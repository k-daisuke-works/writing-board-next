'use client'

import { useMemo, useState } from 'react'
import {
  ChevronDown, BookOpen, Search, Lightbulb, X,
  Home, MessageSquare, Calendar, Newspaper, Users, Receipt,
  LogIn, LayoutDashboard, Send,
} from 'lucide-react'
import { SECTIONS, type Block, type ManualItem } from './content'

const SECTION_ICONS: Record<string, { Icon: React.ElementType; color: string }> = {
  overview: { Icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
  home: { Icon: Home, color: 'bg-indigo-50 text-indigo-600' },
  posts: { Icon: MessageSquare, color: 'bg-violet-50 text-violet-600' },
  schedule: { Icon: Calendar, color: 'bg-teal-50 text-teal-600' },
  welfare: { Icon: Newspaper, color: 'bg-green-50 text-green-600' },
  members: { Icon: Users, color: 'bg-orange-50 text-orange-600' },
  expenses: { Icon: Receipt, color: 'bg-rose-50 text-rose-600' },
}

const QUICK_START = [
  { Icon: LogIn, title: 'ログイン', desc: '団体ID・ユーザーID・パスワードを入力してログインします' },
  { Icon: LayoutDashboard, title: 'ホームを確認', desc: '重要連絡と部署のお知らせをチェックします' },
  { Icon: Send, title: '投稿してみる', desc: 'チームメッセージや掲示板に最初のひとことを投稿します' },
]

// item 内の全テキストを検索対象に平坦化
function itemText(item: ManualItem): string {
  const blockText = (b: Block) =>
    b.type === 'p' || b.type === 'note' ? b.text : b.items.join(' ')
  return `${item.q} ${item.blocks.map(blockText).join(' ')}`
}

export default function ManualPage() {
  const [query, setQuery] = useState('')
  const [expandAll, setExpandAll] = useState(false)

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!q) return SECTIONS
    return SECTIONS
      .map(s => ({ ...s, items: s.items.filter(item => itemText(item).toLowerCase().includes(q)) }))
      .filter(s => s.items.length > 0)
  }, [q])

  const totalHits = filtered.reduce((n, s) => n + s.items.length, 0)

  return (
    <div className="anim-fade-in max-w-3xl">
      {/* ヘッダー */}
      <div className="mb-5 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">使い方マニュアル</h1>
          <p className="text-sm text-gray-500 mt-0.5">機能ごとの操作方法を確認できます</p>
        </div>
      </div>

      {/* 検索 */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="キーワードで検索（例: 投稿 / PIN / 日程調整）"
          className="w-full h-11 bg-white border border-gray-200 rounded-xl pl-10 pr-12 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-shadow"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="検索をクリア"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-600 active:text-gray-600 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* セクションナビ（横スクロールチップ） */}
      {!q && (
        <nav className="sticky top-14 z-10 -mx-4 px-4 py-2 bg-gray-50/90 backdrop-blur mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {SECTIONS.map(s => {
              const { Icon } = SECTION_ICONS[s.id] ?? { Icon: BookOpen }
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-1.5 shrink-0 whitespace-nowrap bg-white border border-gray-200 rounded-full px-3.5 py-2 min-h-[44px] text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 active:border-blue-300 active:text-blue-600 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.title}
                </a>
              )
            })}
          </div>
        </nav>
      )}

      {/* クイックスタート */}
      {!q && (
        <div className="relative overflow-hidden rounded-2xl mb-8 p-5 sm:p-6" style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)' }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/30 rounded-full blur-2xl pointer-events-none" aria-hidden />
          <p className="relative text-blue-200 text-xs font-semibold mb-1">QUICK START</p>
          <h2 className="relative text-white font-bold text-lg mb-4">はじめての方はこの3ステップ</h2>
          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-3">
            {QUICK_START.map(({ Icon, title, desc }, i) => (
              <div key={title} className="bg-white/10 border border-white/15 rounded-xl p-3.5 backdrop-blur">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-white text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <Icon className="w-4 h-4 text-blue-200" />
                  <span className="text-white text-sm font-semibold">{title}</span>
                </div>
                <p className="text-blue-100/90 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 検索結果件数 / 全て開く */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">
          {q ? `「${query.trim()}」の検索結果 ${totalHits}件` : `全${SECTIONS.reduce((n, s) => n + s.items.length, 0)}項目`}
        </p>
        {!q && (
          <button
            onClick={() => setExpandAll(v => !v)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium min-h-[32px] px-2"
          >
            {expandAll ? 'すべて閉じる' : 'すべて開く'}
          </button>
        )}
      </div>

      {/* セクション */}
      {totalHits === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-10 text-center">
          <p className="text-sm text-gray-500 mb-1">「{query.trim()}」に一致する項目が見つかりませんでした</p>
          <p className="text-xs text-gray-400">別のキーワードで検索してみてください</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filtered.map(section => {
            const { Icon, color } = SECTION_ICONS[section.id] ?? { Icon: BookOpen, color: 'bg-gray-50 text-gray-600' }
            return (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-800 leading-tight">{section.title}</h2>
                    <p className="text-xs text-gray-400">{section.desc}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {section.items.map(item => (
                    <AccordionItem key={item.q} item={item} forceOpen={expandAll || !!q} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AccordionItem({ item, forceOpen }: { item: ManualItem; forceOpen: boolean }) {
  const [open, setOpen] = useState(false)
  const isOpen = forceOpen || open

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 min-h-[48px] text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-800 pr-4">{item.q}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3 anim-slide-down">
          {item.blocks.map((block, i) => <BlockView key={i} block={block} />)}
        </div>
      )}
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'p':
      return <p className="text-sm text-gray-600 leading-relaxed">{block.text}</p>
    case 'steps':
      return (
        <ol className="space-y-2">
          {block.items.map((step, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 mt-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-gray-600 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      )
    case 'list':
      return (
        <ul className="space-y-1.5">
          {block.items.map((li, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-400 shrink-0" aria-hidden />
              <span className="text-sm text-gray-600 leading-relaxed">{li}</span>
            </li>
          ))}
        </ul>
      )
    case 'note':
      return (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">{block.text}</p>
        </div>
      )
  }
}
