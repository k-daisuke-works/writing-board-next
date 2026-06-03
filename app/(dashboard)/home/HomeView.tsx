'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Plus, Paperclip, Clock, ChevronRight, AlertCircle, Megaphone } from 'lucide-react'
import Link from 'next/link'
import { getPublicMediaUrl } from '@/lib/storage'
import { relativeTime, isRecent } from '@/lib/utils'
import { ExpandableText } from '@/app/(dashboard)/components/ExpandableText'
import type { Department, WritingData, UserSession, PostRead, PostReaction, PostReply } from '@/types/database'
import PostModal from '@/app/(dashboard)/posts/PostModal'
import HomeMenuDropdown from './HomeMenuDropdown'
import PostReads from '@/app/(dashboard)/components/PostReads'
import PostReactions from '@/app/(dashboard)/components/PostReactions'
import PostReplies from '@/app/(dashboard)/components/PostReplies'
import MarkReadOnMount from '@/app/(dashboard)/components/MarkReadOnMount'
import RealtimeSocial from '@/app/(dashboard)/components/RealtimeSocial'
import PushNotificationButton from '@/app/(dashboard)/components/PushNotificationButton'

type SocialMaps = {
  readsMap: Record<number, PostRead[]>
  reactionsMap: Record<number, PostReaction[]>
  repliesMap: Record<number, PostReply[]>
  myUserKey: number
  myUserName: string
  myAvatarUrl: string | null
  avatarMap: Record<number, string | null>
}

type Props = {
  session: UserSession
  departments: Department[]
  deptLatest: Record<number, WritingData>
  teamMembers: { user_key: number; user_name: string; avatar_url?: string | null }[]
  memberLatest: Record<number, WritingData | null>
  readsMap: Record<number, PostRead[]>
  reactionsMap: Record<number, PostReaction[]>
  repliesMap: Record<number, PostReply[]>
  allPostIds: number[]
  importantPosts: WritingData[]
  avatarMap: Record<number, string | null>
}


function MediaBlock({ post }: { post: WritingData }) {
  return (
    <>
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
    </>
  )
}

function SocialBar({ postId, social }: { postId: number; social: SocialMaps }) {
  return (
    <div className="mt-3 pt-2 border-t border-gray-100 space-y-2">
      <PostReactions
        postId={postId}
        reactions={social.reactionsMap[postId] ?? []}
        myUserKey={social.myUserKey}
      />
      <div className="flex items-center gap-3">
        <PostReads reads={social.readsMap[postId] ?? []} myUserKey={social.myUserKey} />
      </div>
      <PostReplies
        postId={postId}
        replies={social.repliesMap[postId] ?? []}
        myUserKey={social.myUserKey}
        myUserName={social.myUserName}
        myAvatarUrl={social.myAvatarUrl}
        avatarMap={social.avatarMap}
      />
    </div>
  )
}

function NoticeCard({ dept, post, social }: { dept: Department; post: WritingData | undefined; social: SocialMaps }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={1.75} />
          <span className="text-sm font-medium text-gray-800">{dept.department_name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {post?.is_important && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
              <AlertCircle className="w-3 h-3" />重要
            </span>
          )}
          {post && isRecent(post.writing_time) && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">NEW</span>
          )}
        </div>
      </div>
      <div className="px-4 py-3">
        {post ? (
          <>
            <ExpandableText text={post.message} className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap" />
            <MediaBlock post={post} />
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
              <span className="text-xs text-gray-500">{post.user_name_stamp}</span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />{relativeTime(post.writing_time)}
              </span>
            </div>
            <SocialBar postId={post.writing_id} social={social} />
          </>
        ) : (
          <p className="text-sm text-gray-400 py-2">まだお知らせがありません</p>
        )}
      </div>
    </div>
  )
}

function TeamCard({ member, post, isMe, social }: {
  member: { user_key: number; user_name: string; avatar_url?: string | null }
  post: WritingData | null
  isMe: boolean
  social: SocialMaps
}) {
  return (
    <div className={`rounded-lg overflow-hidden border ${isMe ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
      <Link href={`/member/${member.user_key}`} className={`flex items-center justify-between px-4 py-3 border-b hover:bg-opacity-80 transition-colors group ${isMe ? 'border-blue-100 hover:bg-blue-100' : 'border-gray-100 hover:bg-gray-50'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold ${
            isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {member.avatar_url
              ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
              : member.user_name.slice(0, 1)
            }
          </div>
          <span className="text-sm font-medium text-gray-800">{member.user_name}</span>
          {isMe && <span className="text-xs text-blue-500 font-medium">（自分）</span>}
        </div>
        <div className="flex items-center gap-2">
          {post?.is_important && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
              <AlertCircle className="w-3 h-3" />重要
            </span>
          )}
          {post && isRecent(post.writing_time) && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">NEW</span>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
        </div>
      </Link>
      <div className="px-4 py-3">
        {post ? (
          <>
            <ExpandableText text={post.message} className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap" />
            <MediaBlock post={post} />
            <div className="flex items-center justify-end mt-3 pt-2 border-t border-gray-50">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />{relativeTime(post.writing_time)}
              </span>
            </div>
            <SocialBar postId={post.writing_id} social={social} />
          </>
        ) : (
          <p className="text-sm text-gray-400 py-2">まだ投稿がありません</p>
        )}
      </div>
    </div>
  )
}

export default function HomeView({
  session, departments, deptLatest, teamMembers, memberLatest,
  readsMap, reactionsMap, repliesMap, allPostIds, importantPosts, avatarMap,
}: Props) {
  const [modalType, setModalType] = useState<'team' | 'notice' | null>(null)
  const router = useRouter()

  const social: SocialMaps = {
    readsMap,
    reactionsMap,
    repliesMap,
    myUserKey: session.userKey,
    myUserName: session.userName,
    myAvatarUrl: session.avatarUrl,
    avatarMap,
  }

  function closeModal() {
    setModalType(null)
    router.refresh()
  }

  return (
    <div className="anim-fade-in space-y-6">
      <MarkReadOnMount postIds={allPostIds} />
      <RealtimeSocial organizationKey={session.organizationKey} />

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
        <div className="flex items-center gap-2">
          <PushNotificationButton />
          <HomeMenuDropdown role={session.role} userKey={session.userKey} />
        </div>
      </div>

      {importantPosts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-red-500" />重要連絡
            </h2>
            <Link href="/posts" className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
              全体掲示板を見る
            </Link>
          </div>
          <div className="space-y-2">
            {importantPosts.map((post) => (
              <div key={post.writing_id} className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <div className="flex items-center flex-wrap gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">重要</span>
                  <span className="text-xs font-medium text-gray-700">{post.department_name_stamp}</span>
                  <span className="text-xs text-gray-500">{post.user_name_stamp}</span>
                  {post.display_until && (
                    <span className="text-xs text-red-400 ml-auto">
                      {new Date(post.display_until).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}まで
                    </span>
                  )}
                </div>
                <ExpandableText text={post.message} className="text-sm text-red-900 leading-relaxed whitespace-pre-wrap" />
                <div className="flex items-center justify-end mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <Clock className="w-3 h-3" />{relativeTime(post.writing_time)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {departments.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-600">部署からのお知らせ</h2>
            <button
              onClick={() => setModalType('notice')}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />お知らせを投稿
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {departments.map((dept) => (
              <NoticeCard key={dept.department_id} dept={dept} post={deptLatest[dept.department_id]} social={social} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teamMembers.map((member) => (
              <TeamCard
                key={member.user_key}
                member={member}
                post={memberLatest[member.user_key]}
                isMe={member.user_key === session.userKey}
                social={social}
              />
            ))}
          </div>
        )}
      </section>

      {modalType && (
        <PostModal session={session} postType={modalType} onClose={closeModal} />
      )}
    </div>
  )
}
