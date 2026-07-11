'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerOrganization } from '@/actions/auth'
import { SetupStepper } from '../SetupStepper'
import { setupCard, setupHeading, setupInput, setupLabel, setupBtn, setupErrorBox } from '../setup-ui'

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
    <div className={`${setupCard} max-w-md`}>
      {/* ステッパー */}
      <SetupStepper current={1} />

      {/* タイトル */}
      <div className="mb-7">
        <h1 className={`${setupHeading} mb-1.5`}>団体を登録</h1>
        <p className="text-sm leading-6 text-gray-500">
          まずは団体の基本情報を入力してください
        </p>
      </div>

      {error && (
        <div className={setupErrorBox}>
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={setupLabel}>
            団体ID
            <span className="ml-1.5 text-xs text-gray-400 font-normal">英数字・ハイフン（変更不可）</span>
          </label>
          <input type="text" name="organizationId" required placeholder="例: chiiki-fukushikai" lang="en"
            autoComplete="off" autoCorrect="off" autoCapitalize="off" className={setupInput} />
        </div>
        <div>
          <label className={setupLabel}>団体名</label>
          <input type="text" name="organizationName" required placeholder="例: 〇〇県社会福祉士会" className={setupInput} />
        </div>
        <div>
          <label className={setupLabel}>管理パスワード</label>
          <input type="password" name="organizationPassword" required minLength={8} placeholder="8文字以上" autoComplete="new-password" className={setupInput} />
        </div>

        <div className="pt-1">
          <button type="submit" disabled={loading} className={setupBtn}>
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />登録中…</>
              : '次へ：部署・職種の登録'}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="font-bold text-[#17798a] hover:text-[#0f5561]">ログイン</Link>
      </p>
    </div>
  )
}
