'use client'

import { useState, useTransition } from 'react'
import { upsertScheduleResponse, closeScheduleEvent } from '@/actions/schedule'
import type { ScheduleEvent, ScheduleDate, ScheduleResponse, UserSession } from '@/types/database'

type Row = { id: number; name: string; type: 'department' | 'user' }
type Answer = 'ok' | 'maybe' | 'ng'

type Props = {
  event: ScheduleEvent
  dates: ScheduleDate[]
  responses: ScheduleResponse[]
  rows: Row[]
  session: UserSession
}

const CYCLE: Answer[] = ['ok', 'maybe', 'ng']

const DISPLAY: Record<Answer, { label: string; cellCls: string }> = {
  ok:    { label: '○', cellCls: 'bg-green-50  text-green-600 border-green-200' },
  maybe: { label: '△', cellCls: 'bg-yellow-50 text-amber-500 border-yellow-200' },
  ng:    { label: '×', cellCls: 'bg-red-50    text-red-500   border-red-200' },
}

function fmtDt(dt: string) {
  const d = new Date(dt)
  return {
    date: d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' }),
    time: d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
  }
}

export default function ScheduleGrid({ event, dates, responses, rows, session }: Props) {
  const [resMap, setResMap] = useState<Record<number, Record<number, Answer>>>(() => {
    const m: Record<number, Record<number, Answer>> = {}
    for (const r of responses) {
      if (!m[r.date_id]) m[r.date_id] = {}
      m[r.date_id][r.respondent_id] = r.answer
    }
    return m
  })
  const [, startTransition] = useTransition()
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState('')
  // 直近で回答したセル（key を変えて anim-pop を再発火させる）
  const [popped, setPopped] = useState<string | null>(null)

  const myType = event.scope === 'all_departments' ? 'department' : 'user'
  const myId   = event.scope === 'all_departments' ? session.departmentId : session.userKey
  const myName = event.scope === 'all_departments' ? session.departmentName : session.userName

  const canEdit = event.status === 'open' && rows.some(r => r.id === myId && r.type === myType) && myId > 0

  function handleCell(dateId: number, row: Row) {
    if (!canEdit || row.id !== myId || row.type !== myType) return

    const current = resMap[dateId]?.[row.id] ?? null
    const next = current === null ? 'ok' : CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]

    setPopped(`${dateId}-${Date.now()}`)
    setError('')
    setResMap(prev => ({
      ...prev,
      [dateId]: { ...prev[dateId], [row.id]: next },
    }))

    const fd = new FormData()
    fd.set('eventId',        String(event.event_id))
    fd.set('dateId',         String(dateId))
    fd.set('answer',         next)
    fd.set('respondentType', row.type)
    fd.set('respondentId',   String(row.id))
    fd.set('respondentName', row.name)

    startTransition(async () => {
      try {
        const r = await upsertScheduleResponse(fd)
        if (r?.error) throw new Error(r.error)
      } catch (e) {
        // 保存失敗: 楽観更新を元に戻してエラー表示
        setError(e instanceof Error ? e.message : '回答の保存に失敗しました。')
        setResMap(prev => {
          const dateRow = { ...prev[dateId] }
          if (current === null) delete dateRow[row.id]
          else dateRow[row.id] = current
          return { ...prev, [dateId]: dateRow }
        })
      }
    })
  }

  async function handleClose() {
    if (!confirm('このイベントを終了しますか？')) return
    setClosing(true)
    setError('')
    try {
      const r = await closeScheduleEvent(event.event_id)
      if (r?.error) setError(r.error)
    } catch {
      setError('イベントの終了に失敗しました。')
    } finally {
      setClosing(false)
    }
  }

  function summary(dateId: number) {
    const cells = Object.values(resMap[dateId] ?? {})
    return {
      ok:    cells.filter(a => a === 'ok').length,
      maybe: cells.filter(a => a === 'maybe').length,
      ng:    cells.filter(a => a === 'ng').length,
    }
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
        <p className="text-sm text-gray-400">回答するメンバーが見つかりません</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">
                  {event.scope === 'all_departments' ? '部署' : 'メンバー'}
                </th>
                {dates.map(d => {
                  const { date, time } = fmtDt(d.candidate_dt)
                  return (
                    <th key={d.date_id} className="border-b border-r last:border-r-0 border-gray-200 px-3 py-2.5 text-center min-w-[90px]">
                      <div className="text-xs font-semibold text-gray-700 whitespace-nowrap">{date}</div>
                      <div className="text-xs text-gray-400">{time}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const isMe = row.id === myId && row.type === myType
                const rowBg = ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                return (
                  <tr key={row.id}>
                    <td className={`sticky left-0 z-10 ${rowBg} border-b border-r border-gray-100 px-4 py-2.5 whitespace-nowrap`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {row.name.slice(0, 1)}
                        </div>
                        <span className={`text-xs font-medium ${isMe ? 'text-blue-700' : 'text-gray-700'}`}>{row.name}</span>
                        {isMe && <span className="text-xs text-blue-400">（自分）</span>}
                      </div>
                    </td>
                    {dates.map(d => {
                      const answer  = resMap[d.date_id]?.[row.id] ?? null
                      const disp    = answer ? DISPLAY[answer] : null
                      const editable = isMe && event.status === 'open'
                      return (
                        <td key={d.date_id} className={`${rowBg} border-b border-r last:border-r-0 border-gray-100 px-2 py-2 text-center`}>
                          <button
                            type="button"
                            onClick={() => handleCell(d.date_id, row)}
                            disabled={!editable}
                            title={editable ? 'クリックして変更' : undefined}
                            className={`w-11 h-10 rounded border text-sm font-bold transition-all ${
                              disp
                                ? `${disp.cellCls} ${editable ? 'hover:opacity-70 cursor-pointer active:scale-90' : 'cursor-default'}`
                                : editable
                                  ? 'border-dashed border-gray-300 text-gray-300 hover:border-blue-400 hover:text-blue-400 cursor-pointer active:scale-90'
                                  : 'border-dashed border-gray-200 text-gray-200 cursor-default'
                            }`}
                          >
                            <span
                              key={isMe && popped?.startsWith(`${d.date_id}-`) ? popped : `${d.date_id}-static`}
                              className={isMe ? 'anim-pop inline-block' : undefined}
                            >
                              {disp ? disp.label : '–'}
                            </span>
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">集計</td>
                {dates.map(d => {
                  const { ok, maybe, ng } = summary(d.date_id)
                  return (
                    <td key={d.date_id} className="border-r last:border-r-0 border-gray-200 px-2 py-2 text-center">
                      <div className="space-y-0.5 text-xs leading-tight">
                        <div className="text-green-600 font-semibold">○ {ok}</div>
                        <div className="text-amber-500 font-semibold">△ {maybe}</div>
                        <div className="text-red-500 font-semibold">× {ng}</div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {canEdit && (
        <p className="text-xs text-gray-400 text-center">自分の行をクリックして回答 · ○→△→×→○ の順で切り替わります</p>
      )}
      {!canEdit && event.status === 'open' && myId > 0 && (
        <p className="text-xs text-gray-400 text-center">このイベントの回答対象に含まれていません</p>
      )}
      {event.status === 'open' && !canEdit && myId <= 0 && (
        <p className="text-xs text-gray-400 text-center">部署が設定されていないため回答できません</p>
      )}

      {event.status === 'open' && (event.created_by === session.userKey || session.adminFlag) && (
        <div className="flex justify-end">
          <button
            onClick={handleClose}
            disabled={closing}
            className="text-sm text-gray-500 hover:text-red-600 border border-gray-300 hover:border-red-300 px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {closing ? '処理中…' : 'イベントを終了する'}
          </button>
        </div>
      )}
    </div>
  )
}
