'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerOrganization } from '@/actions/auth'

const inputCls = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await registerOrganization(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false); return }
    router.push(`/departmentjob/register?orgKey=${result.organizationKey}&initial=true`)
  }

  return (
    <div className="anim-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">団体を新規登録</h1>
      <p className="text-sm text-gray-500 mb-8">組織情報を入力してアカウントを作成します</p>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelCls}>団体ID <span className="text-gray-400 font-normal text-xs">（英数字、変更不可）</span></label>
          <input type="text" name="organizationId" required placeholder="例: acme-corp" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>団体名</label>
          <input type="text" name="organizationName" required placeholder="例: 株式会社サンプル" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>管理パスワード</label>
          <input type="password" name="organizationPassword" required minLength={8} placeholder="8文字以上" className={inputCls} />
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />登録中…</>
            : '登録して次へ'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">ログイン</Link>
      </p>
    </div>
  )
}
