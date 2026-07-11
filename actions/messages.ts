'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { createOrgClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit'
import { sendPush } from '@/lib/push'
import { broadcastRefresh } from '@/lib/realtime'
import type { DmPair } from '@/types/database'

const MAX_DM_LENGTH = 2000

// DM は participant 限定 RLS（user_key クレーム必須）。組織トークンでは全拒否される
async function dmClient(organizationKey: number, userKey: number) {
  return createOrgClient(organizationKey, { userKey })
}

function pairKeys(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a]
}

/** DMリクエスト送信（相互承認制の起点）。拒否済みなら再申請として pending に戻す */
export async function requestDm(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const targetUserKey = Number(formData.get('targetUserKey'))
  if (!Number.isInteger(targetUserKey) || targetUserKey <= 0) return { error: '不正なリクエストです。' }
  if (targetUserKey === session.userKey) return { error: '自分自身にはリクエストできません。' }

  const supabase = await dmClient(session.organizationKey, session.userKey)

  const { data: target } = await supabase
    .from('user_info')
    .select('user_key, user_name, is_active')
    .eq('user_key', targetUserKey)
    .eq('organization_key', session.organizationKey)
    .single()
  if (!target || target.is_active === false) return { error: '相手が見つかりません。' }

  const [userA, userB] = pairKeys(session.userKey, targetUserKey)

  const { data: existing } = await supabase
    .from('dm_pairs')
    .select('pair_id, status, requested_by')
    .eq('organization_key', session.organizationKey)
    .eq('user_a', userA)
    .eq('user_b', userB)
    .maybeSingle()

  if (existing) {
    const pair = existing as Pick<DmPair, 'pair_id' | 'status' | 'requested_by'>
    if (pair.status === 'accepted') return { error: 'すでにメッセージをやり取りできます。' }
    if (pair.status === 'pending')  return { error: 'リクエストは承認待ちです。' }
    // blocked は相手に悟らせない（pending と同じ文言にしない・詳細も返さない）
    if (pair.status === 'blocked')  return { error: '現在この相手にはリクエストできません。' }
    // declined → 再申請（申請者が入れ替わる場合もあるため requested_by を更新）
    const { error } = await supabase
      .from('dm_pairs')
      .update({ status: 'pending', requested_by: session.userKey, responded_at: null })
      .eq('pair_id', pair.pair_id)
      .eq('organization_key', session.organizationKey)
    if (error) return { error: 'リクエストに失敗しました。' }
  } else {
    const { error } = await supabase.from('dm_pairs').insert({
      organization_key: session.organizationKey,
      user_a: userA,
      user_b: userB,
      requested_by: session.userKey,
    })
    if (error) {
      if (error.code === '23505') return { error: 'リクエストは承認待ちです。' }
      return { error: 'リクエストに失敗しました。' }
    }
  }

  revalidatePath('/messages')
  revalidatePath(`/member/${targetUserKey}`)
  after(() => sendPush(
    { organizationKey: session.organizationKey, userKeys: [targetUserKey] },
    { title: 'メッセージリクエスト', body: `${session.userName}さんからメッセージのリクエストが届きました`, url: '/messages', tag: `dm-request-${session.userKey}` }
  ))
  return { success: true }
}

/** リクエストへの応答（承認 / 見送り / ブロック）。応答できるのは受け取った側のみ */
export async function respondDm(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const pairId = Number(formData.get('pairId'))
  const action = formData.get('action') as string
  if (!Number.isInteger(pairId) || pairId <= 0) return { error: '不正なリクエストです。' }
  if (!['accept', 'decline', 'block'].includes(action)) return { error: '不正なリクエストです。' }

  const supabase = await dmClient(session.organizationKey, session.userKey)

  const { data: pair } = await supabase
    .from('dm_pairs')
    .select('pair_id, status, requested_by, user_a, user_b')
    .eq('pair_id', pairId)
    .eq('organization_key', session.organizationKey)
    .single()
  if (!pair) return { error: 'リクエストが見つかりません。' }
  if ((pair as DmPair).requested_by === session.userKey) return { error: '自分のリクエストには応答できません。' }
  if ((pair as DmPair).status !== 'pending') return { error: 'このリクエストはすでに応答済みです。' }

  const status = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'blocked'
  const { error } = await supabase
    .from('dm_pairs')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('pair_id', pairId)
    .eq('organization_key', session.organizationKey)
  if (error) return { error: '応答に失敗しました。' }

  revalidatePath('/messages')
  if (status === 'accepted') {
    const requester = (pair as DmPair).requested_by
    after(() => sendPush(
      { organizationKey: session.organizationKey, userKeys: [requester] },
      { title: 'リクエストが承認されました', body: `${session.userName}さんとメッセージをやり取りできます`, url: `/messages/${pairId}`, tag: `dm-accept-${pairId}` }
    ))
  }
  return { success: true }
}

/** メッセージ送信（承認済みペアのみ。RLS でも二重に強制される） */
export async function sendDm(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const pairId  = Number(formData.get('pairId'))
  const message = ((formData.get('message') as string) ?? '').trim()
  if (!Number.isInteger(pairId) || pairId <= 0) return { error: '不正なリクエストです。' }
  if (!message) return { error: 'メッセージを入力してください。' }
  if (message.length > MAX_DM_LENGTH) return { error: `メッセージは${MAX_DM_LENGTH}文字以内で入力してください。` }

  const supabase = await dmClient(session.organizationKey, session.userKey)

  const { data: pair } = await supabase
    .from('dm_pairs')
    .select('pair_id, status, user_a, user_b')
    .eq('pair_id', pairId)
    .eq('organization_key', session.organizationKey)
    .single()
  if (!pair || (pair as DmPair).status !== 'accepted') return { error: 'この相手にはまだ送信できません。' }

  const { error } = await supabase.from('dm_messages').insert({
    organization_key: session.organizationKey,
    pair_id: pairId,
    sender_key: session.userKey,
    message,
  })
  if (error) return { error: '送信に失敗しました。' }

  revalidatePath('/messages')
  revalidatePath(`/messages/${pairId}`)
  const other = (pair as DmPair).user_a === session.userKey ? (pair as DmPair).user_b : (pair as DmPair).user_a
  after(() => sendPush(
    { organizationKey: session.organizationKey, userKeys: [other] },
    { title: `${session.userName}さんからメッセージ`, body: message.slice(0, 60), url: `/messages/${pairId}`, tag: `dm-${pairId}` }
  ))
  after(() => broadcastRefresh(session.organizationKey))
  return { success: true }
}

/** スレッドを開いたとき、相手からの未読メッセージに既読を付ける */
export async function markDmRead(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const pairId = Number(formData.get('pairId'))
  if (!Number.isInteger(pairId) || pairId <= 0) return { error: '不正なリクエストです。' }

  const supabase = await dmClient(session.organizationKey, session.userKey)
  await supabase
    .from('dm_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('pair_id', pairId)
    .eq('organization_key', session.organizationKey)
    .neq('sender_key', session.userKey)
    .is('read_at', null)
  revalidatePath('/messages')
  return { success: true }
}

/**
 * 当事者によるスレッドの管理者開示（トラブル報告）。
 * 運営・管理者は原則DM本文を閲覧できず、この開示操作があって初めて
 * 該当スレッドのみ閲覧可能になる（通信当事者の同意に基づく開示）。
 * 開示は取り消し不可・監査ログ必須。報復リスク回避のため相手には通知しない。
 */
export async function discloseDmThread(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const pairId = Number(formData.get('pairId'))
  if (!Number.isInteger(pairId) || pairId <= 0) return { error: '不正なリクエストです。' }

  const supabase = await dmClient(session.organizationKey, session.userKey)

  const { data: pair } = await supabase
    .from('dm_pairs')
    .select('pair_id, disclosed_at')
    .eq('pair_id', pairId)
    .eq('organization_key', session.organizationKey)
    .single()
  if (!pair) return { error: 'スレッドが見つかりません。' }
  if ((pair as DmPair).disclosed_at) return { error: 'このスレッドはすでに報告済みです。' }

  const { error } = await supabase
    .from('dm_pairs')
    .update({ disclosed_at: new Date().toISOString(), disclosed_by: session.userKey })
    .eq('pair_id', pairId)
    .eq('organization_key', session.organizationKey)
  if (error) return { error: '報告に失敗しました。' }

  after(() => logAudit({
    organizationKey: session.organizationKey,
    actorUserKey: session.userKey,
    actorName: session.userName,
    action: 'dm.disclose',
    target: `dm_pair:${pairId}`,
    detail: { pairId },
  }))

  // 管理者へ通知（本文は含めない）
  const { data: admins } = await supabase
    .from('user_info')
    .select('user_key')
    .eq('organization_key', session.organizationKey)
    .eq('role', 'admin')
  const adminKeys = (admins ?? []).map(a => a.user_key).filter(k => k !== session.userKey)
  if (adminKeys.length > 0) {
    after(() => sendPush(
      { organizationKey: session.organizationKey, userKeys: adminKeys },
      { title: 'DMの報告が届きました', body: 'メンバーからメッセージスレッドの報告があります。管理画面から確認してください。', url: '/messages/reported', tag: `dm-disclose-${pairId}` }
    ))
  }

  revalidatePath('/messages')
  revalidatePath(`/messages/${pairId}`)
  revalidatePath('/messages/reported')
  return { success: true }
}
