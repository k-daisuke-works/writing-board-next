import { NextRequest, NextResponse } from 'next/server'
import { sendPush } from '@/lib/push'

/** 内部用プッシュ送信エンドポイント（Cron 等の外部トリガー向け） */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret')
  if (!process.env.INTERNAL_SECRET || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { organizationKey, departmentId, userKeys, excludeUserKey, title, body, url, tag } = await req.json()
  if (!organizationKey || !title) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }

  const sent = await sendPush(
    { organizationKey, departmentId, userKeys, excludeUserKey },
    { title, body: body ?? '', url: url ?? '/home', tag }
  )
  return NextResponse.json({ sent })
}
