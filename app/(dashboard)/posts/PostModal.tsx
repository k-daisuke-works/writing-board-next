'use client'

import { useState, useEffect, useRef } from 'react'
import { createPost } from '@/actions/posts'
import type { UserSession } from '@/types/database'
import { X, Paperclip, Image, Video, XCircle, AlertCircle } from 'lucide-react'

type Props = {
  session: UserSession
  postType?: 'board' | 'team' | 'notice'
  onClose: () => void
}

const inputCls = "w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"

export default function PostModal({ session, postType = 'board', onClose }: Props) {
  const [message,    setMessage]    = useState('')
  const [pin,        setPin]        = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [imageFile,  setImageFile]  = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [videoFile,  setVideoFile]  = useState<File | null>(null)
  const [pdfFile,    setPdfFile]    = useState<File | null>(null)
  const [isImportant,  setIsImportant]  = useState(false)
  const [displayUntil, setDisplayUntil] = useState('')

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview) }
  }, [imagePreview])

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!message.trim()) { setError('内容を入力してください。'); return }
    setLoading(true)
    const fd = new FormData()
    fd.set('message', message)
    fd.set('pin', pin)
    fd.set('postType', postType)
    fd.set('isImportant', isImportant ? '1' : '0')
    if (isImportant && displayUntil) fd.set('displayUntil', displayUntil)
    if (imageFile) fd.set('imageFile', imageFile)
    if (videoFile) fd.set('videoFile', videoFile)
    if (pdfFile)   fd.set('pdfFile',   pdfFile)
    const result = await createPost(fd)
    if (result?.error) { setError(result.error); setLoading(false); return }
    onClose()
  }

  const title = postType === 'team' ? 'チームにメッセージ' : postType === 'notice' ? 'お知らせを投稿' : '新規投稿'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 anim-overlay"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-2xl w-full sm:max-w-lg flex flex-col max-h-[92dvh] sm:max-h-[90vh] anim-slide-down">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0 relative">
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full sm:hidden" />
          <div className="mt-1 sm:mt-0">
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{session.departmentName} · {session.userName}</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* フォーム */}
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
              rows={5} placeholder={postType === 'team' ? 'チームへのメッセージを入力…' : postType === 'notice' ? 'お知らせの内容を入力してください…' : '全体掲示板の内容を入力してください…'}
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{message.length}文字</p>
          </div>

          {/* PIN */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              PINコード <span className="text-gray-400 font-normal">（任意・編集削除時に使用）</span>
            </label>
            <input
              type="text" value={pin} onChange={(e) => setPin(e.target.value)}
              placeholder="任意のPINを設定" className={inputCls}
            />
          </div>

          {/* 添付ファイル */}
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">添付ファイル <span className="text-gray-400 font-normal">（任意）</span></p>
            <div className="flex gap-2">
              {/* 画像 */}
              <label className={`flex-1 flex items-center justify-center gap-1.5 border rounded-md px-3 py-2 cursor-pointer text-xs font-medium transition-colors ${imageFile ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                <Image className="w-3.5 h-3.5" />画像
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" onChange={onImageChange} />
              </label>
              {/* 動画 */}
              <label className={`flex-1 flex items-center justify-center gap-1.5 border rounded-md px-3 py-2 cursor-pointer text-xs font-medium transition-colors ${videoFile ? 'border-purple-400 bg-purple-50 text-purple-600' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                <Video className="w-3.5 h-3.5" />動画
                <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/avi" className="sr-only"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
              </label>
              {/* PDF */}
              <label className={`flex-1 flex items-center justify-center gap-1.5 border rounded-md px-3 py-2 cursor-pointer text-xs font-medium transition-colors ${pdfFile ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                <Paperclip className="w-3.5 h-3.5" />PDF
                <input ref={pdfInputRef} type="file" accept=".pdf" className="sr-only"
                  onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            {/* プレビュー */}
            {(imageFile || videoFile || pdfFile) && (
              <div className="mt-2 space-y-1.5">
                {imageFile && imagePreview && (
                  <div className="flex items-center gap-2 bg-blue-50 rounded-md p-2">
                    <img src={imagePreview} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                    <span className="text-xs text-blue-700 truncate flex-1">{imageFile.name}</span>
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); if (imageInputRef.current) imageInputRef.current.value = '' }}>
                      <XCircle className="w-4 h-4 text-blue-400 hover:text-blue-600" />
                    </button>
                  </div>
                )}
                {videoFile && (
                  <div className="flex items-center gap-2 bg-purple-50 rounded-md p-2">
                    <Video className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="text-xs text-purple-700 truncate flex-1">{videoFile.name}</span>
                    <button type="button" onClick={() => { setVideoFile(null); if (videoInputRef.current) videoInputRef.current.value = '' }}>
                      <XCircle className="w-4 h-4 text-purple-400 hover:text-purple-600" />
                    </button>
                  </div>
                )}
                {pdfFile && (
                  <div className="flex items-center gap-2 bg-orange-50 rounded-md p-2">
                    <Paperclip className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="text-xs text-orange-700 truncate flex-1">{pdfFile.name}</span>
                    <button type="button" onClick={() => { setPdfFile(null); if (pdfInputRef.current) pdfInputRef.current.value = '' }}>
                      <XCircle className="w-4 h-4 text-orange-400 hover:text-orange-600" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 重要フラグ */}
          <label className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md border cursor-pointer transition-colors ${isImportant ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <input
              type="checkbox"
              checked={isImportant}
              onChange={(e) => { setIsImportant(e.target.checked); if (!e.target.checked) setDisplayUntil('') }}
              className="w-4 h-4 accent-red-500"
            />
            <AlertCircle className={`w-4 h-4 shrink-0 ${isImportant ? 'text-red-500' : 'text-gray-400'}`} />
            <div>
              <p className={`text-sm font-medium ${isImportant ? 'text-red-700' : 'text-gray-700'}`}>重要な投稿としてマーク</p>
              <p className="text-xs text-gray-400">ホーム画面の「重要連絡」に表示されます</p>
            </div>
          </label>

          {/* 表示期限（boardの重要投稿のみ） */}
          {isImportant && postType === 'board' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                表示期限 <span className="text-gray-400 font-normal">（この日まで重要連絡に表示）</span>
              </label>
              <input
                type="date"
                value={displayUntil}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDisplayUntil(e.target.value)}
                className={inputCls}
              />
            </div>
          )}

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
