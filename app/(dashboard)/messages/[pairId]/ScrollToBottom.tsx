'use client'

import { useEffect } from 'react'

/** スレッドを開いたとき・新着反映時に最下部へスクロールする（メッセンジャー的挙動） */
export default function ScrollToBottom({ trigger }: { trigger: number }) {
  useEffect(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight })
  }, [trigger])
  return null
}
