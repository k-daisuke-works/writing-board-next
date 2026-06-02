'use client'

import { useState } from 'react'
import { ChevronDown, BookOpen } from 'lucide-react'
import { SECTIONS } from './content'

export default function ManualPage() {
  return (
    <div className="anim-fade-in max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">使い方マニュアル</h1>
          <p className="text-sm text-gray-500 mt-0.5">システムの操作方法を確認できます</p>
        </div>
      </div>

      {/* 目次 */}
      <nav className="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">目次</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {s.title}
            </a>
          ))}
        </div>
      </nav>

      {/* セクション */}
      <div className="space-y-6">
        {SECTIONS.map(section => (
          <section key={section.id} id={section.id}>
            <h2 className="text-base font-semibold text-gray-800 mb-2 pb-2 border-b border-gray-200">
              {section.title}
            </h2>
            <div className="space-y-1">
              {section.items.map((item, i) => (
                <AccordionItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-800 pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{a}</p>
        </div>
      )}
    </div>
  )
}
