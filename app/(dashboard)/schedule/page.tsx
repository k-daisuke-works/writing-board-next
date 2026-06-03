import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ScheduleView from './ScheduleView'

export default async function SchedulePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = createServiceClient()

  const [
    { data: allCalendarEvents },
    { data: scheduleEvents },
    { data: departments },
  ] = await Promise.all([
    supabase.from('calendar_events').select('*')
      .eq('organization_key', session.organizationKey)
      .order('event_date'),
    supabase.from('schedule_events').select('*')
      .eq('organization_key', session.organizationKey)
      .order('created_at', { ascending: false }),
    supabase.from('department_data').select('department_id, department_name, organization_key')
      .eq('organization_key', session.organizationKey)
      .order('department_name'),
  ])

  const allEvents  = (allCalendarEvents ?? []).filter(e => e.scope === 'all')
  const deptEvents = (allCalendarEvents ?? []).filter(
    e => e.scope === 'department' && e.department_id === session.departmentId
  )

  return (
    <ScheduleView
      allEvents={allEvents}
      deptEvents={deptEvents}
      scheduleEvents={scheduleEvents ?? []}
      departments={departments ?? []}
      session={session}
    />
  )
}
