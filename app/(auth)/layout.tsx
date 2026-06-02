import Link from 'next/link'

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* トップバー：ロゴ + ログインリンク */}
      <header className="h-14 border-b border-gray-100 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="7" cy="14" r="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="17" cy="14" r="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 14h2M7 10V8h3m4 0h3V10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-gray-800 text-sm">RoScope</span>
        </div>
        <div className="ml-auto">
          <Link href="/login"
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            ログインはこちら
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col items-center justify-start lg:justify-center px-6 py-10 lg:py-12 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
