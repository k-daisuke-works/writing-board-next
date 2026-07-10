'use client'

import { useState } from 'react'
import {
  MessageSquare, ClipboardList, Calendar as CalendarIcon,
  Send, Plus, X, CheckCircle2,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// スマホフレーム
// ─────────────────────────────────────────────────────────────
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[320px]">
      <div className="rounded-[2.4rem] border-[10px] border-gray-900 bg-gray-900 shadow-2xl shadow-blue-900/40 overflow-hidden">
        <div className="bg-gray-50 h-[500px] flex flex-col">
          {/* ステータスバー */}
          <div className="shrink-0 bg-white flex items-center justify-between px-5 pt-2 pb-1.5">
            <span className="text-[10px] font-semibold text-gray-700">9:41</span>
            <div className="w-20 h-4.5 bg-gray-900 rounded-full" aria-hidden />
            <div className="flex items-end gap-0.5" aria-hidden>
              {[3, 5, 7, 9].map(h => (
                <span key={h} className="w-1 rounded-sm bg-gray-700" style={{ height: h }} />
              ))}
            </div>
          </div>
          {/* アプリヘッダー */}
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-100">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 border border-white rounded-sm" />
            </div>
            <span className="text-[11px] font-semibold text-gray-800">RoScope</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

function Avatar({ name, mine }: { name: string; mine?: boolean }) {
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
      mine ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
    }`}>
      {name[0]}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// デモ1: 掲示板（リアクション・投稿が実際に動く）
// ─────────────────────────────────────────────────────────────
type Reaction = { emoji: string; count: number; mine: boolean }
type DemoPost = {
  id: number
  name: string
  dept: string
  msg: string
  time: string
  mine?: boolean
  isNew?: boolean
  reactions: Reaction[]
}

function BoardDemo() {
  const [posts, setPosts] = useState<DemoPost[]>([
    {
      id: 1, name: '田中 花子', dept: '研修班',
      msg: '6月の定例研修、会場はユニゾンプラザ大会議室に決定しました！',
      time: '2時間前',
      reactions: [
        { emoji: '👍', count: 4, mine: false },
        { emoji: '🎉', count: 2, mine: false },
      ],
    },
    {
      id: 2, name: '佐藤 美咲', dept: '広報班',
      msg: '会報の原稿締切は 6/30 です。テンプレートを添付します📎',
      time: '5時間前',
      reactions: [
        { emoji: '👍', count: 3, mine: false },
        { emoji: '❤️', count: 1, mine: false },
      ],
    },
  ])
  const [draft, setDraft] = useState('')
  const [popKey, setPopKey] = useState<string | null>(null)

  const toggleReaction = (postId: number, emoji: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      return {
        ...p,
        reactions: p.reactions.map(r =>
          r.emoji === emoji
            ? { ...r, mine: !r.mine, count: r.count + (r.mine ? -1 : 1) }
            : r,
        ),
      }
    }))
    setPopKey(`${postId}-${emoji}-${Date.now()}`)
  }

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    setPosts(prev => [
      {
        id: Date.now(), name: 'あなた', dept: '研修班', msg: text,
        time: 'たった今', mine: true, isNew: true,
        reactions: [{ emoji: '👍', count: 0, mine: false }],
      },
      ...prev,
    ])
    setDraft('')
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {posts.map(post => (
          <div key={post.id} className={`bg-white rounded-xl border p-3 anim-slide-down ${post.mine ? 'border-blue-200' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Avatar name={post.name} mine={post.mine} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-800 truncate">{post.name}</span>
                  {post.isNew && <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">NEW</span>}
                </div>
                <span className="text-[9px] text-gray-400">{post.dept} · {post.time}</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-700 leading-relaxed mb-2">{post.msg}</p>
            <div className="flex gap-1.5 flex-wrap">
              {post.reactions.map(r => (
                <button
                  key={r.emoji}
                  onClick={() => toggleReaction(post.id, r.emoji)}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] transition-colors min-h-[44px] ${
                    r.mine
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 active:bg-gray-100'
                  }`}
                >
                  <span
                    key={popKey?.startsWith(`${post.id}-${r.emoji}`) ? popKey : r.emoji}
                    className="anim-pop inline-block"
                  >
                    {r.emoji}
                  </span>
                  <span className="font-semibold tabular-nums">{r.count}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* 投稿フォーム */}
      <div className="shrink-0 bg-white border-t border-gray-200 p-2.5 flex items-center gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          placeholder="メッセージを投稿してみる…"
          className="flex-1 min-w-0 bg-gray-100 rounded-full px-3.5 py-2.5 text-[11px] text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          aria-label="投稿する"
          className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// デモ2: 日程調整（自分の行をタップで ○→△→× が切り替わる）
// ─────────────────────────────────────────────────────────────
const ANSWERS = ['none', 'ok', 'maybe', 'ng'] as const
type Answer = typeof ANSWERS[number]

const ANSWER_DISP: Record<Answer, { label: string; cls: string }> = {
  none:  { label: '−', cls: 'bg-gray-50 text-gray-300 border-gray-200 border-dashed' },
  ok:    { label: '○', cls: 'bg-green-50 text-green-600 border-green-300' },
  maybe: { label: '△', cls: 'bg-yellow-50 text-amber-500 border-yellow-300' },
  ng:    { label: '×', cls: 'bg-red-50 text-red-500 border-red-300' },
}

function PollDemo() {
  const dates = ['6/10(水)', '6/11(木)', '6/12(金)']
  const others: { name: string; answers: Answer[] }[] = [
    { name: '山田 太郎', answers: ['ok', 'maybe', 'ok'] },
    { name: '佐藤 美咲', answers: ['ng', 'ok', 'ok'] },
    { name: '鈴木 一郎', answers: ['ok', 'ok', 'ng'] },
  ]
  const [mine, setMine] = useState<Answer[]>(['none', 'none', 'none'])

  const cycle = (i: number) => {
    setMine(prev => prev.map((a, ai) =>
      ai === i ? ANSWERS[(ANSWERS.indexOf(a) + 1) % ANSWERS.length] : a,
    ))
  }

  const tally = dates.map((_, i) =>
    others.filter(o => o.answers[i] === 'ok').length + (mine[i] === 'ok' ? 1 : 0),
  )
  const best = Math.max(...tally)

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <p className="text-[12px] font-semibold text-gray-800 mb-0.5">6月定例研修 日程調整</p>
      <p className="text-[10px] text-gray-400 mb-2.5">自分の行をタップして回答してください</p>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr>
              <th className="bg-gray-50 border-b border-r border-gray-200 px-2 py-2 text-left text-gray-500 font-semibold">名前</th>
              {dates.map(d => (
                <th key={d} className="bg-gray-50 border-b border-r last:border-r-0 border-gray-200 px-1 py-2 text-center text-gray-700 font-semibold whitespace-nowrap">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 自分の行（操作可能） */}
            <tr className="bg-blue-50/60">
              <td className="border-b border-r border-gray-100 px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <Avatar name="あ" mine />
                  <span className="font-semibold text-blue-700 whitespace-nowrap">あなた</span>
                </div>
              </td>
              {mine.map((a, i) => (
                <td key={i} className="border-b border-r last:border-r-0 border-gray-100 p-1 text-center">
                  <button
                    onClick={() => cycle(i)}
                    aria-label={`${dates[i]} の回答を切り替え`}
                    className={`inline-flex items-center justify-center w-full h-11 rounded-lg border text-[13px] font-bold transition-colors active:scale-95 ${ANSWER_DISP[a].cls}`}
                  >
                    <span key={`${i}-${a}`} className="anim-pop inline-block">{ANSWER_DISP[a].label}</span>
                  </button>
                </td>
              ))}
            </tr>
            {/* 他メンバー */}
            {others.map(row => (
              <tr key={row.name}>
                <td className="border-b border-r border-gray-100 px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <Avatar name={row.name} />
                    <span className="text-gray-700 whitespace-nowrap">{row.name}</span>
                  </div>
                </td>
                {row.answers.map((a, ai) => (
                  <td key={ai} className="border-b border-r last:border-r-0 border-gray-100 p-1 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-7 rounded-md border text-[11px] font-bold ${ANSWER_DISP[a].cls}`}>
                      {ANSWER_DISP[a].label}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
            {/* 集計行 */}
            <tr className="bg-gray-50">
              <td className="border-r border-gray-200 px-2 py-2 text-gray-500 font-semibold">○の数</td>
              {tally.map((t, i) => (
                <td key={i} className="border-r last:border-r-0 border-gray-200 py-2 text-center">
                  <span className={`inline-flex items-center gap-0.5 font-bold tabular-nums ${
                    t === best && t > 0 ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {t === best && t > 0 && <CheckCircle2 className="w-3 h-3" />}
                    {t}人
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {mine.every(a => a !== 'none') && (
        <div className="mt-2.5 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-[10px] text-green-700 anim-slide-down flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          回答ありがとうございます！実際のアプリでは自動で集計・共有されます
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// デモ3: カレンダー（日付をタップして予定を追加できる）
// ─────────────────────────────────────────────────────────────
function CalendarDemo() {
  const days = ['日', '月', '火', '水', '木', '金', '土']
  const cells: (number | null)[] = [
    null, 1, 2, 3, 4, 5, 6,
    7, 8, 9, 10, 11, 12, 13,
    14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27,
    28, 29, 30, null, null, null, null,
  ]
  const [events, setEvents] = useState<Record<number, string[]>>({
    5: ['理事会'], 12: ['定例研修'], 25: ['会報締切'],
  })
  const [selected, setSelected] = useState<number | null>(null)
  const [draft, setDraft] = useState('')

  const addEvent = () => {
    const text = draft.trim()
    if (!text || selected == null) return
    setEvents(prev => ({ ...prev, [selected]: [...(prev[selected] ?? []), text] }))
    setDraft('')
  }

  const removeEvent = (day: number, idx: number) => {
    setEvents(prev => {
      const next = (prev[day] ?? []).filter((_, i) => i !== idx)
      const copy = { ...prev }
      if (next.length === 0) delete copy[day]
      else copy[day] = next
      return copy
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-gray-800">2026年6月</span>
        <span className="text-[9px] text-gray-400">日付をタップして予定を追加</span>
      </div>
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {days.map((d, i) => (
            <div key={d} className={`text-center text-[9px] font-medium py-1 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
            }`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => (
            <button
              key={i}
              disabled={!day}
              onClick={() => day && setSelected(day)}
              className={`min-h-[44px] border-r border-b border-gray-100 p-0.5 text-left align-top transition-colors ${
                i % 7 === 6 ? 'border-r-0' : ''
              } ${!day ? 'bg-gray-50/40' : 'active:bg-blue-50'} ${selected === day ? 'bg-blue-50 ring-1 ring-inset ring-blue-300' : ''}`}
            >
              {day && (
                <>
                  <span className={`text-[9px] font-medium inline-flex w-4 h-4 items-center justify-center rounded-full ${
                    selected === day ? 'bg-blue-600 text-white'
                      : i % 7 === 0 ? 'text-red-400'
                      : i % 7 === 6 ? 'text-blue-400'
                      : 'text-gray-600'
                  }`}>{day}</span>
                  {events[day]?.slice(0, 2).map((ev, ei) => (
                    <span key={ei} className="block text-[7px] px-0.5 py-px mt-px rounded bg-blue-100 text-blue-700 truncate leading-tight anim-fade-in">
                      {ev}
                    </span>
                  ))}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 予定追加フォーム */}
      {selected != null && (
        <div className="mt-2.5 bg-white border border-blue-200 rounded-xl p-2.5 anim-slide-down">
          <p className="text-[10px] font-semibold text-gray-700 mb-1.5">6月{selected}日の予定</p>
          {(events[selected] ?? []).map((ev, i) => (
            <div key={i} className="flex items-center justify-between bg-blue-50 rounded-lg px-2.5 py-1.5 mb-1.5">
              <span className="text-[10px] text-blue-800 truncate">{ev}</span>
              <button
                onClick={() => removeEvent(selected, i)}
                aria-label={`${ev} を削除`}
                className="w-10 h-10 -my-2 -mr-2 flex items-center justify-center text-blue-400 active:text-blue-700 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addEvent() }}
              placeholder="予定名を入力…"
              className="flex-1 min-w-0 bg-gray-100 rounded-lg px-2.5 py-2 text-[11px] text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              onClick={addEvent}
              disabled={!draft.trim()}
              aria-label="予定を追加"
              className="h-11 px-3.5 rounded-lg bg-blue-600 text-white flex items-center gap-1 text-[10px] font-semibold shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
            >
              <Plus className="w-3.5 h-3.5" />追加
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// タブ切り替え本体
// ─────────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'board',
    label: '掲示板',
    Icon: MessageSquare,
    hint: 'リアクションをタップしたり、下の入力欄からメッセージを投稿してみてください。',
    points: ['絵文字リアクションで気軽に反応', '画像・動画・PDFも添付できる', '新着はリアルタイムで全員に反映'],
  },
  {
    id: 'poll',
    label: '日程調整',
    Icon: ClipboardList,
    hint: '「あなた」の行のマスをタップすると ○→△→× の順で回答が切り替わります。',
    points: ['候補日は期間指定で一括追加', '○の集計がひと目でわかる', '確定した日程はカレンダーに自動登録'],
  },
  {
    id: 'calendar',
    label: 'カレンダー',
    Icon: CalendarIcon,
    hint: '日付をタップして、実際に予定を追加してみてください。',
    points: ['会全体・班ごとの2種類のカレンダー', '場所やメモも記録できる', '会員全員がリアルタイムで確認'],
  },
] as const

type TabId = typeof TABS[number]['id']

export function InteractiveDemo() {
  const [tab, setTab] = useState<TabId>('board')
  const active = TABS.find(t => t.id === tab)!

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
      {/* 左: タブと説明 */}
      <div className="w-full lg:flex-1 order-2 lg:order-1">
        <div className="flex gap-2 justify-center lg:justify-start mb-5 overflow-x-auto scrollbar-none -mx-5 px-5 lg:mx-0 lg:px-0">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`font-maru flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap shrink-0 min-h-[44px] transition-all active:scale-95 ${
                tab === id
                  ? 'bg-[#ffc300] text-[#001e5a] shadow-[0_4px_0_#d9a600]'
                  : 'bg-white text-gray-500 border-2 border-gray-200 hover:border-[#ffc300] hover:text-[#8a6d00]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
        <div key={tab} className="anim-slide-down text-center lg:text-left">
          <p className="text-sm sm:text-base leading-relaxed mb-4 rounded-2xl px-5 py-3 inline-block bg-[#fff4d1] border border-[#f3d9ad] text-[#6b5410] font-medium">
            👆 {active.hint}
          </p>
          <ul className="space-y-2.5 text-sm text-gray-600 text-left inline-block">
            {active.points.map(p => (
              <li key={p} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#23aabe] shrink-0" />{p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 右: スマホフレーム */}
      <div className="w-full lg:flex-1 order-1 lg:order-2">
        <PhoneFrame>
          {tab === 'board' && <BoardDemo />}
          {tab === 'poll' && <PollDemo />}
          {tab === 'calendar' && <CalendarDemo />}
        </PhoneFrame>
      </div>
    </div>
  )
}
