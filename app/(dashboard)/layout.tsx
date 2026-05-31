import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { logout } from '@/actions/auth'
import Link from 'next/link'
import { LayoutGrid, MessageSquare, Calendar, Newspaper, Settings, LogOut, Receipt } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* トップバー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">

          {/* ロゴ */}
          <Link href="/home" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center group-hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900 hidden sm:block">業務連絡</span>
          </Link>

          {/* 区切り */}
          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          {/* ナビゲーション */}
          <nav className="flex items-center gap-1 flex-1">
            <Link href="/home"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">ホーム</span>
            </Link>
            <Link href="/posts"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">連絡ボード</span>
            </Link>
            <Link href="/schedule/calendar"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">スケジュール</span>
            </Link>
            <Link href="/welfare"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">福祉情報</span>
            </Link>
            <Link href="/expenses"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">活動費請求</span>
            </Link>
            {session.adminFlag && (
              <Link href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">管理</span>
              </Link>
            )}
          </nav>

          {/* ユーザーエリア */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-medium text-gray-800 leading-none">{session.userName}</span>
              <span className="text-xs text-gray-400 leading-none mt-0.5">{session.departmentName || session.organizationName}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {session.userName.slice(0, 1)}
            </div>
            <form action={logout}>
              <button type="submit"
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1.5 rounded hover:bg-gray-100">
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ページコンテンツ */}
      <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {children}
      </main>
    </div>
  )
}
