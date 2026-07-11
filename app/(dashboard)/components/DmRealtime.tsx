'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * 組織チャンネルの broadcast を購読し、更新シグナルを受けたら
 * サーバーコンポーネントを再取得する（DMスレッドの新着反映）。
 * ペイロードには組織識別情報を含めない設計のため、シグナル受信＝再取得で対応する。
 */
export default function DmRealtime({ channel }: { channel: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const ch = supabase
      .channel(channel)
      .on('broadcast', { event: 'refresh' }, () => router.refresh())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [channel, router])

  return null
}
