'use server'

import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCalendarEvent(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const supabase = createServiceClient()

  await supabase.from('calendar_events').insert({
    organization_key: session.organizationKey,
    title:            formData.get('title') as string,
    event_date:       formData.get('event_date') as string,
    location:         (formData.get('location') as string) || null,
    note:             (formData.get('note') as string) || null,
    scope:            formData.get('scope') as 'all' | 'department',
    department_id:    formData.get('department_id') ? Number(formData.get('department_id')) : null,
    source_schedule_id: null,
    created_by:       String(session.userKey),
  })

  revalidatePath('/schedule/calendar')
  revalidatePath('/schedule/department')
  return { success: true }
}

export async function deleteCalendarEvent(id: number) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const supabase = createServiceClient()

  await supabase.from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('organization_key', session.organizationKey)

  revalidatePath('/schedule/calendar')
  revalidatePath('/schedule/department')
  return { success: true }
}

export async function confirmScheduleEvent(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const eventId = Number(formData.get('event_id'))
  const dateId  = Number(formData.get('date_id'))
  const location = (formData.get('location') as string) || null
  const note     = (formData.get('note') as string) || null

  const supabase = createServiceClient()

  const [{ data: event }, { data: date }] = await Promise.all([
    supabase.from('schedule_events').select('*')
      .eq('event_id', eventId)
      .eq('organization_key', session.organizationKey)
      .single(),
    supabase.from('schedule_dates').select('*')
      .eq('date_id', dateId)
      .eq('event_id', eventId)
      .single(),
  ])

  if (!event || !date) return { error: 'イベントが見つかりません。' }

  await supabase.from('calendar_events').insert({
    organization_key:   session.organizationKey,
    title:              event.title,
    event_date:         (date.candidate_dt as string).split('T')[0],
    location,
    note,
    scope:              event.scope === 'all_departments' ? 'all' : 'department',
    department_id:      event.target_department_id ?? null,
    source_schedule_id: eventId,
    created_by:         String(session.userKey),
  })

  revalidatePath('/schedule/calendar')
  revalidatePath('/schedule/department')
  return { success: true }
}
