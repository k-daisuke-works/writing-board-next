'use server'

import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserRole } from '@/types/database'

function isAdminOrLeader(role?: UserRole) {
  return role === 'admin' || role === 'leader'
}

export async function createCalendarEvent(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }
  if (!isAdminOrLeader(session.role)) return { error: 'カレンダーの編集は管理者・リーダーのみ可能です。' }

  const title     = (formData.get('title') as string)?.trim()
  const eventDate = (formData.get('event_date') as string)?.trim()
  const scope     = formData.get('scope') === 'department' ? 'department' : 'all'
  const rawDeptId = formData.get('department_id') ? Number(formData.get('department_id')) : null

  if (!title) return { error: 'イベント名を入力してください。' }
  if (title.length > 100) return { error: 'イベント名は100文字以内で入力してください。' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate ?? '')) return { error: '日付の形式が正しくありません。' }

  // リーダーは自部署のイベントのみ作成可（全社スコープは管理者のみ）
  let departmentId = rawDeptId
  if (session.role === 'leader') {
    if (scope === 'all') return { error: '全体イベントの作成は管理者のみ可能です。' }
    departmentId = session.departmentId
  }

  const supabase = createServiceClient()

  const { error } = await supabase.from('calendar_events').insert({
    organization_key: session.organizationKey,
    title,
    event_date:       eventDate,
    location:         (formData.get('location') as string)?.trim() || null,
    note:             (formData.get('note') as string)?.trim() || null,
    scope,
    department_id:    scope === 'department' ? departmentId : null,
    source_schedule_id: null,
    created_by:       String(session.userKey),
  })
  if (error) return { error: '作成に失敗しました。' }

  revalidatePath('/schedule/calendar')
  revalidatePath('/schedule/department')
  return { success: true }
}

export async function deleteCalendarEvent(id: number) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }
  if (!Number.isInteger(id) || id <= 0) return { error: '不正なリクエストです。' }

  const supabase = createServiceClient()

  const { data: event } = await supabase.from('calendar_events')
    .select('created_by, department_id')
    .eq('id', id)
    .eq('organization_key', session.organizationKey)
    .single()
  if (!event) return { error: 'イベントが見つかりません。' }

  // 削除権限: 管理者 / 作成者本人 / リーダー（自部署イベント）
  const canDelete =
    session.role === 'admin' ||
    event.created_by === String(session.userKey) ||
    (session.role === 'leader' && event.department_id === session.departmentId)
  if (!canDelete) return { error: '削除権限がありません。' }

  const { error } = await supabase.from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('organization_key', session.organizationKey)
  if (error) return { error: '削除に失敗しました。' }

  revalidatePath('/schedule/calendar')
  revalidatePath('/schedule/department')
  return { success: true }
}

export async function confirmScheduleEvent(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }
  if (!isAdminOrLeader(session.role)) return { error: '日程の確定は管理者・リーダーのみ可能です。' }

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

  // リーダーは自部署スケジュールのみ確定可（全社は管理者のみ）。
  // createCalendarEvent と同じスコープ制限を確定経路でも徹底する
  if (session.role === 'leader') {
    if (event.scope === 'all_departments') return { error: '全体スケジュールの確定は管理者のみ可能です。' }
    if (event.target_department_id !== session.departmentId) return { error: '自部署のスケジュールのみ確定できます。' }
  }

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
