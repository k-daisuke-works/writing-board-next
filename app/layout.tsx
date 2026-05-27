import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '業務連絡システム',
  description: '部署間の業務連絡を管理するシステム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
