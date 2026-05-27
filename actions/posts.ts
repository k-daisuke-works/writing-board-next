'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

// ─── 定数 ──────────────────────────────────────────────────
const MAX_MESSAGE_LENGTH = 5000   // 本文の最大文字数
const MAX_PDF_SIZE_MB    = 10     // PDF の最大サイズ (MB)
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024

/** 文字列から HTML タグを除去（XSS 対策） */
function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim()
}

/** PDF マジックナンバー検証（%PDF- で始まるか確認） */
function isPdfMagicBytes(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 5))
  return String.fromCharCode(...bytes) === '%PDF-'
}

/** 新規投稿 */
export async function createPost(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const rawMessage = formData.get('message') as string
  const pin        = formData.get('pin') as string | null
  const pdfFile    = formData.get('pdfFile') as File | null

  // ── 入力バリデーション ──────────────────────────────────
  const message = stripHtml(rawMessage ?? '')
  if (!message) return { error: '内容を入力してください。' }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: `本文は${MAX_MESSAGE_LENGTH}文字以内で入力してください。` }
  }

  const supabase = await createServiceClient()
  let pdfUrl: string | null = null

  // ── PDF アップロード ────────────────────────────────────
  if (pdfFile && pdfFile.size > 0) {
    // サイズチェック（サーバーサイド）
    if (pdfFile.size > MAX_PDF_SIZE_BYTES) {
      return { error: `PDF は ${MAX_PDF_SIZE_MB}MB 以下にしてください。` }
    }

    const arrayBuffer = await pdfFile.arrayBuffer()

    // マジックナンバー検証（Content-Type 偽装対策）
    if (!isPdfMagicBytes(arrayBuffer)) {
      return { error: 'PDF ファイルの形式が正しくありません。' }
    }

    // ファイル名から危険な文字を除去
    const safeName = pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
    const fileName = `${session.organizationKey}/${Date.now()}_${safeName}`

    const { data: uploaded, error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(fileName, arrayBuffer, { contentType: 'application/pdf' })

    if (uploadError) return { error: 'PDF のアップロードに失敗しました。' }
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
    message,                       // sanitized
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

  const writingId  = Number(formData.get('writingId'))
  const rawMessage = formData.get('message') as string
  const pin        = formData.get('pin') as string | null
  const pdfFile    = formData.get('pdfFile') as File | null

  if (!Number.isInteger(writingId) || writingId <= 0) {
    return { error: '不正なリクエストです。' }
  }

  const message = stripHtml(rawMessage ?? '')
  if (!message) return { error: '内容を入力してください。' }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: `本文は${MAX_MESSAGE_LENGTH}文字以内で入力してください。` }
  }

  const supabase = await createServiceClient()

  // ── IDOR 対策: organization_key で絞り込む ──────────────
  const { data: post } = await supabase
    .from('writing_data')
    .select('pin, department_id, pdf_url')
    .eq('writing_id', writingId)
    .eq('organization_key', session.organizationKey)   // ← 追加
    .single()

  if (!post) return { error: '投稿が見つかりません。' }

  // PIN 認証
  if (post.pin) {
    const inputPin = pin?.trim() ?? ''
    const ok = await bcrypt.compare(inputPin, post.pin)
    if (!ok) return { error: 'PIN が一致しません。' }
  }

  let pdfUrl = post.pdf_url

  // 新しい PDF があれば上書き
  if (pdfFile && pdfFile.size > 0) {
    if (pdfFile.size > MAX_PDF_SIZE_BYTES) {
      return { error: `PDF は ${MAX_PDF_SIZE_MB}MB 以下にしてください。` }
    }

    const arrayBuffer = await pdfFile.arrayBuffer()
    if (!isPdfMagicBytes(arrayBuffer)) {
      return { error: 'PDF ファイルの形式が正しくありません。' }
    }

    const safeName = pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
    const fileName = `${session.organizationKey}/${Date.now()}_${safeName}`

    const { data: uploaded, error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(fileName, arrayBuffer, { contentType: 'application/pdf' })

    if (uploadError) return { error: 'PDF のアップロードに失敗しました。' }
    pdfUrl = uploaded.path
  }

  const { error } = await supabase
    .from('writing_data')
    .update({ message, pdf_url: pdfUrl })
    .eq('writing_id', writingId)
    .eq('organization_key', session.organizationKey)   // ← 追加

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

  if (!Number.isInteger(writingId) || writingId <= 0) {
    return { error: '不正なリクエストです。' }
  }

  const supabase = await createServiceClient()

  // ── IDOR 対策: organization_key で絞り込む ──────────────
  const { data: post } = await supabase
    .from('writing_data')
    .select('pin, department_id')
    .eq('writing_id', writingId)
    .eq('organization_key', session.organizationKey)   // ← 追加
    .single()

  if (!post) return { error: '投稿が見つかりません。' }

  // PIN 認証
  if (post.pin) {
    const inputPin = pin?.trim() ?? ''
    const ok = await bcrypt.compare(inputPin, post.pin)
    if (!ok) return { error: 'PIN が一致しません。' }
  }

  const { error } = await supabase
    .from('writing_data')
    .delete()
    .eq('writing_id', writingId)
    .eq('organization_key', session.organizationKey)   // ← 追加

  if (error) return { error: '削除に失敗しました。' }

  revalidatePath('/posts')
  revalidatePath(`/department/${post.department_id}`)
  return { success: true }
}

/** PDF のダウンロード用署名付き URL を取得（60秒有効） */
export async function getPdfSignedUrl(pdfPath: string) {
  const session = await getSession()
  if (!session) return null

  // パスが自組織のものかチェック（org_key/ で始まるか）
  if (!pdfPath.startsWith(`${session.organizationKey}/`)) return null

  const supabase = await createServiceClient()
  const { data } = await supabase.storage
    .from('pdfs')
    .createSignedUrl(pdfPath, 60)
  return data?.signedUrl ?? null
}
