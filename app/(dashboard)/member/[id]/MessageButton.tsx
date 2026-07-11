'use client'

import { useState, useTransition } from 'react'
import { requestDm } from '@/actions/messages'
import { MessageSquare, Check } from 'lucide-react'

/** メンバー詳細からのDMリクエスト送信ボタン */
export default function MessageButton({ targetUserKey }: { targetUserKey: number }) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function request() {
    if (pending || done) return
    const fd = new FormData()
    fd.set('targetUserKey', String(targetUserKey))
    startTransition(async () => {
      try {
        const res = await requestDm(fd)
        if (res?.error) { setError(res.error); return }
        setError(null)
        setDone(true)
      } catch {
        setError('リクエストに失敗しました。')
      }
    })
  }

  if (done) {
    return (
      <p className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-green-50 text-sm font-medium text-green-700">
        <Check className="h-4 w-4" />
        リクエストしました
      </p>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={request}
        disabled={pending}
        className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        <MessageSquare className="h-4 w-4" />
        {pending ? '送信中…' : 'メッセージをリクエスト'}
      </button>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}
