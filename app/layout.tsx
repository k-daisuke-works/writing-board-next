import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SWRProvider from './SWRProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RoScope',
  description: 'チームの今を、一目で見渡す。',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RoScope',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={inter.className}>
      <body className="min-h-screen antialiased">
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  )
}
