import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ScheduleList from './ScheduleList'

export default async function SchedulePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()

  const [{ data: events }, { data: departments }] = await Promise.all([
    supabase.from('schedule_events')
      .select('*')
      .eq('organization_key', session.organizationKey)
      .order('created_at', { ascending: false }),
    supabase.from('department_data')
      .select('department_id, department_name, organization_key')
      .eq('organization_key', session.organizationKey)
      .order('department_name'),
  ])

  return (
    <div className="anim-fade-in max-w-3xl">
      <ScheduleList events={events ?? []} departments={departments ?? []} />
    </div>
  )
}
