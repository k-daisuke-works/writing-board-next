'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/actions/auth'

const inputCls = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5"

export default function ForgotPasswordPage() {
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await requestPasswordReset(new FormData(e.currentTarget))
      if (result && 'error' in result && result.error) { setError(result.error); setLoading(false); return }
      setDone(true)
    } catch {
      setError('エラーが発生しました。もう一度お試しください。')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="anim-fade-in w-full max-w-md text-center">
        <div className="text-4xl mb-4">📮</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">送信を受け付けました</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          入力内容が管理者アカウント（メール登録済み）と一致した場合、<br className="hidden sm:block" />
          再設定リンクをメールでお送りしました。30分以内にお手続きください。
        </p>
        <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800 font-medium">ログイン画面に戻る</Link>
      </div>
    )
  }

  return (
    <div className="anim-fade-in w-full max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">パスワード再設定</h1>
      <p className="text-sm text-gray-500 mb-8">
        管理者向けのメール再設定です。登録済みのメールアドレス宛に再設定リンクを送信します。
        <span className="block mt-1 text-xs text-gray-400">※一般メンバーの方は管理者にリセットを依頼してください。</span>
      </p>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelCls}>団体ID</label>
          <input type="text" name="organizationId" required lang="en" autoComplete="off" autoCorrect="off" autoCapitalize="off" placeholder="例: ORG123" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>ユーザーID</label>
          <input type="text" name="userId" required lang="en" autoComplete="off" autoCorrect="off" autoCapitalize="off" placeholder="例: USER001" className={inputCls} />
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />送信中…</>
            : '再設定メールを送信'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">ログイン画面に戻る</Link>
      </p>
    </div>
  )
}
