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

  if ((count ?? 0) > 0) {
    return { error: 'この部署には所属ユーザーがいるため削除できません。' }
  }

  const { error } = await supabase
    .from('department_data')
    .delete()
    .eq('department_id', departmentId)

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

  if ((count ?? 0) > 0) {
    return { error: 'この職種には所属ユーザーがいるため削除できません。' }
  }

  const { error } = await supabase
    .from('job_data')
    .delete()
    .eq('job_id', jobId)

  if (error) return { error: '削除に失敗しました。' }

  revalidatePath('/admin')
  return { success: true }
}

/** 部署登録 */
export async function createDepartment(formData: FormData) {
  const session = await getSession()
  if (!session?.adminFlag) return { error: '管理者権限が必要です。' }

  const departmentName = formData.get('departmentName') as string
  const supabase = await createServiceClient()

  const { error } = await supabase.from('department_data').insert({
    department_name:  departmentName,
    organization_key: session.organizationKey,
  })

  if (error) return { error: '登録に失敗しました。' }

  revalidatePath('/admin')
  revalidatePath('/departmentjob/register')
  return { success: true }
}

/** 職種登録 */
export async function createJob(formData: FormData) {
  const session = await getSession()
  if (!session?.adminFlag) return { error: '管理者権限が必要です。' }

  const jobName  = formData.get('jobName') as string
  const supabase = await createServiceClient()

  const { error } = await supabase.from('job_data').insert({
    job_name:         jobName,
    organization_key: session.organizationKey,
  })

  if (error) return { error: '登録に失敗しました。' }

  revalidatePath('/admin')
  revalidatePath('/departmentjob/register')
  return { success: true }
}

/** ユーザー登録（管理者が行う） */
export async function registerUser(formData: FormData) {
  const session = await getSession()
  if (!session?.adminFlag) return { error: '管理者権限が必要です。' }

  const userId       = formData.get('userId') as string
  const userName     = formData.get('userName') as string
  const departmentId = Number(formData.get('departmentId'))
  const jobId        = Number(formData.get('jobId'))
  const password     = formData.get('password') as string
  const isAdmin      = formData.get('isAdmin') === 'true'

  const supabase = await createServiceClient()

  // 重複チェック
  const { data: existing } = await supabase
    .from('user_info')
    .select('user_key')
    .eq('user_id', userId)
    .eq('organization_key', session.organizationKey)
    .single()

  if (existing) return { error: 'このユーザーIDはすでに登録されています。' }

  const hashed = await bcrypt.hash(password, 10)

  const { error } = await supabase.from('user_info').insert({
    user_id:          userId,
    user_name:        userName,
    department_id:    departmentId,
    job_id:           jobId,
    admin_flag:       isAdmin,
    organization_key: session.organizationKey,
    password:         hashed,
  })

  if (error) return { error: '登録に失敗しました。' }

  revalidatePath('/admin')
  return { success: true }
}
