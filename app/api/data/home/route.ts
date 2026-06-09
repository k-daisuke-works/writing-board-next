import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import type { WritingData, PostRead, PostReaction, PostReply, PostAttachment } from '@/types/database'
import { groupByPostId } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const hasDept = session.departmentId > 0

  const now = new Date().toISOString()

  const [
    { data: membersRaw },
    { data: deptNoticesRaw },
    { data: teamRecentPosts },
  ] = await Promise.all([
    hasDept
      ? supabase.from('user_info').select('user_key, user_name, avatar_url')
          .eq('department_id', session.departmentId).eq('organization_key', session.organizationKey).order('user_name')
      : Promise.resolve({ data: [] as { user_key: number; user_name: string; avatar_url: string | null }[] }),
    // 自部署の重要フラグつきチームメッセージ = 「部署からのお知らせ」
    hasDept
      ? supabase.from('writing_data').select('*')
          .eq('organization_key', session.organizationKey)
          .eq('post_type', 'team')
          .eq('is_important', true)
          .eq('department_id', session.departmentId)
          .or(`display_until.is.null,display_until.gte.${now}`)
          .order('writing_time', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as WritingData[] }),
    hasDept
      ? supabase.from('writing_data').select('*')
          .eq('department_id', session.departmentId).eq('organization_key', session.organizationKey)
          .eq('post_type', 'team').gte('writing_time', sevenDaysAgo).order('writing_time', { ascending: false })
      : Promise.resolve({ data: [] as WritingData[] }),
  ])

  const noticePosts = (deptNoticesRaw ?? []) as WritingData[]

  const teamMembers = membersRaw ?? []
  const memberLatest: Record<number, WritingData | null> = {}
  const seen = new Set<number>()
  for (const post of teamRecentPosts ?? []) {
    if (post.user_key != null && !seen.has(post.user_key)) {
      seen.add(post.user_key)
      memberLatest[post.user_key] = post
    }
  }
  for (const m of teamMembers) {
    if (!(m.user_key in memberLatest)) memberLatest[m.user_key] = null
  }

  const allPostIds = [
    ...noticePosts.map(p => p.writing_id),
    ...Object.values(memberLatest).filter(Boolean).map(p => p!.writing_id),
  ]

  const [{ data: allReads }, { data: allReactions }, { data: allReplies }, { data: importantPostsRaw }, { data: attachmentsRaw }] =
    await Promise.all([
      allPostIds.length > 0
        ? supabase.from('post_reads').select('*').in('post_id', allPostIds).eq('organization_key', session.organizationKey)
        : Promise.resolve({ data: [] as PostRead[] }),
      allPostIds.length > 0
        ? supabase.from('post_reactions').select('*').in('post_id', allPostIds).eq('organization_key', session.organizationKey)
        : Promise.resolve({ data: [] as PostReaction[] }),
      allPostIds.length > 0
        ? supabase.from('post_replies').select('*').in('post_id', allPostIds).eq('organization_key', session.organizationKey).order('created_at')
        : Promise.resolve({ data: [] as PostReply[] }),
      supabase.from('writing_data').select('*')
        .eq('organization_key', session.organizationKey).eq('post_type', 'board').eq('is_important', true)
        .or(`display_until.is.null,display_until.gte.${new Date().toISOString()}`)
        .order('writing_time', { ascending: false }).limit(10),
      allPostIds.length > 0
        ? supabase.from('post_attachments').select('*').in('post_id', allPostIds).eq('organization_key', session.organizationKey)
        : Promise.resolve({ data: [] as PostAttachment[] }),
    ])

  const avatarMap: Record<number, string | null> = { [session.userKey]: session.avatarUrl ?? null }
  for (const m of teamMembers) avatarMap[m.user_key] = m.avatar_url ?? null
  const unknownKeys = [...new Set((allReplies ?? []).map(r => r.user_key as number))].filter(k => !(k in avatarMap))
  if (unknownKeys.length > 0) {
    const { data: avatarData } = await supabase.from('user_info').select('user_key, avatar_url').in('user_key', unknownKeys)
    for (const u of avatarData ?? []) avatarMap[u.user_key] = u.avatar_url ?? null
  }

  const attachmentsMap: Record<number, PostAttachment[]> = {}
  for (const a of (attachmentsRaw ?? []) as PostAttachment[]) {
    if (!attachmentsMap[a.post_id]) attachmentsMap[a.post_id] = []
    attachmentsMap[a.post_id].push(a)
  }

  return NextResponse.json({
    noticePosts,
    teamMembers,
    memberLatest,
    readsMap:     groupByPostId<PostRead>(allReads as PostRead[]),
    reactionsMap: groupByPostId<PostReaction>(allReactions as PostReaction[]),
    repliesMap:   groupByPostId<PostReply>(allReplies as PostReply[]),
    allPostIds,
    importantPosts: importantPostsRaw ?? [],
    avatarMap,
    attachmentsMap,
    fetchedAt: Date.now(),
  })
}
