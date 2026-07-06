'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import type { CalendarEvent } from '@/types/database'
import type { UserSession } from '@/types/database'
import { createCalendarEvent, deleteCalendarEvent } from '@/actions/calendar'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

type Props = {
  events: CalendarEvent[]
  session: UserSession
  mode: 'all' | 'department'
}

export default function CalendarView({ events, session, mode }: Props) {
  const router = useRouter()
  const canEdit = session.role === 'admin' || session.role === 'leader'
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [showModal, setShowModal]     = useState(false)
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [title, setTitle]       = useState('')
  const [location, setLocation] = useState('')
  const [note, setNote]         = useState('')
  const [, startTransition] = useTransition()

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const firstDow   = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthStr = String(month).padStart(2, '0')
  const monthEvents = events.filter(e => e.event_date.startsWith(`${year}-${monthStr}`))

  function eventsForDay(day: number) {
    const ds = `${year}-${monthStr}-${String(day).padStart(2, '0')}`
    return monthEvents.filter(e => e.event_date === ds)
  }

  function isToday(day: number) {
    return day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear()
  }

  function openAdd(day: number) {
    setSelectedDay(day)
    setTitle('')
    setLocation('')
    setNote('')
    setShowModal(true)
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const fd = new FormData()
    fd.set('title', title)
    fd.set('event_date', `${year}-${monthStr}-${String(selectedDay).padStart(2, '0')}`)
    fd.set('location', location)
    fd.set('note', note)
    fd.set('scope', mode === 'department' ? 'department' : 'all')
    if (mode === 'department') fd.set('department_id', String(session.departmentId))
    startTransition(async () => {
      await createCalendarEvent(fd)
      router.refresh()
      setShowModal(false)
    })
  }

  function handleDelete(id: number) {
    if (!confirm('このイベントを削除しますか？')) return
    startTransition(async () => {
      await deleteCalendarEvent(id)
      router.refresh()
    })
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-base font-semibold text-gray-800 w-28 text-center">
            {year}年{month}月
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        {canEdit && (
          <button
            onClick={() => openAdd(now.getDate())}
            className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            追加
          </button>
        )}
      </div>

      {/* カレンダーグリッド */}
      <div className="overflow-x-auto scrollbar-none">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden min-w-[350px]">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`text-center text-xs font-medium py-2 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
            }`}>
              {w}
            </div>
          ))}
        </div>

        {/* 日セル */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const col = i % 7
            const dayEvs = day ? eventsForDay(day) : []
            return (
              <div
                key={i}
                onClick={() => canEdit && day && openAdd(day)}
                className={`min-h-[70px] sm:min-h-[90px] border-r border-b border-gray-100 p-1 ${
                  col === 6 ? 'border-r-0' : ''
                } ${day && canEdit ? 'cursor-pointer hover:bg-gray-50' : day ? '' : 'bg-gray-50/40'} transition-colors`}
              >
                {day && (
                  <>
                    <span className={`text-xs font-medium inline-flex w-5 h-5 items-center justify-center rounded-full ${
                      isToday(day)  ? 'bg-blue-600 text-white' :
                      col === 0     ? 'text-red-400' :
                      col === 6     ? 'text-blue-400' :
                      'text-gray-600'
                    }`}>
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayEvs.slice(0, 3).map(ev => (
                        <div
                          key={ev.id}
                          onClick={e => e.stopPropagation()}
                          className="text-xs px-1 py-0.5 rounded flex items-center gap-1 group bg-blue-100 text-blue-700"
                          title={ev.location ? `${ev.title} @ ${ev.location}` : ev.title}
                        >
                          <span className="truncate flex-1 leading-tight">{ev.title}</span>
                          {canEdit && (
                            <button
                              onClick={() => handleDelete(ev.id)}
                              className="opacity-0 group-hover:opacity-100 shrink-0 hover:text-red-500 transition-all"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {dayEvs.length > 3 && (
                        <div className="text-xs text-gray-400 px-1">+{dayEvs.length - 3}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
      </div>

      {/* 追加モーダル */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">
                イベントを追加 — {year}/{monthStr}/{String(selectedDay).padStart(2, '0')}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="イベント名 *"
                required
                autoFocus
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="場所（例：ユニゾンプラザ 大研修室）"
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="メモ（任意）"
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 rounded disabled:opacity-40 transition-colors"
                >
                  追加
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
