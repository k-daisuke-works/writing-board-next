import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Users } from 'lucide-react'
import ScheduleGrid from './ScheduleGrid'
import ConfirmScheduleButton from './ConfirmScheduleButton'

type Row = { id: number; name: string; type: 'department' | 'user' }

export default async function ScheduleEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const eventId = Number(id)
  const supabase = await createServiceClient()

  const { data: event } = await supabase
    .from('schedule_events')
    .select('*')
    .eq('event_id', eventId)
    .eq('organization_key', session.organizationKey)
    .single()

  if (!event) redirect('/schedule')

  const [{ data: dates }, { data: responses }] = await Promise.all([
    supabase.from('schedule_dates').select('*').eq('event_id', eventId).order('sort_order'),
    supabase.from('schedule_responses').select('*').eq('event_id', eventId),
  ])

  let rows: Row[] = []
  if (event.scope === 'all_departments') {
    const { data: depts } = await supabase
      .from('department_data')
      .select('department_id, department_name')
      .eq('organization_key', session.organizationKey)
      .order('department_name')
    rows = (depts ?? []).map(d => ({ id: d.department_id, name: d.department_name, type: 'department' as const }))
  } else if (event.target_department_id) {
    const { data: members } = await supabase
      .from('user_info')
      .select('user_key, user_name')
      .eq('department_id', event.target_department_id)
      .eq('organization_key', session.organizationKey)
      .order('user_name')
    rows = (members ?? []).map(m => ({ id: m.user_key, name: m.user_name, type: 'user' as const }))
  }

  return (
    <div className="anim-fade-in">
      <div className="mb-6">
        <Link href="/schedule" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-3 w-fit">
          <ArrowLeft className="w-4 h-4" />
          日程調整に戻る
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold text-gray-900">{event.title}</h1>
          {event.status === 'open'
            ? <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">調整中</span>
            : <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">終了</span>
          }
        </div>
        {event.description && (
          <p className="text-sm text-gray-500 mt-1">{event.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
          {event.scope === 'all_departments'
            ? <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />全部署</span>
            : <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.target_department_name}</span>
          }
          <span>{event.created_by_name} が作成</span>
        </div>
      </div>

      <ScheduleGrid
        event={event}
        dates={dates ?? []}
        responses={responses ?? []}
        rows={rows}
        session={session}
      />

      {(session.userKey === event.created_by || session.adminFlag) && event.status === 'open' && (
        <ConfirmScheduleButton eventId={eventId} dates={dates ?? []} />
      )}
    </div>
  )
}
