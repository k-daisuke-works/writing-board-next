import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import type { WritingData, PostRead, PostReaction, PostReply } from '@/types/database'

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
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const hasDept = session.departmentId > 0

  const [
    { data: departments },
    { data: membersRaw },
    { data: allOrgPosts },
    { data: teamRecentPosts },
  ] = await Promise.all([
    supabase.from('department_data').select('*').eq('organization_key', session.organizationKey).order('department_id'),
    hasDept
      ? supabase.from('user_info').select('user_key, user_name, avatar_url')
          .eq('department_id', session.departmentId).eq('organization_key', session.organizationKey).order('user_name')
      : Promise.resolve({ data: [] as { user_key: number; user_name: string; avatar_url: string | null }[] }),
    supabase.from('writing_data').select('*')
      .eq('organization_key', session.organizationKey).eq('post_type', 'notice')
      .order('writing_time', { ascending: false }).limit(200),
    hasDept
      ? supabase.from('writing_data').select('*')
          .eq('department_id', session.departmentId).eq('organization_key', session.organizationKey)
          .eq('post_type', 'team').gte('writing_time', sevenDaysAgo).order('writing_time', { ascending: false })
      : Promise.resolve({ data: [] as WritingData[] }),
  ])

  const now = new Date().toISOString()
  const deptRaw: Record<number, WritingData[]> = {}
  for (const post of allOrgPosts ?? []) {
    if (!post.department_id) continue
    if (!deptRaw[post.department_id]) deptRaw[post.department_id] = []
    deptRaw[post.department_id].push(post)
  }
  // 期限設定中のお知らせは全件表示、最新1件は常に含める（重複除外）
  const deptPosts: Record<number, WritingData[]> = {}
  for (const [deptId, posts] of Object.entries(deptRaw)) {
    const sticky = posts.filter(p => p.display_until && p.display_until >= now)
    const latest = posts[0]
    const isLatestSticky = sticky.some(p => p.writing_id === latest.writing_id)
    deptPosts[Number(deptId)] = isLatestSticky ? sticky : [...sticky, latest]
  }

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
    ...Object.values(deptPosts).flat().map(p => p.writing_id),
    ...Object.values(memberLatest).filter(Boolean).map(p => p!.writing_id),
  ]

  const [{ data: allReads }, { data: allReactions }, { data: allReplies }, { data: importantPostsRaw }] =
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
    ])

  const avatarMap: Record<number, string | null> = { [session.userKey]: session.avatarUrl ?? null }
  for (const m of teamMembers) avatarMap[m.user_key] = m.avatar_url ?? null
  const unknownKeys = [...new Set((allReplies ?? []).map(r => r.user_key as number))].filter(k => !(k in avatarMap))
  if (unknownKeys.length > 0) {
    const { data: avatarData } = await supabase.from('user_info').select('user_key, avatar_url').in('user_key', unknownKeys)
    for (const u of avatarData ?? []) avatarMap[u.user_key] = u.avatar_url ?? null
  }

  return NextResponse.json({
    departments: departments ?? [],
    deptPosts,
    teamMembers,
    memberLatest,
    readsMap:     groupByPostId<PostRead>(allReads as PostRead[]),
    reactionsMap: groupByPostId<PostReaction>(allReactions as PostReaction[]),
    repliesMap:   groupByPostId<PostReply>(allReplies as PostReply[]),
    allPostIds,
    importantPosts: importantPostsRaw ?? [],
    avatarMap,
    fetchedAt: Date.now(),
  })
}
