import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'RoScope',
    short_name: 'RoScope',
    description: 'チームの今を、一目で見渡す。',
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    background_color: '#f5f5f5',
    theme_color: '#2563eb',
    orientation: 'portrait',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // 全面塗りアイコンのため maskable としても利用可能
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
