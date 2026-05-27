'use client'

import { useTransition } from 'react'

type Props = {
  action: (formData: FormData) => Promise<unknown>
  writingId: number
}

export function DeletePostButton({ action, writingId }: Props) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!confirm('本当に削除しますか？')) return
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await action(formData)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <input type="hidden" name="writingId" value={writingId} />
      <input
        type="password"
        name="pin"
        placeholder="PIN（設定している場合）"
        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-60"
      >
        {pending ? '削除中…' : '削除'}
      </button>
    </form>
  )
}
