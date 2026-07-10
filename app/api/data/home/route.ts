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
    { data: regularNoticeRaw },
    { data: importantNoticesRaw },
    { data: teamRecentPosts },
  ] = await Promise.all([
    hasDept
      ? supabase.from('user_info').select('user_key, user_name, avatar_url')
          .eq('department_id', session.departmentId).eq('organization_key', session.organizationKey).order('user_name')
      : Promise.resolve({ data: [] as { user_key: number; user_name: string; avatar_url: string | null }[] }),
    // 通常お知らせ: 最新1件（7日以内・is_important=false/null）
    hasDept
      ? supabase.from('writing_data').select('*')
          .eq('organization_key', session.organizationKey)
          .eq('department_id', session.departmentId)
          .eq('post_type', 'notice')
          .or('is_important.is.null,is_important.eq.false')
          .gte('writing_time', sevenDaysAgo)
          .order('writing_time', { ascending: false })
          .limit(1)
      : Promise.resolve({ data: [] as WritingData[] }),
    // 重要お知らせ: 期限内の全件（is_important=true・post_type='notice'または旧形式'team'）
    hasDept
      ? supabase.from('writing_data').select('*')
          .eq('organization_key', session.organizationKey)
          .eq('department_id', session.departmentId)
          .eq('is_important', true)
          .or('post_type.eq.notice,post_type.eq.team')
          .not('display_until', 'is', null)
          .gte('display_until', now)
          .order('writing_time', { ascending: false })
      : Promise.resolve({ data: [] as WritingData[] }),
    hasDept
      ? supabase.from('writing_data').select('*')
          .eq('department_id', session.departmentId).eq('organization_key', session.organizationKey)
          .eq('post_type', 'team').gte('writing_time', sevenDaysAgo).order('writing_time', { ascending: false })
      : Promise.resolve({ data: [] as WritingData[] }),
  ])

  // 表示順：最新の通常お知らせ1件（上）→ 重要お知らせ全件（下）
  const noticePosts = [
    ...((regularNoticeRaw ?? []) as WritingData[]),
    ...((importantNoticesRaw ?? []) as WritingData[]),
  ]

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
    const { data: avatarData } = await supabase.from('user_info').select('user_key, avatar_url')
      .eq('organization_key', session.organizationKey).in('user_key', unknownKeys)
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
