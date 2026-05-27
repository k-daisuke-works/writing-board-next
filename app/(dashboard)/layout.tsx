import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { logout } from '@/actions/auth'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ナビバー */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* ロゴ */}
          <Link href="/home" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-lg flex items-center justify-center text-sm shadow-sm">
              📣
            </div>
            <span className="font-bold text-slate-800 tracking-tight hidden sm:block">業務連絡</span>
          </Link>

          {/* ナビリンク */}
          <div className="flex items-center gap-1">
            <Link
              href="/posts"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <span>📋</span>
              <span className="hidden sm:inline">連絡ボード</span>
            </Link>
            {session.adminFlag && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <span>⚙️</span>
                <span className="hidden sm:inline">管理</span>
              </Link>
            )}
          </div>

          {/* ユーザー情報 */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium text-slate-700">{session.userName}</span>
              <span className="text-xs text-slate-400">{session.departmentName}</span>
            </div>
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
              {session.userName.slice(0, 1)}
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
