import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

const MAX_MESSAGE_LENGTH = 5000

function stripHtml(text: string) { return text.replace(/<[^>]*>/g, '').trim() }

function parseJsonPaths(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

function err(msg: string) { return NextResponse.json({ error: msg }, { status: 400 }) }

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '認証が必要です。' }, { status: 401 })

  const formData = await req.formData()

  const rawMessage      = formData.get('message') as string
  const pin             = formData.get('pin') as string | null
  const rawType         = formData.get('postType') as string
  const postType        = rawType === 'team' ? 'team' : rawType === 'notice' ? 'notice' : 'board'
  const isImportant     = formData.get('isImportant') === '1' && (session.role === 'admin' || session.role === 'leader')
  const rawDisplayUntil = formData.get('displayUntil') as string | null
  const displayUntil    = (postType === 'notice' || isImportant) && rawDisplayUntil
    ? new Date(rawDisplayUntil + 'T23:59:59').toISOString()
    : null

  // ファイルはクライアント側でSupabase Storageへ直接アップロード済み。パスのみ受け取る。
  const imageUrls = parseJsonPaths(formData.get('imagePaths') as string | null)
  const videoUrls = parseJsonPaths(formData.get('videoPaths') as string | null)
  const pdfUrls   = parseJsonPaths(formData.get('pdfPaths')   as string | null)

  const message = stripHtml(rawMessage ?? '')
  if (!message)                            return err('内容を入力してください。')
  if (message.length > MAX_MESSAGE_LENGTH) return err(`本文は${MAX_MESSAGE_LENGTH}文字以内で入力してください。`)

  // パスが自組織のディレクトリ配下であることを確認
  const orgPrefix = `${session.organizationKey}/`
  const allPaths  = [...imageUrls, ...videoUrls, ...pdfUrls]
  if (allPaths.some(p => !p.startsWith(orgPrefix)))
    return err('不正なファイルパスです。')

  const supabase   = createServiceClient()
  const hashedPin  = pin?.trim() ? await bcrypt.hash(pin.trim(), 10) : null

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

  if (error || !insertedPost) return err('投稿に失敗しました。')

  const attachments = [
    ...imageUrls.map(url => ({ post_id: insertedPost.writing_id, organization_key: session.organizationKey, file_type: 'image' as const, url })),
    ...videoUrls.map(url => ({ post_id: insertedPost.writing_id, organization_key: session.organizationKey, file_type: 'video' as const, url })),
    ...pdfUrls.map(url => ({ post_id: insertedPost.writing_id, organization_key: session.organizationKey, file_type: 'pdf' as const, url })),
  ]
  if (attachments.length > 0) {
    await supabase.from('post_attachments').insert(attachments)
  }

  if (postType === 'team' || postType === 'notice') revalidatePath('/home')
  else revalidatePath('/posts')

  if (isImportant) {
    const secret = process.env.INTERNAL_SECRET, baseUrl = process.env.NEXT_PUBLIC_APP_URL
    if (secret && baseUrl) {
      fetch(`${baseUrl}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
        body: JSON.stringify({
          organizationKey: session.organizationKey,
          title: '重要なお知らせ',
          body: `${session.userName}: ${message.slice(0, 80)}`,
          url: postType === 'board' ? '/posts' : '/home',
        }),
      }).catch(() => {})
    }
  }

  return NextResponse.json({ success: true })
}
