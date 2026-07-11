import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

/** Server Component / Server Action で使う Supabase クライアント（anon key）*/
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

/**
 * サービスロールクライアント（サーバーサイドのみ）
 * RLS をバイパスして全テーブルを操作できる。
 * 絶対にクライアント側に渡さないこと。
 *
 * 認証済みコンテキストでは createOrgClient を使うこと。
 * これを直接使ってよいのはセッション確立前（ログイン・セットアップ）、
 * Cron、内部API（INTERNAL_SECRET）、Storage 操作のみ。
 */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

// ─── 組織スコープクライアント（RLS 多層防御） ──────────────────
// Supabase のレガシー JWT シークレットで role=authenticated ＋
// organization_key クレームを自己署名し、PostgREST に RLS
// （org_isolation ポリシー）を適用させる。アプリ層の
// .eq('organization_key') が漏れても他団体のデータには到達できない。

const ORG_TOKEN_TTL_SEC = 3600
const orgTokenCache = new Map<string, { token: string; expiresAt: number }>()
let warnedMissingSecret = false

async function signOrgToken(organizationKey: number, userKey?: number): Promise<string | null> {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) {
    if (!warnedMissingSecret) {
      warnedMissingSecret = true
      console.error('[supabase] SUPABASE_JWT_SECRET 未設定のため service role にフォールバック中（RLS 多層防御が無効）')
    }
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  const cacheKey = `${organizationKey}:${userKey ?? ''}`
  const cached = orgTokenCache.get(cacheKey)
  // 期限5分前を過ぎたら再署名（実行中のリクエストが期限を跨がないように）
  if (cached && cached.expiresAt - 300 > now) return cached.token

  const token = await new SignJWT({
    role: 'authenticated',
    organization_key: organizationKey,
    // DM等の「本人限定」RLSポリシー用。付けない限り participant 系テーブルは全拒否
    ...(userKey !== undefined ? { user_key: userKey } : {}),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(now + ORG_TOKEN_TTL_SEC)
    .sign(new TextEncoder().encode(secret))
  orgTokenCache.set(cacheKey, { token, expiresAt: now + ORG_TOKEN_TTL_SEC })
  return token
}

/**
 * 組織スコープの Supabase クライアント（サーバーサイドのみ）。
 * 認証済みの Server Action / ページ / API では必ずこちらを使う:
 *   const supabase = await createOrgClient(session.organizationKey)
 *
 * DM など「参加者本人限定」テーブルへのアクセスには userKey を渡す:
 *   await createOrgClient(session.organizationKey, { userKey: session.userKey })
 *
 * SUPABASE_JWT_SECRET 未設定時は service role にフォールバックする
 * （アプリは止めず、多層防御だけが無効になる）。
 */
export async function createOrgClient(organizationKey: number, opts?: { userKey?: number }) {
  const token = await signOrgToken(organizationKey, opts?.userKey)
  if (!token) return createServiceClient()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  )
}
