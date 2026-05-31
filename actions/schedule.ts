'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function createScheduleEvent(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const scope = formData.get('scope') as 'all_departments' | 'department'
  const targetDeptId = scope === 'department' ? Number(formData.get('targetDeptId')) : null
  const targetDeptName = scope === 'department' ? (formData.get('targetDeptName') as string) || null : null
  const dates = formData.getAll('dates') as string[]

  if (!title) return { error: 'タイトルを入力してください。' }
  if (scope === 'department' && !targetDeptId) return { error: '対象部署を選択してください。' }
  const validDates = dates.filter(d => d.trim())
  if (!validDates.length) return { error: '候補日時を1つ以上入力してください。' }

  const supabase = await createServiceClient()

  const { data: event, error: eventError } = await supabase
    .from('schedule_events')
    .insert({
      organization_key: session.organizationKey,
      created_by: session.userKey,
      created_by_name: session.userName,
      title,
      description,
      scope,
      target_department_id: targetDeptId,
      target_department_name: targetDeptName,
    })
    .select('event_id')
    .single()

  if (eventError || !event) return { error: 'イベントの作成に失敗しました。' }

  const dateRows = validDates.map((d, i) => ({
    event_id: event.event_id,
    candidate_dt: d,
    sort_order: i,
  }))

  const { error: dateError } = await supabase.from('schedule_dates').insert(dateRows)
  if (dateError) return { error: '候補日時の登録に失敗しました。' }

  revalidatePath('/schedule')
  return { success: true, eventId: event.event_id }
}

export async function upsertScheduleResponse(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const eventId        = Number(formData.get('eventId'))
  const dateId         = Number(formData.get('dateId'))
  const answer         = formData.get('answer') as string
  const respondentType = formData.get('respondentType') as 'department' | 'user'
  const respondentId   = Number(formData.get('respondentId'))
  const respondentName = formData.get('respondentName') as string

  if (!['ok', 'maybe', 'ng'].includes(answer)) return { error: '不正な回答です。' }
  if (respondentType === 'user'       && respondentId !== session.userKey)     return { error: '他のユーザーの回答は変更できません。' }
  if (respondentType === 'department' && respondentId !== session.departmentId) return { error: '他の部署の回答は変更できません。' }

  const supabase = await createServiceClient()

  const { data: event } = await supabase
    .from('schedule_events')
    .select('event_id')
    .eq('event_id', eventId)
    .eq('organization_key', session.organizationKey)
    .single()

  if (!event) return { error: 'イベントが見つかりません。' }

  const { error } = await supabase.from('schedule_responses').upsert(
    {
      event_id:        eventId,
      date_id:         dateId,
      respondent_type: respondentType,
      respondent_id:   respondentId,
      respondent_name: respondentName,
      answer,
      answered_by:  session.userKey,
      answered_at:  new Date().toISOString(),
    },
    { onConflict: 'date_id,respondent_type,respondent_id' }
  )

  if (error) return { error: '回答の保存に失敗しました。' }

  return { success: true }
}

export async function closeScheduleEvent(eventId: number) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const supabase = await createServiceClient()

  const { data: event } = await supabase
    .from('schedule_events')
    .select('created_by')
    .eq('event_id', eventId)
    .eq('organization_key', session.organizationKey)
    .single()

  if (!event) return { error: 'イベントが見つかりません。' }
  if (event.created_by !== session.userKey && !session.adminFlag) return { error: '権限がありません。' }

  const { error } = await supabase
    .from('schedule_events')
    .update({ status: 'closed' })
    .eq('event_id', eventId)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '更新に失敗しました。' }

  revalidatePath('/schedule')
  revalidatePath('/schedule/calendar')
  revalidatePath('/schedule/department')
  revalidatePath(`/schedule/${eventId}`)
  return { success: true }
}
