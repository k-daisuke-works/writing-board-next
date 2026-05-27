export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* 左パネル：ブランドエリア（ログインのみ） */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-12 shrink-0"
        style={{ background: 'linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">業務連絡システム</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">
              チームの情報共有を<br />もっとスムーズに
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              部署間の業務連絡をリアルタイムで共有。
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
        <div className="flex items-center gap-2.5 mb-8 lg:hidden w-full max-w-md">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-gray-800">業務連絡システム</span>
        </div>
        {children}
      </div>
    </div>
  )
}
