import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

const MAX_MESSAGE_LENGTH   = 5000
const MAX_PDF_SIZE_BYTES   = 10 * 1024 * 1024
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024

function stripHtml(text: string) { return text.replace(/<[^>]*>/g, '').trim() }
function safeName(name: string)  { return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) }

function isPdfMagicBytes(buf: ArrayBuffer) {
  const b = new Uint8Array(buf.slice(0, 5))
  return String.fromCharCode(...b) === '%PDF-'
}
function isImageMagicBytes(buf: ArrayBuffer) {
  const b = new Uint8Array(buf.slice(0, 12))
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return true                          // JPEG
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return true         // PNG
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return true                          // GIF
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return true       // WebP
  return false
}
function isVideoMagicBytes(buf: ArrayBuffer) {
  const b = new Uint8Array(buf.slice(0, 16))
  // WebM/MKV
  if (b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3) return true
  // AVI (RIFF container)
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46) return true
  // MP4/MOV/3GP: ftyp box at offset 4 or 8
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return true
  if (b[8] === 0x66 && b[9] === 0x74 && b[10] === 0x79 && b[11] === 0x70) return true
  return false
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

  const rawImageFiles = formData.getAll('imageFiles')
  const rawVideoFiles = formData.getAll('videoFiles')
  const rawPdfFiles   = formData.getAll('pdfFiles')
  const imageFiles = rawImageFiles.filter((f): f is File => f instanceof File && f.size > 0)
  const videoFiles = rawVideoFiles.filter((f): f is File => f instanceof File && f.size > 0)
  const pdfFiles   = rawPdfFiles.filter((f): f is File => f instanceof File && f.size > 0)

  const message = stripHtml(rawMessage ?? '')
  if (!message)                            return err('内容を入力してください。')
  if (message.length > MAX_MESSAGE_LENGTH) return err(`本文は${MAX_MESSAGE_LENGTH}文字以内で入力してください。`)

  const supabase = createServiceClient()
  const imageUrls: string[] = []
  const videoUrls: string[] = []
  const pdfUrls:   string[] = []

  for (let i = 0; i < imageFiles.length; i++) {
    const f = imageFiles[i]
    if (f.size > MAX_IMAGE_SIZE_BYTES) return err('画像は10MB以下にしてください。')
    const buf = await f.arrayBuffer()
    if (!isImageMagicBytes(buf)) return err('画像ファイルの形式が正しくありません。')
    const path = `${session.organizationKey}/${Date.now()}_${i}_${safeName(f.name)}`
    const { data, error } = await supabase.storage.from('images').upload(path, buf, { contentType: f.type })
    if (error) return err('画像のアップロードに失敗しました。')
    imageUrls.push(data.path)
  }

  for (let i = 0; i < videoFiles.length; i++) {
    const f = videoFiles[i]
    if (f.size > MAX_VIDEO_SIZE_BYTES) return err('動画は50MB以下にしてください。')
    const buf = await f.arrayBuffer()
    if (!isVideoMagicBytes(buf)) return err('動画ファイルの形式が正しくありません。')
    const path = `${session.organizationKey}/${Date.now()}_${i}_${safeName(f.name)}`
    const { data, error } = await supabase.storage.from('videos').upload(path, buf, { contentType: f.type })
    if (error) return err('動画のアップロードに失敗しました。')
    videoUrls.push(data.path)
  }

  for (let i = 0; i < pdfFiles.length; i++) {
    const f = pdfFiles[i]
    if (f.size > MAX_PDF_SIZE_BYTES) return err('PDFは10MB以下にしてください。')
    const buf = await f.arrayBuffer()
    if (!isPdfMagicBytes(buf)) return err('PDFファイルの形式が正しくありません。')
    const path = `${session.organizationKey}/${Date.now()}_${i}_${safeName(f.name)}`
    const { data, error } = await supabase.storage.from('pdfs').upload(path, buf, { contentType: 'application/pdf' })
    if (error) return err('PDFのアップロードに失敗しました。')
    pdfUrls.push(data.path)
  }

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

  if (error || !insertedPost) return err('投稿に失敗しました。')

  // 全添付ファイルを post_attachments に保存
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
