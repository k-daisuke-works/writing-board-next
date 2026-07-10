import { NextRequest, NextResponse } from 'next/server'
import { refreshInstagramCache } from '@/lib/instagram'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Vercel cron authorization（secret 未設定時は常に拒否 = fail-closed）
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await refreshInstagramCache()
  return NextResponse.json({ ok: true, ...result })
}
