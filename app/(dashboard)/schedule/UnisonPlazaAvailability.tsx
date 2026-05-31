'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Building2 } from 'lucide-react'

export default function UnisonPlazaAvailability() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const mm = String(month).padStart(2, '0')
  const src = `https://www.unisonplaza-member.jp/print/?year=${year}&month=${mm}`

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">ユニゾンプラザ 空き状況</h2>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          別タブで開く
        </a>
      </div>

      {/* 月ナビ */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          aria-label="前の月"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-sm font-medium text-gray-700 w-20 text-center">
          {year}年{month}月
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          aria-label="次の月"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* iframe */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <iframe
          key={src}
          src={src}
          title="ユニゾンプラザ空き状況"
          className="w-full"
          style={{ height: '640px', border: 'none' }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1.5">
        表示されない場合は「別タブで開く」をご利用ください
      </p>
    </div>
  )
}
