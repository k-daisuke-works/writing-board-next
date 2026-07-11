'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { respondDm } from '@/actions/messages'

/** 受け取ったDMリクエストへの応答（承認 / 見送り / ブロック） */
export default function RespondDmButtons({ pairId }: { pairId: number }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function respond(action: 'accept' | 'decline' | 'block') {
    if (pending) return
    if (action === 'block' && !confirm('この相手をブロックします。今後この相手からのリクエストを受け取りません。よろしいですか？')) return
    const fd = new FormData()
    fd.set('pairId', String(pairId))
    fd.set('action', action)
    startTransition(async () => {
      try {
        const res = await respondDm(fd)
        if (res?.error) { setError(res.error); return }
        router.refresh()
      } catch {
        setError('操作に失敗しました。')
      }
    })
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => respond('accept')}
          disabled={pending}
          className="min-h-[44px] flex-1 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          承認
        </button>
        <button
          type="button"
          onClick={() => respond('decline')}
          disabled={pending}
          className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          見送り
        </button>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => respond('block')}
          disabled={pending}
          className="text-xs text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-60"
        >
          ブロック
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  )
}
