'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Users, Receipt, BookOpen, Settings, UserCircle, LogOut } from 'lucide-react'
import { logout } from '@/actions/auth'
import type { UserSession } from '@/types/database'

const MENU_ITEMS = [
  { href: '/members',  Icon: Users,       label: 'メンバー一覧',      adminOnly: false },
  { href: '/expenses', Icon: Receipt,     label: '活動費請求',        adminOnly: false },
  { href: '/manual',   Icon: BookOpen,    label: '使い方マニュアル',  adminOnly: false },
  { href: '/admin',    Icon: Settings,    label: '組織管理',          adminOnly: true  },
]

export default function UserMenu({ session }: { session: UserSession }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  const items = MENU_ITEMS.filter(item => !item.adminOnly || session.role !== 'member')

  return (
    <div ref={ref} className="relative shrink-0">
      {/* アバターボタン */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-400 transition-colors focus:outline-none"
        aria-label="個人メニュー"
      >
        {session.avatarUrl ? (
          <img src={session.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {session.userName.slice(0, 1)}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-44 overflow-hidden anim-slide-down">
          {/* ユーザー情報 */}
          <div className="px-3 py-2.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{session.userName}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {session.departmentName || session.organizationName}
            </p>
          </div>

          {/* メニュー項目 */}
          <div className="py-1">
            {items.map(({ href, Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={1.75} />
                {label}
              </Link>
            ))}
            <Link
              href={`/member/${session.userKey}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <UserCircle className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={1.75} />
              プロフィール編集
            </Link>
          </div>

          {/* ログアウト */}
          <form action={logout} className="border-t border-gray-100 py-1">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              ログアウト
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
