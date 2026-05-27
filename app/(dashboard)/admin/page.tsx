import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPanel from './AdminPanel'

export default async function AdminPage() {
  const session = await getSession()
  if (!session?.adminFlag) redirect('/home')

  const supabase = await createServiceClient()
  const orgKey   = session.organizationKey

  const [{ data: users }, { data: departments }, { data: jobs }] = await Promise.all([
    supabase
      .from('user_info')
      .select('*, department:department_data(department_name), job:job_data(job_name)')
      .eq('organization_key', orgKey)
      .order('created_at', { ascending: true }),
    supabase.from('department_data').select('*').eq('organization_key', orgKey).order('department_id'),
    supabase.from('job_data').select('*').eq('organization_key', orgKey).order('job_id'),
  ])

  // 部署・職種ごとのユーザー数を集計
  const deptCnt: Record<number, number> = {}
  const jobCnt:  Record<number, number> = {}
  for (const u of users ?? []) {
    if (u.department_id) deptCnt[u.department_id] = (deptCnt[u.department_id] ?? 0) + 1
    if (u.job_id)        jobCnt[u.job_id]          = (jobCnt[u.job_id]          ?? 0) + 1
  }

  return (
    <AdminPanel
      users={users ?? []}
      departments={departments ?? []}
      jobs={jobs ?? []}
      currentUserKey={session.userKey}
      deptCnt={deptCnt}
      jobCnt={jobCnt}
      orgName={session.organizationName}
    />
  )
}
