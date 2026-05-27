'use client'

import { useState } from 'react'
import { login } from '@/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        {/* アクセントバー */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />

        <div className="px-8 py-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1 tracking-tight">ログイン</h2>
          <p className="text-sm text-slate-400 mb-6">団体IDとユーザー情報を入力してください</p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                団体ID
              </label>
              <input
                type="text" name="organizationId" required
                placeholder="例: ORG123"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                ユーザーID
              </label>
              <input
                type="text" name="userId" required
                placeholder="例: USER001"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                パスワード
              </label>
              <input
                type="password" name="password" required minLength={8}
                placeholder="8文字以上"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors mt-2 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ログイン中…
                </span>
              ) : 'ログインする'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link href="/register" className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors">
              📝 新しい団体を登録する
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
