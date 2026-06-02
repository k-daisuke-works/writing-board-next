'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/schedule/calendar',   label: '全体スケジュール' },
  { href: '/schedule/department', label: '部署スケジュール' },
  { href: '/schedule',            label: '日程調整' },
  { href: '/schedule/unison',     label: 'ユニゾンプラザ空き状況' },
]

export default function SubNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/schedule') {
      return pathname === '/schedule' || /^\/schedule\/\d/.test(pathname)
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 mb-5 scrollbar-none">
      {TABS.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            isActive(tab.href)
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
