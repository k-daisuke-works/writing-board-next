import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RealtimePosts from './RealtimePosts'
import type { WritingData } from '@/types/database'

export default async function PostsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()

  // ① 部署一覧を取得（小テーブルなので高速）
  const { data: departments } = await supabase
    .from('department_data')
    .select('*')
    .eq('organization_key', session.organizationKey)
    .order('department_id')

  // ② 部署ごとに最新1件だけを並列取得
  //    以前: 全投稿を一括取得→JSでフィルタ（投稿数が増えるほど遅い）
  //    現在: 1件×N部署 を Promise.all で並列実行（常に高速）
  const deptPostResults = await Promise.all(
    (departments ?? []).map((dept) =>
      supabase
        .from('writing_data')
        .select('*')
        .eq('department_id', dept.department_id)
        .eq('organization_key', session.organizationKey)
        .order('writing_time', { ascending: false })
        .limit(1)
        .maybeSingle()
    )
  )

  // ③ 結果を Record<department_id, WritingData> に変換
  const latestPosts: Record<number, WritingData> = {}
  for (const { data } of deptPostResults) {
    if (data) latestPosts[data.department_id] = data
  }

  return (
    <RealtimePosts
      initialPosts={latestPosts}
      departments={departments ?? []}
      session={session}
    />
  )
}
