'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

/** 新規投稿 */
export async function createPost(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const message = formData.get('message') as string
  const pin     = formData.get('pin') as string | null
  const pdfFile = formData.get('pdfFile') as File | null

  const supabase = await createServiceClient()

  let pdfUrl: string | null = null

  // PDF アップロード（Supabase Storage）
  if (pdfFile && pdfFile.size > 0) {
    const fileName = `${session.organizationKey}/${Date.now()}_${pdfFile.name}`
    const arrayBuffer = await pdfFile.arrayBuffer()
    const { data: uploaded, error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(fileName, arrayBuffer, { contentType: 'application/pdf' })

    if (uploadError) return { error: 'PDFのアップロードに失敗しました。' }
    pdfUrl = uploaded.path
  }

  // PIN ハッシュ化
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
    pdf_url:               pdfUrl,
  })

  if (error) return { error: '投稿に失敗しました。' }

  revalidatePath('/posts')
  return { success: true }
}

/** 投稿編集 */
export async function updatePost(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const writingId = Number(formData.get('writingId'))
  const message   = formData.get('message') as string
  const pin       = formData.get('pin') as string | null
  const pdfFile   = formData.get('pdfFile') as File | null

  const supabase = await createServiceClient()

  // 既存投稿取得
  const { data: post } = await supabase
    .from('writing_data')
    .select('pin, department_id, pdf_url')
    .eq('writing_id', writingId)
    .single()

  if (!post) return { error: '投稿が見つかりません。' }

  // PIN 認証
  if (post.pin) {
    const inputPin = pin?.trim() ?? ''
    const ok = await bcrypt.compare(inputPin, post.pin)
    if (!ok) return { error: 'PINが一致しません。' }
  }

  let pdfUrl = post.pdf_url

  // 新しい PDF があれば上書き
  if (pdfFile && pdfFile.size > 0) {
    const fileName = `${session.organizationKey}/${Date.now()}_${pdfFile.name}`
    const arrayBuffer = await pdfFile.arrayBuffer()
    const { data: uploaded, error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(fileName, arrayBuffer, { contentType: 'application/pdf' })

    if (uploadError) return { error: 'PDFのアップロードに失敗しました。' }
    pdfUrl = uploaded.path
  }

  const { error } = await supabase
    .from('writing_data')
    .update({ message, pdf_url: pdfUrl })
    .eq('writing_id', writingId)

  if (error) return { error: '更新に失敗しました。' }

  revalidatePath('/posts')
  revalidatePath(`/department/${post.department_id}`)
  return { success: true }
}

/** 投稿削除 */
export async function deletePost(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const writingId = Number(formData.get('writingId'))
  const pin       = formData.get('pin') as string | null

  const supabase = await createServiceClient()

  const { data: post } = await supabase
    .from('writing_data')
    .select('pin, department_id')
    .eq('writing_id', writingId)
    .single()

  if (!post) return { error: '投稿が見つかりません。' }

  // PIN 認証
  if (post.pin) {
    const inputPin = pin?.trim() ?? ''
    const ok = await bcrypt.compare(inputPin, post.pin)
    if (!ok) return { error: 'PINが一致しません。' }
  }

  const { error } = await supabase
    .from('writing_data')
    .delete()
    .eq('writing_id', writingId)

  if (error) return { error: '削除に失敗しました。' }

  revalidatePath('/posts')
  revalidatePath(`/department/${post.department_id}`)
  return { success: true }
}

/** PDF のダウンロード用署名付き URL を取得（60秒有効） */
export async function getPdfSignedUrl(pdfPath: string) {
  const supabase = await createServiceClient()
  const { data } = await supabase.storage
    .from('pdfs')
    .createSignedUrl(pdfPath, 60)
  return data?.signedUrl ?? null
}
