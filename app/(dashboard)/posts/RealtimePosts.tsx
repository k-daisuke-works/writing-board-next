'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Department, WritingData, UserSession } from '@/types/database'
import PostModal from './PostModal'

type Props = {
  initialPosts: Record<number, WritingData>
  departments: Department[]
  session: UserSession
}

function isRecent(timeStr: string | null): boolean {
  if (!timeStr) return false
  const diffDays =
    (Date.now() - new Date(timeStr).getTime()) / (1000 * 60 * 60 * 24)
  return diffDays < 7
}

function formatDate(timeStr: string): string {
  return new Date(timeStr).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function RealtimePosts({
  initialPosts,
  departments,
  session,
}: Props) {
  const [latestPosts, setLatestPosts] = useState(initialPosts)
  const [showPostModal, setShowPostModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    // Supabase Realtime: writing_data テーブルの変更を購読
    const channel = supabase
      .channel('writing_data_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'writing_data',
          filter: `organization_key=eq.${session.organizationKey}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPost = payload.new as WritingData
            setLatestPosts((prev) => {
              const current = prev[newPost.department_id!]
              if (!current || newPost.writing_time > current.writing_time) {
                return { ...prev, [newPost.department_id!]: newPost }
              }
              return prev
            })
            setToast(`💬 ${newPost.department_name_stamp} から新しい投稿があります`)
            setTimeout(() => setToast(null), 4000)
          }
          if (payload.eventType === 'DELETE') {
            const deleted = payload.old as WritingData
            setLatestPosts((prev) => {
              if (prev[deleted.department_id!]?.writing_id === deleted.writing_id) {
                const updated = { ...prev }
                delete updated[deleted.department_id!]
                return updated
              }
              return prev
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session.organizationKey])

  return (
    <>
      {/* トースト通知 */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm animate-bounce">
          {toast}
        </div>
      )}

      {/* 投稿ボタン */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📋 各部署の最新投稿</h1>
        <button
          onClick={() => setShowPostModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          ✏️ 投稿する
        </button>
      </div>

      {/* 部署カード一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const post = latestPosts[dept.department_id]
          const recent = isRecent(post?.writing_time ?? null)

          return (
            <a
              key={dept.department_id}
              href={`/department/${dept.department_id}`}
              className="bg-white rounded-2xl shadow hover:shadow-md transition-shadow overflow-hidden block"
            >
              {/* カードヘッダー */}
              <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-2">
                <span className="font-semibold text-sm">🏢 {dept.department_name}</span>
                {recent && (
                  <span className="ml-auto bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    NEW
                  </span>
                )}
              </div>

              {/* カード本文 */}
              <div className="p-4">
                {post && recent ? (
                  <>
                    <p className="text-xs text-gray-500 mb-2">
                      👤 {post.user_name_stamp}　💼 {post.job_name_stamp}
                    </p>
                    <div
                      className="text-sm text-gray-700 line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: post.message }}
                    />
                    {post.pdf_url && (
                      <span className="mt-2 inline-block text-xs text-red-500">
                        📎 PDF添付あり
                      </span>
                    )}
                    <p className="text-xs text-gray-400 mt-2 text-right">
                      🕐 {formatDate(post.writing_time)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 italic text-center py-4">
                    最新の投稿はありません
                  </p>
                )}
              </div>
            </a>
          )
        })}
      </div>

      {/* 投稿モーダル */}
      {showPostModal && (
        <PostModal
          session={session}
          onClose={() => setShowPostModal(false)}
        />
      )}
    </>
  )
}
