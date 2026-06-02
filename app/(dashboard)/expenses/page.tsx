import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function ExpensesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="anim-fade-in max-w-3xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">活動費請求</h1>
        <p className="text-sm text-gray-500 mt-0.5">フォームに必要事項を入力して送信してください</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLScEo42c3ee0RTVcU0hmOctaqBSbjxvBUmf6cq5b81r1LzsgEA/viewform?embedded=true"
          style={{ border: 'none', minWidth: '320px', width: '100%', height: '900px' }}
          title="活動費請求フォーム"
        >
          読み込んでいます…
        </iframe>
      </div>
    </div>
  )
}
