import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SWRProvider from './SWRProvider'
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RoScope',
  description: 'チームの今を、一目で見渡す。',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RoScope',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={inter.className}>
      <body className="min-h-screen antialiased">
        <SWRProvider>{children}</SWRProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
