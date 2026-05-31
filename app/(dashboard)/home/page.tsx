import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { WritingData } from '@/types/database'
import HomeView from './HomeView'

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
    supabase
      .from('department_data')
      .select('*')
      .eq('organization_key', session.organizationKey)
      .order('department_id'),

    hasDept
      ? supabase
          .from('user_info')
          .select('user_key, user_name')
          .eq('department_id', session.departmentId)
          .eq('organization_key', session.organizationKey)
          .order('user_name')
      : Promise.resolve({ data: [] as { user_key: number; user_name: string }[], error: null }),

    // post_type='notice' の最新投稿を部署ごとにdedup（各部署からのお知らせ用）
    supabase
      .from('writing_data')
      .select('*')
      .eq('organization_key', session.organizationKey)
      .eq('post_type', 'notice')
      .order('writing_time', { ascending: false })
      .limit(200),

    // チームの7日以内のteam投稿
    hasDept
      ? supabase
          .from('writing_data')
          .select('*')
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

  return (
    <HomeView
      session={session}
      departments={departments ?? []}
      deptLatest={deptLatest}
      teamMembers={teamMembers}
      memberLatest={memberLatest}
    />
  )
}
