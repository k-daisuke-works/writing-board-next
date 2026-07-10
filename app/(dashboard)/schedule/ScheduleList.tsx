'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Plus, Building2, Users, ChevronRight, Clock } from 'lucide-react'
import type { ScheduleEvent, Department } from '@/types/database'
import CreateEventModal from './CreateEventModal'
import { fmtShortDate } from '@/lib/utils'

type Props = {
  events: ScheduleEvent[]
  departments: Department[]
}

export default function ScheduleList({ events, departments }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">日程調整</h1>
          <p className="text-sm text-gray-500 mt-0.5">{events.length}件のイベント</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="pressable flex items-center gap-1.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-200 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />新しいイベント
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">まだ日程調整イベントがありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <Link
              key={event.event_id}
              href={`/schedule/${event.event_id}`}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg px-5 py-4 hover:border-blue-200 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 truncate">{event.title}</span>
                  {event.status === 'open'
                    ? <span className="shrink-0 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">調整中</span>
                    : <span className="shrink-0 text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">終了</span>
                  }
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                  {event.scope === 'all_departments'
                    ? <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />全部署</span>
                    : <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.target_department_name}</span>
                  }
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />{fmtShortDate(event.created_at)} · {event.created_by_name}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <CreateEventModal
          departments={departments}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
