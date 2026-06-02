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
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !PUBLIC_KEY) {
      setStatus('unsupported')
      return
    }
    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        setStatus('subscribed')
      } else if (Notification.permission === 'denied') {
        setStatus('denied')
      } else {
        setStatus('unsubscribed')
      }
    })
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
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
        status === 'subscribed'
          ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
          : status === 'denied'
          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
      }`}
      disabled={status === 'denied'}
    >
      {status === 'subscribed' ? (
        <><Bell className="w-3.5 h-3.5" />通知オン</>
      ) : status === 'denied' ? (
        <><BellOff className="w-3.5 h-3.5" />通知ブロック中</>
      ) : (
        <><Bell className="w-3.5 h-3.5" />通知を受け取る</>
      )}
    </button>
  )
}
