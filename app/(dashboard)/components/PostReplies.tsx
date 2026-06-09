'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { MessageCircle, ChevronDown, Send } from 'lucide-react'
import { addReply } from '@/actions/social'
import { relativeTime } from '@/lib/utils'
import type { PostReply } from '@/types/database'

type Props = {
  postId: number
  replies: PostReply[]
  myUserKey: number
  myUserName: string
  myAvatarUrl?: string | null
  avatarMap?: Record<number, string | null>
}

function Avatar({
  userKey, userName, myUserKey, myAvatarUrl, avatarMap,
}: {
  userKey: number
  userName: string
  myUserKey: number
  myAvatarUrl?: string | null
  avatarMap?: Record<number, string | null>
}) {
  const isMe = userKey === myUserKey
  const url  = isMe ? myAvatarUrl : (avatarMap?.[userKey] ?? null)
  return (
    <div className={`w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 ${
      isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
    }`}>
      {url
        ? <img src={url} alt="" className="w-full h-full object-cover" />
        : userName.slice(0, 1)}
    </div>
  )
}

export default function PostReplies({ postId, replies, myUserKey, myUserName, myAvatarUrl, avatarMap }: Props) {
  const router = useRouter()
  const [expanded, setExpanded]         = useState(false)
  const [, startTransition]             = useTransition()
  const [localReplies, setLocalReplies] = useState(replies)
  const formRef                         = useRef<HTMLFormElement>(null)

  // サーバーから最新データが届いたら同期
  useEffect(() => { setLocalReplies(replies) }, [replies])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd  = new FormData(e.currentTarget)
    const msg = String(fd.get('message') ?? '').trim()
    if (!msg) return

    // 楽観的更新：即座に表示
    const optimistic = {
      id: -Date.now(),
      post_id: postId,
      user_key: myUserKey,
      user_name_stamp: myUserName,
      message: msg,
      created_at: new Date().toISOString(),
      organization_key: 0,
    } as unknown as PostReply

    setLocalReplies(prev => [...prev, optimistic])
    setExpanded(true)
    formRef.current?.reset()

    startTransition(async () => {
      await addReply(fd)
      mutate(key => typeof key === 'string' && key.startsWith('/api/data/'))
      router.refresh()
    })
  }

  const total   = localReplies.length
  const sorted  = [...localReplies].reverse()
  const first   = sorted[0]

  return (
    <div className="space-y-2">

      {/* コメント数 / 展開トグル */}
      {total > 0 && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {total}件のコメント
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* 先頭1件プレビュー（折り畳み時） */}
      {first && !expanded && (
        <div className="flex gap-2">
          <Avatar userKey={first.user_key} userName={first.user_name_stamp} myUserKey={myUserKey} myAvatarUrl={myAvatarUrl} avatarMap={avatarMap} />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-gray-700 mr-1.5">{first.user_name_stamp}</span>
            <span className="text-xs text-gray-600 break-words">{first.message}</span>
          </div>
        </div>
      )}

      {/* 全コメント（展開時） */}
      {expanded && (
        <div className="space-y-2.5 pl-1 border-l-2 border-gray-100">
          {sorted.map(r => (
            <div key={r.id} className="flex gap-2">
              <Avatar userKey={r.user_key} userName={r.user_name_stamp} myUserKey={myUserKey} myAvatarUrl={myAvatarUrl} avatarMap={avatarMap} />
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

      {/* 入力フォーム（常時表示） */}
      <form ref={formRef} onSubmit={handleSubmit} className="flex items-center gap-2">
        <input type="hidden" name="postId" value={postId} />
        <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-bold shrink-0 bg-blue-600 text-white">
          {myAvatarUrl
            ? <img src={myAvatarUrl} alt="" className="w-full h-full object-cover" />
            : myUserName.slice(0, 1)}
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

    </div>
  )
}
