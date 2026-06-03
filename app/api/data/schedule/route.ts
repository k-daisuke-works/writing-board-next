import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const [
    { data: allCalendarEvents },
    { data: scheduleEvents },
    { data: departments },
  ] = await Promise.all([
    supabase.from('calendar_events').select('*').eq('organization_key', session.organizationKey).order('event_date'),
    supabase.from('schedule_events').select('*').eq('organization_key', session.organizationKey).order('created_at', { ascending: false }),
    supabase.from('department_data').select('department_id, department_name, organization_key')
      .eq('organization_key', session.organizationKey).order('department_name'),
  ])

  return NextResponse.json({
    allEvents:      (allCalendarEvents ?? []).filter(e => e.scope === 'all'),
    deptEvents:     (allCalendarEvents ?? []).filter(e => e.scope === 'department' && e.department_id === session.departmentId),
    scheduleEvents: scheduleEvents ?? [],
    departments:    departments ?? [],
    fetchedAt: Date.now(),
  })
}
