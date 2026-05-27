import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RealtimePosts from './RealtimePosts'
import type { WritingData } from '@/types/database'

export default async function PostsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()

  // 部署一覧
  const { data: departments } = await supabase
    .from('department_data')
    .select('*')
    .eq('organization_key', session.organizationKey)
    .order('department_id')

  // 全投稿（組織内）
  const { data: writings } = await supabase
    .from('writing_data')
    .select('*')
    .eq('organization_key', session.organizationKey)
    .order('writing_time', { ascending: false })

  // 部署ごとの最新投稿を作成
  const latestPosts: Record<number, WritingData> = {}
  for (const post of writings ?? []) {
    if (!latestPosts[post.department_id]) {
      latestPosts[post.department_id] = post
    }
  }

  return (
    <RealtimePosts
      initialPosts={latestPosts}
      departments={departments ?? []}
      session={session}
    />
  )
}
