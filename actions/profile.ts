'use server'

import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const targetUserKey = Number(formData.get('user_key'))
  if (targetUserKey !== session.userKey && !session.adminFlag) {
    throw new Error('Forbidden')
  }

  const supabase = await createServiceClient()

  let avatarUrl: string | undefined

  const avatarFile = formData.get('avatar') as File | null
  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split('.').pop() ?? 'jpg'
    const path = `${targetUserKey}.${ext}`
    const bytes = await avatarFile.arrayBuffer()

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, { contentType: avatarFile.type, upsert: true })

    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      avatarUrl = `${data.publicUrl}?t=${Date.now()}`
    }
  }

  const updates: Record<string, string | null> = {
    affiliation: (formData.get('affiliation') as string) || null,
    profile:     (formData.get('profile') as string) || null,
  }
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl

  await supabase.from('user_info')
    .update(updates)
    .eq('user_key', targetUserKey)
    .eq('organization_key', session.organizationKey)

  revalidatePath(`/member/${targetUserKey}`)
  revalidatePath('/members')
}
