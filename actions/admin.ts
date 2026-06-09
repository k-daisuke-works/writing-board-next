'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import type { UserRole } from '@/types/database'

// ─── ヘルパー ────────────────────────────────────────────
function isAdminOrLeader(role?: UserRole) {
  return role === 'admin' || role === 'leader'
}

/** ユーザー削除（自分自身は不可）
 *  - 管理者: 全ユーザー
 *  - リーダー: 自部署のユーザーのみ
 */
export async function deleteUser(formData: FormData) {
  const session = await getSession()
  if (!session || !isAdminOrLeader(session.role)) return { error: '権限がありません。' }

  const userKey = Number(formData.get('userKey'))
  if (userKey === session.userKey) return { error: '自分自身は削除できません。' }

  const supabase = await createServiceClient()

  if (session.role === 'leader') {
    const { data: target } = await supabase
      .from('user_info')
      .select('department_id')
      .eq('user_key', userKey)
      .eq('organization_key', session.organizationKey)
      .single()
    if (!target || target.department_id !== session.departmentId) {
      return { error: '自部署のユーザーのみ削除できます。' }
    }
  }

  const { error } = await supabase
    .from('user_info')
    .delete()
    .eq('user_key', userKey)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '削除に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

/** 部署削除（所属ユーザーがいる場合は不可）— 管理者のみ */
export async function deleteDepartment(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }

  const departmentId = Number(formData.get('departmentId'))
  const supabase = await createServiceClient()

  const { count } = await supabase
    .from('user_info')
    .select('*', { count: 'exact', head: true })
    .eq('department_id', departmentId)
    .eq('organization_key', session.organizationKey)

  if ((count ?? 0) > 0) return { error: 'この部署には所属ユーザーがいるため削除できません。' }

  const { error } = await supabase
    .from('department_data')
    .delete()
    .eq('department_id', departmentId)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '削除に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

/** 職種削除（所属ユーザーがいる場合は不可）— 管理者のみ */
export async function deleteJob(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }

  const jobId = Number(formData.get('jobId'))
  const supabase = await createServiceClient()

  const { count } = await supabase
    .from('user_info')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', jobId)
    .eq('organization_key', session.organizationKey)

  if ((count ?? 0) > 0) return { error: 'この職種には所属ユーザーがいるため削除できません。' }

  const { error } = await supabase
    .from('job_data')
    .delete()
    .eq('job_id', jobId)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '削除に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

/** 部署登録 — 管理者のみ（初回セットアップは例外） */
export async function createDepartment(formData: FormData) {
  const session = await getSession()
  const orgKeyFromForm = Number(formData.get('organizationKey') || 0)

  if (session && session.role !== 'admin') return { error: '管理者権限が必要です。' }
  if (!session && !orgKeyFromForm) return { error: '権限がありません。' }

  const organizationKey = session?.organizationKey ?? orgKeyFromForm
  const departmentName = formData.get('departmentName') as string

  if (!departmentName?.trim()) return { error: '部署名を入力してください。' }
  if (departmentName.trim().length > 100) return { error: '部署名は100文字以内で入力してください。' }

  const supabase = await createServiceClient()

  if (!session) {
    const { count } = await supabase
      .from('user_info')
      .select('*', { count: 'exact', head: true })
      .eq('organization_key', organizationKey)
    if ((count ?? 0) > 0) return { error: '権限がありません。' }
  }

  const { error } = await supabase.from('department_data').insert({
    department_name:  departmentName.trim(),
    organization_key: organizationKey,
  })

  if (error) {
    console.error('[createDepartment] error:', error)
    return { error: '登録に失敗しました。' }
  }

  revalidatePath('/admin')
  revalidatePath('/departmentjob/register')
  return { success: true }
}

/** 職種登録 — 管理者のみ（初回セットアップは例外） */
export async function createJob(formData: FormData) {
  const session = await getSession()
  const orgKeyFromForm = Number(formData.get('organizationKey') || 0)

  if (session && session.role !== 'admin') return { error: '管理者権限が必要です。' }
  if (!session && !orgKeyFromForm) return { error: '権限がありません。' }

  const organizationKey = session?.organizationKey ?? orgKeyFromForm
  const jobName = formData.get('jobName') as string

  if (!jobName?.trim()) return { error: '職種名を入力してください。' }
  if (jobName.trim().length > 100) return { error: '職種名は100文字以内で入力してください。' }

  const supabase = await createServiceClient()

  if (!session) {
    const { count } = await supabase
      .from('user_info')
      .select('*', { count: 'exact', head: true })
      .eq('organization_key', organizationKey)
    if ((count ?? 0) > 0) return { error: '権限がありません。' }
  }

  const { error } = await supabase.from('job_data').insert({
    job_name:         jobName.trim(),
    organization_key: organizationKey,
  })

  if (error) {
    console.error('[createJob] error:', error)
    return { error: '登録に失敗しました。' }
  }

  revalidatePath('/admin')
  revalidatePath('/departmentjob/register')
  return { success: true }
}

/** 部署名更新 — 管理者のみ */
export async function updateDepartment(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }

  const departmentId   = Number(formData.get('departmentId'))
  const departmentName = (formData.get('departmentName') as string)?.trim()
  if (!departmentName) return { error: '部署名を入力してください。' }

  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('department_data')
    .update({ department_name: departmentName })
    .eq('department_id', departmentId)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '更新に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

/** 職種名更新 — 管理者のみ */
export async function updateJob(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }

  const jobId   = Number(formData.get('jobId'))
  const jobName = (formData.get('jobName') as string)?.trim()
  if (!jobName) return { error: '職種名を入力してください。' }

  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('job_data')
    .update({ job_name: jobName })
    .eq('job_id', jobId)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '更新に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

/** ユーザー情報更新
 *  - 管理者: 全ユーザー・全ロール変更可
 *  - リーダー: 自部署のユーザーのみ、adminへの昇格不可
 */
export async function updateUser(formData: FormData) {
  const session = await getSession()
  if (!session || !isAdminOrLeader(session.role)) return { error: '権限がありません。' }

  const userKey      = Number(formData.get('userKey'))
  const userName     = (formData.get('userName') as string)?.trim()
  const departmentId = Number(formData.get('departmentId')) || null
  const jobId        = Number(formData.get('jobId'))        || null
  const newPassword  = (formData.get('password') as string)?.trim()
  const roleFromForm = formData.get('role') as string
  const newRole: UserRole = ['admin', 'leader', 'member'].includes(roleFromForm)
    ? roleFromForm as UserRole
    : 'member'

  if (!userName) return { error: 'ユーザー名を入力してください。' }

  const supabase = await createServiceClient()

  if (session.role === 'leader') {
    const { data: target } = await supabase
      .from('user_info')
      .select('department_id')
      .eq('user_key', userKey)
      .eq('organization_key', session.organizationKey)
      .single()
    if (!target || target.department_id !== session.departmentId) {
      return { error: '自部署のユーザーのみ操作できます。' }
    }
    if (newRole === 'admin') return { error: 'リーダー権限では管理者を設定できません。' }
  }

  const updates: Record<string, unknown> = {
    user_name:     userName,
    department_id: departmentId,
    job_id:        jobId,
    role:          newRole,
    admin_flag:    newRole === 'admin',
  }
  if (newPassword) updates.password = await bcrypt.hash(newPassword, 10)

  const { error } = await supabase
    .from('user_info')
    .update(updates)
    .eq('user_key', userKey)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '更新に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

/** ユーザー登録
 *  - 管理者: 任意の部署・任意のロール
 *  - リーダー: 自部署のみ・admin以外のロール
 *  - 初回セットアップ: セッションなし + organizationKey + isInitialSetup=true
 */
export async function registerUser(formData: FormData) {
  const session = await getSession()

  const orgKeyFromForm = Number(formData.get('organizationKey') || 0)
  const isInitialSetup = formData.get('isInitialSetup') === 'true'

  if (session && !isAdminOrLeader(session.role)) return { error: '権限がありません。' }
  if (!session && !(isInitialSetup && orgKeyFromForm)) return { error: '権限がありません。' }

  const organizationKey = session?.organizationKey ?? orgKeyFromForm

  const userId       = (formData.get('userId') as string)?.normalize('NFKC').trim()
  const userName     = (formData.get('userName') as string)?.trim()
  const departmentId = Number(formData.get('departmentId')) || null
  const jobId        = Number(formData.get('jobId')) || null
  const password     = formData.get('password') as string
  const roleFromForm = formData.get('role') as string
  const userRole: UserRole = isInitialSetup
    ? 'admin'
    : ['admin', 'leader', 'member'].includes(roleFromForm)
      ? roleFromForm as UserRole
      : 'member'

  if (!userId || !userName?.trim() || !password) {
    return { error: '必須項目を入力してください。' }
  }
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(userId)) {
    return { error: 'ユーザーIDは英数字・ハイフン・アンダースコアのみ、50文字以内で入力してください。' }
  }
  if (userName.trim().length > 50) return { error: 'ユーザー名は50文字以内で入力してください。' }
  if (password.length < 8) return { error: 'パスワードは8文字以上で入力してください。' }

  if (session?.role === 'leader') {
    if (userRole === 'admin') return { error: 'リーダー権限では管理者を作成できません。' }
    if (departmentId !== session.departmentId) {
      return { error: '自部署のユーザーのみ登録できます。' }
    }
  }

  const supabase = await createServiceClient()

  if (!session && isInitialSetup) {
    const { count } = await supabase
      .from('user_info')
      .select('*', { count: 'exact', head: true })
      .eq('organization_key', organizationKey)
    if ((count ?? 0) > 0) return { error: '権限がありません。' }
  }

  const { data: existing } = await supabase
    .from('user_info')
    .select('user_key')
    .eq('user_id', userId)
    .eq('organization_key', organizationKey)
    .single()

  if (existing) return { error: 'このユーザーIDはすでに登録されています。' }

  const hashed = await bcrypt.hash(password, 10)

  const { error } = await supabase.from('user_info').insert({
    user_id:              userId.trim(),
    user_name:            userName.trim(),
    department_id:        departmentId,
    job_id:               jobId,
    role:                 userRole,
    admin_flag:           userRole === 'admin',
    organization_key:     organizationKey,
    password:             hashed,
    must_change_password: !isInitialSetup,
  })

  if (error) {
    console.error('[registerUser] supabase error:', error.code, error.message, error.details)
    if (error.code === '23505') return { error: 'このユーザーIDはすでに登録されています。' }
    if (error.code === '23503') return { error: '部署または職種の選択に問題があります。' }
    return { error: `登録に失敗しました。(${error.code ?? 'unknown'})` }
  }

  revalidatePath('/admin')
  return { success: true }
}

/** 管理者によるパスワードリセット — admin のみ */
export async function resetUserPassword(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }

  const userKey     = Number(formData.get('userKey'))
  const newPassword = (formData.get('newPassword') as string)?.trim()

  if (!userKey || !newPassword) return { error: '必須項目を入力してください。' }
  if (newPassword.length < 8) return { error: 'パスワードは8文字以上で入力してください。' }

  const supabase = createServiceClient()
  const hashed   = await bcrypt.hash(newPassword, 10)

  const { error } = await supabase
    .from('user_info')
    .update({ password: hashed, must_change_password: true })
    .eq('user_key', userKey)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: 'リセットに失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}
