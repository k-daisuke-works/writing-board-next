export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #e0e7ff 0%, #f8fafc 55%)' }}
    >
      {/* ブランドロゴ */}
      <div className="mb-8 text-center select-none">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-md text-2xl mb-3">
          📣
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">業務連絡システム</h1>
        <p className="text-sm text-slate-400 mt-0.5">チームの情報共有をスムーズに</p>
      </div>

      {children}
    </div>
  )
}
