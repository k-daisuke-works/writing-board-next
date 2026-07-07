'use client'

import { useState, useRef, useEffect } from 'react'
import { mutate } from 'swr'
import { createPost } from '@/actions/posts'
import type { UserSession } from '@/types/database'
import { X, Paperclip, Image, Video, XCircle, AlertCircle } from 'lucide-react'

async function signAndUpload(
  file: File,
  fileType: 'image' | 'video' | 'pdf',
  onProgress: (pct: number) => void,
): Promise<string | null> {
  const res = await fetch('/api/storage/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileType, filename: file.name }),
  })
  const { signedUrl, path, error } = await res.json()
  if (error || !signedUrl) return null

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    })
    xhr.addEventListener('load', () => (xhr.status < 300 ? resolve() : reject()))
    xhr.addEventListener('error', reject)
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.send(file)
  })

  return path as string
}

type Props = {
  session: UserSession
  postType?: 'board' | 'team' | 'notice'
  defaultImportant?: boolean
  onClose: () => void
}

const inputCls = "w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"

export default function PostModal({ session, postType = 'board', defaultImportant = false, onClose }: Props) {
  const [message,       setMessage]       = useState('')
  const [pin,           setPin]           = useState('')
  const [loading,       setLoading]       = useState(false)
  const [submitted,     setSubmitted]     = useState(false)
  const [error,         setError]         = useState('')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [isImportant,   setIsImportant]   = useState(defaultImportant)
  const [displayUntil,  setDisplayUntil]  = useState('')

  const [imageItems, setImageItems] = useState<{ file: File; preview: string }[]>([])
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const [pdfFiles,   setPdfFiles]   = useState<File[]>([])

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef   = useRef<HTMLInputElement>(null)

  // Cleanup previews on unmount
  const imageItemsRef = useRef(imageItems)
  useEffect(() => { imageItemsRef.current = imageItems }, [imageItems])
  useEffect(() => () => { imageItemsRef.current.forEach(({ preview }) => URL.revokeObjectURL(preview)) }, [])

  function onImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setImageItems(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))])
    e.target.value = ''
  }
  function removeImage(i: number) {
    setImageItems(prev => {
      URL.revokeObjectURL(prev[i].preview)
      return prev.filter((_, j) => j !== i)
    })
  }
  function onVideoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    setVideoFiles(prev => [...prev, ...Array.from(e.target.files ?? [])])
    e.target.value = ''
  }
  function onPdfAdd(e: React.ChangeEvent<HTMLInputElement>) {
    setPdfFiles(prev => [...prev, ...Array.from(e.target.files ?? [])])
    e.target.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!message.trim()) { setError('内容を入力してください。'); return }
    setLoading(true)
    setUploadProgress(null)
    setError('')

    const totalFiles = imageItems.length + videoFiles.length + pdfFiles.length
    let done = 0
    function onFileProgress(filePct: number) {
      setUploadProgress(Math.round(((done + filePct / 100) / Math.max(totalFiles, 1)) * 100))
    }

    try {
      const imagePaths: string[] = []
      const videoPaths: string[] = []
      const pdfPaths:   string[] = []

      for (const { file } of imageItems) {
        const path = await signAndUpload(file, 'image', onFileProgress)
        if (!path) throw new Error('画像のアップロードに失敗しました。')
        imagePaths.push(path); done++
      }
      for (const file of videoFiles) {
        const path = await signAndUpload(file, 'video', onFileProgress)
        if (!path) throw new Error('動画のアップロードに失敗しました。')
        videoPaths.push(path); done++
      }
      for (const file of pdfFiles) {
        const path = await signAndUpload(file, 'pdf', onFileProgress)
        if (!path) throw new Error('PDFのアップロードに失敗しました。')
        pdfPaths.push(path); done++
      }

      if (totalFiles > 0) setUploadProgress(100)

      const fd = new FormData()
      fd.set('message', message)
      fd.set('pin', pin)
      fd.set('postType', postType)
      fd.set('isImportant', isImportant ? '1' : '0')
      if (isImportant && displayUntil) fd.set('displayUntil', displayUntil)
      fd.set('imagePaths', JSON.stringify(imagePaths))
      fd.set('videoPaths', JSON.stringify(videoPaths))
      fd.set('pdfPaths',   JSON.stringify(pdfPaths))

      const result = await createPost(fd)
      if (result?.error) { setError(result.error); setLoading(false); setUploadProgress(null); return }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました。')
      setLoading(false); setUploadProgress(null); return
    }

    setSubmitted(true)
    mutate(key => typeof key === 'string' && key.startsWith('/api/data/'))
    setTimeout(onClose, 800)
  }

  const title = postType === 'notice'
    ? 'お知らせを投稿'
    : postType === 'team'
      ? 'チームにメッセージ'
      : '新規投稿'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 anim-overlay"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div className="flex h-[100dvh] w-full flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:max-w-lg sm:rounded-xl anim-slide-down">

        {/* ヘッダー */}
        <div className="safe-pt relative flex shrink-0 items-center justify-between border-b border-gray-200 px-4 pb-3 pt-3 sm:px-5 sm:py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{session.departmentName} · {session.userName}</p>
          </div>
          <button onClick={onClose} disabled={loading}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-30 sm:min-h-0 sm:min-w-0 sm:w-7 sm:h-7">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3 sm:space-y-4 sm:p-5">
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
              rows={4} placeholder={postType === 'team' ? 'チームへのメッセージを入力…' : postType === 'notice' ? 'お知らせの内容を入力してください…' : '全体掲示板の内容を入力してください…'}
              className="h-24 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:h-32 sm:py-2.5"
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
            <p className="text-xs font-medium text-gray-700 mb-2">
              添付ファイル <span className="text-gray-400 font-normal">（任意・複数可）</span>
            </p>
            <div className="flex gap-2">
              {/* 画像 */}
              <label className={`flex-1 flex items-center justify-center gap-1.5 border rounded-md px-3 py-2 cursor-pointer text-xs font-medium transition-colors ${imageItems.length > 0 ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                <Image className="w-3.5 h-3.5" />
                画像{imageItems.length > 0 ? `(${imageItems.length})` : ''}
                <input ref={imageInputRef} type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" onChange={onImageAdd} />
              </label>
              {/* 動画 */}
              <label className={`flex-1 flex items-center justify-center gap-1.5 border rounded-md px-3 py-2 cursor-pointer text-xs font-medium transition-colors ${videoFiles.length > 0 ? 'border-purple-400 bg-purple-50 text-purple-600' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                <Video className="w-3.5 h-3.5" />
                動画{videoFiles.length > 0 ? `(${videoFiles.length})` : ''}
                <input ref={videoInputRef} type="file" multiple accept="video/mp4,video/quicktime,video/webm,video/avi" className="sr-only" onChange={onVideoAdd} />
              </label>
              {/* PDF */}
              <label className={`flex-1 flex items-center justify-center gap-1.5 border rounded-md px-3 py-2 cursor-pointer text-xs font-medium transition-colors ${pdfFiles.length > 0 ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                <Paperclip className="w-3.5 h-3.5" />
                PDF{pdfFiles.length > 0 ? `(${pdfFiles.length})` : ''}
                <input ref={pdfInputRef} type="file" multiple accept=".pdf" className="sr-only" onChange={onPdfAdd} />
              </label>
            </div>

            {/* プレビュー */}
            {(imageItems.length > 0 || videoFiles.length > 0 || pdfFiles.length > 0) && (
              <div className="mt-2 space-y-1.5">
                {imageItems.length > 0 && (
                  <div className={imageItems.length === 1 ? 'flex' : 'grid grid-cols-3 gap-1.5'}>
                    {imageItems.map((item, i) => (
                      <div key={i} className="relative">
                        <img src={item.preview} alt=""
                          className={`rounded object-cover border border-blue-100 ${imageItems.length === 1 ? 'w-16 h-16' : 'w-full h-16'}`}
                        />
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute -top-1 -right-1 bg-white rounded-full shadow">
                          <XCircle className="w-4 h-4 text-blue-400 hover:text-blue-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {videoFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-purple-50 rounded-md p-2">
                    <Video className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="text-xs text-purple-700 truncate flex-1">{f.name}</span>
                    <button type="button" onClick={() => setVideoFiles(prev => prev.filter((_, j) => j !== i))}>
                      <XCircle className="w-4 h-4 text-purple-400 hover:text-purple-600" />
                    </button>
                  </div>
                ))}
                {pdfFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-orange-50 rounded-md p-2">
                    <Paperclip className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="text-xs text-orange-700 truncate flex-1">{f.name}</span>
                    <button type="button" onClick={() => setPdfFiles(prev => prev.filter((_, j) => j !== i))}>
                      <XCircle className="w-4 h-4 text-orange-400 hover:text-orange-600" />
                    </button>
                  </div>
                ))}
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

          {/* 表示期限（重要フラグ時のみ） */}
          {isImportant && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                表示期限{' '}
                {postType === 'notice'
                  ? <span className="text-red-500">*</span>
                  : <span className="text-gray-400 font-normal">（この日まで固定表示）</span>
                }
              </label>
              <input
                type="date"
                value={displayUntil}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDisplayUntil(e.target.value)}
                required={postType === 'notice'}
                className={inputCls}
              />
              {postType === 'notice' && (
                <p className="text-xs text-gray-400 mt-1">重要なお知らせは表示期限の設定が必要です</p>
              )}
            </div>
          )}

          {/* アップロード進捗 */}
          {loading && uploadProgress !== null && (
            <div className="space-y-1.5">
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-400">
                {uploadProgress < 100 ? `${uploadProgress}% アップロード中…` : '処理中…'}
              </p>
            </div>
          )}

          </div>

          {/* 常に画面内に残る操作ボタン */}
          <div className="safe-pb flex shrink-0 gap-2.5 border-t border-gray-200 bg-white px-4 pb-3 pt-3 sm:p-5 sm:pt-4">
            <button type="button" onClick={onClose} disabled={loading}
              className="min-h-11 flex-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40">
              キャンセル
            </button>
            <button type="submit" disabled={loading || submitted || !message.trim()}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                submitted ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'
              }`}>
              {submitted
                ? '投稿しました ✓'
                : loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />送信中…</>
                  : '投稿する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
