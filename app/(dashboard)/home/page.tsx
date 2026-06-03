import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { WritingData, PostRead, PostReaction, PostReply } from '@/types/database'
import HomeView from './HomeView'

function groupByPostId<T extends { post_id: number }>(items: T[] | null): Record<number, T[]> {
  return (items ?? []).reduce<Record<number, T[]>>((acc, item) => {
    if (!acc[item.post_id]) acc[item.post_id] = []
    acc[item.post_id].push(item)
    return acc
  }, {})
}

export default async function HomePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()
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
          .eq('department_id', session.departmentId)
          .eq('organization_key', session.organizationKey)
          .order('user_name')
      : Promise.resolve({ data: [] as { user_key: number; user_name: string; avatar_url: string | null }[], error: null }),

    supabase.from('writing_data').select('*')
      .eq('organization_key', session.organizationKey)
      .eq('post_type', 'notice')
      .order('writing_time', { ascending: false })
      .limit(200),

    hasDept
      ? supabase.from('writing_data').select('*')
          .eq('department_id', session.departmentId)
          .eq('organization_key', session.organizationKey)
          .eq('post_type', 'team')
          .gte('writing_time', sevenDaysAgo)
          .order('writing_time', { ascending: false })
      : Promise.resolve({ data: [] as WritingData[], error: null }),
  ])

  const deptLatest: Record<number, WritingData> = {}
  for (const post of allOrgPosts ?? []) {
    if (post.department_id && !deptLatest[post.department_id]) {
      deptLatest[post.department_id] = post
    }
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

  // ホームに表示される全投稿のソーシャルデータを取得
  const allPostIds = [
    ...Object.values(deptLatest).map(p => p.writing_id),
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
      // 全体掲示板（board）の重要投稿（期限内のもののみ）
      supabase.from('writing_data').select('*')
        .eq('organization_key', session.organizationKey)
        .eq('post_type', 'board')
        .eq('is_important', true)
        .or(`display_until.is.null,display_until.gte.${new Date().toISOString()}`)
        .order('writing_time', { ascending: false })
        .limit(10),
    ])

  return (
    <HomeView
      session={session}
      departments={departments ?? []}
      deptLatest={deptLatest}
      teamMembers={teamMembers}
      memberLatest={memberLatest}
      readsMap={groupByPostId<PostRead>(allReads as PostRead[])}
      reactionsMap={groupByPostId<PostReaction>(allReactions as PostReaction[])}
      repliesMap={groupByPostId<PostReply>(allReplies as PostReply[])}
      allPostIds={allPostIds}
      importantPosts={importantPostsRaw ?? []}
    />
  )
}
