'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarCheck, X } from 'lucide-react'
import { confirmScheduleEvent } from '@/actions/calendar'
import type { ScheduleDate } from '@/types/database'

type Props = {
  eventId: number
  dates: ScheduleDate[]
}

function fmtDt(dt: string) {
  return new Date(dt).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ConfirmScheduleButton({ eventId, dates }: Props) {
  const router = useRouter()
  const [open, setOpen]               = useState(false)
  const [dateId, setDateId]           = useState<number | ''>('')
  const [location, setLocation]       = useState('')
  const [note, setNote]               = useState('')
  const [isPending, startTransition]  = useTransition()
  const [done, setDone]               = useState(false)

  if (done) {
    return (
      <div className="text-xs text-green-600 flex items-center gap-1 mt-4">
        <CalendarCheck className="w-3.5 h-3.5" />
        スケジュールに追加しました
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dateId) return
    const fd = new FormData()
    fd.set('event_id', String(eventId))
    fd.set('date_id', String(dateId))
    fd.set('location', location)
    fd.set('note', note)
    startTransition(async () => {
      await confirmScheduleEvent(fd)
      router.refresh()
      setOpen(false)
      setDone(true)
    })
  }

  return (
    <div className="mt-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded transition-colors"
        >
          <CalendarCheck className="w-4 h-4" />
          日程を確定してスケジュールに追加
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3 max-w-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">スケジュールに追加</p>
            <button type="button" onClick={() => setOpen(false)} className="p-1 rounded hover:bg-blue-100">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          <select
            value={dateId}
            onChange={e => setDateId(Number(e.target.value))}
            required
            className="w-full text-sm border border-gray-300 rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">日程を選択...</option>
            {dates.map(d => (
              <option key={d.date_id} value={d.date_id}>
                {fmtDt(d.candidate_dt)}
              </option>
            ))}
          </select>

          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="場所（例：ユニゾンプラザ 大研修室）"
            className="w-full text-sm border border-gray-300 rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="メモ（任意）"
            className="w-full text-sm border border-gray-300 rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!dateId || isPending}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded disabled:opacity-40 transition-colors"
            >
              {isPending ? '追加中...' : '追加'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
