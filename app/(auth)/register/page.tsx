'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerOrganization } from '@/actions/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
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

    // 登録成功 → 部署・職種登録へ（organizationKey を渡す）
    router.push(`/departmentjob/register?orgKey=${result.organizationKey}&initial=true`)
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-teal-600 px-8 py-6 text-center">
          <h1 className="text-2xl font-bold text-white">📝 団体新規登録</h1>
        </div>

        <div className="px-8 py-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                団体ID
              </label>
              <input
                type="text"
                name="organizationId"
                required
                placeholder="例: ORG123"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                団体名
              </label>
              <input
                type="text"
                name="organizationName"
                required
                placeholder="例: 株式会社サンプル"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                name="organizationPassword"
                required
                minLength={8}
                placeholder="8文字以上"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? '登録中...' : '登録する'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-blue-500 hover:underline">
              ← ログインに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
