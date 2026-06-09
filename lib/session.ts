import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { createServiceClient } from '@/lib/supabase/server'
import type { UserSession, UserRole } from '@/types/database'

const SECRET      = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE_NAME = 'wb_session'

// ─── JWT に格納する最小限のクレーム ────────────────────────
// 名前・部署名などは JWT に入れず DB から毎回取得する
// → 管理者が情報変更しても即時反映、削除ユーザーは自動無効化
type SessionClaims = {
  userKey:         number
  organizationKey: number
  role:            UserRole
}

// ─── セッション発行 ─────────────────────────────────────────
/** ログイン成功後にセッション Cookie を発行（最小クレームのみ） */
export async function createSession(claims: SessionClaims) {
  const token = await new SignJWT(claims as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')        // 旧: 24h → 8h に短縮
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 8,          // 8時間
    path:     '/',
  })
}

// ─── セッション取得（DB から最新値を返す） ──────────────────
/**
 * JWT を検証し、DB から最新のユーザー情報を取得して返す。
 * - React.cache でリクエスト内の重複 DB クエリを排除
 * - ユーザーが削除されていれば null を返す（自動無効化）
 * - 部署名・組織名などは DB の現在値を返す（スタンプ問題解消）
 */
export const getSession = cache(async (): Promise<UserSession | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  let claims: SessionClaims
  try {
    const { payload } = await jwtVerify(token, SECRET)
    claims = payload as unknown as SessionClaims
  } catch {
    return null
  }

  try {
    const supabase = createServiceClient()

    const [{ data: user }, { data: org }] = await Promise.all([
      supabase
        .from('user_info')
        .select(`
          user_key, user_id, user_name, admin_flag, role, organization_key, avatar_url,
          department:department_data(department_id, department_name),
          job:job_data(job_id, job_name)
        `)
        .eq('user_key', claims.userKey)
        .eq('organization_key', claims.organizationKey)
        .single(),
      supabase
        .from('organization_data')
        .select('organization_id, organization_name')
        .eq('organization_key', claims.organizationKey)
        .single(),
    ])

    // ユーザーまたは組織が存在しない場合 → セッション無効
    if (!user || !org) return null

    return {
      userKey:          user.user_key,
      userId:           user.user_id,
      userName:         user.user_name,
      organizationKey:  user.organization_key,
      organizationId:   org.organization_id,
      organizationName: org.organization_name,
      departmentId:     (user.department as unknown as { department_id: number } | null)?.department_id ?? 0,
      departmentName:   (user.department as unknown as { department_name: string } | null)?.department_name ?? '',
      jobId:            (user.job as unknown as { job_id: number } | null)?.job_id ?? 0,
      jobName:          (user.job as unknown as { job_name: string } | null)?.job_name ?? '',
      role:             ((user as unknown as { role: string }).role ?? 'member') as UserRole,
      adminFlag:        ((user as unknown as { role: string }).role ?? 'member') === 'admin',
      avatarUrl:        (user as unknown as { avatar_url: string | null }).avatar_url ?? null,
    }
  } catch {
    return null
  }
})

// ─── ログアウト ─────────────────────────────────────────────
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// ─── 初期セットアップ用ワンタイムトークン ──────────────────
/**
 * 組織登録直後に発行するセットアップトークン。
 * URL に生の organizationKey を露出させないために使用する。
 * - 有効期限 30 分
 * - 署名付き（偽造・改ざん不可）
 * - `sub: 'setup'` でセッショントークンと区別
 */
export async function createSetupToken(organizationKey: number): Promise<string> {
  return new SignJWT({ sub: 'setup', organizationKey } as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30m')
    .sign(SECRET)
}

/**
 * セットアップトークンを検証し organizationKey を返す。
 * 無効・期限切れ・不正な場合は null を返す。
 */
export async function verifySetupToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (payload.sub !== 'setup') return null
    const orgKey = payload.organizationKey
    if (typeof orgKey !== 'number' || orgKey <= 0) return null
    return orgKey
  } catch {
    return null
  }
}
