'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Trash2 } from 'lucide-react'
import { createScheduleEvent } from '@/actions/schedule'
import type { Department } from '@/types/database'

type Props = {
  departments: Department[]
  onClose: () => void
}

const inputCls = "w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"

export default function CreateEventModal({ departments, onClose }: Props) {
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [scope,       setScope]       = useState<'all_departments' | 'department'>('all_departments')
  const [targetDeptId, setTargetDeptId] = useState<number | ''>('')
  const [dates,       setDates]       = useState<string[]>([''])
  const [error,       setError]       = useState('')
  const [isPending,   startTransition] = useTransition()
  const router = useRouter()

  const targetDept = departments.find(d => d.department_id === Number(targetDeptId))

  function addDate()               { setDates(prev => [...prev, '']) }
  function removeDate(i: number)   { setDates(prev => prev.filter((_, j) => j !== i)) }
  function updateDate(i: number, v: string) { setDates(prev => prev.map((d, j) => j === i ? v : d)) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validDates = dates.filter(d => d.trim())
    if (!title.trim())                             { setError('タイトルを入力してください。'); return }
    if (scope === 'department' && !targetDeptId)   { setError('対象部署を選択してください。'); return }
    if (!validDates.length)                        { setError('候補日時を1つ以上入力してください。'); return }

    const fd = new FormData()
    fd.set('title', title.trim())
    if (description.trim()) fd.set('description', description.trim())
    fd.set('scope', scope)
    if (scope === 'department' && targetDept) {
      fd.set('targetDeptId',   String(targetDept.department_id))
      fd.set('targetDeptName', targetDept.department_name)
    }
    validDates.forEach(d => fd.append('dates', d))

    startTransition(async () => {
      const result = await createScheduleEvent(fd)
      if (result?.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 anim-overlay"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-2xl w-full sm:max-w-lg flex flex-col max-h-[92dvh] anim-slide-down">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0 relative">
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full sm:hidden" />
          <h2 className="text-sm font-semibold text-gray-900 mt-1 sm:mt-0">新しいイベントを作成</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-md px-3 py-2.5 text-sm">{error}</div>
          )}

          {/* タイトル */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">タイトル <span className="text-red-500">*</span></label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="例: 7月全体会議" className={inputCls} />
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              説明 <span className="text-gray-400 font-normal">（任意）</span>
            </label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={2} placeholder="イベントの詳細を入力…"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors" />
          </div>

          {/* スコープ */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">対象範囲</label>
            <div className="flex gap-2">
              {(['all_departments', 'department'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setScope(s)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                    scope === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}>
                  {s === 'all_departments' ? '全部署' : '特定部署'}
                </button>
              ))}
            </div>
          </div>

          {/* 部署選択 */}
          {scope === 'department' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">対象部署 <span className="text-red-500">*</span></label>
              <select value={targetDeptId} onChange={e => setTargetDeptId(Number(e.target.value))} className={inputCls}>
                <option value="">-- 部署を選択 --</option>
                {departments.map(d => (
                  <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* 候補日時 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-700">候補日時 <span className="text-red-500">*</span></label>
              <button type="button" onClick={addDate}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors">
                <Plus className="w-3.5 h-3.5" />追加
              </button>
            </div>
            <div className="space-y-2">
              {dates.map((d, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="datetime-local"
                    value={d}
                    onChange={e => updateDate(i, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                  {dates.length > 1 && (
                    <button type="button" onClick={() => removeDate(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-2.5 pt-1 pb-safe">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-md hover:bg-gray-50 transition-colors">
              キャンセル
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-md transition-colors flex items-center justify-center gap-2">
              {isPending
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />作成中…</>
                : '作成する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
