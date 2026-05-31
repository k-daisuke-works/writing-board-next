import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarView from '../calendar/CalendarView'

export default async function DepartmentCalendarPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()

  const { data: events } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('organization_key', session.organizationKey)
    .eq('scope', 'department')
    .eq('department_id', session.departmentId)
    .order('event_date')

  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">部署スケジュール</h1>
        <p className="text-sm text-gray-500 mt-0.5">{session.departmentName} のイベント</p>
      </div>
      <CalendarView events={events ?? []} session={session} mode="department" />
    </div>
  )
}
