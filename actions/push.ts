'use server'

import { getSession } from '@/lib/session'
import { createOrgClient } from '@/lib/supabase/server'

export async function subscribePush(sub: {
  endpoint: string
  p256dh: string
  auth: string
}) {
  const session = await getSession()
  if (!session) return

  const supabase = await createOrgClient(session.organizationKey)
  await supabase.from('push_subscriptions').upsert(
    {
      user_key: session.userKey,
      organization_key: session.organizationKey,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
    { onConflict: 'endpoint', ignoreDuplicates: false }
  )
}

export async function unsubscribePush(endpoint: string) {
  const session = await getSession()
  if (!session) return

  const supabase = await createOrgClient(session.organizationKey)
  await supabase.from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_key', session.userKey)
    .eq('organization_key', session.organizationKey)
}
