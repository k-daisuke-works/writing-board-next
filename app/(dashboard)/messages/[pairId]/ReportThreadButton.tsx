'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { discloseDmThread } from '@/actions/messages'
import { Flag } from 'lucide-react'

/** スレッドを管理者に開示（報告）する。取り消し不可のため確認ダイアログを挟む */
export default function ReportThreadButton({ pairId }: { pairId: number }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function report() {
    if (pending) return
    const fd = new FormData()
    fd.set('pairId', String(pairId))
    startTransition(async () => {
      try {
        const res = await discloseDmThread(fd)
        if (res?.error) { setError(res.error); return }
        setOpen(false)
        router.refresh()
      } catch {
        setError('報告に失敗しました。')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600"
      >
        <Flag className="h-3.5 w-3.5" />
        管理者に報告
      </button>

      {open && (
        <div
          className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => { if (!pending) setOpen(false) }}
        >
          <div className="max-h-[calc(100dvh-4rem)] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-900">管理者に報告しますか？</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              このスレッドの全メッセージが管理者に開示されます。取り消せません。
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="min-h-[44px] flex-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={report}
                disabled={pending}
                className="min-h-[44px] flex-1 rounded-lg bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {pending ? '報告中…' : '報告する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
