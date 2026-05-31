'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Plus, Image, Video, Paperclip, ChevronDown, Clock } from 'lucide-react'
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

function isRecent(t: string) {
  return Date.now() - new Date(t).getTime() < 7 * 864e5
}

function truncate(s: string, n = 60) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function MediaBadge({ post }: { post: WritingData }) {
  if (post.image_url) return (
    <img src={getPublicMediaUrl('images', post.image_url)} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
  )
  if (post.video_url) return <Video className="w-4 h-4 text-gray-400 shrink-0" />
  if (post.pdf_url)   return <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
  return null
}

// お知らせカード（全文表示 + 8行超えで展開）
function NoticeCard({ dept, post }: { dept: Department; post: WritingData | undefined }) {
  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const msgRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = msgRef.current
    if (el) setIsClamped(el.scrollHeight > el.clientHeight + 2)
  }, [post?.message])

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={1.75} />
          <span className="text-sm font-medium text-gray-800">{dept.department_name}</span>
        </div>
        {post && isRecent(post.writing_time) && (
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">NEW</span>
        )}
      </div>

      {/* 本文 */}
      <div className="px-4 py-3">
        {post ? (
          <>
            <p
              ref={msgRef}
              className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap ${!expanded ? 'line-clamp-8' : ''}`}
            >
              {post.message}
            </p>

            {/* 展開ボタン */}
            {(isClamped || expanded) && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="mt-1.5 flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                {expanded ? '閉じる' : '続きを読む'}
              </button>
            )}

            {/* メディア */}
            {post.image_url && (
              <img src={getPublicMediaUrl('images', post.image_url)} alt="" className="mt-3 rounded-lg max-w-xs w-full border border-gray-100" />
            )}
            {post.video_url && (
              <video src={getPublicMediaUrl('videos', post.video_url)} controls className="mt-3 rounded-lg max-w-xs w-full" />
            )}
            {post.pdf_url && (
              <a href={`/api/pdf?path=${encodeURIComponent(post.pdf_url)}`} target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors">
                <Paperclip className="w-3.5 h-3.5" />PDFを開く
              </a>
            )}

            {/* フッター */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
              <span className="text-xs text-gray-500">{post.user_name_stamp}</span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />{relativeTime(post.writing_time)}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 py-2">まだお知らせがありません</p>
        )}
      </div>
    </div>
  )
}

export default function HomeView({ session, departments, deptLatest, teamMembers, memberLatest }: Props) {
  const [modalType, setModalType] = useState<'team' | 'notice' | null>(null)
  const router = useRouter()

  function closeModal() {
    setModalType(null)
    router.refresh()
  }

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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-600">各部署からのお知らせ</h2>
            <button
              onClick={() => setModalType('notice')}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />お知らせを投稿
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {departments.map((dept) => (
              <NoticeCard key={dept.department_id} dept={dept} post={deptLatest[dept.department_id]} />
            ))}
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
              onClick={() => setModalType('team')}
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

      {modalType && (
        <PostModal session={session} postType={modalType} onClose={closeModal} />
      )}
    </div>
  )
}
