'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, Users, Building2, Settings, Menu, X } from 'lucide-react'

const MENU_CARDS = [
  {
    href: '/posts',
    Icon: MessageSquare,
    title: '連絡ボード',
    desc: '各部署の最新業務連絡を確認する',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    adminOnly: false,
  },
  {
    href: '/user/register',
    Icon: Users,
    title: 'ユーザー管理',
    desc: '新しいメンバーを招待・追加する',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    adminOnly: true,
  },
  {
    href: '/departmentjob/register',
    Icon: Building2,
    title: '部署・職種登録',
    desc: '組織の部署や職種を設定する',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    adminOnly: true,
  },
  {
    href: '/admin',
    Icon: Settings,
    title: '管理設定',
    desc: 'ユーザーや組織情報を管理・削除する',
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-600',
    adminOnly: true,
  },
]

export default function HomeMenuDropdown({ adminFlag }: { adminFlag: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const cards = MENU_CARDS.filter((c) => !c.adminOnly || adminFlag)

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors select-none"
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        <span className="hidden sm:inline">メニュー</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-60">
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
      )}
    </div>
  )
}
