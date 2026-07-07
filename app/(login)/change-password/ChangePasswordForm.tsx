'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { changePassword } from '@/actions/auth'
import { KeyRound } from 'lucide-react'

const inputCls = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5"

export default function ChangePasswordForm({ isForcedChange }: { isForcedChange: boolean }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await changePassword(new FormData(e.currentTarget))
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else {
        router.push('/home')
      }
    } catch {
      setError('エラーが発生しました。もう一度お試しください。')
      setLoading(false)
    }
  }

  return (
    <div className="anim-fade-in w-full max-w-md">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <KeyRound className="w-4.5 h-4.5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">パスワードを変更</h1>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        {isForcedChange
          ? '初回ログイン用の新しいパスワードを設定してください。'
          : 'セキュリティのため、新しいパスワードを設定してください。'}
      </p>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isForcedChange && (
          <div>
            <label className={labelCls}>現在のパスワード</label>
            <input type="password" name="currentPassword" required placeholder="現在のパスワードを入力" autoComplete="current-password" className={inputCls} />
          </div>
        )}
        <div>
          <label className={labelCls}>新しいパスワード</label>
          <input type="password" name="newPassword" required minLength={8} placeholder="8文字以上" autoComplete="new-password" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>新しいパスワード（確認）</label>
          <input type="password" name="confirmPassword" required minLength={8} placeholder="もう一度入力" autoComplete="new-password" className={inputCls} />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-md text-sm transition-colors flex items-center justify-center gap-2">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />変更中…</>
            : 'パスワードを変更する'}
        </button>
      </form>
    </div>
  )
}
