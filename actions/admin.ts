'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

/** ユーザー削除（自分自身は不可） */
export async function deleteUser(formData: FormData) {
  const session = await getSession()
  if (!session?.adminFlag) return { error: '管理者権限が必要です。' }

  const userKey = Number(formData.get('userKey'))

  if (userKey === session.userKey) {
    return { error: '自分自身は削除できません。' }
  }

  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('user_info')
    .delete()
    .eq('user_key', userKey)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '削除に失敗しました。' }

  revalidatePath('/admin')
  return { success: true }
}

/** 部署削除（所属ユーザーがいる場合は不可） */
export async function deleteDepartment(formData: FormData) {
  const session = await getSession()
  if (!session?.adminFlag) return { error: '管理者権限が必要です。' }

  const departmentId = Number(formData.get('departmentId'))
  const supabase = await createServiceClient()

  const { count } = await supabase
    .from('user_info')
    .select('*', { count: 'exact', head: true })
    .eq('department_id', departmentId)
    .eq('organization_key', session.organizationKey)

  if ((count ?? 0) > 0) {
    return { error: 'この部署には所属ユーザーがいるため削除できません。' }
  }

  const { error } = await supabase
    .from('department_data')
    .delete()
    .eq('department_id', departmentId)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '削除に失敗しました。' }

  revalidatePath('/admin')
  return { success: true }
}

/** 職種削除（所属ユーザーがいる場合は不可） */
export async function deleteJob(formData: FormData) {
  const session = await getSession()
  if (!session?.adminFlag) return { error: '管理者権限が必要です。' }

  const jobId = Number(formData.get('jobId'))
  const supabase = await createServiceClient()

  const { count } = await supabase
    .from('user_info')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', jobId)
    .eq('organization_key', session.organizationKey)

  if ((count ?? 0) > 0) {
    return { error: 'この職種には所属ユーザーがいるため削除できません。' }
  }

  const { error } = await supabase
    .from('job_data')
    .delete()
    .eq('job_id', jobId)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '削除に失敗しました。' }

  revalidatePath('/admin')
  return { success: true }
}

/** 部署登録
 *  - 通常: セッションの adminFlag を確認
 *  - 初回セットアップ: セッションなし + フォームの organizationKey を使用
 */
export async function createDepartment(formData: FormData) {
  const session = await getSession()

  // フォームから organizationKey を取得（初回セットアップ時に使用）
  const orgKeyFromForm = Number(formData.get('organizationKey') || 0)

  // 権限チェック
  if (session && !session.adminFlag) return { error: '管理者権限が必要です。' }
  if (!session && !orgKeyFromForm) return { error: '権限がありません。' }

  const organizationKey = session?.organizationKey ?? orgKeyFromForm
  const departmentName = formData.get('departmentName') as string

  if (!departmentName?.trim()) return { error: '部署名を入力してください。' }
  if (departmentName.trim().length > 100) return { error: '部署名は100文字以内で入力してください。' }

  const supabase = await createServiceClient()

  // 初回セットアップ時の追加チェック:
  // 既にユーザーが存在する組織への未認証アクセスを拒否（推測した orgKey での不正追加防止）
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

/** 職種登録
 *  - 通常: セッションの adminFlag を確認
 *  - 初回セットアップ: セッションなし + フォームの organizationKey を使用
 */
export async function createJob(formData: FormData) {
  const session = await getSession()

  const orgKeyFromForm = Number(formData.get('organizationKey') || 0)

  if (session && !session.adminFlag) return { error: '管理者権限が必要です。' }
  if (!session && !orgKeyFromForm) return { error: '権限がありません。' }

  const organizationKey = session?.organizationKey ?? orgKeyFromForm
  const jobName = formData.get('jobName') as string

  if (!jobName?.trim()) return { error: '職種名を入力してください。' }
  if (jobName.trim().length > 100) return { error: '職種名は100文字以内で入力してください。' }

  const supabase = await createServiceClient()

  // 初回セットアップ時: ユーザーが既存の組織への未認証アクセスを拒否
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

/** 部署名更新 */
export async function updateDepartment(formData: FormData) {
  const session = await getSession()
  if (!session?.adminFlag) return { error: '管理者権限が必要です。' }

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

/** 職種名更新 */
export async function updateJob(formData: FormData) {
  const session = await getSession()
  if (!session?.adminFlag) return { error: '管理者権限が必要です。' }

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

/** ユーザー情報更新 */
export async function updateUser(formData: FormData) {
  const session = await getSession()
  if (!session?.adminFlag) return { error: '管理者権限が必要です。' }

  const userKey      = Number(formData.get('userKey'))
  const userName     = (formData.get('userName') as string)?.trim()
  const departmentId = Number(formData.get('departmentId')) || null
  const jobId        = Number(formData.get('jobId'))        || null
  const isAdmin      = formData.get('isAdmin') === 'true'
  const newPassword  = (formData.get('password') as string)?.trim()

  if (!userName) return { error: 'ユーザー名を入力してください。' }

  const supabase = await createServiceClient()
  const updates: Record<string, unknown> = {
    user_name:     userName,
    department_id: departmentId,
    job_id:        jobId,
    admin_flag:    isAdmin,
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
 *  - 通常: セッションの adminFlag を確認
 *  - 初回セットアップ: セッションなし + フォームの organizationKey + isInitialSetup=true
 */
export async function registerUser(formData: FormData) {
  const session = await getSession()

  const orgKeyFromForm = Number(formData.get('organizationKey') || 0)
  const isInitialSetup = formData.get('isInitialSetup') === 'true'

  // 権限チェック
  if (session && !session.adminFlag) return { error: '管理者権限が必要です。' }
  if (!session && !(isInitialSetup && orgKeyFromForm)) return { error: '権限がありません。' }

  const organizationKey = session?.organizationKey ?? orgKeyFromForm

  // 全角英数字・記号を半角に正規化してから検証（日本語IMEの全角入力対策）
  const userId       = (formData.get('userId') as string)?.normalize('NFKC').trim()
  const userName     = (formData.get('userName') as string)?.trim()
  const departmentId = Number(formData.get('departmentId')) || null
  const jobId        = Number(formData.get('jobId')) || null
  const password     = formData.get('password') as string
  // 初回セットアップ時は必ず管理者に
  const isAdmin      = isInitialSetup ? true : (formData.get('isAdmin') === 'true')

  if (!userId || !userName?.trim() || !password) {
    return { error: '必須項目を入力してください。' }
  }
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(userId)) {
    return { error: 'ユーザーIDは英数字・ハイフン・アンダースコアのみ、50文字以内で入力してください。' }
  }
  if (userName.trim().length > 50) {
    return { error: 'ユーザー名は50文字以内で入力してください。' }
  }
  if (password.length < 8) {
    return { error: 'パスワードは8文字以上で入力してください。' }
  }

  const supabase = await createServiceClient()

  // 初回セットアップ時: 既にユーザーがいる組織への未認証アクセスを拒否
  // （第2ユーザー以降の不正作成を防止）
  if (!session && isInitialSetup) {
    const { count } = await supabase
      .from('user_info')
      .select('*', { count: 'exact', head: true })
      .eq('organization_key', organizationKey)
    if ((count ?? 0) > 0) return { error: '権限がありません。' }
  }

  // 重複チェック
  const { data: existing } = await supabase
    .from('user_info')
    .select('user_key')
    .eq('user_id', userId)
    .eq('organization_key', organizationKey)
    .single()

  if (existing) return { error: 'このユーザーIDはすでに登録されています。' }

  const hashed = await bcrypt.hash(password, 10)

  const { error } = await supabase.from('user_info').insert({
    user_id:          userId.trim(),
    user_name:        userName.trim(),
    department_id:    departmentId,
    job_id:           jobId,
    admin_flag:       isAdmin,
    organization_key: organizationKey,
    password:         hashed,
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
