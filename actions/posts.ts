'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

const MAX_MESSAGE_LENGTH = 5000
const MAX_PDF_SIZE_BYTES   = 10  * 1024 * 1024   // 10 MB
const MAX_IMAGE_SIZE_BYTES = 10  * 1024 * 1024   // 10 MB
const MAX_VIDEO_SIZE_BYTES = 50  * 1024 * 1024   // 50 MB

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim()
}

function isPdfMagicBytes(buf: ArrayBuffer): boolean {
  const b = new Uint8Array(buf.slice(0, 5))
  return String.fromCharCode(...b) === '%PDF-'
}

function isImageMagicBytes(buf: ArrayBuffer): boolean {
  const b = new Uint8Array(buf.slice(0, 12))
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return true                          // JPEG
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return true         // PNG
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return true                          // GIF
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return true       // WebP
  return false
}

function isVideoMagicBytes(buf: ArrayBuffer): boolean {
  const b = new Uint8Array(buf.slice(0, 12))
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return true        // MP4/MOV
  if (b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3) return true        // WebM
  return false
}

function safeName(original: string): string {
  return original.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
}

export async function createPost(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const rawMessage  = formData.get('message') as string
  const pin         = formData.get('pin') as string | null
  const rawType     = formData.get('postType') as string
  const postType    = rawType === 'team' ? 'team' : rawType === 'notice' ? 'notice' : 'board'
  const isImportant = formData.get('isImportant') === '1' &&
    (session.role === 'admin' || session.role === 'leader')
  const pdfFile    = formData.get('pdfFile')   as File | null
  const imageFile  = formData.get('imageFile') as File | null
  const videoFile  = formData.get('videoFile') as File | null

  const message = stripHtml(rawMessage ?? '')
  if (!message) return { error: '内容を入力してください。' }
  if (message.length > MAX_MESSAGE_LENGTH) return { error: `本文は${MAX_MESSAGE_LENGTH}文字以内で入力してください。` }

  const supabase = await createServiceClient()
  let pdfUrl:   string | null = null
  let imageUrl: string | null = null
  let videoUrl: string | null = null

  if (pdfFile && pdfFile.size > 0) {
    if (pdfFile.size > MAX_PDF_SIZE_BYTES) return { error: 'PDFは10MB以下にしてください。' }
    const buf = await pdfFile.arrayBuffer()
    if (!isPdfMagicBytes(buf)) return { error: 'PDFファイルの形式が正しくありません。' }
    const path = `${session.organizationKey}/${Date.now()}_${safeName(pdfFile.name)}`
    const { data, error } = await supabase.storage.from('pdfs').upload(path, buf, { contentType: 'application/pdf' })
    if (error) return { error: 'PDFのアップロードに失敗しました。' }
    pdfUrl = data.path
  }

  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > MAX_IMAGE_SIZE_BYTES) return { error: '画像は10MB以下にしてください。' }
    if (!imageFile.type.startsWith('image/')) return { error: '画像ファイルを選択してください。' }
    const buf = await imageFile.arrayBuffer()
    if (!isImageMagicBytes(buf)) return { error: '画像ファイルの形式が正しくありません。' }
    const path = `${session.organizationKey}/${Date.now()}_${safeName(imageFile.name)}`
    const { data, error } = await supabase.storage.from('images').upload(path, buf, { contentType: imageFile.type })
    if (error) return { error: '画像のアップロードに失敗しました。' }
    imageUrl = data.path
  }

  if (videoFile && videoFile.size > 0) {
    if (videoFile.size > MAX_VIDEO_SIZE_BYTES) return { error: '動画は50MB以下にしてください。' }
    if (!videoFile.type.startsWith('video/')) return { error: '動画ファイルを選択してください。' }
    const buf = await videoFile.arrayBuffer()
    if (!isVideoMagicBytes(buf)) return { error: '動画ファイルの形式が正しくありません。' }
    const path = `${session.organizationKey}/${Date.now()}_${safeName(videoFile.name)}`
    const { data, error } = await supabase.storage.from('videos').upload(path, buf, { contentType: videoFile.type })
    if (error) return { error: '動画のアップロードに失敗しました。' }
    videoUrl = data.path
  }

  const hashedPin = pin?.trim() ? await bcrypt.hash(pin.trim(), 10) : null

  const { error } = await supabase.from('writing_data').insert({
    user_key:              session.userKey,
    job_id:                session.jobId,
    department_id:         session.departmentId,
    organization_key:      session.organizationKey,
    user_name_stamp:       session.userName,
    job_name_stamp:        session.jobName,
    department_name_stamp: session.departmentName,
    pin:                   hashedPin,
    message,
    pdf_url:   pdfUrl,
    image_url: imageUrl,
    video_url: videoUrl,
    post_type:    postType,
    is_important: isImportant,
  })

  if (error) return { error: '投稿に失敗しました。' }

  if (postType === 'team' || postType === 'notice') {
    revalidatePath('/home')
  } else {
    revalidatePath('/posts')
  }

  // 重要投稿の場合はプッシュ通知を送信
  if (isImportant) {
    const internalSecret = process.env.INTERNAL_SECRET
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    if (internalSecret && baseUrl) {
      fetch(`${baseUrl}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret },
        body: JSON.stringify({
          organizationKey: session.organizationKey,
          title: '重要なお知らせ',
          body: `${session.userName}: ${message.slice(0, 80)}`,
          url: postType === 'board' ? '/posts' : '/home',
        }),
      }).catch(() => {})
    }
  }

  return { success: true }
}

export async function updatePost(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const writingId  = Number(formData.get('writingId'))
  const rawMessage = formData.get('message') as string
  const pin        = formData.get('pin') as string | null
  const pdfFile    = formData.get('pdfFile') as File | null

  if (!Number.isInteger(writingId) || writingId <= 0) return { error: '不正なリクエストです。' }

  const message = stripHtml(rawMessage ?? '')
  if (!message) return { error: '内容を入力してください。' }
  if (message.length > MAX_MESSAGE_LENGTH) return { error: `本文は${MAX_MESSAGE_LENGTH}文字以内で入力してください。` }

  const supabase = await createServiceClient()

  const { data: post } = await supabase
    .from('writing_data')
    .select('pin, department_id, user_key, pdf_url, post_type')
    .eq('writing_id', writingId)
    .eq('organization_key', session.organizationKey)
    .single()

  if (!post) return { error: '投稿が見つかりません。' }

  if (post.pin) {
    const ok = await bcrypt.compare(pin?.trim() ?? '', post.pin)
    if (!ok) return { error: 'PINが一致しません。' }
  }

  let pdfUrl = post.pdf_url

  if (pdfFile && pdfFile.size > 0) {
    if (pdfFile.size > MAX_PDF_SIZE_BYTES) return { error: 'PDFは10MB以下にしてください。' }
    const buf = await pdfFile.arrayBuffer()
    if (!isPdfMagicBytes(buf)) return { error: 'PDFファイルの形式が正しくありません。' }
    const path = `${session.organizationKey}/${Date.now()}_${safeName(pdfFile.name)}`
    const { data, error } = await supabase.storage.from('pdfs').upload(path, buf, { contentType: 'application/pdf' })
    if (error) return { error: 'PDFのアップロードに失敗しました。' }
    pdfUrl = data.path
  }

  const { error } = await supabase
    .from('writing_data')
    .update({ message, pdf_url: pdfUrl })
    .eq('writing_id', writingId)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '更新に失敗しました。' }

  if (post.post_type === 'team' || post.post_type === 'notice') {
    revalidatePath('/home')
    if (post.user_key) revalidatePath(`/member/${post.user_key}`)
  } else {
    revalidatePath('/posts')
    revalidatePath(`/department/${post.department_id}`)
  }
  return { success: true }
}

export async function deletePost(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const writingId = Number(formData.get('writingId'))
  const pin       = formData.get('pin') as string | null

  if (!Number.isInteger(writingId) || writingId <= 0) return { error: '不正なリクエストです。' }

  const supabase = await createServiceClient()

  const { data: post } = await supabase
    .from('writing_data')
    .select('pin, department_id, user_key, post_type')
    .eq('writing_id', writingId)
    .eq('organization_key', session.organizationKey)
    .single()

  if (!post) return { error: '投稿が見つかりません。' }

  const canDelete =
    session.role === 'admin' ||
    (session.role === 'leader' && (
      post.department_id === session.departmentId ||
      post.user_key === session.userKey
    )) ||
    post.user_key === session.userKey

  if (!canDelete) return { error: '削除権限がありません。' }

  if (post.pin) {
    const ok = await bcrypt.compare(pin?.trim() ?? '', post.pin)
    if (!ok) return { error: 'PINが一致しません。' }
  }

  const { error } = await supabase
    .from('writing_data')
    .delete()
    .eq('writing_id', writingId)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '削除に失敗しました。' }

  if (post.post_type === 'team' || post.post_type === 'notice') {
    revalidatePath('/home')
    if (post.user_key) revalidatePath(`/member/${post.user_key}`)
  } else {
    revalidatePath('/posts')
    revalidatePath(`/department/${post.department_id}`)
  }
  return { success: true }
}

export async function getPdfSignedUrl(pdfPath: string) {
  const session = await getSession()
  if (!session) return null
  if (!pdfPath.startsWith(`${session.organizationKey}/`)) return null
  const supabase = await createServiceClient()
  const { data } = await supabase.storage.from('pdfs').createSignedUrl(pdfPath, 60)
  return data?.signedUrl ?? null
}
