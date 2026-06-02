import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: '業務連絡システム',
  description: '部署間の業務連絡を管理するシステム',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '業務連絡',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={inter.className}>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
