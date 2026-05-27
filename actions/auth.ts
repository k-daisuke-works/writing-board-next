'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/server'
import { createSession, deleteSession } from '@/lib/session'
import type { UserSession } from '@/types/database'

/** ログイン */
export async function login(formData: FormData) {
  const organizationId = formData.get('organizationId') as string
  const userId        = formData.get('userId') as string
  const password      = formData.get('password') as string

  const supabase = await createServiceClient()

  // 組織を取得
  const { data: org } = await supabase
    .from('organization_data')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (!org) return { error: 'ログインに失敗しました。' }

  // ユーザーを取得（部署・職種も JOIN）
  const { data: user } = await supabase
    .from('user_info')
    .select(`
      *,
      department:department_data(department_id, department_name),
      job:job_data(job_id, job_name)
    `)
    .eq('user_id', userId)
    .eq('organization_key', org.organization_key)
    .single()

  if (!user) return { error: 'ログインに失敗しました。' }

  // パスワード照合
  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) return { error: 'ログインに失敗しました。' }

  const session: UserSession = {
    userKey:          user.user_key,
    userId:           user.user_id,
    userName:         user.user_name,
    organizationKey:  org.organization_key,
    organizationId:   org.organization_id,
    organizationName: org.organization_name,
    departmentId:     user.department?.department_id ?? 0,
    departmentName:   user.department?.department_name ?? '',
    jobId:            user.job?.job_id ?? 0,
    jobName:          user.job?.job_name ?? '',
    adminFlag:        user.admin_flag ?? false,
  }

  await createSession(session)
  redirect('/home')
}

/** ログアウト */
export async function logout() {
  await deleteSession()
  redirect('/login')
}

/** 団体登録 */
export async function registerOrganization(formData: FormData) {
  const organizationId       = formData.get('organizationId') as string
  const organizationName     = formData.get('organizationName') as string
  const organizationPassword = formData.get('organizationPassword') as string

  const supabase = await createServiceClient()

  // 重複チェック
  const { data: existing } = await supabase
    .from('organization_data')
    .select('organization_key')
    .eq('organization_id', organizationId)
    .single()

  if (existing) return { error: 'この団体IDはすでに使われています。' }

  const hashed = await bcrypt.hash(organizationPassword, 10)

  const { data: org, error } = await supabase
    .from('organization_data')
    .insert({
      organization_id:       organizationId,
      organization_name:     organizationName,
      organization_password: hashed,
    })
    .select()
    .single()

  if (error || !org) return { error: '登録に失敗しました。' }

  return { success: true, organizationKey: org.organization_key }
}
