import Link from 'next/link'
import { RoScopeLogo } from '@/app/components/RoScopeLogo'

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* トップバー：ロゴ + ログインリンク */}
      <header className="h-14 border-b border-gray-100 flex items-center px-6 shrink-0">
        <RoScopeLogo size="sm" />
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
