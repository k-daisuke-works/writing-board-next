'use client'

import { useState } from 'react'
import { createPost } from '@/actions/posts'
import type { UserSession } from '@/types/database'

type Props = {
  session: UserSession
  onClose: () => void
}

export default function PostModal({ session, onClose }: Props) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!message.trim()) { setError('内容を入力してください。'); return }
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('message', message)

    const result = await createPost(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="font-bold text-lg">✏️ 新規投稿</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="内容を入力してください"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PINコード <span className="text-gray-400 font-normal">（任意・編集/削除時に必要）</span>
            </label>
            <input
              type="text"
              name="pin"
              placeholder="設定する場合は入力"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PDFファイル <span className="text-gray-400 font-normal">（任意）</span>
            </label>
            <input
              type="file"
              name="pdfFile"
              accept=".pdf"
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-60"
            >
              {loading ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
