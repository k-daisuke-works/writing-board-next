import Link from 'next/link'
import { RoScopeLogo } from '@/app/components/RoScopeLogo'

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#fdf9ee]">
      {/* ランディング・ログインと同じ浮遊装飾 */}
      <span className="anim-puka pointer-events-none absolute hidden w-[90px] h-[90px] rounded-full top-[14%] right-[6%] opacity-60 sm:block" style={{ background: '#ffc300' }} aria-hidden />
      <span className="anim-puka pointer-events-none absolute hidden w-[46px] h-[46px] rounded-full bottom-[24%] right-[14%] opacity-70 sm:block" style={{ background: '#23aabe', animationDelay: '-1.6s' }} aria-hidden />
      <span className="anim-puka pointer-events-none absolute hidden w-[32px] h-[32px] rounded-full top-[40%] left-[5%] opacity-70 sm:block" style={{ background: '#7dbb01', animationDelay: '-2.4s' }} aria-hidden />

      {/* トップバー：ロゴ + ログインリンク */}
      <header className="relative z-10 flex h-16 shrink-0 items-center border-b border-[#f3e6c2] bg-white/80 px-5 backdrop-blur sm:px-10">
        <RoScopeLogo size="sm" />
        <div className="ml-auto">
          <Link href="/login"
            className="font-maru inline-flex min-h-[40px] items-center rounded-full border-2 border-gray-200 bg-white px-4 text-sm font-bold text-[#001e5a] transition-colors hover:border-[#ffc300]">
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
