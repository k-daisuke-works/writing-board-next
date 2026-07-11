'use client'

import { useEffect } from 'react'
import { markDmRead } from '@/actions/messages'

/** スレッドを開いたときに相手からの未読へ既読を付ける（1回だけ） */
export default function MarkDmReadOnMount({ pairId }: { pairId: number }) {
  useEffect(() => {
    const fd = new FormData()
    fd.set('pairId', String(pairId))
    markDmRead(fd)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairId])
  return null
}
