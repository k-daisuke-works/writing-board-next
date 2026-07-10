import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

const BUCKETS = { image: 'images', video: 'videos', pdf: 'pdfs' } as const

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '認証が必要です。' }, { status: 401 })

  const { fileType, filename } = await req.json() as { fileType: string; filename: string }
  if (!Object.keys(BUCKETS).includes(fileType))
    return NextResponse.json({ error: '不正なファイル種別です。' }, { status: 400 })

  const bucket = BUCKETS[fileType as keyof typeof BUCKETS]
  const path   = `${session.organizationKey}/${Date.now()}_${safeName(filename)}`

  // tenant-ok: Storage の署名アップロードURL発行のみ。storage スキーマにRLS未設定のため service role
  const supabase = createServiceClient()
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path)
  if (error || !data) return NextResponse.json({ error: 'URLの生成に失敗しました。' }, { status: 500 })

  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path })
}
