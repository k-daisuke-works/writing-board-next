'use client'

import { useState } from 'react'
import type { CalendarEvent, ScheduleEvent, Department, UserSession } from '@/types/database'
import CalendarView from './calendar/CalendarView'
import ScheduleList from './ScheduleList'
import UnisonPlazaAvailability from './UnisonPlazaAvailability'

type Tab = 'calendar' | 'department' | 'schedule' | 'unison'

const TABS: { id: Tab; label: string }[] = [
  { id: 'calendar',   label: '全体スケジュール' },
  { id: 'department', label: '部署スケジュール' },
  { id: 'schedule',   label: '日程調整' },
  { id: 'unison',     label: 'ユニゾンプラザ' },
]

type Props = {
  allEvents: CalendarEvent[]
  deptEvents: CalendarEvent[]
  scheduleEvents: ScheduleEvent[]
  departments: Department[]
  session: UserSession
}

export default function ScheduleView({ allEvents, deptEvents, scheduleEvents, departments, session }: Props) {
  const [tab, setTab] = useState<Tab>('calendar')

  return (
    <div className="anim-fade-in">
      <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 mb-5 scrollbar-none">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'calendar' && (
        <div className="max-w-4xl">
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-gray-900">全体スケジュール</h1>
            <p className="text-sm text-gray-500 mt-0.5">全部署共通のイベント</p>
          </div>
          <CalendarView events={allEvents} session={session} mode="all" />
        </div>
      )}

      {tab === 'department' && (
        <div className="max-w-4xl">
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-gray-900">部署スケジュール</h1>
            <p className="text-sm text-gray-500 mt-0.5">{session.departmentName} のイベント</p>
          </div>
          <CalendarView events={deptEvents} session={session} mode="department" />
        </div>
      )}

      {tab === 'schedule' && (
        <div className="max-w-3xl">
          <ScheduleList events={scheduleEvents} departments={departments} />
        </div>
      )}

      {tab === 'unison' && (
        <div className="max-w-5xl">
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-gray-900">ユニゾンプラザ 空き状況</h1>
            <p className="text-sm text-gray-500 mt-0.5">研修室・会議室の予約状況</p>
          </div>
          <UnisonPlazaAvailability />
        </div>
      )}
    </div>
  )
}
