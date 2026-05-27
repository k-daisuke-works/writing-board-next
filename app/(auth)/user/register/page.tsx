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
  const params = await searchParams
  const isInitial = params.initial === 'true'
  const orgKeyParam = params.orgKey ? Number(params.orgKey) : null

  const session = await getSession()

  // 初回セットアップ（orgKey あり）か通常管理者アクセス（session あり）か判定
  const organizationKey = session?.organizationKey ?? orgKeyParam
  const canAccess = session?.adminFlag || (isInitial && orgKeyParam != null)

  if (!organizationKey || !canAccess) redirect('/login')

  const supabase = await createServiceClient()

  const [{ data: departments }, { data: jobs }] = await Promise.all([
    supabase.from('department_data').select('*').eq('organization_key', organizationKey),
    supabase.from('job_data').select('*').eq('organization_key', organizationKey),
  ])

  const success = params.success === 'true'
  const error = params.error ? decodeURIComponent(params.error) : null

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        {!isInitial ? (
          <>
            <Link href="/admin" className="text-blue-500 hover:underline text-sm">← 管理ページに戻る</Link>
            <h1 className="text-2xl font-bold text-gray-800">👤 ユーザー登録</h1>
          </>
        ) : (
          <>
            <Link
              href={`/departmentjob/register?orgKey=${organizationKey}&initial=true`}
              className="text-blue-500 hover:underline text-sm"
            >
              ← 部署・職種登録に戻る
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">👤 管理者ユーザー登録</h1>
          </>
        )}
      </div>

      {isInitial && (
        <div className="mb-4 bg-blue-50 border border-blue-300 text-blue-700 rounded-lg px-4 py-3 text-sm">
          ℹ️ 最初のユーザーは管理者として登録されます。登録後にログインできます。
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-300 text-green-700 rounded-lg px-4 py-3 text-sm">
          ✅ ユーザーを登録しました。{!isInitial && 'さらに登録できます。'}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">
          ❌ {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6">
        <form action={async (formData: FormData) => {
          'use server'
          // 初回セットアップの場合は organizationKey を付加し、必ず管理者にする
          if (isInitial && orgKeyParam) {
            formData.set('organizationKey', String(orgKeyParam))
            formData.set('isAdmin', 'true')
            formData.set('isInitialSetup', 'true')
          }
          const result = await registerUser(formData)
          if (result?.error) {
            const errorUrl = isInitial
              ? `/user/register?orgKey=${orgKeyParam}&initial=true&error=${encodeURIComponent(result.error)}`
              : `/user/register?error=${encodeURIComponent(result.error)}`
            redirect(errorUrl)
          }
          if (isInitial) {
            redirect('/login')
          } else {
            redirect('/user/register?success=true')
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ユーザーID</label>
            <input type="text" name="userId" required placeholder="例: USER001"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label>
            <input type="text" name="userName" required placeholder="例: 山田太郎"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">部署</label>
            <select name="departmentId" required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">選択してください</option>
              {departments?.map((d) => (
                <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">職種</label>
            <select name="jobId" required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">選択してください</option>
              {jobs?.map((j) => (
                <option key={j.job_id} value={j.job_id}>{j.job_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input type="password" name="password" required minLength={8} placeholder="8文字以上"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          {!isInitial && (
            <div className="flex items-center gap-2">
              <input type="checkbox" name="isAdmin" value="true" id="isAdmin" className="rounded" />
              <label htmlFor="isAdmin" className="text-sm text-gray-700">管理者権限を付与する</label>
            </div>
          )}
          <button type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition">
            {isInitial ? '管理者ユーザーを作成してログインへ' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  )
}
