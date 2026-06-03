import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { deletePost, updatePost, getPdfSignedUrl } from '@/actions/posts'
import { ExpandableText } from '@/app/(dashboard)/components/ExpandableText'
import PostAttachments from '@/app/(dashboard)/components/PostAttachments'
import { DeletePostButton } from '@/app/(dashboard)/department/[id]/DeletePostButton'
import ProfileEditModal from './ProfileEditModal'
import MarkReadOnMount from '@/app/(dashboard)/components/MarkReadOnMount'
import PostReads from '@/app/(dashboard)/components/PostReads'
import PostReactions from '@/app/(dashboard)/components/PostReactions'
import PostReplies from '@/app/(dashboard)/components/PostReplies'
import RealtimeSocial from '@/app/(dashboard)/components/RealtimeSocial'
import Link from 'next/link'
import { ArrowLeft, Clock, Paperclip, User, ChevronDown, Building2 } from 'lucide-react'
import type { PostRead, PostReaction, PostReply, PostAttachment } from '@/types/database'

type SA = (fd: FormData) => Promise<void>
const toAction = (fn: (fd: FormData) => unknown) => fn as unknown as SA

function groupByPostId<T extends { post_id: number }>(items: T[] | null): Record<number, T[]> {
  return (items ?? []).reduce<Record<number, T[]>>((acc, item) => {
    if (!acc[item.post_id]) acc[item.post_id] = []
    acc[item.post_id].push(item)
    return acc
  }, {})
}

export default async function MemberHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const userId = Number(id)
  const supabase = await createServiceClient()

  const [{ data: member }, { data: posts }] = await Promise.all([
    supabase.from('user_info')
      .select('user_key, user_name, avatar_url, affiliation, profile, department_id')
      .eq('user_key', userId)
      .eq('organization_key', session.organizationKey)
      .single(),
    supabase.from('writing_data').select('*')
      .eq('user_key', userId)
      .eq('organization_key', session.organizationKey)
      .eq('post_type', 'team')
      .order('writing_time', { ascending: false }),
  ])

  if (!member) redirect('/members')

  const postIds = (posts ?? []).map(p => p.writing_id)

  const [{ data: allReads }, { data: allReactions }, { data: allReplies }, { data: attachmentsRaw }] =
    postIds.length > 0
      ? await Promise.all([
          supabase.from('post_reads').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey),
          supabase.from('post_reactions').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey),
          supabase.from('post_replies').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey).order('created_at'),
          supabase.from('post_attachments').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey),
        ])
      : [{ data: [] as PostRead[] }, { data: [] as PostReaction[] }, { data: [] as PostReply[] }, { data: [] as PostAttachment[] }]

  const readsMap     = groupByPostId<PostRead>(allReads as PostRead[])
  const reactionsMap = groupByPostId<PostReaction>(allReactions as PostReaction[])
  const repliesMap   = groupByPostId<PostReply>(allReplies as PostReply[])
  const attachmentsMap: Record<number, PostAttachment[]> = {}
  for (const a of (attachmentsRaw ?? []) as PostAttachment[]) {
    if (!attachmentsMap[a.post_id]) attachmentsMap[a.post_id] = []
    attachmentsMap[a.post_id].push(a)
  }

  const replyUserKeys = [...new Set((allReplies ?? []).map(r => (r as PostReply).user_key))]
  const avatarMap: Record<number, string | null> = {}
  if (replyUserKeys.length > 0) {
    const { data: avatarData } = await supabase
      .from('user_info').select('user_key, avatar_url').in('user_key', replyUserKeys)
    for (const u of avatarData ?? []) avatarMap[u.user_key] = u.avatar_url ?? null
  }

  const canEdit = session.userKey === userId || session.adminFlag

  function fmt(t: string) {
    return new Date(t).toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="anim-fade-in max-w-3xl">
      <MarkReadOnMount postIds={postIds} />
      <RealtimeSocial organizationKey={session.organizationKey} />

      <Link href="/members" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4 w-fit">
        <ArrowLeft className="w-4 h-4" />
        メンバー一覧に戻る
      </Link>

      {/* プロフィールカード */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-100 shrink-0 border border-gray-200">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-blue-600 text-xl font-bold">
                {member.user_name.slice(0, 1)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{member.user_name}</h1>
                {member.affiliation && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    {member.affiliation}
                  </div>
                )}
              </div>
              {canEdit && (
                <ProfileEditModal
                  userKey={member.user_key}
                  currentAffiliation={member.affiliation}
                  currentProfile={member.profile}
                  currentAvatarUrl={member.avatar_url}
                />
              )}
            </div>
            {member.profile ? (
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed">{member.profile}</p>
            ) : canEdit ? (
              <p className="text-sm text-gray-400 mt-2">プロフィールを編集して自己紹介を追加しましょう</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* 投稿履歴 */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-500">投稿履歴</h2>
        <p className="text-xs text-gray-400 mt-0.5">{posts?.length ?? 0}件</p>
      </div>

      {posts && posts.length > 0 ? (
        <div className="space-y-2.5">
          {posts.map((post) => (
            <div key={post.writing_id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {post.user_name_stamp.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{post.user_name_stamp}</span>
                    <span className="text-xs text-gray-400">{post.job_name_stamp}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {fmt(post.writing_time)}
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-5 py-4 space-y-3">
                <ExpandableText text={post.message} className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap" />
                <PostAttachments post={post} attachments={attachmentsMap[post.writing_id] ?? []} />

                {/* ソーシャル */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <PostReactions
                    postId={post.writing_id}
                    reactions={reactionsMap[post.writing_id] ?? []}
                    myUserKey={session.userKey}
                  />
                  <div className="flex items-center gap-3">
                    <PostReads reads={readsMap[post.writing_id] ?? []} myUserKey={session.userKey} />
                  </div>
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

              {canEdit && (
                <details className="border-t border-gray-100">
                  <summary className="flex items-center gap-1.5 px-5 py-2.5 text-xs text-gray-400 cursor-pointer hover:bg-gray-50 hover:text-gray-600 transition-colors list-none select-none group">
                    <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                    編集 / 削除
                  </summary>
                  <div className="bg-gray-50 px-4 sm:px-5 py-4 space-y-3 border-t border-gray-100">
                    <form action={toAction(updatePost)} className="space-y-2.5">
                      <input type="hidden" name="writingId" value={post.writing_id} />
                      <textarea name="message" defaultValue={post.message} rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 resize-none transition-colors bg-white" />
                      <div className="flex gap-2 flex-wrap">
                        <input type="text" name="pin" placeholder="PIN"
                          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors bg-white w-32" />
                        <label className="flex items-center gap-1.5 border border-gray-300 rounded-md px-3 py-1.5 cursor-pointer hover:bg-white transition-colors text-sm text-gray-500">
                          <Paperclip className="w-3.5 h-3.5" />PDF
                          <input type="file" name="pdfFile" accept=".pdf" className="sr-only" />
                        </label>
                        <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors">
                          更新
                        </button>
                      </div>
                    </form>
                    <DeletePostButton action={deletePost} writingId={post.writing_id} />
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">まだ投稿がありません</p>
        </div>
      )}
    </div>
  )
}

