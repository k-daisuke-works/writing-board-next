import type { LucideIcon } from 'lucide-react'

/** ページ見出し（アイコンチップ＋タイトル＋任意の補足・右アクション）。全ダッシュボードで共通 */
export function PageHeading({
  Icon, title, subtitle, iconBg = 'bg-blue-50', iconColor = 'text-blue-600', action,
}: {
  Icon: LucideIcon
  title: string
  subtitle?: React.ReactNode
  iconBg?: string
  iconColor?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${iconBg} ${iconColor}`}>
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold leading-tight text-gray-900">{title}</h1>
          {subtitle != null && <p className="mt-0.5 truncate text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** セクション見出し（h2）。小さめアイコンチップ＋タイトル＋任意の右アクション */
export function SectionHeading({
  Icon, title, iconBg = 'bg-blue-50', iconColor = 'text-blue-600', action,
}: {
  Icon: LucideIcon
  title: string
  iconBg?: string
  iconColor?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-700">
        <span className={`grid size-6 shrink-0 place-items-center rounded-lg ${iconBg} ${iconColor}`}>
          <Icon className="size-3.5" strokeWidth={2} />
        </span>
        <span className="truncate">{title}</span>
      </h2>
      {action}
    </div>
  )
}
