'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Department, WritingData, UserSession } from '@/types/database'
import PostModal from './PostModal'
import Link from 'next/link'
import { Plus, Clock, Paperclip, Building2, ChevronRight, Wifi } from 'lucide-react'

type Props = {
  initialPosts: Record<number, WritingData>
  departments: Department[]
  session: UserSession
}

function relativeTime(t: string) {
  const m = Math.floor((Date.now() - new Date(t).getTime()) / 60000)
  if (m < 1)  return 'たった今'
  if (m < 60) return `${m}分前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}時間前`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}日前`
  return new Date(t).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

function isRecent(t: string | null) {
  return !!t && Date.now() - new Date(t).getTime() < 7 * 864e5
}

export default function RealtimePosts({ initialPosts, departments, session }: Props) {
  const [latestPosts, setLatestPosts] = useState(initialPosts)
  const [showModal, setShowModal]     = useState(false)
  const [toast, setToast]             = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const ch = supabase.channel('wr')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'writing_data',
        filter: `organization_key=eq.${session.organizationKey}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const p = payload.new as WritingData
          setLatestPosts((prev) => {
            const cur = prev[p.department_id!]
            return (!cur || p.writing_time > cur.writing_time)
              ? { ...prev, [p.department_id!]: p }
              : prev
          })
          setToast(`${p.department_name_stamp}に新しい連絡があります`)
          setTimeout(() => setToast(null), 4000)
        }
        if (payload.eventType === 'DELETE') {
          const d = payload.old as WritingData
          setLatestPosts((prev) => {
            if (prev[d.department_id!]?.writing_id !== d.writing_id) return prev
            const next = { ...prev }; delete next[d.department_id!]; return next
          })
        }
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [session.organizationKey])

  const newCount = departments.filter((d) => isRecent(latestPosts[d.department_id]?.writing_time ?? null)).length

  return (
    <>
      {/* トースト */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 anim-slide-down">
          <div className="bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
            {toast}
          </div>
        </div>
      )}

      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">連絡ボード</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
            {departments.length}部署
            {newCount > 0 && <span className="text-blue-600 font-medium">· {newCount}件の新着</span>}
            <span className="flex items-center gap-1 text-green-600">
              <Wifi className="w-3 h-3" />
              <span className="text-xs">リアルタイム</span>
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>投稿する</span>
        </button>
      </div>

      {/* 部署カードグリッド */}
      {departments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">部署が登録されていません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map((dept) => {
            const post   = latestPosts[dept.department_id]
            const recent = isRecent(post?.writing_time ?? null)

            return (
              <Link key={dept.department_id} href={`/department/${dept.department_id}`} className="group">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all duration-150 h-full flex flex-col">
                  {/* カードヘッダー */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
                      <span className="text-sm font-medium text-gray-800">{dept.department_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {recent && (
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          NEW
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>

                  {/* カード本文 */}
                  <div className="flex-1 px-4 py-3">
                    {post ? (
                      <>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                          <span className="font-medium text-gray-600">{post.user_name_stamp}</span>
                          <span>·</span>
                          <span>{post.job_name_stamp}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                          {post.message}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          {post.pdf_url
                            ? <span className="flex items-center gap-1 text-xs text-gray-400"><Paperclip className="w-3 h-3"/>PDF添付</span>
                            : <span />
                          }
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />{relativeTime(post.writing_time)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 py-3">まだ投稿がありません</p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {showModal && <PostModal session={session} onClose={() => setShowModal(false)} />}
    </>
  )
}
