import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RealtimePosts from './RealtimePosts'
import type { WritingData, PostRead, PostReaction, PostReply } from '@/types/database'

function groupByPostId<T extends { post_id: number }>(items: T[] | null): Record<number, T[]> {
  return (items ?? []).reduce<Record<number, T[]>>((acc, item) => {
    if (!acc[item.post_id]) acc[item.post_id] = []
    acc[item.post_id].push(item)
    return acc
  }, {})
}

export default async function PostsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()

  const [{ data: departments }, { data: boardPosts }] = await Promise.all([
    supabase.from('department_data').select('*')
      .eq('organization_key', session.organizationKey)
      .order('department_id'),
    supabase.from('writing_data').select('*')
      .eq('organization_key', session.organizationKey)
      .eq('post_type', 'board')
      .order('writing_time', { ascending: false }),
  ])

  const latestPosts: Record<number, WritingData> = {}
  for (const post of boardPosts ?? []) {
    if (post.department_id != null && !latestPosts[post.department_id]) {
      latestPosts[post.department_id] = post
    }
  }

  const postIds = Object.values(latestPosts).map(p => p.writing_id)

  const [{ data: allReads }, { data: allReactions }, { data: allReplies }] =
    postIds.length > 0
      ? await Promise.all([
          supabase.from('post_reads').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey),
          supabase.from('post_reactions').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey),
          supabase.from('post_replies').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey).order('created_at'),
        ])
      : [{ data: [] as PostRead[] }, { data: [] as PostReaction[] }, { data: [] as PostReply[] }]

  const replyUserKeys = [...new Set((allReplies ?? []).map(r => (r as PostReply).user_key))]
  const avatarMap: Record<number, string | null> = {}
  if (replyUserKeys.length > 0) {
    const { data: avatarData } = await supabase
      .from('user_info').select('user_key, avatar_url').in('user_key', replyUserKeys)
    for (const u of avatarData ?? []) avatarMap[u.user_key] = u.avatar_url ?? null
  }

  return (
    <RealtimePosts
      initialPosts={latestPosts}
      departments={departments ?? []}
      session={session}
      initialReadsMap={groupByPostId<PostRead>(allReads as PostRead[])}
      initialReactionsMap={groupByPostId<PostReaction>(allReactions as PostReaction[])}
      initialRepliesMap={groupByPostId<PostReply>(allReplies as PostReply[])}
      initialAvatarMap={avatarMap}
    />
  )
}
