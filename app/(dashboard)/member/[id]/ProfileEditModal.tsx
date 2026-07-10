'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Pencil, Camera } from 'lucide-react'
import { updateProfile } from '@/actions/profile'

type Props = {
  userKey: number
  currentAffiliation: string | null
  currentProfile: string | null
  currentAvatarUrl: string | null
  currentSocialWorkerMemberId: string | null
}

export default function ProfileEditModal({
  userKey,
  currentAffiliation,
  currentProfile,
  currentAvatarUrl,
  currentSocialWorkerMemberId,
}: Props) {
  const router = useRouter()
  const [open, setOpen]               = useState(false)
  const [affiliation, setAffiliation] = useState(currentAffiliation ?? '')
  const [profile, setProfile]         = useState(currentProfile ?? '')
  const [socialWorkerMemberId, setSocialWorkerMemberId] = useState(currentSocialWorkerMemberId ?? '')
  const [error, setError] = useState('')
  const [preview, setPreview]         = useState<string | null>(null)
  const fileRef                        = useRef<HTMLInputElement>(null)
  const [isPending, startTransition]  = useTransition()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError('')
    startTransition(async () => {
      const result = await updateProfile(fd)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
      setOpen(false)
    })
  }

  const avatarSrc = preview ?? currentAvatarUrl

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="pressable flex items-center gap-1.5 min-h-[44px] text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-2.5 rounded-md transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        プロフィール編集
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4 anim-overlay"
          onClick={() => setOpen(false)}
        >
          <div
            className="safe-pb max-h-[95dvh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-xl anim-sheet-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">プロフィール編集</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="user_key" value={userKey} />

              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              {/* アバター */}
              <div className="flex justify-center">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-blue-400 transition-colors block"
                  >
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center">
                        <Camera className="w-6 h-6 text-gray-400" />
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
                  >
                    <Camera className="w-3 h-3 text-white" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    name="avatar"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFile}
                  />
                </div>
              </div>

              <input
                name="affiliation"
                value={affiliation}
                onChange={e => setAffiliation(e.target.value)}
                placeholder="所属（例：〇〇施設、△△法人）"
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <div>
                <label htmlFor="social-worker-member-id" className="mb-1.5 block text-xs font-medium text-gray-600">社会福祉士会ID</label>
                <input
                  id="social-worker-member-id"
                  name="social_worker_member_id"
                  value={socialWorkerMemberId}
                  onChange={e => setSocialWorkerMemberId(e.target.value)}
                  maxLength={50}
                  autoComplete="off"
                  placeholder="会員番号を入力"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-400">活動費請求フォームの会員番号へ自動入力されます</p>
              </div>

              <textarea
                name="profile"
                value={profile}
                onChange={e => setProfile(e.target.value)}
                placeholder="自己紹介・専門分野など"
                rows={4}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 text-sm btn-pop text-white py-2 rounded disabled:opacity-40 transition-colors"
                >
                  {isPending ? '保存中...' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
