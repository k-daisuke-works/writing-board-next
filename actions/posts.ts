'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

const MAX_MESSAGE_LENGTH = 5000
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim()
}

function parseJsonPaths(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

function isPdfMagicBytes(buf: ArrayBuffer): boolean {
  const b = new Uint8Array(buf.slice(0, 5))
  return String.fromCharCode(...b) === '%PDF-'
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
  const rawDisplayUntil = formData.get('displayUntil') as string | null
  const displayUntil    = (postType === 'notice' || isImportant) && rawDisplayUntil
    ? new Date(rawDisplayUntil + 'T23:59:59').toISOString()
    : null

  // ファイルはクライアント側でSupabase Storageへ直接アップロード済み。パスのみ受け取る。
  const imageUrls = parseJsonPaths(formData.get('imagePaths') as string | null)
  const videoUrls = parseJsonPaths(formData.get('videoPaths') as string | null)
  const pdfUrls   = parseJsonPaths(formData.get('pdfPaths')   as string | null)

  const message = stripHtml(rawMessage ?? '')
  if (!message) return { error: '内容を入力してください。' }
  if (message.length > MAX_MESSAGE_LENGTH) return { error: `本文は${MAX_MESSAGE_LENGTH}文字以内で入力してください。` }

  // パスが自組織のディレクトリ配下であることを確認
  const orgPrefix = `${session.organizationKey}/`
  if ([...imageUrls, ...videoUrls, ...pdfUrls].some(p => !p.startsWith(orgPrefix)))
    return { error: '不正なファイルパスです。' }

  const supabase  = createServiceClient()
  const hashedPin = pin?.trim() ? await bcrypt.hash(pin.trim(), 10) : null

  const { data: insertedPost, error } = await supabase.from('writing_data').insert({
    user_key:              session.userKey,
    job_id:                session.jobId,
    department_id:         session.departmentId,
    organization_key:      session.organizationKey,
    user_name_stamp:       session.userName,
    job_name_stamp:        session.jobName,
    department_name_stamp: session.departmentName,
    pin:           hashedPin,
    message,
    image_url:     imageUrls[0] ?? null,
    video_url:     videoUrls[0] ?? null,
    pdf_url:       pdfUrls[0] ?? null,
    post_type:     postType,
    is_important:  isImportant,
    display_until: displayUntil,
  }).select('writing_id').single()

  if (error || !insertedPost) return { error: '投稿に失敗しました。' }

  const attachments = [
    ...imageUrls.map(url => ({ post_id: insertedPost.writing_id, organization_key: session.organizationKey, file_type: 'image' as const, url })),
    ...videoUrls.map(url => ({ post_id: insertedPost.writing_id, organization_key: session.organizationKey, file_type: 'video' as const, url })),
    ...pdfUrls.map(url => ({ post_id: insertedPost.writing_id, organization_key: session.organizationKey, file_type: 'pdf' as const, url })),
  ]
  if (attachments.length > 0) {
    await supabase.from('post_attachments').insert(attachments)
  }

  if (postType === 'team' || postType === 'notice') {
    revalidatePath('/home')
  } else {
    revalidatePath('/posts')
  }

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

  const supabase = createServiceClient()

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

  const supabase = createServiceClient()

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
  const supabase = createServiceClient()
  const { data } = await supabase.storage.from('pdfs').createSignedUrl(pdfPath, 60)
  return data?.signedUrl ?? null
}
