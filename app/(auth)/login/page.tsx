'use client'

import { useState } from 'react'
import { login } from '@/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const result = await login(formData)

    // redirect() が投げられた場合はここに到達しない
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6 text-center">
          <h1 className="text-2xl font-bold text-white tracking-wide">
            📣 業務連絡システム
          </h1>
        </div>

        {/* フォーム */}
        <div className="px-8 py-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">団体ID</label>
              <input
                type="text"
                name="organizationId"
                required
                placeholder="例: ORG123"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ユーザーID</label>
              <input
                type="text"
                name="userId"
                required
                placeholder="例: USER001"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                placeholder="8文字以上"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/register" className="text-sm text-blue-500 hover:underline">
              📝 新しい団体を登録する
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
