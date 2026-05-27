import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { registerUser } from '@/actions/admin'
import Link from 'next/link'
import { Users, ArrowLeft, CheckCircle, AlertCircle, Info, Check } from 'lucide-react'

export default async function UserRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ orgKey?: string; initial?: string; success?: string; error?: string }>
}) {
  const params      = await searchParams
  const isInitial   = params.initial === 'true'
  const orgKeyParam = params.orgKey ? Number(params.orgKey) : null
  const session     = await getSession()

  const organizationKey = session?.organizationKey ?? orgKeyParam
  const canAccess       = session?.adminFlag || (isInitial && orgKeyParam != null)

  if (!organizationKey || !canAccess) redirect('/login')

  const supabase = await createServiceClient()
  const [{ data: departments }, { data: jobs }] = await Promise.all([
    supabase.from('department_data').select('*').eq('organization_key', organizationKey),
    supabase.from('job_data').select('*').eq('organization_key', organizationKey),
  ])

  const success  = params.success === 'true'
  const errorMsg = params.error ? decodeURIComponent(params.error) : null

  const inputCls = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
  const labelCls = "block text-xs font-medium text-gray-700 mb-1.5"

  return (
    <div className="w-full max-w-md">
      {/* ヘッダー */}
      <div className="mb-6">
        {isInitial ? (
          <>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <Check className="w-3 h-3" />団体登録
              </span>
              <span>→</span>
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <Check className="w-3 h-3" />部署・職種登録
              </span>
              <span>→</span>
              <span className="font-medium text-gray-700">ユーザー登録</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">管理者ユーザーを作成</h1>
            <p className="text-sm text-gray-500 mt-0.5">最初のユーザーは管理者として登録されます</p>
          </>
        ) : (
          <>
            <Link href="/admin" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-3 w-fit">
              <ArrowLeft className="w-4 h-4" />管理設定に戻る
            </Link>
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-gray-400" strokeWidth={1.75} />
              <h1 className="text-xl font-semibold text-gray-900">ユーザー登録</h1>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">新しいメンバーをチームに追加します</p>
          </>
        )}
      </div>

      {/* フィードバック */}
      {isInitial && (
        <div className="mb-4 flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-md px-4 py-3 text-sm">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>登録後、このIDとパスワードでログインできます</span>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-md px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />ユーザーを登録しました。
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-md px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{errorMsg}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">
            {isInitial ? '管理者アカウント情報' : 'ユーザー情報'}
          </span>
        </div>
        <form action={async (formData: FormData) => {
          'use server'
          if (isInitial && orgKeyParam) {
            formData.set('organizationKey', String(orgKeyParam))
            formData.set('isAdmin', 'true')
            formData.set('isInitialSetup', 'true')
          }
          const result = await registerUser(formData)
          if (result?.error) {
            const url = isInitial
              ? `/user/register?orgKey=${orgKeyParam}&initial=true&error=${encodeURIComponent(result.error)}`
              : `/user/register?error=${encodeURIComponent(result.error)}`
            redirect(url)
          }
          if (isInitial) redirect('/login')
          else redirect('/user/register?success=true')
        }} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>ユーザーID <span className="text-red-500">*</span></label>
              <input type="text" name="userId" required placeholder="例: USER001" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>ユーザー名 <span className="text-red-500">*</span></label>
              <input type="text" name="userName" required placeholder="例: 山田太郎" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>部署 <span className="text-red-500">*</span></label>
              <select name="departmentId" required className={inputCls}>
                <option value="">選択…</option>
                {departments?.map((d) => (
                  <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>職種 <span className="text-red-500">*</span></label>
              <select name="jobId" required className={inputCls}>
                <option value="">選択…</option>
                {jobs?.map((j) => (
                  <option key={j.job_id} value={j.job_id}>{j.job_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>パスワード <span className="text-red-500">*</span></label>
            <input type="password" name="password" required minLength={8} placeholder="8文字以上" className={inputCls} />
          </div>
          {!isInitial && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" name="isAdmin" value="true"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">管理者権限を付与する</span>
            </label>
          )}
          <button type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-md transition-colors flex items-center justify-center gap-2">
            {isInitial ? 'ユーザーを作成してログインへ' : '登録する'}
            {isInitial && <Check className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {isInitial && (
        <p className="text-center mt-4">
          <Link href={`/departmentjob/register?orgKey=${orgKeyParam}&initial=true`}
            className="flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-3 h-3" />部署・職種登録に戻る
          </Link>
        </p>
      )}
    </div>
  )
}
