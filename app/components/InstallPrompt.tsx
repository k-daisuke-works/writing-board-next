'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

const DISMISSED_AT_KEY = 'roscope-install-prompt-dismissed-at'
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
}

function isAppleMobile() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function wasRecentlyDismissed() {
  const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY))
  return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_FOR_MS
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [mode, setMode] = useState<'install' | 'ios' | null>(null)

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setMode('install')
    }
    const handleInstalled = () => {
      localStorage.removeItem(DISMISSED_AT_KEY)
      setMode(null)
      setInstallEvent(null)
    }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    const iosTimer = isAppleMobile()
      ? window.setTimeout(() => setMode('ios'), 900)
      : undefined

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      if (iosTimer) window.clearTimeout(iosTimer)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()))
    setMode(null)
  }

  async function install() {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') localStorage.removeItem(DISMISSED_AT_KEY)
    else localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()))
    setMode(null)
    setInstallEvent(null)
  }

  if (!mode) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:items-center" role="presentation">
      <section
        aria-labelledby="install-prompt-title"
        aria-modal="true"
        className="anim-slide-down relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/70 bg-white p-6 shadow-2xl shadow-slate-950/25"
        role="dialog"
      >
        <button onClick={dismiss} className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800" aria-label="閉じる">
          <X className="size-4" />
        </button>

        <div className="mb-5 flex items-center gap-4 pr-8">
          <div className="rounded-2xl bg-white p-1 shadow-lg ring-1 ring-slate-200">
            <Image src="/icon-192.png" alt="" width={56} height={56} className="size-14 rounded-xl" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">RoScope App</p>
            <h2 id="install-prompt-title" className="mt-1 text-xl font-black tracking-tight text-slate-950">アプリとして使いませんか？</h2>
          </div>
        </div>

        {mode === 'install' ? (
          <>
            <p className="text-sm leading-6 text-slate-600">ホーム画面からすぐ開けて、ブラウザの枠なしで快適に使えます。</p>
            <button onClick={install} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-lg">
              <Download className="size-4" />インストールする
            </button>
          </>
        ) : (
          <>
            <p className="text-sm leading-6 text-slate-600">iPhone・iPadでは、Safariの共有メニューからホーム画面へ追加できます。</p>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-100 font-bold text-indigo-700">1</span><span className="flex items-center gap-1.5">画面下の <Share className="size-4 text-blue-600" />「共有」をタップ</span></li>
                <li className="flex items-center gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-100 font-bold text-indigo-700">2</span>「ホーム画面に追加」を選択</li>
                <li className="flex items-center gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-100 font-bold text-indigo-700">3</span>「Webアプリとして開く」をオン</li>
              </ol>
            </div>
          </>
        )}

        <button onClick={dismiss} className="mt-3 w-full py-2 text-sm font-medium text-slate-400 transition hover:text-slate-600">あとで</button>
      </section>
    </div>
  )
}
