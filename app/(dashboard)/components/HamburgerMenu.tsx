'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Menu, Receipt } from 'lucide-react'

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
        aria-label="メニュー"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          <Link
            href="/expenses"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Receipt className="w-4 h-4 text-gray-400" />
            活動費請求
          </Link>
        </div>
      )}
    </div>
  )
}
