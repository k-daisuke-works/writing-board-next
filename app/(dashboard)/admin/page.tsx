import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { deleteUser, deleteDepartment, deleteJob } from '@/actions/admin'
import { DeleteForm } from './DeleteForm'
import Link from 'next/link'

export default async function AdminPage() {
  const session = await getSession()
  if (!session?.adminFlag) redirect('/home')

  const supabase = await createServiceClient()
  const orgKey = session.organizationKey

  const [{ data: users }, { data: departments }, { data: jobs }] = await Promise.all([
    supabase.from('user_info')
      .select('*, department:department_data(department_name), job:job_data(job_name)')
      .eq('organization_key', orgKey),
    supabase.from('department_data').select('*').eq('organization_key', orgKey),
    supabase.from('job_data').select('*').eq('organization_key', orgKey),
  ])

  const deptCount: Record<number, number> = {}
  const jobCount:  Record<number, number> = {}
  for (const u of users ?? []) {
    if (u.department_id) deptCount[u.department_id] = (deptCount[u.department_id] ?? 0) + 1
    if (u.job_id)        jobCount[u.job_id]         = (jobCount[u.job_id]         ?? 0) + 1
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/home" className="text-sm text-slate-400 hover:text-indigo-500 transition-colors">← ホームに戻る</Link>
        <span className="text-slate-200">/</span>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">管理設定</h1>
      </div>

      <div className="space-y-6">
        {/* ユーザー */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center text-xs">👤</span>
              ユーザー
              <span className="text-xs text-slate-400 font-normal">{users?.length ?? 0} 名</span>
            </h2>
            <Link href="/user/register" className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors font-medium">
              + 追加
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {users?.map((user) => (
              <div key={user.user_key} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50/50 transition-colors">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                  {user.user_name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{user.user_name}</p>
                  <p className="text-xs text-slate-400">{user.department?.department_name ?? '—'} · {user.job?.job_name ?? '—'}</p>
                </div>
                {user.admin_flag ? (
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium shrink-0">管理者</span>
                ) : (
                  <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full shrink-0">一般</span>
                )}
                <div className="shrink-0">
                  {user.user_key !== session.userKey ? (
                    <DeleteForm
                      action={deleteUser}
                      fields={{ userKey: user.user_key }}
                      confirmText={`${user.user_name} を削除しますか？`}
                    />
                  ) : (
                    <span className="text-xs text-slate-300">自分</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* 部署 */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-violet-100 rounded-md flex items-center justify-center text-xs">🏢</span>
                部署
                <span className="text-xs text-slate-400 font-normal">{departments?.length ?? 0} 件</span>
              </h2>
              <Link href="/departmentjob/register" className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors font-medium">
                + 追加
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {departments?.map((dept) => {
                const cnt = deptCount[dept.department_id] ?? 0
                return (
                  <div key={dept.department_id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50/50 transition-colors">
                    <span className="text-sm text-slate-700">{dept.department_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-300">{cnt}人</span>
                      <DeleteForm
                        action={deleteDepartment}
                        fields={{ departmentId: dept.department_id }}
                        confirmText={`${dept.department_name} を削除しますか？`}
                        disabled={cnt > 0}
                        disabledReason="所属ユーザーがいます"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 職種 */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-100 rounded-md flex items-center justify-center text-xs">💼</span>
                職種
                <span className="text-xs text-slate-400 font-normal">{jobs?.length ?? 0} 件</span>
              </h2>
              <Link href="/departmentjob/register" className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors font-medium">
                + 追加
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {jobs?.map((job) => {
                const cnt = jobCount[job.job_id] ?? 0
                return (
                  <div key={job.job_id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50/50 transition-colors">
                    <span className="text-sm text-slate-700">{job.job_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-300">{cnt}人</span>
                      <DeleteForm
                        action={deleteJob}
                        fields={{ jobId: job.job_id }}
                        confirmText={`${job.job_name} を削除しますか？`}
                        disabled={cnt > 0}
                        disabledReason="所属ユーザーがいます"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
