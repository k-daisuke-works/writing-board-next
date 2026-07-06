'use client'

import { useEffect } from 'react'

/** ルートレイアウトでSWを常時登録する（通知ボタン非依存でPWA機能を有効化） */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
