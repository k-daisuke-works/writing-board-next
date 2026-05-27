import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { registerUser } from '@/actions/admin'
import Link from 'next/link'

export default async function UserRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const session = await getSession()
  if (!session?.adminFlag) redirect('/home')

  const supabase = await createServiceClient()

  const [{ data: departments }, { data: jobs }] = await Promise.all([
    supabase.from('department_data').select('*').eq('organization_key', session.organizationKey),
    supabase.from('job_data').select('*').eq('organization_key', session.organizationKey),
  ])

  const params = await searchParams
  const success = params.success === 'true'

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-blue-500 hover:underline text-sm">← 管理ページに戻る</Link>
        <h1 className="text-2xl font-bold text-gray-800">👤 ユーザー登録</h1>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-300 text-green-700 rounded-lg px-4 py-3 text-sm">
          ✅ ユーザーを登録しました。
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6">
        <form action={async (formData: FormData) => {
          'use server'
          const result = await registerUser(formData)
          if (!result?.error) redirect('/user/register?success=true')
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
          <div className="flex items-center gap-2">
            <input type="checkbox" name="isAdmin" value="true" id="isAdmin" className="rounded" />
            <label htmlFor="isAdmin" className="text-sm text-gray-700">管理者権限を付与する</label>
          </div>
          <button type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition">
            登録する
          </button>
        </form>
      </div>
    </div>
  )
}
