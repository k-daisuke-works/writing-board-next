import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import type { WritingData, PostRead, PostReaction, PostReply, PostAttachment } from '@/types/database'

function groupByPostId<T extends { post_id: number }>(items: T[] | null): Record<number, T[]> {
  return (items ?? []).reduce<Record<number, T[]>>((acc, item) => {
    if (!acc[item.post_id]) acc[item.post_id] = []
    acc[item.post_id].push(item)
    return acc
  }, {})
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const [{ data: departments }, { data: boardPosts }] = await Promise.all([
    supabase.from('department_data').select('*').eq('organization_key', session.organizationKey).order('department_id'),
    supabase.from('writing_data').select('*')
      .eq('organization_key', session.organizationKey).eq('post_type', 'board')
      .order('writing_time', { ascending: false }),
  ])

  const latestPosts: Record<number, WritingData> = {}
  for (const post of boardPosts ?? []) {
    if (post.department_id != null && !latestPosts[post.department_id]) latestPosts[post.department_id] = post
  }

  const postIds = Object.values(latestPosts).map(p => p.writing_id)

  const [{ data: allReads }, { data: allReactions }, { data: allReplies }, { data: attachmentsRaw }] =
    postIds.length > 0
      ? await Promise.all([
          supabase.from('post_reads').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey),
          supabase.from('post_reactions').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey),
          supabase.from('post_replies').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey).order('created_at'),
          supabase.from('post_attachments').select('*').in('post_id', postIds).eq('organization_key', session.organizationKey),
        ])
      : [{ data: [] as PostRead[] }, { data: [] as PostReaction[] }, { data: [] as PostReply[] }, { data: [] as PostAttachment[] }]

  const avatarMap: Record<number, string | null> = {}
  const replyUserKeys = [...new Set((allReplies ?? []).map(r => (r as PostReply).user_key))]
  if (replyUserKeys.length > 0) {
    const { data: avatarData } = await supabase.from('user_info').select('user_key, avatar_url').in('user_key', replyUserKeys)
    for (const u of avatarData ?? []) avatarMap[u.user_key] = u.avatar_url ?? null
  }

  const attachmentsMap: Record<number, PostAttachment[]> = {}
  for (const a of (attachmentsRaw ?? []) as PostAttachment[]) {
    if (!attachmentsMap[a.post_id]) attachmentsMap[a.post_id] = []
    attachmentsMap[a.post_id].push(a)
  }

  return NextResponse.json({
    departments: departments ?? [],
    latestPosts,
    readsMap:     groupByPostId<PostRead>(allReads as PostRead[]),
    reactionsMap: groupByPostId<PostReaction>(allReactions as PostReaction[]),
    repliesMap:   groupByPostId<PostReply>(allReplies as PostReply[]),
    avatarMap,
    attachmentsMap,
    fetchedAt: Date.now(),
  })
}
