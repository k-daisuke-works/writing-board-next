'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { Plus } from 'lucide-react'
import { toggleReaction } from '@/actions/social'
import type { PostReaction } from '@/types/database'

const EMOJIS = [
  '👍','👎','❤️','😊','😂','😮','😢','😡',
  '🙏','👏','💪','🤔','👀','✅','❌','⭕',
  '🔔','📌','🚀','⭐','🔥','💡','📢','✨',
  '💯','🎉','👋','🤝','😅','😌','🥹','📋',
]

type Props = { postId: number; reactions: PostReaction[]; myUserKey: number; myUserName?: string }

export default function PostReactions({ postId, reactions, myUserKey, myUserName = '' }: Props) {
  const router = useRouter()
  const [, startTransition]                   = useTransition()
  const [pickerOpen, setPickerOpen]           = useState(false)
  const [localReactions, setLocalReactions]   = useState(reactions)
  const pickerRef                             = useRef<HTMLDivElement>(null)

  // サーバーから最新データが届いたら同期
  useEffect(() => { setLocalReactions(reactions) }, [reactions])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    if (pickerOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  function handleToggle(emoji: string) {
    setPickerOpen(false)

    // 楽観的更新：即座にトグル
    setLocalReactions(prev => {
      const mine = prev.find(r => r.emoji === emoji && r.user_key === myUserKey)
      if (mine) {
        return prev.filter(r => !(r.emoji === emoji && r.user_key === myUserKey))
      }
      return [...prev, {
        id: -Date.now(),
        post_id: postId,
        emoji,
        user_key: myUserKey,
        user_name: myUserName,
        organization_key: 0,
      } as unknown as PostReaction]
    })

    startTransition(async () => {
      await toggleReaction(postId, emoji)
      mutate(key => typeof key === 'string' && key.startsWith('/api/data/'))
      router.refresh()
    })
  }

  const grouped = localReactions.reduce<Record<string, { count: number; users: string[]; mine: boolean }>>(
    (acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [], mine: false }
      acc[r.emoji].count++
      if (r.user_name) acc[r.emoji].users.push(r.user_name)
      if (r.user_key === myUserKey) acc[r.emoji].mine = true
      return acc
    }, {}
  )

  return (
    <div className="flex items-center flex-wrap gap-1">
      {Object.entries(grouped).map(([emoji, { count, users, mine }]) => (
        <button
          key={emoji}
          onClick={() => handleToggle(emoji)}
          title={users.join('、')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
            mine
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
        >
          {emoji} {count}
        </button>
      ))}

      <div ref={pickerRef} className="relative">
        <button
          onClick={() => setPickerOpen(v => !v)}
          className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>

        {pickerOpen && (
          <div className="absolute bottom-full mb-1.5 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20 w-52">
            <div className="grid grid-cols-8 gap-0.5">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => handleToggle(e)}
                  className="w-6 h-6 flex items-center justify-center text-base hover:bg-gray-100 rounded transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
