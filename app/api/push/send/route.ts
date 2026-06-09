import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/server'

function initVapid() {
  const subject = process.env.VAPID_SUBJECT
  const pub     = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv    = process.env.VAPID_PRIVATE_KEY
  if (!subject || !pub || !priv) return false
  webpush.setVapidDetails(subject, pub, priv)
  return true
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!initVapid()) {
    return NextResponse.json({ error: 'Push not configured' }, { status: 503 })
  }

  const { organizationKey, title, body, url } = await req.json()
  const supabase = createServiceClient()

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('organization_key', organizationKey)

  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 })

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title, body, url })
      )
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent })
}
