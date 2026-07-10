import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

// Content-Security-Policy（ISO27001 A.8.26 アプリケーションセキュリティ要件）
// - script-src: Next.js のインラインスクリプトに 'unsafe-inline' が必要。'unsafe-eval' は開発時のみ
// - frame-src: ユニゾンプラザ空き状況・Google フォームの埋め込みのみ許可
// - connect-src: 自オリジンと Supabase（REST / Storage / Realtime WebSocket）のみ
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // cdninstagram / fbcdn は /sns の Instagram 投稿画像（サーバー側キャッシュの表示のみ・スクリプトは読み込まない）
  "img-src 'self' data: blob: https://*.supabase.co https://images.pexels.com https://*.cdninstagram.com https://*.fbcdn.net",
  "media-src 'self' blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src https://www.unisonplaza-member.jp https://docs.google.com",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
]

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '11mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/api/pdf',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
    ]
  },
}

export default nextConfig
