import type { NextConfig } from 'next'

const securityHeaders = [
  // クリックジャッキング防止
  { key: 'X-Frame-Options', value: 'DENY' },
  // MIME スニッフィング防止
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // リファラー情報の制限
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // 不要なブラウザ機能へのアクセスを制限
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // HTTPS 強制（本番環境）
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // XSS フィルター（レガシーブラウザ向け）
  { key: 'X-XSS-Protection', value: '1; mode=block' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
