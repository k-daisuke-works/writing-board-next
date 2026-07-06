'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/server'
import { createSession, deleteSession, createSetupToken, getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit'

// ─── ログイン試行レート制限 ─────────────────────────────────
// 注: Node.js モジュールスコープの Map のため、同一プロセス内でのみ有効。
// 複数インスタンスにスケールアウトする本番環境では Upstash Redis への移行を推奨。
// @upstash/ratelimit + @upstash/redis を middleware.ts に組み込むことで
// インスタンス横断のレート制限が実現できる。
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT = {
  MAX:       10,                  // 同一キーで最大試行回数
  WINDOW_MS: 15 * 60 * 1000,     // 15分ウィンドウ
}

function recordFailedAttempt(key: string): number {
  const now  = Date.now()
  const prev = loginAttempts.get(key)
  if (!prev || now >= prev.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT.WINDOW_MS })
    return 1
  }
  const next = { count: prev.count + 1, resetAt: prev.resetAt }
  loginAttempts.set(key, next)
  return next.count
}

function isRateLimited(key: string): boolean {
  const entry = loginAttempts.get(key)
  if (!entry) return false
  if (Date.now() >= entry.resetAt) { loginAttempts.delete(key); return false }
  return entry.count >= RATE_LIMIT.MAX
}

// ─── ログイン ───────────────────────────────────────────────
export async function login(formData: FormData) {
  const organizationId = (formData.get('organizationId') as string)?.normalize('NFKC').trim()
  const userId         = (formData.get('userId') as string)?.normalize('NFKC').trim()
  const password       = formData.get('password') as string

  if (!organizationId || !userId || !password) {
    return { error: '必須項目を入力してください。' }
  }

  // IP + 団体ID でレート制限（ユーザーIDも含めると過度に細粒度になる）
  const headerStore = await headers()
  const ip  = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const key = `${ip}:${organizationId}`

  if (isRateLimited(key)) {
    return { error: 'ログイン試行が多すぎます。15分後に再度お試しください。' }
  }

  const supabase = createServiceClient()

  const { data: org } = await supabase
    .from('organization_data')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (!org) {
    recordFailedAttempt(key)
    return { error: 'ログインに失敗しました。' }
  }

  // ログイン失敗の監査記録（組織が特定できた場合のみ）
  const auditLoginFailure = (reason: string) =>
    after(() => logAudit({
      organizationKey: org.organization_key,
      actorName: userId,
      action: 'auth.login_failed',
      detail: { reason },
      ipAddress: ip,
    }))

  const { data: user } = await supabase
    .from('user_info')
    .select('user_key, user_id, role, password, must_change_password, is_active, password_changed_at')
    .eq('user_id', userId)
    .eq('organization_key', org.organization_key)
    .single()

  if (!user) {
    recordFailedAttempt(key)
    auditLoginFailure('unknown_user')
    return { error: 'ログインに失敗しました。' }
  }

  const u = user as unknown as {
    role: string
    must_change_password: boolean
    is_active: boolean
    password_changed_at: string | null
  }

  if (!u.is_active) {
    recordFailedAttempt(key)
    auditLoginFailure('account_frozen')
    return { error: 'このアカウントは凍結されています。管理者にお問い合わせください。' }
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    recordFailedAttempt(key)
    auditLoginFailure('wrong_password')
    return { error: 'ログインに失敗しました。' }
  }

  // パスワード有効期限チェック
  const { data: policy } = await supabase
    .from('password_policy')
    .select('min_length, expiry_days')
    .eq('organization_key', org.organization_key)
    .single()

  let isExpired = false
  if (policy?.expiry_days && u.password_changed_at) {
    const changedAt  = new Date(u.password_changed_at).getTime()
    const expiresAt  = changedAt + policy.expiry_days * 24 * 60 * 60 * 1000
    isExpired = Date.now() > expiresAt
  }

  // 成功: レート制限リセット、ログイン履歴記録、セッション発行
  loginAttempts.delete(key)

  supabase.from('login_history').insert({
    user_key:       user.user_key,
    organization_key: org.organization_key,
    user_name_stamp: userId,
    ip_address:     ip,
  }).then(() => {})

  await createSession({
    userKey:         user.user_key,
    organizationKey: org.organization_key,
    role:            u.role as 'admin' | 'leader' | 'member' ?? 'member',
  })

  const mustChange = u.must_change_password || isExpired
  redirect(mustChange ? '/change-password' : '/home')
}

// ─── ログアウト ─────────────────────────────────────────────
export async function logout() {
  await deleteSession()
  redirect('/login')
}

// ─── パスワード変更 ─────────────────────────────────────────
export async function changePassword(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }

  const currentPassword = formData.get('currentPassword') as string
  const newPassword     = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!currentPassword || !newPassword || !confirmPassword)
    return { error: '全ての項目を入力してください。' }
  if (newPassword !== confirmPassword)
    return { error: '新しいパスワードが一致しません。' }
  if (newPassword === currentPassword)
    return { error: '現在と同じパスワードは使用できません。' }

  const supabase = createServiceClient()

  const [{ data: user }, { data: policy }] = await Promise.all([
    supabase
      .from('user_info')
      .select('password')
      .eq('user_key', session.userKey)
      .eq('organization_key', session.organizationKey)
      .single(),
    supabase
      .from('password_policy')
      .select('min_length')
      .eq('organization_key', session.organizationKey)
      .maybeSingle(),
  ])

  const minLength = policy?.min_length ?? 8
  if (newPassword.length < minLength)
    return { error: `新しいパスワードは${minLength}文字以上で入力してください。` }

  if (!user) return { error: 'ユーザーが見つかりません。' }

  const isValid = await bcrypt.compare(currentPassword, user.password)
  if (!isValid) return { error: '現在のパスワードが正しくありません。' }

  const hashed = await bcrypt.hash(newPassword, 10)
  const { error } = await supabase
    .from('user_info')
    .update({ password: hashed, must_change_password: false, password_changed_at: new Date().toISOString() })
    .eq('user_key', session.userKey)
    .eq('organization_key', session.organizationKey)

  if (error) return { error: 'パスワードの変更に失敗しました。' }

  after(() => logAudit({
    organizationKey: session.organizationKey,
    actorUserKey: session.userKey,
    actorName: session.userName,
    action: 'auth.password_change',
    target: `user:${session.userKey}`,
  }))

  return { success: true }
}

// ─── 団体登録 ───────────────────────────────────────────────
export async function registerOrganization(formData: FormData) {
  const organizationId       = (formData.get('organizationId') as string)?.trim()
  const organizationName     = (formData.get('organizationName') as string)?.trim()
  const organizationPassword = formData.get('organizationPassword') as string

  // サーバーサイドバリデーション
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

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[registerOrganization] SUPABASE_SERVICE_ROLE_KEY が未設定です')
    return { error: 'サーバー設定エラーが発生しました。' }
  }

  const supabase = createServiceClient()

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

  if (error || !org) {
    console.error('[registerOrganization] insert error:', JSON.stringify(error))
    return { error: '登録に失敗しました。しばらくしてから再度お試しください。' }
  }

  // 生の organizationKey ではなく署名付きセットアップトークンを返す
  const setupToken = await createSetupToken(org.organization_key)
  return { success: true, setupToken }
}
