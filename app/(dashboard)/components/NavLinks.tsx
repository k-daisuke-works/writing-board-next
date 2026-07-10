'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, MessageSquare, Calendar, Newspaper, Search } from 'lucide-react'

type Props = { unreadBoard: number; unreadTeam: number }

const LINKS = [
  { href: '/home', match: '/home', Icon: LayoutGrid, label: 'ホーム', mobile: true, badge: 'team' as const },
  { href: '/posts', match: '/posts', Icon: MessageSquare, label: '全体掲示板', mobile: true, badge: 'board' as const },
  { href: '/schedule/calendar', match: '/schedule', Icon: Calendar, label: 'スケジュール', mobile: true, badge: null },
  { href: '/welfare', match: '/welfare', Icon: Newspaper, label: '福祉情報', mobile: false, badge: null },
  { href: '/search', match: '/search', Icon: Search, label: '検索', mobile: false, badge: null },
]

export default function NavLinks({ unreadBoard, unreadTeam }: Props) {
  const pathname = usePathname()

  return (
    <nav className="flex min-w-0 flex-1 items-center justify-center gap-0.5 sm:justify-start sm:gap-1" aria-label="メインナビゲーション">
      {LINKS.map(({ href, match, Icon, label, mobile, badge }) => {
        const active = pathname === match || pathname.startsWith(`${match}/`)
        const count = badge === 'team' ? unreadTeam : badge === 'board' ? unreadBoard : 0
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`relative shrink-0 items-center justify-center gap-1.5 rounded-full text-sm transition-colors min-h-11 min-w-11 sm:min-h-9 sm:min-w-0 sm:px-3.5 sm:py-1.5 ${
              mobile ? 'flex' : 'hidden sm:flex'
            } ${
              active
                ? 'font-maru font-bold bg-[#ffc300] text-[#001e5a]'
                : 'text-gray-600 hover:bg-[#fff4d1] hover:text-[#8a6d00]'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
            {count > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
