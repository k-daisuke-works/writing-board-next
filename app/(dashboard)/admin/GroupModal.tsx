'use client'

import { useState, useTransition } from 'react'
import { setGroupMembers } from '@/actions/admin'
import type { Group, UserInfo } from '@/types/database'
import { X, Check, Loader2, Users } from 'lucide-react'

type Props = {
  group: Group
  allUsers: UserInfo[]
  onClose: () => void
  onSuccess: () => void
}

export default function GroupModal({ group, allUsers, onClose, onSuccess }: Props) {
  const currentKeys = new Set((group.members ?? []).map(m => m.user_key))
  const [selected, setSelected] = useState<Set<number>>(new Set(currentKeys))
  const [isPending, startTransition] = useTransition()

  function toggle(userKey: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(userKey) ? next.delete(userKey) : next.add(userKey)
      return next
    })
  }

  function handleSave() {
    const fd = new FormData()
    fd.set('groupId', String(group.group_id))
    fd.set('userKeys', JSON.stringify([...selected]))
    startTransition(async () => {
      const r = await setGroupMembers(fd)
      if (r?.error) return
      onSuccess()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 anim-overlay"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-2xl w-full sm:max-w-md flex flex-col max-h-[80dvh] anim-sheet-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">{group.group_name} — メンバー設定</h2>
          </div>
          <button onClick={onClose} aria-label="閉じる" className="pressable w-10 h-10 -m-1.5 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {allUsers.map(u => (
            <button
              key={u.user_key}
              type="button"
              onClick={() => toggle(u.user_key)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                selected.has(u.user_key)
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300'
              }`}>
                {selected.has(u.user_key) && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{u.user_name}</div>
                <div className="text-xs text-gray-400 truncate">
                  {(u.department as { department_name?: string } | null)?.department_name ?? '—'}
                  {(u.job as { job_name?: string } | null)?.job_name ? ` · ${(u.job as { job_name: string }).job_name}` : ''}
                </div>
              </div>
            </button>
          ))}
          {allUsers.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-gray-400">ユーザーがいません</p>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-md hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 btn-pop disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />保存中…</> : `保存（${selected.size}名）`}
          </button>
        </div>
      </div>
    </div>
  )
}
