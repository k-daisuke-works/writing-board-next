'use client'

import { useState } from 'react'
import { Eye, ChevronDown } from 'lucide-react'
import type { PostRead } from '@/types/database'

type Props = { reads: PostRead[]; myUserKey: number }

export default function PostReads({ reads, myUserKey }: Props) {
  const [open, setOpen] = useState(false)
  if (reads.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Eye className="w-3 h-3" />
        既読 {reads.length}件
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-1.5 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[140px]">
          <p className="text-[10px] font-semibold text-gray-400 mb-1.5 px-1">既読メンバー</p>
          <div className="space-y-0.5 max-h-36 overflow-y-auto">
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
        </div>
      )}
    </div>
  )
}
