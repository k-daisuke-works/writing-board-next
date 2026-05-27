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
  const organizationId       = (formData.get('organizationId') as string)?.trim()
  const organizationName     = (formData.get('organizationName') as string)?.trim()
  const organizationPassword = formData.get('organizationPassword') as string

  // ── サーバーサイドバリデーション ────────────────────────
  if (!organizationId || !organizationName || !organizationPassword) {
    return { error: '必須項目を入力してください。' }
  }
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(organizationId)) {
    return { error: '団体IDは英数字・ハイフン・アンダースコアのみ、50文字以内で入力してください。' }
  }
  if (organizationName.length > 100) {
    return { error: '団体名は100文字以内で入力してください。' }
  }
  if (organizationPassword.length < 8) {
    return { error: 'パスワードは8文字以上で入力してください。' }
  }

  // 環境変数チェック
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[registerOrganization] SUPABASE_SERVICE_ROLE_KEY が未設定です')
    return { error: 'サーバー設定エラー: SUPABASE_SERVICE_ROLE_KEY 未設定' }
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('[registerOrganization] NEXT_PUBLIC_SUPABASE_URL が未設定です')
    return { error: 'サーバー設定エラー: NEXT_PUBLIC_SUPABASE_URL 未設定' }
  }

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

  if (error) {
    // エラー詳細はサーバーログのみ（クライアントへの情報漏洩防止）
    console.error('[registerOrganization] Supabase insert error:', JSON.stringify(error))
    return { error: '登録に失敗しました。しばらくしてから再度お試しください。' }
  }

  if (!org) return { error: '登録に失敗しました（データなし）。' }

  return { success: true, organizationKey: org.organization_key }
}
