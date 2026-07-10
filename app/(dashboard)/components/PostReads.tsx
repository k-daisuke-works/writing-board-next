'use client'

import { useState } from 'react'
import { Eye, ChevronDown, BellRing } from 'lucide-react'
import { remindUnread } from '@/actions/social'
import type { PostRead } from '@/types/database'

type Props = {
  reads: PostRead[]
  myUserKey: number
  /** admin / leader のとき指定するとドロップダウンに未読リマインド送信ボタンを表示 */
  postId?: number
  canRemind?: boolean
}

export default function PostReads({ reads, myUserKey, postId, canRemind }: Props) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function remind() {
    if (!postId || sending) return
    setSending(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('postId', String(postId))
      const res = await remindUnread(fd)
      if ('error' in res) setResult(res.error)
      else if (res.unread === 0) setResult('未読の人はいません')
      else setResult(`未読${res.unread}人に通知を送りました（受信設定済み ${res.sent}件）`)
    } catch {
      setResult('送信に失敗しました。もう一度お試しください。')
    } finally {
      setSending(false)
    }
  }

  if (reads.length === 0 && !(canRemind && postId)) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex min-h-[44px] items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Eye className="w-3 h-3" />
        既読 {reads.length}件
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        // モバイルは fixed のボトムパネル（画面端でのクリッピング防止）、sm以上は従来のドロップダウン
        <div className="fixed inset-x-3 bottom-20 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 sm:absolute sm:inset-x-auto sm:bottom-full sm:left-0 sm:z-10 sm:mb-1.5 sm:p-2 sm:min-w-[180px] sm:max-w-[260px]">
          <p className="text-[10px] font-semibold text-gray-400 mb-1.5 px-1">既読メンバー</p>
          <div className="space-y-0.5 max-h-36 overflow-y-auto">
            {reads.length === 0 && <p className="px-1 py-0.5 text-xs text-gray-400">まだ誰も読んでいません</p>}
            {reads.map(r => (
              <div key={r.id} className="flex items-center gap-1.5 px-1 py-0.5">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
                  r.user_key === myUserKey ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {r.user_name.slice(0, 1)}
                </div>
                <span className="text-xs text-gray-700">{r.user_name}</span>
              </div>
            ))}
          </div>
          {canRemind && postId && (
            <div className="mt-1.5 border-t border-gray-100 pt-1.5">
              <button
                onClick={remind}
                disabled={sending}
                className="flex w-full min-h-[44px] items-center gap-1.5 rounded-md px-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50"
              >
                <BellRing className="w-3.5 h-3.5 shrink-0" />
                {sending ? '送信中…' : '未読の人にリマインドを送る'}
              </button>
              {result && <p className="mt-1 px-1.5 text-[11px] leading-4 text-gray-500">{result}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
