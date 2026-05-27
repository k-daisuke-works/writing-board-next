'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Department, WritingData, UserSession } from '@/types/database'
import PostModal from './PostModal'
import Link from 'next/link'

type Props = {
  initialPosts: Record<number, WritingData>
  departments: Department[]
  session: UserSession
}

// 部署ごとのアクセントカラー（静的クラスで Tailwind に認識させる）
const ACCENTS = [
  { border: 'border-l-indigo-500',  dot: 'bg-indigo-500',  badge: 'bg-indigo-100 text-indigo-700'  },
  { border: 'border-l-violet-500',  dot: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700'  },
  { border: 'border-l-blue-500',    dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700'      },
  { border: 'border-l-emerald-500', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700'},
  { border: 'border-l-amber-500',   dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700'   },
  { border: 'border-l-rose-500',    dot: 'bg-rose-500',    badge: 'bg-rose-100 text-rose-700'     },
  { border: 'border-l-cyan-500',    dot: 'bg-cyan-500',    badge: 'bg-cyan-100 text-cyan-700'     },
  { border: 'border-l-pink-500',    dot: 'bg-pink-500',    badge: 'bg-pink-100 text-pink-700'     },
]

function isRecent(t: string | null) {
  if (!t) return false
  return (Date.now() - new Date(t).getTime()) < 7 * 864e5
}

function relativeTime(t: string): string {
  const diffMin = Math.floor((Date.now() - new Date(t).getTime()) / 60000)
  if (diffMin < 1)  return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24)   return `${diffH}時間前`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7)    return `${diffD}日前`
  return new Date(t).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export default function RealtimePosts({ initialPosts, departments, session }: Props) {
  const [latestPosts, setLatestPosts] = useState(initialPosts)
  const [showModal, setShowModal]     = useState(false)
  const [toast, setToast]             = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const ch = supabase
      .channel('writing_data_realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'writing_data',
        filter: `organization_key=eq.${session.organizationKey}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const p = payload.new as WritingData
          setLatestPosts((prev) => {
            const cur = prev[p.department_id!]
            if (!cur || p.writing_time > cur.writing_time)
              return { ...prev, [p.department_id!]: p }
            return prev
          })
          setToast(`💬 ${p.department_name_stamp} に新しい連絡があります`)
          setTimeout(() => setToast(null), 4000)
        }
        if (payload.eventType === 'DELETE') {
          const d = payload.old as WritingData
          setLatestPosts((prev) => {
            if (prev[d.department_id!]?.writing_id === d.writing_id) {
              const next = { ...prev }
              delete next[d.department_id!]
              return next
            }
            return prev
          })
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [session.organizationKey])

  const newCount = departments.filter(
    (d) => isRecent(latestPosts[d.department_id]?.writing_time ?? null)
  ).length

  return (
    <>
      {/* トースト */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 toast-enter">
          <div className="bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl text-sm flex items-center gap-2.5 max-w-xs">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
            {toast}
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">連絡ボード</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {departments.length} 部署
            {newCount > 0 && (
              <span className="ml-2 text-indigo-500 font-medium">· {newCount} 件の新着</span>
            )}
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              リアルタイム更新中
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm"
        >
          <span>✏️</span>
          <span className="hidden sm:inline">投稿する</span>
        </button>
      </div>

      {/* 部署カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept, i) => {
          const accent = ACCENTS[i % ACCENTS.length]
          const post   = latestPosts[dept.department_id]
          const recent = isRecent(post?.writing_time ?? null)

          return (
            <Link
              key={dept.department_id}
              href={`/department/${dept.department_id}`}
              className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:-translate-y-0.5"
            >
              {/* カードヘッダー */}
              <div className={`border-l-4 ${accent.border} px-4 pt-4 pb-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${accent.dot}`} />
                  <span className="font-semibold text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                    {dept.department_name}
                  </span>
                </div>
                {recent && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${accent.badge}`}>
                    NEW
                  </span>
                )}
              </div>

              {/* カード本文 */}
              <div className={`flex-1 border-l-4 ${accent.border} px-4 pb-4`}>
                {post ? (
                  <>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <span>{post.user_name_stamp}</span>
                      <span>·</span>
                      <span>{post.job_name_stamp}</span>
                    </div>
                    <div
                      className="text-sm text-slate-600 line-clamp-3 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: post.message }}
                    />
                    <div className="flex items-center justify-between mt-3">
                      {post.pdf_url && (
                        <span className="text-xs text-rose-400 flex items-center gap-1">
                          📎 PDF
                        </span>
                      )}
                      <span className="text-xs text-slate-300 ml-auto">
                        {relativeTime(post.writing_time)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-300 italic py-4 text-center">
                    まだ投稿がありません
                  </p>
                )}
              </div>
            </Link>
          )
        })}

        {departments.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-300">
            <div className="text-4xl mb-3">🏢</div>
            <p className="text-sm">部署が登録されていません</p>
          </div>
        )}
      </div>

      {showModal && <PostModal session={session} onClose={() => setShowModal(false)} />}
    </>
  )
}
