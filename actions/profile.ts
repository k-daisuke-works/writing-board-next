'use server'

import { getSession } from '@/lib/session'
import { createOrgClient, createServiceClient } from '@/lib/supabase/server'
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
  const isSelf = targetUserKey === session.userKey
  // 本人＝全項目編集可。管理者が他人を編集する場合は事務項目（会員番号）のみ許可し、
  // 自己表現（アイコン・所属・自己紹介）は本人だけが変えられる。
  if (!isSelf && !session.adminFlag) {
    return { error: '権限がありません。' }
  }

  const supabase = await createOrgClient(session.organizationKey)
  // tenant-ok: Storage（avatars バケット）操作用。storage スキーマにRLS未設定のため service role
  const storage = createServiceClient()

  // 対象ユーザーが自組織に所属していることを確認（user_key は組織横断のグローバル連番のため必須）
  const { data: targetUser } = await supabase
    .from('user_info')
    .select('user_key')
    .eq('user_key', targetUserKey)
    .eq('organization_key', session.organizationKey)
    .single()
  if (!targetUser) return { error: '対象ユーザーが見つかりません。' }

  let avatarUrl: string | undefined
  const socialWorkerMemberId = ((formData.get('social_worker_member_id') as string) ?? '')
    .normalize('NFKC')
    .trim()
  if (socialWorkerMemberId.length > 50) return { error: '社会福祉士会IDは50文字以内で入力してください。' }
  if (socialWorkerMemberId && !/^[a-zA-Z0-9_-]+$/.test(socialWorkerMemberId)) {
    return { error: '社会福祉士会IDは英数字・ハイフン・アンダースコアで入力してください。' }
  }

  // 管理者が他人を編集するとき: 会員番号だけ更新して即返す（自己表現項目は触らない）
  if (!isSelf) {
    const { error: idError } = await supabase.from('user_info')
      .update({ social_worker_member_id: socialWorkerMemberId || null })
      .eq('user_key', targetUserKey)
      .eq('organization_key', session.organizationKey)
    if (idError) return { error: '会員番号の保存に失敗しました。' }
    revalidatePath(`/member/${targetUserKey}`)
    revalidatePath('/expenses')
    return { success: true }
  }

  const avatarFile = formData.get('avatar') as File | null
  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > MAX_AVATAR_SIZE_BYTES) return { error: '画像は5MB以下にしてください。' }
    const rawExt = avatarFile.name.split('.').pop()?.toLowerCase() ?? ''
    const ext = AVATAR_EXT[rawExt]
    if (!ext) return { error: '画像はJPEG/PNG/GIF/WebP/HEIC形式で指定してください。' }

    // 組織プレフィックス付きパスでクロステナントのファイル上書きを防止
    const path = `${session.organizationKey}/${targetUserKey}.${ext}`
    const bytes = await avatarFile.arrayBuffer()

    const { error } = await storage.storage
      .from('avatars')
      .upload(path, bytes, { contentType: avatarFile.type, upsert: true })

    if (!error) {
      const { data } = storage.storage.from('avatars').getPublicUrl(path)
      avatarUrl = data.publicUrl
    }
  }

  const updates: Record<string, string | null> = {
    affiliation: (formData.get('affiliation') as string) || null,
    profile:     (formData.get('profile') as string) || null,
    social_worker_member_id: socialWorkerMemberId || null,
  }
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl

  const { error: updateError } = await supabase.from('user_info')
    .update(updates)
    .eq('user_key', targetUserKey)
    .eq('organization_key', session.organizationKey)

  if (updateError) return { error: 'プロフィールの保存に失敗しました。' }

  revalidatePath(`/member/${targetUserKey}`)
  revalidatePath('/members')
  revalidatePath('/expenses')
  return { success: true }
}
