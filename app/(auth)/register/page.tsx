'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerOrganization } from '@/actions/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await registerOrganization(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push(`/departmentjob/register?orgKey=${result.organizationKey}&initial=true`)
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

        <div className="px-8 py-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1 tracking-tight">団体を新規登録</h2>
          <p className="text-sm text-slate-400 mb-6">組織情報を入力してアカウントを作成</p>

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
                placeholder="例: ORG123（英数字）"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                団体名
              </label>
              <input
                type="text" name="organizationName" required
                placeholder="例: 株式会社サンプル"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                パスワード
              </label>
              <input
                type="password" name="organizationPassword" required minLength={8}
                placeholder="8文字以上"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors mt-2 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  登録中…
                </span>
              ) : '登録して次へ →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link href="/login" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
              ← ログインに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
