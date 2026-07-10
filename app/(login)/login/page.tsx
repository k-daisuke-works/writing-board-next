'use client'

import { useState } from 'react'
import { login } from '@/actions/auth'
import Link from 'next/link'
import { ANNOUNCEMENTS } from '@/lib/announcements'

const inputCls = "w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 min-h-[44px] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#ffc300] focus:ring-2 focus:ring-[#ffc300]/40 transition-colors bg-white"
const labelCls = "block text-sm font-bold text-gray-700 mb-1.5"

export default function LoginPage() {
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await login(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div className="anim-fade-in w-full max-w-md">
      <div className="bg-white rounded-[28px] shadow-xl shadow-amber-900/5 px-6 py-8 sm:px-8">
        <h1 className="font-maru text-2xl font-extrabold mb-1" style={{ color: '#001e5a' }}>ログイン</h1>
        <p className="text-sm text-gray-500 mb-7">団体IDとユーザー情報を入力してください</p>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4.5">
          <div>
            <label className={labelCls}>団体ID</label>
            <input type="text" name="organizationId" required placeholder="例: ORG123" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ユーザーID</label>
            <input type="text" name="userId" required placeholder="例: USER001" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>パスワード</label>
            <input type="password" name="password" required minLength={8} placeholder="8文字以上" className={inputCls} />
          </div>

          <button
            type="submit" disabled={loading}
            className="font-maru w-full min-h-[48px] mt-2 disabled:opacity-60 text-white font-bold py-3 rounded-full text-base transition-transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            style={{ background: '#001e5a', boxShadow: '0 5px 0 #001240' }}
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />ログイン中…</>
              : 'ログイン'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowForgot(v => !v)}
            className="inline-flex items-center justify-center min-h-[44px] px-3 text-sm font-bold text-[#17798a] hover:text-[#0f5561]"
          >
            パスワードをお忘れですか？
          </button>
          {showForgot && (
            <div className="anim-fade-in mt-2 text-left rounded-2xl px-4 py-3.5 text-sm text-gray-700 space-y-2 bg-[#fff4d1] border border-[#f3d9ad]">
              <p className="font-bold text-gray-900">パスワードの再設定手順</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>所属団体の<span className="font-bold">管理者</span>にパスワードのリセットを依頼してください。</li>
                <li>管理者が発行した<span className="font-bold">仮パスワード</span>でログインします。</li>
                <li>ログイン後、新しいパスワードの設定画面が自動で表示されます。</li>
              </ol>
              <p className="text-xs text-gray-500">
                ※管理者の方は、メールアドレス登録済みであれば{' '}
                <Link href="/forgot-password" className="font-bold text-[#17798a] hover:text-[#0f5561]">メールで再設定</Link>
                できます。
              </p>
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-sm text-gray-500">
          団体アカウントをお持ちでない方は{' '}
          <Link href="/register" className="font-bold text-[#17798a] hover:text-[#0f5561]">新規登録</Link>
        </p>
      </div>

      {/* 最近のアップデート */}
      <div className="mt-6 px-2">
        <p className="font-maru text-xs font-bold text-gray-400 tracking-wide mb-3">最近のアップデート</p>
        <ul className="space-y-2.5">
          {ANNOUNCEMENTS.slice(0, 3).map(a => (
            <li key={a.version} className="flex items-baseline gap-2.5 text-sm">
              <span className="text-xs text-gray-400 tabular-nums shrink-0">{a.date}</span>
              <span className="font-maru text-xs font-bold shrink-0 rounded-full px-2 py-0.5" style={{ background: '#fff4d1', color: '#8a6d00' }}>{a.version}</span>
              <span className="text-gray-600 min-w-0">{a.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
