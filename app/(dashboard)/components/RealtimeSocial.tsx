'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RealtimeSocial({ organizationKey }: { organizationKey: number }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const ch = supabase.channel('social-realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'post_reactions',
        filter: `organization_key=eq.${organizationKey}`,
      }, () => router.refresh())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'post_replies',
        filter: `organization_key=eq.${organizationKey}`,
      }, () => router.refresh())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [organizationKey])

  return null
}
