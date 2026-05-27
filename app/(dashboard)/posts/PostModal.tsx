'use client'

import { useState } from 'react'
import { createPost } from '@/actions/posts'
import type { UserSession } from '@/types/database'

type Props = { session: UserSession; onClose: () => void }

export default function PostModal({ session, onClose }: Props) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!message.trim()) { setError('内容を入力してください。'); return }
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('message', message)
    const result = await createPost(formData)
    if (result?.error) { setError(result.error); setLoading(false); return }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-enter bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800">新規投稿</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {session.departmentName} · {session.userName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              内容 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="業務連絡の内容を入力…"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition resize-none"
            />
            <p className="text-xs text-slate-300 mt-1 text-right">{message.length} 文字</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                PINコード <span className="text-slate-300 font-normal normal-case">(任意)</span>
              </label>
              <input
                type="text" name="pin"
                placeholder="編集/削除時に必要"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                PDF <span className="text-slate-300 font-normal normal-case">(任意)</span>
              </label>
              <input
                type="file" name="pdfFile" accept=".pdf"
                className="w-full text-sm text-slate-400 pt-2 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl hover:bg-slate-50 transition text-sm font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit" disabled={loading || !message.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl transition text-sm font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  投稿中…
                </span>
              ) : '投稿する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
