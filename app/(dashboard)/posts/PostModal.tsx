'use client'

import { useState } from 'react'
import { createPost } from '@/actions/posts'
import type { UserSession } from '@/types/database'
import { X, Paperclip } from 'lucide-react'

type Props = { session: UserSession; onClose: () => void }

const inputCls = "w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"

export default function PostModal({ session, onClose }: Props) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!message.trim()) { setError('内容を入力してください。'); return }
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('message', message)
    const result = await createPost(fd)
    if (result?.error) { setError(result.error); setLoading(false); return }
    onClose()
  }

  return (
    /* オーバーレイ: モバイルは下揃え、sm以上は中央 */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 anim-overlay"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* モーダル本体 */}
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-2xl w-full sm:max-w-lg flex flex-col max-h-[92dvh] sm:max-h-[90vh] anim-slide-down">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0 relative">
          {/* モバイル用ドラッグハンドル */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full sm:hidden" />
          <div className="mt-1 sm:mt-0">
            <h2 className="text-sm font-semibold text-gray-900">新規投稿</h2>
            <p className="text-xs text-gray-400 mt-0.5">{session.departmentName} · {session.userName}</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* スクロール可能なフォーム */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-md px-3 py-2.5 text-sm">
              {error}
            </div>
          )}

          {/* 本文 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message} onChange={(e) => setMessage(e.target.value)}
              rows={5} placeholder="業務連絡の内容を入力してください…"
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{message.length}文字</p>
          </div>

          {/* PIN + PDF: モバイルは縦並び */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PIN */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                PINコード <span className="text-gray-400 font-normal">（任意）</span>
              </label>
              <input type="text" name="pin" placeholder="編集・削除時に使用" className={inputCls} />
            </div>
            {/* PDF */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                添付ファイル <span className="text-gray-400 font-normal">（PDF可）</span>
              </label>
              <label className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-400 truncate">ファイルを選択</span>
                <input type="file" name="pdfFile" accept=".pdf" className="sr-only" />
              </label>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-2.5 pt-1 pb-safe">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-md hover:bg-gray-50 transition-colors">
              キャンセル
            </button>
            <button type="submit" disabled={loading || !message.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-md transition-colors flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />送信中…</>
                : '投稿する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
