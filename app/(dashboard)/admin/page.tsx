import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { deleteUser, deleteDepartment, deleteJob } from '@/actions/admin'

// Server Action の戻り値型を form の action 型に合わせるユーティリティ
type SA = (fd: FormData) => Promise<void>
const toAction = (fn: (fd: FormData) => unknown) => fn as unknown as SA
import Link from 'next/link'

export default async function AdminPage() {
  const session = await getSession()
  if (!session?.adminFlag) redirect('/home')

  const supabase = await createServiceClient()
  const orgKey = session.organizationKey

  const [{ data: users }, { data: departments }, { data: jobs }] =
    await Promise.all([
      supabase
        .from('user_info')
        .select('*, department:department_data(department_name), job:job_data(job_name)')
        .eq('organization_key', orgKey),
      supabase
        .from('department_data')
        .select('*')
        .eq('organization_key', orgKey),
      supabase
        .from('job_data')
        .select('*')
        .eq('organization_key', orgKey),
    ])

  // 所属人数のカウント
  const deptUserCount: Record<number, number> = {}
  const jobUserCount: Record<number, number> = {}
  for (const u of users ?? []) {
    if (u.department_id) deptUserCount[u.department_id] = (deptUserCount[u.department_id] ?? 0) + 1
    if (u.job_id) jobUserCount[u.job_id] = (jobUserCount[u.job_id] ?? 0) + 1
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🔧 管理ページ</h1>

      <div className="space-y-8">
        {/* ユーザー一覧 */}
        <section className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">👤 ユーザー</h2>
            <Link href="/user/register" className="text-sm text-blue-500 hover:underline">
              + ユーザー追加
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-gray-500">
                  <th className="pb-2">ユーザー名</th>
                  <th className="pb-2">部署</th>
                  <th className="pb-2">職種</th>
                  <th className="pb-2">管理者</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users?.map((user) => (
                  <tr key={user.user_key} className="hover:bg-gray-50">
                    <td className="py-2 font-medium">{user.user_name}</td>
                    <td className="py-2 text-gray-600">{user.department?.department_name}</td>
                    <td className="py-2 text-gray-600">{user.job?.job_name}</td>
                    <td className="py-2">
                      {user.admin_flag ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">管理者</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">一般</span>
                      )}
                    </td>
                    <td className="py-2">
                      {user.user_key !== session.userKey ? (
                        <form action={toAction(deleteUser)}>
                          <input type="hidden" name="userKey" value={user.user_key} />
                          <button
                            type="submit"
                            className="text-xs text-red-500 hover:text-red-700"
                            onClick={(e) => { if (!confirm('削除しますか？')) e.preventDefault() }}
                          >
                            削除
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-gray-400">（自分）</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 部署一覧 */}
        <section className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">🏢 部署</h2>
            <Link href="/departmentjob/register" className="text-sm text-blue-500 hover:underline">
              + 部署追加
            </Link>
          </div>
          <div className="space-y-2">
            {departments?.map((dept) => {
              const count = deptUserCount[dept.department_id] ?? 0
              return (
                <div key={dept.department_id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{dept.department_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{count}人</span>
                    <form action={toAction(deleteDepartment)}>
                      <input type="hidden" name="departmentId" value={dept.department_id} />
                      <button
                        type="submit"
                        disabled={count > 0}
                        className="text-xs text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                        onClick={(e) => { if (count === 0 && !confirm('削除しますか？')) e.preventDefault() }}
                      >
                        削除
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 職種一覧 */}
        <section className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">💼 職種</h2>
            <Link href="/departmentjob/register" className="text-sm text-blue-500 hover:underline">
              + 職種追加
            </Link>
          </div>
          <div className="space-y-2">
            {jobs?.map((job) => {
              const count = jobUserCount[job.job_id] ?? 0
              return (
                <div key={job.job_id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{job.job_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{count}人</span>
                    <form action={toAction(deleteJob)}>
                      <input type="hidden" name="jobId" value={job.job_id} />
                      <button
                        type="submit"
                        disabled={count > 0}
                        className="text-xs text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                        onClick={(e) => { if (count === 0 && !confirm('削除しますか？')) e.preventDefault() }}
                      >
                        削除
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
