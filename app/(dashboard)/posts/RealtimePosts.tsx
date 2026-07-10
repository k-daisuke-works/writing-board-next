'use client'

import { useState } from 'react'
import { ExpandableText } from '@/app/(dashboard)/components/ExpandableText'
import { relativeTime, isRecent } from '@/lib/utils'
import type { Department, WritingData, UserSession, PostRead, PostReaction, PostReply, PostAttachment } from '@/types/database'
import PostModal from './PostModal'
import Link from 'next/link'
import { Plus, Clock, Building2, ChevronRight, Wifi } from 'lucide-react'
import PostReads from '@/app/(dashboard)/components/PostReads'
import PostReactions from '@/app/(dashboard)/components/PostReactions'
import PostReplies from '@/app/(dashboard)/components/PostReplies'
import PostAttachments from '@/app/(dashboard)/components/PostAttachments'
import MarkReadOnMount from '@/app/(dashboard)/components/MarkReadOnMount'
import RealtimeSocial from '@/app/(dashboard)/components/RealtimeSocial'

type Props = {
  initialPosts: Record<number, WritingData>
  departments: Department[]
  session: UserSession
  initialReadsMap: Record<number, PostRead[]>
  initialReactionsMap: Record<number, PostReaction[]>
  initialRepliesMap: Record<number, PostReply[]>
  initialAvatarMap: Record<number, string | null>
  initialAttachmentsMap: Record<number, PostAttachment[]>
}


export default function RealtimePosts({
  initialPosts, departments, session,
  initialReadsMap, initialReactionsMap, initialRepliesMap, initialAvatarMap, initialAttachmentsMap,
}: Props) {
  // 表示データは SWR 由来の props。broadcast 受信時に親が /api/data/posts を
  // 再取得し、key={fetchedAt} で本コンポーネントが最新 props で再マウントされる。
  const latestPosts = initialPosts
  const [showModal, setShowModal] = useState(false)

  const postIds = Object.values(latestPosts).map(p => p.writing_id)
  const newCount = departments.filter((d) => isRecent(latestPosts[d.department_id]?.writing_time ?? null)).length

  return (
    <>
      <MarkReadOnMount postIds={postIds} />
      <RealtimeSocial channel={session.realtimeChannel} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">全体掲示板</h1>
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
          className="flex items-center gap-1.5 btn-pop text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" /><span>投稿する</span>
        </button>
      </div>

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
              <div key={dept.department_id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-200 transition-colors h-full flex flex-col">
                <Link href={`/department/${dept.department_id}`} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
                    <span className="text-sm font-medium text-gray-800">{dept.department_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {recent && <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">NEW</span>}
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
                  </div>
                </Link>

                <div className="flex-1 px-4 py-3">
                  {post ? (
                    <>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                        <span className="font-medium text-gray-600">{post.user_name_stamp}</span>
                        <span>·</span>
                        <span>{post.job_name_stamp}</span>
                      </div>

                      <ExpandableText
                        text={post.message}
                        className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                      />

                      <PostAttachments post={post} attachments={initialAttachmentsMap[post.writing_id] ?? []} />

                      <div className="flex items-center justify-end mt-3 pb-2 border-b border-gray-50">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />{relativeTime(post.writing_time)}
                        </span>
                      </div>

                      <div className="pt-2 space-y-2">
                        <PostReactions
                          postId={post.writing_id}
                          reactions={initialReactionsMap[post.writing_id] ?? []}
                          myUserKey={session.userKey}
                        />
                        <div className="flex items-center gap-3">
                          <PostReads reads={initialReadsMap[post.writing_id] ?? []} myUserKey={session.userKey} />
                        </div>
                        <PostReplies
                          postId={post.writing_id}
                          replies={initialRepliesMap[post.writing_id] ?? []}
                          myUserKey={session.userKey}
                          myUserName={session.userName}
                          myAvatarUrl={session.avatarUrl}
                          avatarMap={initialAvatarMap}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 py-3">まだ投稿がありません</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <PostModal session={session} postType="board" onClose={() => setShowModal(false)} />}
    </>
  )
}
