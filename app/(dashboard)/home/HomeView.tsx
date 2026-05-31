'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, ChevronRight, Plus, Image, Video, Paperclip } from 'lucide-react'
import { getPublicMediaUrl } from '@/lib/storage'
import type { Department, WritingData, UserSession } from '@/types/database'
import PostModal from '@/app/(dashboard)/posts/PostModal'
import HomeMenuDropdown from './HomeMenuDropdown'

type Props = {
  session: UserSession
  departments: Department[]
  deptLatest: Record<number, WritingData>
  teamMembers: { user_key: number; user_name: string }[]
  memberLatest: Record<number, WritingData | null>
}

function relativeTime(t: string) {
  const m = Math.floor((Date.now() - new Date(t).getTime()) / 60000)
  if (m < 1) return 'たった今'
  if (m < 60) return `${m}分前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}時間前`
  const d = Math.floor(h / 24)
  return `${d}日前`
}

function truncate(s: string, n = 60) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function MediaBadge({ post }: { post: WritingData }) {
  if (post.image_url) return (
    <img
      src={getPublicMediaUrl('images', post.image_url)}
      alt=""
      className="w-8 h-8 rounded object-cover shrink-0"
    />
  )
  if (post.video_url) return <Video className="w-4 h-4 text-gray-400 shrink-0" />
  if (post.pdf_url)   return <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
  return null
}

export default function HomeView({ session, departments, deptLatest, teamMembers, memberLatest }: Props) {
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  return (
    <div className="anim-fade-in space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            おはようございます、{session.userName}さん
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {session.organizationName}
            {session.departmentName && ` · ${session.departmentName}`}
            {session.jobName && ` · ${session.jobName}`}
          </p>
        </div>
        <HomeMenuDropdown adminFlag={session.adminFlag} />
      </div>

      {/* 各部署からのお知らせ */}
      {departments.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-600 mb-2">各部署からのお知らせ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {departments.map((dept) => {
              const post = deptLatest[dept.department_id]
              return (
                <Link key={dept.department_id} href={`/department/${dept.department_id}`} className="group">
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-2 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{dept.department_name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {post ? truncate(post.message) : '投稿なし'}
                      </p>
                    </div>
                    {post && <span className="text-xs text-gray-400 shrink-0">{relativeTime(post.writing_time)}</span>}
                    {post && <MediaBadge post={post} />}
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-400 shrink-0 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* チームのメッセージ */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-600">
            チームのメッセージ
            {session.departmentName && (
              <span className="font-normal text-gray-400 ml-1.5">· {session.departmentName}</span>
            )}
          </h2>
          {session.departmentId > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />投稿する
            </button>
          )}
        </div>

        {session.departmentId <= 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-6 text-center">
            <p className="text-sm text-gray-400">所属部署が設定されていません</p>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-6 text-center">
            <p className="text-sm text-gray-400">チームメンバーが見つかりません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {teamMembers.map((member) => {
              const post = memberLatest[member.user_key]
              const isMe = member.user_key === session.userKey

              return (
                <div
                  key={member.user_key}
                  className={`rounded-lg px-3 py-2.5 flex items-center gap-2.5 min-w-0 border ${
                    isMe ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {member.user_name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{member.user_name}</p>
                    <p className={`text-xs truncate ${post ? 'text-gray-500' : 'text-gray-300'}`}>
                      {post ? truncate(post.message) : 'まだ投稿がありません'}
                    </p>
                  </div>
                  {post && <span className="text-xs text-gray-400 shrink-0">{relativeTime(post.writing_time)}</span>}
                  {post && <MediaBadge post={post} />}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {showModal && (
        <PostModal
          session={session}
          postType="team"
          onClose={() => {
            setShowModal(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
