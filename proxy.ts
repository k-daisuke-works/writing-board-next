import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

// 認証なしでアクセスできるパス
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/departmentjob/register',  // 初回セットアップ時（orgKey付き）も使用
  '/user/register',            // 初回セットアップ時（isInitial付き）も使用
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => p === '/' ? pathname === '/' : pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('wb_session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    // トークン期限切れ・不正
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('wb_session')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api/).*)'],
}
