import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '業務連絡システム',
    short_name: '業務連絡',
    description: '部署間の業務連絡を管理するシステム',
    start_url: '/home',
    display: 'standalone',
    background_color: '#f5f5f5',
    theme_color: '#2563eb',
    orientation: 'portrait',
    icons: [
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
      { src: '/icon',       sizes: '32x32',   type: 'image/png' },
    ],
  }
}
