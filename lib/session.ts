import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { UserSession } from '@/types/database'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE_NAME = 'wb_session'

/** ログイン成功後にセッション Cookie を発行 */
export async function createSession(user: UserSession) {
  const token = await new SignJWT(user as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24時間
    path: '/',
  })
}

/** サーバー側でセッション情報を取得 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as UserSession
  } catch {
    return null
  }
}

/** ログアウト */
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
