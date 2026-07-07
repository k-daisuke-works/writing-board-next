'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { subscribePush, unsubscribePush } from '@/actions/push'

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export default function PushNotificationButton() {
  const [status, setStatus] = useState<'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading'>('loading')

  useEffect(() => {
    async function initialize() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !PUBLIC_KEY) {
        await Promise.resolve()
        setStatus('unsupported')
        return
      }
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        const existing = await reg.pushManager.getSubscription()
        setStatus(existing ? 'subscribed' : Notification.permission === 'denied' ? 'denied' : 'unsubscribed')
      } catch {
        setStatus('unsupported')
      }
    }
    void initialize()
  }, [])

  async function toggle() {
    const reg = await navigator.serviceWorker.ready
    if (status === 'subscribed') {
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await unsubscribePush(sub.endpoint)
      }
      setStatus('unsubscribed')
    } else {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
      })
      const json = sub.toJSON()
      await subscribePush({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
      })
      setStatus('subscribed')
    }
  }

  if (status === 'loading' || status === 'unsupported') return null

  return (
    <button
      onClick={toggle}
      title={status === 'subscribed' ? '通知をオフにする' : '通知をオンにする'}
      className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-xs transition-colors sm:min-h-0 sm:min-w-0 sm:py-1.5 ${
        status === 'subscribed'
          ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
          : status === 'denied'
          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
      }`}
      disabled={status === 'denied'}
    >
      {status === 'subscribed' ? (
        <><Bell className="w-4 h-4 shrink-0 sm:w-3.5 sm:h-3.5" /><span className="hidden sm:inline">通知オン</span></>
      ) : status === 'denied' ? (
        <><BellOff className="w-4 h-4 shrink-0 sm:w-3.5 sm:h-3.5" /><span className="hidden sm:inline">通知ブロック中</span></>
      ) : (
        <><Bell className="w-4 h-4 shrink-0 sm:w-3.5 sm:h-3.5" /><span className="hidden sm:inline">通知を受け取る</span></>
      )}
    </button>
  )
}
