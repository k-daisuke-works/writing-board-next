'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sendDm } from '@/actions/messages'
import { Send } from 'lucide-react'

/** スレッド下部に固定するメッセージ送信フォーム */
export default function DmSendForm({ pairId }: { pairId: number }) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const message = text.trim()
    if (!message || pending) return
    const fd = new FormData()
    fd.set('pairId', String(pairId))
    fd.set('message', message)
    startTransition(async () => {
      try {
        const res = await sendDm(fd)
        if (res?.error) { setError(res.error); return }
        setText('')
        setError(null)
        router.refresh()
      } catch {
        setError('送信に失敗しました。')
      }
    })
  }

  return (
    <div className="sticky bottom-0 z-30 -mx-3 border-t border-gray-200 bg-white px-3 py-2.5 safe-pb sm:-mx-6 sm:px-6">
      {error && <p className="mb-1.5 text-xs text-red-600">{error}</p>}
      <form onSubmit={submit} className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          maxLength={2000}
          placeholder="メッセージを入力"
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          aria-label="送信"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}
