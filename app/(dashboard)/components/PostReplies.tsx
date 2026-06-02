'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, ChevronDown, Send } from 'lucide-react'
import { addReply } from '@/actions/social'
import type { PostReply } from '@/types/database'

function relativeTime(t: string) {
  const m = Math.floor((Date.now() - new Date(t).getTime()) / 60000)
  if (m < 1) return 'たった今'
  if (m < 60) return `${m}分前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}時間前`
  return `${Math.floor(h / 24)}日前`
}

type Props = {
  postId: number
  replies: PostReply[]
  myUserKey: number
  myUserName: string
}

export default function PostReplies({ postId, replies, myUserKey, myUserName }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const total = replies.length
  const first = replies[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (!String(fd.get('message') ?? '').trim()) return
    formRef.current?.reset()
    startTransition(async () => {
      await addReply(fd)
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        {total === 0 ? 'コメントする' : `${total}件のコメント`}
        {total > 0 && (
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* 最初のコメントをプレビュー表示（折り畳み時） */}
      {first && !expanded && (
        <div className="flex gap-2">
          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-600 shrink-0 mt-0.5">
            {first.user_name_stamp.slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-gray-700 mr-1.5">{first.user_name_stamp}</span>
            <span className="text-xs text-gray-600 break-words">{first.message}</span>
          </div>
        </div>
      )}

      {/* 展開時：全コメント */}
      {expanded && (
        <div className="space-y-2.5 pl-1 border-l-2 border-gray-100">
          {replies.map(r => (
            <div key={r.id} className="flex gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 ${
                r.user_key === myUserKey ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {r.user_name_stamp.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-medium text-gray-700">{r.user_name_stamp}</span>
                  <span className="text-[10px] text-gray-400">{relativeTime(r.created_at)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed break-words">{r.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 入力フォーム */}
      {(expanded || total === 0) && (
        <form ref={formRef} onSubmit={handleSubmit} className="flex items-center gap-2">
          <input type="hidden" name="postId" value={postId} />
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 bg-blue-600 text-white`}>
            {myUserName.slice(0, 1)}
          </div>
          <input
            name="message"
            placeholder="コメントを追加…"
            className="flex-1 text-xs border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-gray-50"
          />
          <button type="submit" className="text-gray-400 hover:text-blue-600 transition-colors p-1">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  )
}
