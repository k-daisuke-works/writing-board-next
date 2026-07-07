import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
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
        <Link href="/admin" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600">
          <ArrowLeft className="size-4" />管理設定に戻る
        </Link>
      )}

      <div className="mb-7 flex items-start gap-4">
        <div className="hidden size-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 text-white shadow-lg shadow-indigo-200 sm:grid">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Organization setup</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">部署と職種を整えましょう</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">よく使うものから追加してください。登録内容はすぐ下に反映され、あとから管理画面で変更できます。</p>
        </div>
      </div>

      <SetupCollectionClient
        initialDepartments={departments ?? []}
        initialJobs={jobs ?? []}
        setupToken={isInitial ? token : undefined}
      />

      {isInitial && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex sm:items-center sm:justify-between">
          <p className="px-2 text-xs text-slate-500">未登録のままでも次へ進めます</p>
          <Link href={`/user/register?token=${token}`} className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-lg sm:mt-0">
            管理者ユーザーの登録へ<ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
