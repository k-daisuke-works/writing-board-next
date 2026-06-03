'use client'

import { useEffect } from 'react'
import { mutate } from 'swr'
import { createClient } from '@/lib/supabase/client'

export default function RealtimeSocial({ organizationKey }: { organizationKey: number }) {
  const supabase = createClient()

  useEffect(() => {
    const ch = supabase.channel(`social-${organizationKey}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'post_reactions',
        filter: `organization_key=eq.${organizationKey}`,
      }, () => mutate(key => typeof key === 'string' && key.startsWith('/api/data/')))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'post_replies',
        filter: `organization_key=eq.${organizationKey}`,
      }, () => mutate(key => typeof key === 'string' && key.startsWith('/api/data/')))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [organizationKey])

  return null
}
