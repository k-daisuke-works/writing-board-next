import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createDepartment, createJob } from '@/actions/admin'
import Link from 'next/link'

export default async function DepartmentJobRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ orgKey?: string; initial?: string; success?: string }>
}) {
  const params = await searchParams
  const isInitial = params.initial === 'true'
  const orgKey = params.orgKey ? Number(params.orgKey) : null

  // 通常アクセス（ログイン済み）
  const session = await getSession()

  // 初回登録フロー（orgKey あり）か通常フロー（session あり）か判定
  const organizationKey = session?.organizationKey ?? orgKey
  const isAdmin = session?.adminFlag ?? isInitial

  if (!organizationKey) redirect('/login')
  if (!isAdmin) redirect('/home')

  const supabase = await createServiceClient()

  const [{ data: departments }, { data: jobs }] = await Promise.all([
    supabase.from('department_data').select('*').eq('organization_key', organizationKey),
    supabase.from('job_data').select('*').eq('organization_key', organizationKey),
  ])

  const success = params.success === 'true'

  return (
    <div className="max-w-2xl mx-auto">
      {!isInitial && (
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-blue-500 hover:underline text-sm">← 管理ページに戻る</Link>
          <h1 className="text-2xl font-bold text-gray-800">🏢 部署・職種登録</h1>
        </div>
      )}

      {isInitial && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">🎉 団体登録完了！</h1>
          <p className="text-gray-600 text-sm">まず部署と職種を登録してから、ユーザーを追加できます。</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-300 text-green-700 rounded-lg px-4 py-3 text-sm">
          ✅ 登録しました。
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* 部署登録 */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-semibold text-gray-700 mb-4">🏢 部署を追加</h2>
          <form action={async (formData: FormData) => {
            'use server'
            formData.append('_orgKey', String(organizationKey))
            await createDepartment(formData)
            redirect(isInitial
              ? `/departmentjob/register?orgKey=${organizationKey}&initial=true&success=true`
              : '/departmentjob/register?success=true')
          }} className="space-y-3">
            <input type="hidden" name="organizationKey" value={organizationKey} />
            <input type="text" name="departmentName" required placeholder="例: 営業部"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <button type="submit"
              className="w-full bg-purple-600 text-white font-medium py-2 rounded-lg hover:bg-purple-700 transition text-sm">
              追加する
            </button>
          </form>

          {departments && departments.length > 0 && (
            <ul className="mt-4 space-y-1">
              {departments.map((d) => (
                <li key={d.department_id} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                  {d.department_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 職種登録 */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-semibold text-gray-700 mb-4">💼 職種を追加</h2>
          <form action={async (formData: FormData) => {
            'use server'
            await createJob(formData)
            redirect(isInitial
              ? `/departmentjob/register?orgKey=${organizationKey}&initial=true&success=true`
              : '/departmentjob/register?success=true')
          }} className="space-y-3">
            <input type="hidden" name="organizationKey" value={organizationKey} />
            <input type="text" name="jobName" required placeholder="例: エンジニア"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
            <button type="submit"
              className="w-full bg-pink-600 text-white font-medium py-2 rounded-lg hover:bg-pink-700 transition text-sm">
              追加する
            </button>
          </form>

          {jobs && jobs.length > 0 && (
            <ul className="mt-4 space-y-1">
              {jobs.map((j) => (
                <li key={j.job_id} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 inline-block" />
                  {j.job_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {isInitial && (
        <div className="mt-6 text-center">
          <Link
            href={`/user/register`}
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            次へ：ユーザーを登録する →
          </Link>
        </div>
      )}
    </div>
  )
}
