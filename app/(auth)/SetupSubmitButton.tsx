'use client'

import { useFormStatus } from 'react-dom'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { setupBtn } from './setup-ui'

export function SetupSubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={setupBtn}>
      {pending ? <><LoaderCircle className="size-4 animate-spin" />{pendingLabel}</> : <>{idleLabel}<ArrowRight className="size-4" /></>}
    </button>
  )
}
