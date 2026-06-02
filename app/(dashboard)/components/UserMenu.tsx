'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { logout } from '@/actions/auth'
import { buildCards } from '@/app/(dashboard)/components/menuItems'
import type { UserSession } from '@/types/database'

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

  const cards = buildCards(session.adminFlag, session.userKey)

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
        <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-60 overflow-hidden anim-slide-down">
          {/* ユーザー情報 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{session.userName}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {session.departmentName || session.organizationName}
            </p>
          </div>

          {/* メニュー項目 */}
          <div className="p-1.5">
            {cards.map(({ href, Icon, title, desc, iconBg, iconColor }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                <div className="flex items-center gap-3 px-2.5 py-2 rounded-md hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 ${iconBg} rounded-md flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">{title}</p>
                    <p className="text-xs text-gray-400 truncate">{desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ログアウト */}
          <form action={logout} className="border-t border-gray-100 p-1.5">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="w-8 h-8 bg-red-50 rounded-md flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4 text-red-500" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">ログアウト</p>
              </div>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
