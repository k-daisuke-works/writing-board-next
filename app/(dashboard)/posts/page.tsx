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

  const { data: departments } = await supabase
    .from('department_data')
    .select('*')
    .eq('organization_key', session.organizationKey)
    .order('department_id')

  const deptPostResults = await Promise.all(
    (departments ?? []).map((dept) =>
      supabase
        .from('writing_data')
        .select('*')
        .eq('department_id', dept.department_id)
        .eq('organization_key', session.organizationKey)
        .eq('post_type', 'board')
        .order('writing_time', { ascending: false })
        .limit(1)
        .maybeSingle()
    )
  )

  const latestPosts: Record<number, WritingData> = {}
  for (const { data } of deptPostResults) {
    if (data) latestPosts[data.department_id] = data
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

  return (
    <RealtimePosts
      initialPosts={latestPosts}
      departments={departments ?? []}
      session={session}
      initialReadsMap={groupByPostId<PostRead>(allReads as PostRead[])}
      initialReactionsMap={groupByPostId<PostReaction>(allReactions as PostReaction[])}
      initialRepliesMap={groupByPostId<PostReply>(allReplies as PostReply[])}
    />
  )
}
