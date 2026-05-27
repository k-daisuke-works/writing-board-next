import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createDepartment, createJob } from '@/actions/admin'
import Link from 'next/link'

export default async function DepartmentJobRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ orgKey?: string; initial?: string; success?: string; error?: string }>
}) {
  const params      = await searchParams
  const isInitial   = params.initial === 'true'
  const orgKeyParam = params.orgKey ? Number(params.orgKey) : null
  const session     = await getSession()

  const organizationKey = session?.organizationKey ?? orgKeyParam
  const isAdmin         = session?.adminFlag ?? isInitial

  if (!organizationKey) redirect('/login')
  if (!isAdmin)         redirect('/home')

  const supabase = await createServiceClient()
  const [{ data: departments }, { data: jobs }] = await Promise.all([
    supabase.from('department_data').select('*').eq('organization_key', organizationKey),
    supabase.from('job_data').select('*').eq('organization_key', organizationKey),
  ])

  const success    = params.success === 'true'
  const errorMsg   = params.error ? decodeURIComponent(params.error) : null
  const successUrl = isInitial ? `/departmentjob/register?orgKey=${organizationKey}&initial=true&success=true` : '/departmentjob/register?success=true'
  const errorBase  = isInitial ? `/departmentjob/register?orgKey=${organizationKey}&initial=true` : '/departmentjob/register'

  return (
    <div className="w-full max-w-2xl">
      {/* ヘッダー */}
      {isInitial ? (
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-100 rounded-2xl text-2xl mb-3">🎉</div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">団体登録完了！</h1>
          <p className="text-sm text-slate-400 mt-1">続いて部署と職種を登録してください</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-sm text-slate-400 hover:text-indigo-500 transition-colors">← 管理に戻る</Link>
          <span className="text-slate-200">/</span>
          <h1 className="text-xl font-bold text-slate-800">部署・職種登録</h1>
        </div>
      )}

      {/* フィードバック */}
      {success && (
        <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
          ✅ 登録しました。
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* 部署登録 */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
            <span className="w-6 h-6 bg-violet-100 rounded-md flex items-center justify-center text-xs">🏢</span>
            部署を追加
          </h2>
          <p className="text-xs text-slate-400 mb-4">組織内の部署を登録します</p>
          <form action={async (formData: FormData) => {
            'use server'
            formData.append('organizationKey', String(organizationKey))
            const result = await createDepartment(formData)
            if (result?.error) redirect(`${errorBase}&error=${encodeURIComponent(result.error)}`)
            redirect(successUrl)
          }} className="space-y-3">
            <input type="text" name="departmentName" required placeholder="例: 営業部"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition" />
            <button type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 rounded-xl text-sm transition-colors">
              追加する
            </button>
          </form>
          {departments && departments.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {departments.map((d) => (
                <li key={d.department_id} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  {d.department_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 職種登録 */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
            <span className="w-6 h-6 bg-pink-100 rounded-md flex items-center justify-center text-xs">💼</span>
            職種を追加
          </h2>
          <p className="text-xs text-slate-400 mb-4">メンバーの役職・職種を登録します</p>
          <form action={async (formData: FormData) => {
            'use server'
            formData.append('organizationKey', String(organizationKey))
            const result = await createJob(formData)
            if (result?.error) redirect(`${errorBase}&error=${encodeURIComponent(result.error)}`)
            redirect(successUrl)
          }} className="space-y-3">
            <input type="text" name="jobName" required placeholder="例: エンジニア"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition" />
            <button type="submit"
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 rounded-xl text-sm transition-colors">
              追加する
            </button>
          </form>
          {jobs && jobs.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {jobs.map((j) => (
                <li key={j.job_id} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
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
            href={`/user/register?orgKey=${organizationKey}&initial=true`}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            次へ：管理者ユーザーを登録する →
          </Link>
          <p className="text-xs text-slate-400 mt-2">あとで管理ページから追加もできます</p>
        </div>
      )}
    </div>
  )
}
