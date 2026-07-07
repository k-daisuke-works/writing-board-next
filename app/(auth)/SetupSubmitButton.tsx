'use client'

import { useFormStatus } from 'react-dom'
import { ArrowRight, LoaderCircle } from 'lucide-react'

export function SetupSubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-wait disabled:translate-y-0 disabled:opacity-70">
      {pending ? <><LoaderCircle className="size-4 animate-spin" />{pendingLabel}</> : <>{idleLabel}<ArrowRight className="size-4" /></>}
    </button>
  )
}
