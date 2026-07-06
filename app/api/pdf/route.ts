import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '認証が必要です。' }, { status: 401 })

  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  // 組織プレフィックス必須＋パストラバーサル拒否
  if (!path.startsWith(`${session.organizationKey}/`) || path.includes('..')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServiceClient()
  const { data } = await supabase.storage.from('pdfs').createSignedUrl(path, 300)
  if (!data?.signedUrl) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.redirect(data.signedUrl)
}
