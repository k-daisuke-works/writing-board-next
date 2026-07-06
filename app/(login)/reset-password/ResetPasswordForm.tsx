'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPasswordWithToken } from '@/actions/auth'

const inputCls = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5"

export default function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await resetPasswordWithToken(new FormData(e.currentTarget))
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
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">パスワードを再設定しました</h1>
        <p className="text-sm text-gray-500 mb-8">新しいパスワードでログインしてください。</p>
        <Link href="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-md text-sm transition-colors">
          ログイン画面へ
        </Link>
      </div>
    )
  }

  return (
    <div className="anim-fade-in w-full max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">新しいパスワードの設定</h1>
      <p className="text-sm text-gray-500 mb-8">新しいパスワードを入力してください。</p>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <input type="hidden" name="token" value={token} />
        <div>
          <label className={labelCls}>新しいパスワード</label>
          <input type="password" name="newPassword" required minLength={8} autoComplete="new-password" placeholder="8文字以上" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>新しいパスワード（確認）</label>
          <input type="password" name="confirmPassword" required minLength={8} autoComplete="new-password" placeholder="もう一度入力" className={inputCls} />
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />設定中…</>
            : 'パスワードを再設定'}
        </button>
      </form>
    </div>
  )
}
