'use server'

import { createHash } from 'crypto'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServiceClient, createOrgClient } from '@/lib/supabase/server'
import {
  createSession, deleteSession, createSetupToken, getSession,
  createPasswordResetToken, verifyPasswordResetToken,
} from '@/lib/session'
import { logAudit } from '@/lib/audit'
import { sendMail, isMailConfigured } from '@/lib/email'

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

  // tenant-ok: ログイン（セッション確立前）。organization_id から組織を解決するため service role
  const supabase = createServiceClient()

  const { data: org } = await supabase
    .from('organization_data')
    .select('organization_key')
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

  if (!newPassword || !confirmPassword)
    return { error: '全ての項目を入力してください。' }
  if (newPassword !== confirmPassword)
    return { error: '新しいパスワードが一致しません。' }
  const supabase = await createOrgClient(session.organizationKey)

  const [{ data: user }, { data: policy }] = await Promise.all([
    supabase
      .from('user_info')
      .select('password, must_change_password')
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

  const isForcedChange = Boolean(user.must_change_password)
  if (!isForcedChange) {
    if (!currentPassword) return { error: '現在のパスワードを入力してください。' }
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) return { error: '現在のパスワードが正しくありません。' }
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password)
  if (isSamePassword) return { error: '現在と同じパスワードは使用できません。' }

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

// ─── パスワード再設定（管理者・メール経由） ─────────────────

const resetAttempts = new Map<string, { count: number; resetAt: number }>()
const RESET_RATE = { MAX: 5, WINDOW_MS: 15 * 60 * 1000 }

function isResetRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = resetAttempts.get(ip)
  if (!entry || now >= entry.resetAt) {
    resetAttempts.set(ip, { count: 1, resetAt: now + RESET_RATE.WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > RESET_RATE.MAX
}

/** 現在のパスワードハッシュのフィンガープリント（トークンのワンタイム性の担保） */
function passwordFingerprint(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('hex').slice(0, 16)
}

/** 再設定メールの送信リクエスト。ユーザーの存在有無を漏らさないため常に同じ応答を返す */
export async function requestPasswordReset(formData: FormData) {
  const organizationId = (formData.get('organizationId') as string)?.normalize('NFKC').trim()
  const userId         = (formData.get('userId') as string)?.normalize('NFKC').trim()

  if (!organizationId || !userId) return { error: '必須項目を入力してください。' }

  if (!isMailConfigured()) {
    return { error: 'メール再設定は現在利用できません。他の管理者にリセットを依頼してください。' }
  }

  const headerStore = await headers()
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isResetRateLimited(ip)) {
    return { error: 'リクエストが多すぎます。しばらくしてから再度お試しください。' }
  }

  const genericSuccess = { success: true }

  // tenant-ok: パスワード再設定リクエスト（セッション確立前）。organization_id から組織解決
  const supabase = createServiceClient()
  const { data: org } = await supabase
    .from('organization_data')
    .select('organization_key')
    .eq('organization_id', organizationId)
    .single()
  if (!org) return genericSuccess

  const { data: user } = await supabase
    .from('user_info')
    .select('user_key, user_name, password, email, role, is_active')
    .eq('user_id', userId)
    .eq('organization_key', org.organization_key)
    .single()

  // 管理者・有効・メール登録済みの場合のみ送信（結果は外に漏らさない）
  if (!user || user.role !== 'admin' || !user.is_active || !user.email) return genericSuccess

  const token = await createPasswordResetToken(
    user.user_key, org.organization_key, passwordFingerprint(user.password))
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`

  // 列挙対策: 送信はレスポンス後に行い（タイミング差の縮小）、成否もユーザー応答には反映しない
  const email = user.email
  after(async () => {
    const sent = await sendMail(
      email,
      '【RoScope】パスワード再設定のご案内',
      `${user.user_name} 様\n\nRoScope のパスワード再設定リクエストを受け付けました。\n以下のリンクから30分以内に新しいパスワードを設定してください。\n\n${link}\n\n※このリクエストに心当たりがない場合は、このメールを無視してください。パスワードは変更されません。`,
    )
    if (!sent) console.error('[requestPasswordReset] メール送信失敗:', `user:${user.user_key}`)
    // 正当なリクエストが完了したらレート制限をリセット（login と同パターン）
    if (sent) resetAttempts.delete(ip)
    await logAudit({
      organizationKey: org.organization_key,
      actorName: userId,
      action: 'auth.reset_request',
      target: `user:${user.user_key}`,
      detail: { sent },
      ipAddress: ip,
    })
  })

  return genericSuccess
}

/** メールのトークンで新しいパスワードを設定する */
export async function resetPasswordWithToken(formData: FormData) {
  const token           = formData.get('token') as string
  const newPassword     = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!token || !newPassword || !confirmPassword) return { error: '全ての項目を入力してください。' }
  if (newPassword !== confirmPassword) return { error: '新しいパスワードが一致しません。' }

  const claims = await verifyPasswordResetToken(token)
  if (!claims) return { error: 'リンクが無効か期限切れです。再度お手続きください。' }

  // tenant-ok: トークンによるパスワード再設定（セッション確立前）
  const supabase = createServiceClient()
  const [{ data: user }, { data: policy }] = await Promise.all([
    supabase
      .from('user_info')
      .select('user_key, user_name, password')
      .eq('user_key', claims.userKey)
      .eq('organization_key', claims.organizationKey)
      .single(),
    supabase
      .from('password_policy')
      .select('min_length')
      .eq('organization_key', claims.organizationKey)
      .maybeSingle(),
  ])

  // パスワードが既に変わっていればトークンは使用済み扱い
  if (!user || passwordFingerprint(user.password) !== claims.pwh) {
    return { error: 'リンクが無効か期限切れです。再度お手続きください。' }
  }

  const minLength = policy?.min_length ?? 8
  if (newPassword.length < minLength)
    return { error: `新しいパスワードは${minLength}文字以上で入力してください。` }

  const hashed = await bcrypt.hash(newPassword, 10)
  const { error } = await supabase
    .from('user_info')
    .update({ password: hashed, must_change_password: false, password_changed_at: new Date().toISOString() })
    .eq('user_key', claims.userKey)
    .eq('organization_key', claims.organizationKey)

  if (error) return { error: 'パスワードの再設定に失敗しました。' }

  after(() => logAudit({
    organizationKey: claims.organizationKey,
    actorUserKey: claims.userKey,
    actorName: user.user_name,
    action: 'auth.reset_complete',
    target: `user:${claims.userKey}`,
  }))

  return { success: true }
}

// ─── 団体登録 ───────────────────────────────────────────────

// 未認証で叩ける組織作成エンドポイントのスパム対策（IP単位 3回/1時間）
const registerAttempts = new Map<string, { count: number; resetAt: number }>()
const REGISTER_RATE = { MAX: 3, WINDOW_MS: 60 * 60 * 1000 }

function isRegisterRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = registerAttempts.get(ip)
  if (!entry || now >= entry.resetAt) {
    registerAttempts.set(ip, { count: 1, resetAt: now + REGISTER_RATE.WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > REGISTER_RATE.MAX
}

export async function registerOrganization(formData: FormData) {
  const headerStore = await headers()
  const registerIp = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRegisterRateLimited(registerIp)) {
    return { error: '登録リクエストが多すぎます。しばらくしてから再度お試しください。' }
  }

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

  // tenant-ok: 団体新規登録（セッション確立前・組織作成そのもの）
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
