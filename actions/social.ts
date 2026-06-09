'use server'

import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

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
    .maybeSingle()

  if (existing) {
    await supabase.from('post_reactions').delete().eq('id', existing.id)
  } else {
    await supabase.from('post_reactions').insert({
      post_id: postId,
      user_key: session.userKey,
      user_name: session.userName,
      organization_key: session.organizationKey,
      emoji,
    })
  }
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
    .select('writing_id')
    .eq('writing_id', postId)
    .eq('organization_key', session.organizationKey)
    .single()
  if (!post) return

  await supabase.from('post_replies').insert({
    post_id: postId,
    user_key: session.userKey,
    user_name_stamp: session.userName,
    organization_key: session.organizationKey,
    message,
  })
}
