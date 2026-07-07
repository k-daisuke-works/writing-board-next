'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/server'
import { getSession, verifySetupToken } from '@/lib/session'
import { logAudit } from '@/lib/audit'
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

  const supabase = createServiceClient()

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

  after(() => logAudit({
    organizationKey: session.organizationKey,
    actorUserKey: session.userKey,
    actorName: session.userName,
    action: 'user.delete',
    target: `user:${userKey}`,
  }))

  revalidatePath('/admin')
  return { success: true }
}

/** 部署削除（所属ユーザーがいる場合は不可）— 管理者のみ */
export async function deleteDepartment(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }

  const departmentId = Number(formData.get('departmentId'))
  const supabase = createServiceClient()

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
  const supabase = createServiceClient()

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
  const setupToken = String(formData.get('setupToken') || '')
  const orgKeyFromToken = setupToken ? await verifySetupToken(setupToken) : null

  if (session && session.role !== 'admin') return { error: '管理者権限が必要です。' }
  if (!session && !orgKeyFromToken) return { error: '権限がありません。' }

  const organizationKey = session?.organizationKey ?? orgKeyFromToken!
  const departmentName = formData.get('departmentName') as string

  if (!departmentName?.trim()) return { error: '部署名を入力してください。' }
  if (departmentName.trim().length > 100) return { error: '部署名は100文字以内で入力してください。' }

  const supabase = createServiceClient()

  if (!session) {
    const { count } = await supabase
      .from('user_info')
      .select('*', { count: 'exact', head: true })
      .eq('organization_key', organizationKey)
    if ((count ?? 0) > 0) return { error: '権限がありません。' }
  }

  const { data, error } = await supabase.from('department_data')
    .insert({ department_name: departmentName.trim(), organization_key: organizationKey })
    .select('department_id, department_name')
    .single()

  if (error) {
    console.error('[createDepartment] error:', error)
    return { error: '登録に失敗しました。' }
  }

  revalidatePath('/admin')
  return { success: true, item: data }
}

/** 職種登録 — 管理者のみ（初回セットアップは例外） */
export async function createJob(formData: FormData) {
  const session = await getSession()
  const setupToken = String(formData.get('setupToken') || '')
  const orgKeyFromToken = setupToken ? await verifySetupToken(setupToken) : null

  if (session && session.role !== 'admin') return { error: '管理者権限が必要です。' }
  if (!session && !orgKeyFromToken) return { error: '権限がありません。' }

  const organizationKey = session?.organizationKey ?? orgKeyFromToken!
  const jobName = formData.get('jobName') as string

  if (!jobName?.trim()) return { error: '職種名を入力してください。' }
  if (jobName.trim().length > 100) return { error: '職種名は100文字以内で入力してください。' }

  const supabase = createServiceClient()

  if (!session) {
    const { count } = await supabase
      .from('user_info')
      .select('*', { count: 'exact', head: true })
      .eq('organization_key', organizationKey)
    if ((count ?? 0) > 0) return { error: '権限がありません。' }
  }

  const { data, error } = await supabase.from('job_data')
    .insert({ job_name: jobName.trim(), organization_key: organizationKey })
    .select('job_id, job_name')
    .single()

  if (error) {
    console.error('[createJob] error:', error)
    return { error: '登録に失敗しました。' }
  }

  revalidatePath('/admin')
  return { success: true, item: data }
}

/** 部署名更新 — 管理者のみ */
export async function updateDepartment(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }

  const departmentId   = Number(formData.get('departmentId'))
  const departmentName = (formData.get('departmentName') as string)?.trim()
  if (!departmentName) return { error: '部署名を入力してください。' }

  const supabase = createServiceClient()
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

  const supabase = createServiceClient()
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

  const userKey          = Number(formData.get('userKey'))
  const userName         = (formData.get('userName') as string)?.trim()
  const departmentId     = Number(formData.get('departmentId'))     || null
  const jobId            = Number(formData.get('jobId'))            || null
  const positionId       = Number(formData.get('positionId'))       || null
  const employmentTypeId = Number(formData.get('employmentTypeId')) || null
  const newPassword      = (formData.get('password') as string)?.trim()
  const roleFromForm     = formData.get('role') as string
  const newRole: UserRole = ['admin', 'leader', 'member'].includes(roleFromForm)
    ? roleFromForm as UserRole
    : 'member'

  if (!userName) return { error: 'ユーザー名を入力してください。' }

  const supabase = createServiceClient()

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
    user_name:          userName,
    department_id:      departmentId,
    job_id:             jobId,
    position_id:        positionId,
    employment_type_id: employmentTypeId,
    role:               newRole,
    admin_flag:         newRole === 'admin',
  }
  if (newPassword) updates.password = await bcrypt.hash(newPassword, 10)

  const { error } = await supabase
    .from('user_info')
    .update(updates)
    .eq('user_key', userKey)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '更新に失敗しました。' }

  after(() => logAudit({
    organizationKey: session.organizationKey,
    actorUserKey: session.userKey,
    actorName: session.userName,
    action: 'user.update',
    target: `user:${userKey}`,
    detail: { role: newRole, passwordChanged: Boolean(newPassword) },
  }))

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

  const userId           = (formData.get('userId') as string)?.normalize('NFKC').trim()
  const userName         = (formData.get('userName') as string)?.trim()
  const departmentId     = Number(formData.get('departmentId'))     || null
  const jobId            = Number(formData.get('jobId'))            || null
  const positionId       = Number(formData.get('positionId'))       || null
  const employmentTypeId = Number(formData.get('employmentTypeId')) || null
  const password         = formData.get('password') as string
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

  const supabase = createServiceClient()

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
    position_id:          positionId,
    employment_type_id:   employmentTypeId,
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

  after(() => logAudit({
    organizationKey,
    actorUserKey: session?.userKey ?? null,
    actorName: session?.userName ?? '初期セットアップ',
    action: 'user.create',
    target: `user:${userId}`,
    detail: { role: userRole },
  }))

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

  after(() => logAudit({
    organizationKey: session.organizationKey,
    actorUserKey: session.userKey,
    actorName: session.userName,
    action: 'user.password_reset',
    target: `user:${userKey}`,
  }))

  revalidatePath('/admin')
  return { success: true }
}

/** アカウント凍結/解除 — admin のみ */
export async function toggleUserActive(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }

  const userKey   = Number(formData.get('userKey'))
  const isActive  = formData.get('isActive') === 'true'
  if (userKey === session.userKey) return { error: '自分自身は変更できません。' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('user_info')
    .update({ is_active: isActive })
    .eq('user_key', userKey)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '更新に失敗しました。' }

  after(() => logAudit({
    organizationKey: session.organizationKey,
    actorUserKey: session.userKey,
    actorName: session.userName,
    action: isActive ? 'user.unfreeze' : 'user.freeze',
    target: `user:${userKey}`,
  }))

  revalidatePath('/admin')
  return { success: true }
}

// ─── 役職 CRUD ────────────────────────────────────────────────────────────

export async function createPosition(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }
  const name = (formData.get('positionName') as string)?.trim()
  if (!name) return { error: '役職名を入力してください。' }

  const supabase = createServiceClient()
  const { error } = await supabase.from('position_data').insert({
    position_name:    name,
    organization_key: session.organizationKey,
  })
  if (error?.code === '23505') return { error: 'この役職名はすでに登録されています。' }
  if (error) return { error: '追加に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

export async function updatePosition(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }
  const positionId = Number(formData.get('positionId'))
  const name       = (formData.get('positionName') as string)?.trim()
  if (!name) return { error: '役職名を入力してください。' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('position_data')
    .update({ position_name: name })
    .eq('position_id', positionId)
    .eq('organization_key', session.organizationKey)
  if (error) return { error: '更新に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

export async function deletePosition(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }
  const positionId = Number(formData.get('positionId'))

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('position_data')
    .delete()
    .eq('position_id', positionId)
    .eq('organization_key', session.organizationKey)
  if (error) return { error: '削除に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

// ─── 雇用形態 CRUD ────────────────────────────────────────────────────────

export async function createEmploymentType(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }
  const name = (formData.get('employmentTypeName') as string)?.trim()
  if (!name) return { error: '雇用形態名を入力してください。' }

  const supabase = createServiceClient()
  const { error } = await supabase.from('employment_type_data').insert({
    employment_type_name: name,
    organization_key:     session.organizationKey,
  })
  if (error?.code === '23505') return { error: 'この雇用形態はすでに登録されています。' }
  if (error) return { error: '追加に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateEmploymentType(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }
  const id   = Number(formData.get('employmentTypeId'))
  const name = (formData.get('employmentTypeName') as string)?.trim()
  if (!name) return { error: '雇用形態名を入力してください。' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('employment_type_data')
    .update({ employment_type_name: name })
    .eq('employment_type_id', id)
    .eq('organization_key', session.organizationKey)
  if (error) return { error: '更新に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteEmploymentType(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }
  const id = Number(formData.get('employmentTypeId'))

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('employment_type_data')
    .delete()
    .eq('employment_type_id', id)
    .eq('organization_key', session.organizationKey)
  if (error) return { error: '削除に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

// ─── グループ CRUD ────────────────────────────────────────────────────────

export async function createGroup(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }
  const name = (formData.get('groupName') as string)?.trim()
  if (!name) return { error: 'グループ名を入力してください。' }

  const supabase = createServiceClient()
  const { error } = await supabase.from('group_data').insert({
    group_name:       name,
    organization_key: session.organizationKey,
  })
  if (error?.code === '23505') return { error: 'このグループ名はすでに登録されています。' }
  if (error) return { error: '追加に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateGroup(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }
  const groupId = Number(formData.get('groupId'))
  const name    = (formData.get('groupName') as string)?.trim()
  if (!name) return { error: 'グループ名を入力してください。' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('group_data')
    .update({ group_name: name })
    .eq('group_id', groupId)
    .eq('organization_key', session.organizationKey)
  if (error) return { error: '更新に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteGroup(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }
  const groupId = Number(formData.get('groupId'))

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('group_data')
    .delete()
    .eq('group_id', groupId)
    .eq('organization_key', session.organizationKey)
  if (error) return { error: '削除に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

/** グループのメンバーを一括設定（既存メンバーを削除→再挿入） */
export async function setGroupMembers(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }

  const groupId      = Number(formData.get('groupId'))
  const userKeysRaw  = formData.get('userKeys') as string
  const userKeys: number[] = userKeysRaw
    ? JSON.parse(userKeysRaw).map(Number).filter(Boolean)
    : []

  const supabase = createServiceClient()

  const { data: group } = await supabase
    .from('group_data')
    .select('group_id')
    .eq('group_id', groupId)
    .eq('organization_key', session.organizationKey)
    .single()
  if (!group) return { error: '権限がありません。' }

  await supabase.from('user_group_members').delete().eq('group_id', groupId)

  if (userKeys.length > 0) {
    const { error } = await supabase.from('user_group_members').insert(
      userKeys.map(uk => ({ group_id: groupId, user_key: uk }))
    )
    if (error) return { error: 'メンバー設定に失敗しました。' }
  }

  revalidatePath('/admin')
  return { success: true }
}

// ─── 団体設定 ─────────────────────────────────────────────────────────────

export async function updateOrgName(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }

  const name = (formData.get('orgName') as string)?.trim()
  if (!name || name.length > 100) return { error: '団体名を100文字以内で入力してください。' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('organization_data')
    .update({ organization_name: name })
    .eq('organization_key', session.organizationKey)
  if (error) return { error: '更新に失敗しました。' }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateOrgPassword(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }

  const currentPassword = formData.get('currentOrgPassword') as string
  const newPassword     = formData.get('newOrgPassword') as string
  const confirmPassword = formData.get('confirmOrgPassword') as string

  if (!currentPassword || !newPassword || !confirmPassword)
    return { error: '全ての項目を入力してください。' }
  if (newPassword.length < 8)
    return { error: '新しい団体パスは8文字以上で入力してください。' }
  if (newPassword !== confirmPassword)
    return { error: '新しい団体パスが一致しません。' }

  const supabase = createServiceClient()
  const { data: org } = await supabase
    .from('organization_data')
    .select('organization_password')
    .eq('organization_key', session.organizationKey)
    .single()
  if (!org) return { error: '組織情報の取得に失敗しました。' }

  const isValid = await bcrypt.compare(currentPassword, org.organization_password)
  if (!isValid) return { error: '現在の団体パスが正しくありません。' }

  const hashed = await bcrypt.hash(newPassword, 10)
  const { error } = await supabase
    .from('organization_data')
    .update({ organization_password: hashed })
    .eq('organization_key', session.organizationKey)
  if (error) return { error: '更新に失敗しました。' }

  after(() => logAudit({
    organizationKey: session.organizationKey,
    actorUserKey: session.userKey,
    actorName: session.userName,
    action: 'org.password_change',
    target: 'organization',
  }))

  return { success: true }
}

// ─── パスワードポリシー ────────────────────────────────────────────────────

export async function upsertPasswordPolicy(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }

  const minLength  = Math.max(8, Math.min(32, Number(formData.get('minLength')) || 8))
  const expiryRaw  = formData.get('expiryDays') as string
  const expiryDays = expiryRaw && expiryRaw !== '0' ? Number(expiryRaw) : null

  const supabase = createServiceClient()
  const { error } = await supabase.from('password_policy').upsert({
    organization_key: session.organizationKey,
    min_length:       minLength,
    expiry_days:      expiryDays,
  })
  if (error) return { error: '更新に失敗しました。' }

  after(() => logAudit({
    organizationKey: session.organizationKey,
    actorUserKey: session.userKey,
    actorName: session.userName,
    action: 'policy.update',
    target: 'password_policy',
    detail: { minLength, expiryDays },
  }))

  revalidatePath('/admin')
  return { success: true }
}

// ─── 管理者メールアドレス（パスワード再設定用） ───────────────────────────

/** 自分（管理者）のメールアドレスを登録・変更・解除する */
export async function updateMyEmail(formData: FormData) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }

  const raw = (formData.get('email') as string)?.normalize('NFKC').trim().toLowerCase() ?? ''
  const email = raw === '' ? null : raw

  if (email !== null) {
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: 'メールアドレスの形式が正しくありません。' }
    }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('user_info')
    .update({ email })
    .eq('user_key', session.userKey)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: '更新に失敗しました。' }

  after(() => logAudit({
    organizationKey: session.organizationKey,
    actorUserKey: session.userKey,
    actorName: session.userName,
    action: 'user.email_change',
    target: `user:${session.userKey}`,
    detail: { registered: email !== null },
  }))

  revalidatePath('/admin')
  return { success: true }
}
