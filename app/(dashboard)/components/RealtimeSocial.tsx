'use client'

import { useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { createClient } from '@/lib/supabase/client'

/**
 * 組織チャンネルの broadcast を購読し、更新シグナルを受けたら
 * /api/data/* の SWR キャッシュを再検証する。
 * 投稿・リアクション・コメントすべての更新をこの1経路でカバーする。
 */
export default function RealtimeSocial({ channel }: { channel: string }) {
  const { mutate } = useSWRConfig()

  useEffect(() => {
    const supabase = createClient()
    const ch = supabase
      .channel(channel)
      .on('broadcast', { event: 'refresh' }, () => {
        mutate((key) => typeof key === 'string' && key.startsWith('/api/data/'))
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [channel, mutate])

  return null
}
