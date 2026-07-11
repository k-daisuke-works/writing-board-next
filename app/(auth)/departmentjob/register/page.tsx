import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getSession, verifySetupToken } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { SetupStepper } from '../../SetupStepper'
import { SetupCollectionClient } from './SetupCollectionClient'

export default async function DepartmentJobRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const session = await getSession()
  const tokenOrganizationKey = token ? await verifySetupToken(token) : null
  const isInitial = !session && Boolean(tokenOrganizationKey)
  const organizationKey = session?.role === 'admin' ? session.organizationKey : tokenOrganizationKey

  if (!organizationKey) redirect('/login')

  const supabase = createServiceClient()
  const [{ data: departments }, { data: jobs }] = await Promise.all([
    supabase.from('department_data').select('department_id, department_name').eq('organization_key', organizationKey).order('department_id'),
    supabase.from('job_data').select('job_id, job_name').eq('organization_key', organizationKey).order('job_id'),
  ])

  return (
    <div className="anim-fade-in w-full max-w-3xl">
      {isInitial && <SetupStepper current={2} />}

      {!isInitial && (
        <Link href="/admin" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-[#001e5a]">
          <ArrowLeft className="size-4" />管理設定に戻る
        </Link>
      )}

      <div className="mb-7">
        <h1 className="font-maru text-2xl font-extrabold text-[#001e5a]">部署と職種を登録</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">よく使うものから追加してください。登録内容はすぐ下に反映され、あとから管理画面で変更できます。</p>
      </div>

      <SetupCollectionClient
        initialDepartments={departments ?? []}
        initialJobs={jobs ?? []}
        setupToken={isInitial ? token : undefined}
      />

      {isInitial && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:flex sm:items-center sm:justify-between">
          <p className="px-2 text-xs text-gray-500">未登録のままでも次へ進めます</p>
          <Link href={`/user/register?token=${token}`}
            className="font-maru mt-2 flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#001e5a] px-6 py-3 text-sm font-bold text-white shadow-[0_5px_0_#001240] transition-transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 sm:mt-0">
            管理者ユーザーの登録へ<ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
