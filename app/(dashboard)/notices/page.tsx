import { getSession } from '@/lib/session'
import { createOrgClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExpandableText } from '@/app/(dashboard)/components/ExpandableText'
import PostAttachments from '@/app/(dashboard)/components/PostAttachments'
import PostReads from '@/app/(dashboard)/components/PostReads'
import PostReactions from '@/app/(dashboard)/components/PostReactions'
import PostReplies from '@/app/(dashboard)/components/PostReplies'
import RealtimeSocial from '@/app/(dashboard)/components/RealtimeSocial'
import MarkReadOnMount from '@/app/(dashboard)/components/MarkReadOnMount'
import Link from 'next/link'
import { ArrowLeft, Clock, AlertCircle, Megaphone } from 'lucide-react'
import type { PostRead, PostReaction, PostReply, PostAttachment } from '@/types/database'
import { groupByPostId, fmtDatetime, fmtShortDate } from '@/lib/utils'

export default async function NoticesPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.departmentId <= 0) redirect('/home')

  const supabase = await createOrgClient(session.organizationKey)

  const { data: notices } = await supabase.from('writing_data').select('*')
    .eq('organization_key', session.organizationKey)
    .eq('department_id', session.departmentId)
    .or('post_type.eq.notice,and(post_type.eq.team,is_important.eq.true)')
    .order('writing_time', { ascending: false })
    .limit(100)

  const postIds = (notices ?? []).map(p => p.writing_id)

  const [{ data: allReads }, { data: allReactions }, { data: allReplies }, { data: attachmentsRaw }] =
    postIds.length > 0
      ? await Promise.all([
          supabase.from('post_reads').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey),
          supabase.from('post_reactions').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey),
          supabase.from('post_replies').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey).order('created_at'),
          supabase.from('post_attachments').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]

  const readsMap     = groupByPostId<PostRead>(allReads as PostRead[])
  const reactionsMap = groupByPostId<PostReaction>(allReactions as PostReaction[])
  const repliesMap   = groupByPostId<PostReply>(allReplies as PostReply[])
  const attachmentsMap: Record<number, PostAttachment[]> = {}
  for (const a of (attachmentsRaw ?? []) as PostAttachment[]) {
    if (!attachmentsMap[a.post_id]) attachmentsMap[a.post_id] = []
    attachmentsMap[a.post_id].push(a)
  }

  const replyUserKeys = [...new Set((allReplies ?? []).map(r => (r as PostReply).user_key))]
  const avatarMap: Record<number, string | null> = { [session.userKey]: session.avatarUrl ?? null }
  if (replyUserKeys.length > 0) {
    const { data: avatarData } = await supabase
      .from('user_info').select('user_key, avatar_url')
      .eq('organization_key', session.organizationKey).in('user_key', replyUserKeys)
    for (const u of avatarData ?? []) avatarMap[u.user_key] = u.avatar_url ?? null
  }

  return (
    <div className="anim-fade-in max-w-3xl">
      <MarkReadOnMount postIds={postIds} />
      <RealtimeSocial channel={session.realtimeChannel} />

      <div className="mb-6">
        <Link href="/home" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-3 w-fit">
          <ArrowLeft className="w-4 h-4" />
          ホームに戻る
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-500" />
          お知らせ履歴
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {session.departmentName} · {notices?.length ?? 0}件
        </p>
      </div>

      {notices && notices.length > 0 ? (
        <div className="space-y-2.5">
          {notices.map((post) => (
            <div key={post.writing_id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 sm:px-5 pt-3.5 pb-1">
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {post.is_important && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                      <AlertCircle className="w-3 h-3" />重要
                    </span>
                  )}
                  {post.display_until && (
                    <span className="text-xs text-blue-500 font-medium">
                      {fmtShortDate(post.display_until)}まで固定表示
                    </span>
                  )}
                </div>
                <ExpandableText text={post.message} className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap" />
                <PostAttachments post={post} attachments={attachmentsMap[post.writing_id] ?? []} />
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-500">{post.user_name_stamp}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {fmtDatetime(post.writing_time)}
                  </span>
                </div>
              </div>
              <div className="px-4 sm:px-5 py-3 border-t border-gray-100 space-y-2">
                <PostReactions postId={post.writing_id} reactions={reactionsMap[post.writing_id] ?? []} myUserKey={session.userKey} />
                <PostReads reads={readsMap[post.writing_id] ?? []} myUserKey={session.userKey}
                  postId={post.writing_id} canRemind={session.role !== 'member'} />
                <PostReplies
                  postId={post.writing_id}
                  replies={repliesMap[post.writing_id] ?? []}
                  myUserKey={session.userKey}
                  myUserName={session.userName}
                  myAvatarUrl={session.avatarUrl}
                  avatarMap={avatarMap}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">お知らせはまだありません</p>
        </div>
      )}
    </div>
  )
}
