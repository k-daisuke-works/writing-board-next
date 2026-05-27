'use client'

import { useTransition } from 'react'

type Props = {
  action: (formData: FormData) => Promise<unknown>
  fields: Record<string, string | number>
  label?: string
  confirmText?: string
  disabled?: boolean
  disabledReason?: string
}

/** 削除確認ダイアログ付きフォーム（Client Component） */
export function DeleteForm({
  action,
  fields,
  label = '削除',
  confirmText = '本当に削除しますか？',
  disabled = false,
  disabledReason,
}: Props) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!confirm(confirmText)) return
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await action(formData)
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        disabled={disabled || pending}
        title={disabledReason}
        className="text-xs text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        {pending ? '削除中…' : label}
      </button>
    </form>
  )
}
