import { RoScopeLogo } from '@/app/components/RoScopeLogo'

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* 左パネル：ブランドエリア（ログインのみ） */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-12 shrink-0"
        style={{ background: 'linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)' }}
      >
        <div>
          <div className="mb-16">
            <RoScopeLogo size="md" variant="light" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">
              チームの情報共有を<br />もっとスムーズに
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              チームの今を、一目で見渡す。
              大切なお知らせを見逃さない。
            </p>
          </div>
        </div>
        <div className="flex gap-8 text-blue-200 text-xs">
          <span>リアルタイム更新</span>
          <span>PDF添付対応</span>
          <span>マルチ部署対応</span>
        </div>
      </div>

      {/* 右パネル：フォームエリア */}
      <div className="flex-1 flex flex-col items-center justify-start lg:justify-center px-6 py-10 lg:px-8 lg:py-12 bg-gray-50 overflow-y-auto">
        {/* モバイル用ロゴ */}
        <div className="mb-8 lg:hidden w-full max-w-md">
          <RoScopeLogo size="sm" />
        </div>
        {children}
      </div>
    </div>
  )
}
