'use server'

import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024
const AVATAR_EXT: Record<string, string> = {
  jpg: 'jpg', jpeg: 'jpg', png: 'png', gif: 'gif', webp: 'webp', heic: 'heic', heif: 'heif',
}

export async function updateProfile(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const targetUserKey = Number(formData.get('user_key'))
  if (!Number.isInteger(targetUserKey) || targetUserKey <= 0) return { error: '不正なリクエストです。' }
  if (targetUserKey !== session.userKey && !session.adminFlag) {
    return { error: '権限がありません。' }
  }

  const supabase = createServiceClient()

  // 対象ユーザーが自組織に所属していることを確認（user_key は組織横断のグローバル連番のため必須）
  const { data: targetUser } = await supabase
    .from('user_info')
    .select('user_key')
    .eq('user_key', targetUserKey)
    .eq('organization_key', session.organizationKey)
    .single()
  if (!targetUser) return { error: '対象ユーザーが見つかりません。' }

  let avatarUrl: string | undefined

  const avatarFile = formData.get('avatar') as File | null
  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > MAX_AVATAR_SIZE_BYTES) return { error: '画像は5MB以下にしてください。' }
    const rawExt = avatarFile.name.split('.').pop()?.toLowerCase() ?? ''
    const ext = AVATAR_EXT[rawExt]
    if (!ext) return { error: '画像はJPEG/PNG/GIF/WebP/HEIC形式で指定してください。' }

    // 組織プレフィックス付きパスでクロステナントのファイル上書きを防止
    const path = `${session.organizationKey}/${targetUserKey}.${ext}`
    const bytes = await avatarFile.arrayBuffer()

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, { contentType: avatarFile.type, upsert: true })

    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      avatarUrl = data.publicUrl
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
  return { success: true }
}
