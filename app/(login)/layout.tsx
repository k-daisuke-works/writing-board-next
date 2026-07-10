import { RoScopeLogo } from '@/app/components/RoScopeLogo'

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* 左パネル：ブランドエリア（lg以上のみ） */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-12 shrink-0 relative overflow-hidden"
        style={{ background: '#ffc300' }}
      >
        <span className="anim-puka absolute w-[110px] h-[110px] rounded-full bg-white/35 top-[12%] right-[8%]" aria-hidden />
        <span className="anim-puka absolute w-[52px] h-[52px] rounded-full opacity-80 bottom-[30%] right-[16%]" style={{ background: '#23aabe', animationDelay: '-1.6s' }} aria-hidden />
        <span className="anim-puka absolute w-[34px] h-[34px] rounded-full opacity-85 top-[38%] left-[6%]" style={{ background: '#7dbb01', animationDelay: '-2.4s' }} aria-hidden />
        <span className="anim-puka absolute w-[20px] h-[20px] rounded-full bg-white/80 bottom-[10%] left-[22%]" aria-hidden />

        <div className="relative">
          <div className="mb-16">
            <RoScopeLogo size="md" />
          </div>
          <h2 className="font-maru text-3xl font-extrabold leading-snug mb-4" style={{ color: '#001e5a' }}>
            チームの情報共有、<br />
            <span className="inline-block bg-white rounded-full px-3" style={{ color: '#23aabe' }}>まるっと</span>ひとつに。
          </h2>
          <p className="text-sm font-medium leading-relaxed" style={{ color: '#5c4a00' }}>
            班の連絡も、日程調整も、活動費請求も。<br />
            会の「伝える」をひとつのボードに。
          </p>
        </div>
        <div className="relative flex flex-wrap gap-2">
          {['リアルタイム更新', 'PDF添付対応', 'マルチ班対応'].map(t => (
            <span key={t} className="font-maru text-xs font-bold bg-white rounded-full px-4 py-1.5" style={{ color: '#001e5a' }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* 右パネル：フォームエリア */}
      <div className="flex-1 flex flex-col items-center justify-start lg:justify-center px-5 py-10 lg:px-8 lg:py-12 overflow-y-auto" style={{ background: '#fdf9ee' }}>
        {/* モバイル用ロゴ */}
        <div className="mb-6 lg:hidden w-full max-w-md">
          <RoScopeLogo size="sm" />
        </div>
        {children}
      </div>
    </div>
  )
}
