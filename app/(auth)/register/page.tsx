'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerOrganization } from '@/actions/auth'
import { SetupStepper } from '../SetupStepper'

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700"

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
    // 生の organizationKey の代わりに署名付きセットアップトークンを URL に使用
    router.push(`/departmentjob/register?token=${result.setupToken}`)
  }

  return (
    <div className="anim-fade-in w-full max-w-md rounded-3xl border border-white/80 bg-white/85 p-6 shadow-xl shadow-slate-200/60 backdrop-blur sm:p-8">
      {/* ステッパー */}
      <SetupStepper current={1} />

      {/* タイトル */}
      <div className="mb-7">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Welcome to RoScope</p>
        <h1 className="mb-1.5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">組織のスペースを作成</h1>
        <p className="text-sm leading-6 text-slate-500">
          まずは団体の基本情報を入力してください
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>
            団体ID
            <span className="ml-1.5 text-xs text-gray-400 font-normal">英数字・ハイフン（変更不可）</span>
          </label>
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

        <div className="pt-1">
          <button
            type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-wait disabled:translate-y-0 disabled:opacity-60"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />登録中…</>
              : '次へ：部署・職種の登録'}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">ログイン</Link>
      </p>
    </div>
  )
}
