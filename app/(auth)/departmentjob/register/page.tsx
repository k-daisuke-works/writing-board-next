import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createDepartment, createJob } from '@/actions/admin'
import Link from 'next/link'
import { Building2, Briefcase, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Check } from 'lucide-react'

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
  const successUrl = isInitial
    ? `/departmentjob/register?orgKey=${organizationKey}&initial=true&success=true`
    : '/departmentjob/register?success=true'
  const errorBase  = isInitial
    ? `/departmentjob/register?orgKey=${organizationKey}&initial=true`
    : '/departmentjob/register'

  const inputCls = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"

  return (
    <div className="w-full max-w-2xl">
      {/* ヘッダー */}
      <div className="mb-6">
        {isInitial ? (
          <>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <Check className="w-3 h-3" />団体登録
              </span>
              <span>→</span>
              <span className="font-medium text-gray-700">部署・職種登録</span>
              <span>→</span>
              <span>ユーザー登録</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">部署・職種を登録</h1>
            <p className="text-sm text-gray-500 mt-0.5">組織の構造を設定してください</p>
          </>
        ) : (
          <>
            <Link href="/admin" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-3 w-fit">
              <ArrowLeft className="w-4 h-4" />管理設定に戻る
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">部署・職種登録</h1>
            <p className="text-sm text-gray-400 mt-0.5">組織の部署と職種を管理します</p>
          </>
        )}
      </div>

      {/* フィードバック */}
      {success && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-md px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />登録しました。
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-md px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 部署登録 */}
        <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
            <Building2 className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
            <span className="text-sm font-semibold text-gray-900">部署</span>
            {departments && departments.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{departments.length}</span>
            )}
          </div>
          <div className="p-5">
            <form action={async (formData: FormData) => {
              'use server'
              formData.append('organizationKey', String(organizationKey))
              const result = await createDepartment(formData)
              if (result?.error) redirect(`${errorBase}&error=${encodeURIComponent(result.error)}`)
              redirect(successUrl)
            }} className="flex gap-2">
              <input type="text" name="departmentName" required placeholder="例: 営業部"
                className={inputCls} />
              <button type="submit"
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                追加
              </button>
            </form>
            {departments && departments.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {departments.map((d) => (
                  <li key={d.department_id} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {d.department_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 職種登録 */}
        <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
            <Briefcase className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
            <span className="text-sm font-semibold text-gray-900">職種</span>
            {jobs && jobs.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{jobs.length}</span>
            )}
          </div>
          <div className="p-5">
            <form action={async (formData: FormData) => {
              'use server'
              formData.append('organizationKey', String(organizationKey))
              const result = await createJob(formData)
              if (result?.error) redirect(`${errorBase}&error=${encodeURIComponent(result.error)}`)
              redirect(successUrl)
            }} className="flex gap-2">
              <input type="text" name="jobName" required placeholder="例: エンジニア"
                className={inputCls} />
              <button type="submit"
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                追加
              </button>
            </form>
            {jobs && jobs.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {jobs.map((j) => (
                  <li key={j.job_id} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {j.job_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {isInitial && (
        <div className="mt-5 flex flex-col items-center gap-2">
          <Link
            href={`/user/register?orgKey=${organizationKey}&initial=true`}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md text-sm font-semibold transition-colors"
          >
            次へ：管理者ユーザーを登録する
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-gray-400">あとで管理設定ページから追加・変更もできます</p>
        </div>
      )}
    </div>
  )
}
