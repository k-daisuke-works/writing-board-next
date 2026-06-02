'use client'

import { useState } from 'react'
import { AlertCircle, X, Clock } from 'lucide-react'
import type { WritingData } from '@/types/database'

function relativeTime(t: string) {
  const m = Math.floor((Date.now() - new Date(t).getTime()) / 60000)
  if (m < 1) return 'たった今'
  if (m < 60) return `${m}分前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}時間前`
  return `${Math.floor(h / 24)}日前`
}

export default function ImportantBanner({ posts }: { posts: WritingData[] }) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())

  const visible = posts.filter(p => !dismissed.has(p.writing_id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-2">
      {visible.map((post) => (
        <div key={post.writing_id} className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">重要</span>
              <span className="text-xs text-red-500">{post.user_name_stamp}</span>
              {post.department_name_stamp && (
                <span className="text-xs text-red-400">· {post.department_name_stamp}</span>
              )}
              <span className="flex items-center gap-0.5 text-xs text-red-400 ml-auto">
                <Clock className="w-3 h-3" />{relativeTime(post.writing_time)}
              </span>
            </div>
            <p className="text-sm text-red-800 leading-relaxed line-clamp-2">{post.message}</p>
          </div>
          <button
            onClick={() => setDismissed(prev => new Set([...prev, post.writing_id]))}
            className="text-red-300 hover:text-red-500 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
