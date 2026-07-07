import Link from 'next/link'
import { RoScopeLogo } from '@/app/components/RoScopeLogo'

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute -left-40 top-20 size-96 rounded-full bg-teal-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 size-[28rem] rounded-full bg-indigo-200/35 blur-3xl" />
      {/* トップバー：ロゴ + ログインリンク */}
      <header className="relative z-10 flex h-16 shrink-0 items-center border-b border-white/70 bg-white/70 px-6 backdrop-blur-xl sm:px-10">
        <RoScopeLogo size="sm" />
        <div className="ml-auto">
          <Link href="/login"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600">
            ログインはこちら
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-start overflow-y-auto px-5 py-10 lg:justify-center lg:py-12">
        {children}
      </main>
    </div>
  )
}
