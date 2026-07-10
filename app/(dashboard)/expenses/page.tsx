import { getSession } from '@/lib/session'
import { createOrgClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ExpensesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createOrgClient(session.organizationKey)
  const { data: user } = await supabase
    .from('user_info')
    .select('social_worker_member_id')
    .eq('user_key', session.userKey)
    .eq('organization_key', session.organizationKey)
    .single()

  const formUrl = new URL('https://docs.google.com/forms/d/e/1FAIpQLScEo42c3ee0RTVcU0hmOctaqBSbjxvBUmf6cq5b81r1LzsgEA/viewform')
  formUrl.searchParams.set('embedded', 'true')
  if (user?.social_worker_member_id) {
    formUrl.searchParams.set('entry.691344018', user.social_worker_member_id)
  }

  return (
    <div className="anim-fade-in max-w-3xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">活動費請求</h1>
        <p className="text-sm text-gray-500 mt-0.5">フォームに必要事項を入力して送信してください</p>
        {user?.social_worker_member_id ? (
          <p className="mt-2 text-xs text-emerald-700">プロフィールの社会福祉士会IDを会員番号へ入力済みです</p>
        ) : (
          <p className="mt-2 text-xs text-amber-700">プロフィールに社会福祉士会IDを登録すると、会員番号が自動入力されます</p>
        )}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <iframe
          src={formUrl.toString()}
          style={{ border: 'none', minWidth: '320px', width: '100%', height: '900px' }}
          title="活動費請求フォーム"
        >
          読み込んでいます…
        </iframe>
      </div>
    </div>
  )
}
