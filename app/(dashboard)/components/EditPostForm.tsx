'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Paperclip, Check } from 'lucide-react'
import { updatePost } from '@/actions/posts'

/** 投稿編集フォーム（部署ページ・メンバー詳細で共用）。成功/失敗のフィードバックつき */
export default function EditPostForm({
  writingId,
  defaultTitle,
  defaultMessage,
}: {
  writingId: number
  defaultTitle: string
  defaultMessage: string
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setDone(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const r = await updatePost(fd)
        if (r?.error) { setError(r.error); return }
        setDone(true)
        router.refresh()
      } catch {
        setError('更新に失敗しました。もう一度お試しください。')
      }
    })
  }

  const inputCls = 'w-full min-h-[44px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white'

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-2.5">
      <input type="text" name="title" defaultValue={defaultTitle} maxLength={100} placeholder="タイトル（任意）" className={inputCls} />
      <textarea name="message" defaultValue={defaultMessage} rows={3}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors bg-white" />
      <div className="flex flex-wrap items-center gap-2">
        <input type="text" name="pin" placeholder="PIN"
          className="w-32 min-h-[44px] border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white" />
        <label className="flex items-center gap-1.5 border border-gray-300 rounded-md px-3 py-1.5 cursor-pointer hover:bg-white transition-colors text-sm text-gray-500">
          <Paperclip className="w-3.5 h-3.5" />PDF
          <input type="file" name="pdfFile" accept=".pdf" className="sr-only" />
        </label>
        <button type="submit" disabled={pending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-60">
          {pending ? '更新中…' : '更新'}
        </button>
        {done && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <Check className="w-3.5 h-3.5" />更新しました
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </form>
  )
}
