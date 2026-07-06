import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { WELFARE_SOURCES, fetchRssSource } from '@/lib/welfare-rss'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Vercel cron authorization（secret 未設定時は常に拒否 = fail-closed）
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  let total = 0
  const errors: string[] = []

  await Promise.allSettled(
    WELFARE_SOURCES.map(async (source) => {
      const items = await fetchRssSource(source)
      if (!items.length) return

      const rows = items.map(item => ({
        source_name:  source.name,
        title:        item.title,
        url:          item.url,
        published_at: item.publishedAt?.toISOString() ?? null,
        fetched_at:   new Date().toISOString(),
      }))

      const { error } = await supabase
        .from('welfare_news')
        .upsert(rows, { onConflict: 'url,source_name', ignoreDuplicates: false })

      if (error) {
        errors.push(`${source.name}: ${error.message}`)
      } else {
        total += rows.length
      }
    })
  )

  return NextResponse.json({ ok: true, upserted: total, errors })
}
