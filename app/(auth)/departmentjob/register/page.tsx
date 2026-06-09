import { getSession } from '@/lib/session'
import { verifySetupToken } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createDepartment, createJob } from '@/actions/admin'
import Link from 'next/link'
import { Building2, Briefcase, ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { SetupStepper } from '../../SetupStepper'

export default async function DepartmentJobRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string       // 初回セットアップ用（署名付きJWT）
    success?: string
    error?: string
  }>
}) {
  const params  = await searchParams
  const session = await getSession()

  // ── アクセス権チェック ────────────────────────────────────
  let organizationKey: number | null = null
  let isInitial = false

  if (session?.adminFlag) {
    // 管理者モード: セッションの組織を使用
    organizationKey = session.organizationKey
  } else if (params.token) {
    // 初回セットアップモード: セットアップトークンを検証
    organizationKey = await verifySetupToken(params.token)
    if (organizationKey) isInitial = true
  }

  if (!organizationKey) redirect('/login')

  const supabase = createServiceClient()
  const [{ data: departments }, { data: jobs }] = await Promise.all([
    supabase.from('department_data').select('*').eq('organization_key', organizationKey),
    supabase.from('job_data').select('*').eq('organization_key', organizationKey),
  ])

  const success  = params.success === 'true'
  const errorMsg = params.error ? decodeURIComponent(params.error) : null

  // リダイレクト先 URL（トークンを引き継ぐ）
  const successUrl = isInitial
    ? `/departmentjob/register?token=${params.token}&success=true`
    : '/departmentjob/register?success=true'
  const errorBase  = isInitial
    ? `/departmentjob/register?token=${params.token}`
    : '/departmentjob/register'

  const inputCls = "flex-1 min-w-0 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"

  return (
    <div className="anim-fade-in w-full max-w-lg">
      {isInitial && <SetupStepper current={2} />}

      <div className="mb-6">
        {isInitial ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">部署と職種を登録</h1>
            <p className="text-sm text-gray-500">組織の構造を設定します。あとから変更もできます</p>
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

      {success && (
        <div className="mb-5 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-md px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />登録しました。
        </div>
      )}
      {errorMsg && (
        <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-md px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* 部署 */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
            <span className="text-sm font-semibold text-gray-800">部署</span>
            {departments && departments.length > 0 && (
              <span className="ml-auto text-xs text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded">{departments.length}件</span>
            )}
          </div>
          <form action={async (formData: FormData) => {
            'use server'
            formData.append('organizationKey', String(organizationKey))
            const result = await createDepartment(formData)
            if (result?.error) {
              const sep = errorBase.includes('?') ? '&' : '?'
              redirect(`${errorBase}${sep}error=${encodeURIComponent(result.error)}`)
            }
            redirect(successUrl)
          }} className="flex gap-2 mb-3">
            <input type="text" name="departmentName" required placeholder="例: 営業部" className={inputCls} />
            <button type="submit" className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">追加</button>
          </form>
          {departments && departments.length > 0 ? (
            <ul className="space-y-1.5">
              {departments.map(d => (
                <li key={d.department_id} className="flex items-center gap-2 text-sm text-gray-700 bg-white rounded px-2.5 py-1.5 border border-gray-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />{d.department_name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">まだ登録されていません</p>
          )}
        </div>

        {/* 職種 */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
            <span className="text-sm font-semibold text-gray-800">職種</span>
            {jobs && jobs.length > 0 && (
              <span className="ml-auto text-xs text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded">{jobs.length}件</span>
            )}
          </div>
          <form action={async (formData: FormData) => {
            'use server'
            formData.append('organizationKey', String(organizationKey))
            const result = await createJob(formData)
            if (result?.error) {
              const sep = errorBase.includes('?') ? '&' : '?'
              redirect(`${errorBase}${sep}error=${encodeURIComponent(result.error)}`)
            }
            redirect(successUrl)
          }} className="flex gap-2 mb-3">
            <input type="text" name="jobName" required placeholder="例: エンジニア" className={inputCls} />
            <button type="submit" className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">追加</button>
          </form>
          {jobs && jobs.length > 0 ? (
            <ul className="space-y-1.5">
              {jobs.map(j => (
                <li key={j.job_id} className="flex items-center gap-2 text-sm text-gray-700 bg-white rounded px-2.5 py-1.5 border border-gray-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />{j.job_name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">まだ登録されていません</p>
          )}
        </div>
      </div>

      {isInitial && (
        <div className="flex flex-col items-center gap-2">
          <Link
            href={`/user/register?token=${params.token}`}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md text-sm font-semibold transition-colors"
          >
            次へ：管理者ユーザーを登録する
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-gray-400">部署・職種は0件でも次に進めます</p>
        </div>
      )}
    </div>
  )
}
