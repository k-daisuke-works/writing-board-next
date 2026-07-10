'use server'

import { after } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPush } from '@/lib/push'
import { broadcastRefresh } from '@/lib/realtime'
import { logAudit } from '@/lib/audit'

/**
 * 未読者だけにリマインドのプッシュ通知を送る（admin / leader 用）。
 * 送信結果を返すため sendPush は after() ではなく同期的に待つ。
 */
export async function remindUnread(
  formData: FormData,
): Promise<{ error: string } | { success: true; unread: number; sent: number }> {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }
  if (session.role !== 'admin' && session.role !== 'leader') return { error: '権限がありません。' }

  const postId = Number(formData.get('postId'))
  if (!Number.isInteger(postId) || postId <= 0) return { error: '不正なリクエストです。' }

  const supabase = createServiceClient()

  const { data: post } = await supabase
    .from('writing_data')
    .select('writing_id, user_key, department_id, post_type, message, is_important')
    .eq('writing_id', postId)
    .eq('organization_key', session.organizationKey)
    .single()
  if (!post) return { error: '投稿が見つかりません。' }

  // リーダーは自部署の投稿 or 自分の投稿のみ（編集・削除と同ロジック）
  const canRemind =
    session.role === 'admin' ||
    (session.role === 'leader' && (
      post.department_id === session.departmentId ||
      post.user_key === session.userKey
    ))
  if (!canRemind) return { error: '自分の班の投稿のみリマインドできます。' }

  // 対象者: board は組織全体、team / notice は投稿の部署（凍結中は除外）
  let audienceQuery = supabase
    .from('user_info')
    .select('user_key')
    .eq('organization_key', session.organizationKey)
    .eq('is_active', true)
  if (post.post_type !== 'board') audienceQuery = audienceQuery.eq('department_id', post.department_id)
  const [{ data: audience }, { data: reads }] = await Promise.all([
    audienceQuery,
    supabase
      .from('post_reads')
      .select('user_key')
      .eq('post_id', postId)
      .eq('organization_key', session.organizationKey),
  ])

  const readSet = new Set((reads ?? []).map(r => r.user_key))
  if (post.user_key != null) readSet.add(post.user_key) // 投稿者本人は対象外
  const unread = (audience ?? []).map(u => u.user_key).filter(k => !readSet.has(k))
  if (unread.length === 0) return { success: true, unread: 0, sent: 0 }

  const url = post.post_type === 'board' ? '/posts' : post.post_type === 'notice' ? '/notices' : '/home'
  const sent = await sendPush(
    { organizationKey: session.organizationKey, userKeys: unread },
    {
      title: post.is_important ? '【重要】未読のお知らせがあります' : '未読のお知らせがあります',
      body: `${session.userName}: ${post.message.slice(0, 80)}`,
      url,
      tag: `remind-${postId}`,
    },
  )

  after(() => logAudit({
    organizationKey: session.organizationKey,
    actorUserKey: session.userKey,
    actorName: session.userName,
    action: 'post.remind_unread',
    target: `post:${postId}`,
    detail: { unread: unread.length, sent },
  }))

  return { success: true, unread: unread.length, sent }
}

export async function markPostsRead(postIds: number[]) {
  const session = await getSession()
  if (!session || postIds.length === 0) return

  const supabase = createServiceClient()

  const { data: valid } = await supabase
    .from('writing_data')
    .select('writing_id')
    .in('writing_id', postIds)
    .eq('organization_key', session.organizationKey)

  const validIds = (valid ?? []).map(p => p.writing_id)
  if (validIds.length === 0) return

  await supabase.from('post_reads').upsert(
    validIds.map(id => ({
      post_id: id,
      user_key: session.userKey,
      user_name: session.userName,
      organization_key: session.organizationKey,
    })),
    { onConflict: 'post_id,user_key', ignoreDuplicates: true }
  )
}

export async function toggleReaction(postId: number, emoji: string) {
  const session = await getSession()
  if (!session) return

  const supabase = createServiceClient()

  const { data: post } = await supabase
    .from('writing_data')
    .select('writing_id')
    .eq('writing_id', postId)
    .eq('organization_key', session.organizationKey)
    .single()
  if (!post) return

  const { data: existing } = await supabase
    .from('post_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_key', session.userKey)
    .eq('emoji', emoji)
    .eq('organization_key', session.organizationKey)
    .maybeSingle()

  if (existing) {
    await supabase.from('post_reactions').delete().eq('id', existing.id)
      .eq('organization_key', session.organizationKey)
  } else {
    await supabase.from('post_reactions').insert({
      post_id: postId,
      user_key: session.userKey,
      user_name: session.userName,
      organization_key: session.organizationKey,
      emoji,
    })
  }

  after(() => broadcastRefresh(session.organizationKey))
}

export async function addReply(formData: FormData) {
  const session = await getSession()
  if (!session) return

  const postId  = Number(formData.get('postId'))
  const message = String(formData.get('message') ?? '').trim()
  if (!postId || !message) return

  const supabase = createServiceClient()

  const { data: post } = await supabase
    .from('writing_data')
    .select('writing_id, user_key, post_type')
    .eq('writing_id', postId)
    .eq('organization_key', session.organizationKey)
    .single()
  if (!post) return

  const { error } = await supabase.from('post_replies').insert({
    post_id: postId,
    user_key: session.userKey,
    user_name_stamp: session.userName,
    organization_key: session.organizationKey,
    message,
  })

  // 投稿者にコメント通知（自分の投稿への自コメントは除く）
  if (!error && post.user_key && post.user_key !== session.userKey) {
    const url = post.post_type === 'board' ? '/posts' : '/home'
    after(() => sendPush(
      { organizationKey: session.organizationKey, userKeys: [post.user_key] },
      {
        title: 'コメントが届きました',
        body: `${session.userName}: ${message.slice(0, 80)}`,
        url,
        tag: `reply-${postId}`,
      }
    ))
  }

  after(() => broadcastRefresh(session.organizationKey))
}
