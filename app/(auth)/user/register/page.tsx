import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { registerUser } from '@/actions/admin'
import Link from 'next/link'

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

  const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"

  return (
    <div className="w-full max-w-md">
      {/* ヘッダー */}
      {isInitial ? (
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-2xl text-2xl mb-3">👤</div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">管理者ユーザーを作成</h1>
          <p className="text-sm text-slate-400 mt-1">最初のユーザーは管理者として登録されます</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-sm text-slate-400 hover:text-indigo-500 transition-colors">← 管理に戻る</Link>
          <span className="text-slate-200">/</span>
          <h1 className="text-xl font-bold text-slate-800">ユーザー登録</h1>
        </div>
      )}

      {/* フィードバック */}
      {isInitial && (
        <div className="mb-4 flex items-start gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-4 py-3 text-sm">
          ℹ️ 登録後、このIDとパスワードでログインできます
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
          ✅ ユーザーを登録しました。
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
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
        }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">ユーザーID</label>
              <input type="text" name="userId" required placeholder="例: USER001" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">ユーザー名</label>
              <input type="text" name="userName" required placeholder="例: 山田太郎" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">部署</label>
              <select name="departmentId" required className={inputClass}>
                <option value="">選択…</option>
                {departments?.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">職種</label>
              <select name="jobId" required className={inputClass}>
                <option value="">選択…</option>
                {jobs?.map((j) => <option key={j.job_id} value={j.job_id}>{j.job_name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">パスワード</label>
            <input type="password" name="password" required minLength={8} placeholder="8文字以上" className={inputClass} />
          </div>
          {!isInitial && (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" name="isAdmin" value="true" className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-sm text-slate-600">管理者権限を付与する</span>
            </label>
          )}
          <button type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-2">
            {isInitial ? 'ユーザーを作成してログインへ →' : '登録する'}
          </button>
        </form>
      </div>

      {isInitial && (
        <p className="text-center mt-4">
          <Link href={`/departmentjob/register?orgKey=${orgKeyParam}&initial=true`} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            ← 部署・職種登録に戻る
          </Link>
        </p>
      )}
    </div>
  )
}
