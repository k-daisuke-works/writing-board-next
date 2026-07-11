import { getSession } from '@/lib/session'
import { verifySetupToken } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { registerUser } from '@/actions/admin'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { SetupStepper } from '../../SetupStepper'
import { SetupSubmitButton } from '../../SetupSubmitButton'
import { setupCard, setupHeading, setupInput, setupLabel } from '../../setup-ui'

export default async function UserRegisterPage({
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

  if (session?.role === 'admin' || session?.role === 'leader') {
    // 管理者/リーダーモード: セッションの組織を使用
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
  const errorBase  = isInitial
    ? `/user/register?token=${params.token}`
    : '/user/register'

  return (
    <div className={`${setupCard} max-w-lg`}>
      {isInitial && <SetupStepper current={3} />}

      <div className="mb-6">
        {!isInitial && (
          <Link href="/admin" className="mb-3 flex w-fit items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-[#001e5a]">
            <ArrowLeft className="w-4 h-4" />管理設定に戻る
          </Link>
        )}
        <h1 className={`${setupHeading} mb-1.5`}>
          {isInitial ? '管理者アカウントを作成' : 'ユーザー登録'}
        </h1>
        <p className="text-sm text-gray-500">
          {isInitial ? 'このIDとパスワードが最初のログイン情報になります' : '新しいメンバーをチームに追加します'}
        </p>
      </div>

      {isInitial && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-[#f3d9ad] bg-[#fff4d1] px-4 py-3 text-sm text-[#5c4a00]">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>最初のユーザーは自動的に管理者になります</span>
        </div>
      )}
      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 shrink-0" />ユーザーを登録しました。
        </div>
      )}
      {errorMsg && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{errorMsg}
        </div>
      )}

      <form action={async (formData: FormData) => {
        'use server'
        formData.append('organizationKey', String(organizationKey))
        if (isInitial) {
          formData.set('isInitialSetup', 'true')
        }
        const result = await registerUser(formData)
        if (result?.error) {
          const sep = errorBase.includes('?') ? '&' : '?'
          redirect(`${errorBase}${sep}error=${encodeURIComponent(result.error)}`)
        }
        if (isInitial) redirect('/login')
        else redirect('/user/register?success=true')
      }} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={setupLabel}>ユーザーID <span className="text-red-500">*</span></label>
            <input type="text" name="userId" required placeholder="例: USER001" lang="en"
              autoComplete="off" autoCorrect="off" autoCapitalize="off" className={setupInput} />
          </div>
          <div>
            <label className={setupLabel}>ユーザー名 <span className="text-red-500">*</span></label>
            <input type="text" name="userName" required placeholder="例: 山田太郎" autoComplete="off" className={setupInput} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={setupLabel}>部署</label>
            <select name="departmentId" className={setupInput}>
              <option value="">選択…</option>
              {departments?.map((d) => (
                <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={setupLabel}>職種</label>
            <select name="jobId" className={setupInput}>
              <option value="">選択…</option>
              {jobs?.map((j) => (
                <option key={j.job_id} value={j.job_id}>{j.job_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={setupLabel}>パスワード <span className="text-red-500">*</span></label>
          <input type="password" name="password" required minLength={8} placeholder="8文字以上" autoComplete="new-password" className={setupInput} />
        </div>
        {!isInitial && (
          <div>
            <label className={setupLabel}>権限</label>
            <select name="role" defaultValue="member" className={setupInput}>
              {session?.role === 'admin' && (
                <option value="admin">管理者</option>
              )}
              <option value="leader">リーダー</option>
              <option value="member">メンバー</option>
            </select>
          </div>
        )}
        <label className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed cursor-pointer pt-1">
          <input type="checkbox" name="consent" value="agreed" required className="mt-0.5 w-5 h-5 shrink-0 accent-[#001e5a]" />
          <span>
            {isInitial
              ? <>
                  <Link href="/terms" target="_blank" className="underline hover:text-gray-800">利用規約</Link>
                  と
                  <Link href="/privacy" target="_blank" className="underline hover:text-gray-800">プライバシーポリシー</Link>
                  に同意します
                </>
              : <>
                  登録する本人に
                  <Link href="/terms" target="_blank" className="underline hover:text-gray-800">利用規約</Link>
                  ・
                  <Link href="/privacy" target="_blank" className="underline hover:text-gray-800">プライバシーポリシー</Link>
                  の内容を説明し、同意を得ています
                </>
            }
          </span>
        </label>
        <div className="pt-1">
          <SetupSubmitButton idleLabel={isInitial ? 'アカウントを作成して完了' : '登録する'} pendingLabel="アカウントを作成中…" />
        </div>
      </form>

      {isInitial && (
        <p className="text-center mt-5">
          <Link href={`/departmentjob/register?token=${params.token}`}
            className="flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-3 h-3" />部署・職種登録に戻る
          </Link>
        </p>
      )}
    </div>
  )
}
