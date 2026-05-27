import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { logout } from '@/actions/auth'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      {/* ナビバー */}
      <nav className="bg-blue-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/home" className="font-bold text-lg hover:opacity-80">
            🏠 業務連絡システム
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="opacity-90">
              👤 <strong>{session.userName}</strong>
            </span>
            <span className="opacity-75 hidden sm:inline">
              🏢 {session.organizationName}
            </span>
            <Link href="/posts" className="opacity-80 hover:opacity-100 transition">
              📋 連絡
            </Link>
            {session.adminFlag && (
              <Link href="/admin" className="opacity-80 hover:opacity-100 transition">
                🔧 管理
              </Link>
            )}
            <form action={logout}>
              <button
                type="submit"
                className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition text-xs font-medium"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
