'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { buildCards } from '@/app/(dashboard)/components/menuItems'

export default function HomeMenuDropdown({ role, userKey, hasInstagram = false }: { role: string; userKey: number; hasInstagram?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const cards = buildCards(role, userKey, hasInstagram)

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors select-none"
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
