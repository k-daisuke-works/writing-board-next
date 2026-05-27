import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { deleteUser, deleteDepartment, deleteJob } from '@/actions/admin'
import { DeleteForm } from './DeleteForm'
import Link from 'next/link'
import { Users, Building2, Briefcase, Plus, ArrowLeft } from 'lucide-react'

export default async function AdminPage() {
  const session = await getSession()
  if (!session?.adminFlag) redirect('/home')

  const supabase = await createServiceClient()
  const orgKey   = session.organizationKey

  const [{ data: users }, { data: departments }, { data: jobs }] = await Promise.all([
    supabase.from('user_info')
      .select('*, department:department_data(department_name), job:job_data(job_name)')
      .eq('organization_key', orgKey),
    supabase.from('department_data').select('*').eq('organization_key', orgKey),
    supabase.from('job_data').select('*').eq('organization_key', orgKey),
  ])

  const deptCnt: Record<number,number> = {}
  const jobCnt:  Record<number,number> = {}
  for (const u of users ?? []) {
    if (u.department_id) deptCnt[u.department_id] = (deptCnt[u.department_id] ?? 0) + 1
    if (u.job_id)        jobCnt[u.job_id]          = (jobCnt[u.job_id]          ?? 0) + 1
  }

  const Section = ({ title, icon: Icon, count, addHref, children }: {
    title: string; icon: React.ElementType; count: number
    addHref: string; children: React.ReactNode
  }) => (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{count}</span>
        </div>
        <Link href={addHref} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
          <Plus className="w-3.5 h-3.5" />追加
        </Link>
      </div>
      {children}
    </section>
  )

  return (
    <div className="anim-fade-in max-w-4xl">
      <div className="mb-6">
        <Link href="/home" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-3 w-fit">
          <ArrowLeft className="w-4 h-4" />ホームに戻る
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">管理設定</h1>
        <p className="text-sm text-gray-400 mt-0.5">{session.organizationName}</p>
      </div>

      <div className="space-y-5">
        {/* ユーザー */}
        <Section title="ユーザー" icon={Users} count={users?.length ?? 0} addHref="/user/register">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['名前', '部署', '職種', '権限', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users?.map((user) => (
                <tr key={user.user_key} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {user.user_name.slice(0,1)}
                      </div>
                      <span className="font-medium text-gray-900">{user.user_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{user.department?.department_name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{user.job?.job_name ?? '—'}</td>
                  <td className="px-5 py-3">
                    {user.admin_flag
                      ? <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">管理者</span>
                      : <span className="text-xs text-gray-400">一般</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {user.user_key !== session.userKey
                      ? <DeleteForm action={deleteUser} fields={{ userKey: user.user_key }} confirmText={`${user.user_name} を削除しますか？`} />
                      : <span className="text-xs text-gray-300">自分</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* 部署 */}
          <Section title="部署" icon={Building2} count={departments?.length ?? 0} addHref="/departmentjob/register">
            <div className="divide-y divide-gray-50">
              {departments?.map((dept) => {
                const cnt = deptCnt[dept.department_id] ?? 0
                return (
                  <div key={dept.department_id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/70 transition-colors">
                    <span className="text-sm text-gray-800">{dept.department_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{cnt}名</span>
                      <DeleteForm action={deleteDepartment} fields={{ departmentId: dept.department_id }}
                        confirmText={`${dept.department_name} を削除しますか？`}
                        disabled={cnt > 0} disabledReason="所属ユーザーがいます" />
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>

          {/* 職種 */}
          <Section title="職種" icon={Briefcase} count={jobs?.length ?? 0} addHref="/departmentjob/register">
            <div className="divide-y divide-gray-50">
              {jobs?.map((job) => {
                const cnt = jobCnt[job.job_id] ?? 0
                return (
                  <div key={job.job_id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/70 transition-colors">
                    <span className="text-sm text-gray-800">{job.job_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{cnt}名</span>
                      <DeleteForm action={deleteJob} fields={{ jobId: job.job_id }}
                        confirmText={`${job.job_name} を削除しますか？`}
                        disabled={cnt > 0} disabledReason="所属ユーザーがいます" />
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
