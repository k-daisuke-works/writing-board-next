'use client'

import { useState, useTransition } from 'react'
import { registerUser, updateUser } from '@/actions/admin'
import type { UserInfo, Department, Job, Position, EmploymentType, UserRole } from '@/types/database'
import { X, Loader2 } from 'lucide-react'

type Props = {
  mode: 'add' | 'edit'
  user?: UserInfo
  departments: Department[]
  jobs: Job[]
  positions: Position[]
  employmentTypes: EmploymentType[]
  currentUserRole: UserRole
  onClose: () => void
  onSuccess: () => void
}

const inp = "w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
const lbl = "block text-xs font-medium text-gray-700 mb-1.5"

export default function UserFormModal({ mode, user, departments, jobs, positions, employmentTypes, currentUserRole, onClose, onSuccess }: Props) {
  const [error, setError]            = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)

    if (mode === 'add') {
      const raw        = (fd.get('userId') as string) ?? ''
      const normalized = raw.normalize('NFKC').trim()
      fd.set('userId', normalized)

      if (!normalized) {
        setError('ユーザーIDを入力してください。')
        return
      }
      if (!/^[a-zA-Z0-9_-]{1,50}$/.test(normalized)) {
        const info = [...normalized].map(c => `${c}(U+${c.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')})`).join(' ')
        console.error('[UserFormModal] userId invalid chars:', info)
        setError(`ユーザーIDは半角英数字・ハイフン・アンダースコアのみ使用できます。IMEを半角英数字モード（直接入力）にして入力してください。（入力値: ${normalized}）`)
        return
      }
    }

    startTransition(async () => {
      try {
        const result = mode === 'add' ? await registerUser(fd) : await updateUser(fd)
        if (result?.error) { setError(result.error); return }
        onSuccess()
      } catch {
        setError('エラーが発生しました。もう一度お試しください。')
      }
    })
  }

  return (
    /* オーバーレイ: モバイルは下揃え、sm以上は中央 */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 anim-overlay"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* モーダル本体: モバイルは画面下から、sm以上はカード */}
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-2xl w-full sm:max-w-md flex flex-col max-h-[92dvh] sm:max-h-[90vh] anim-sheet-up">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          {/* モバイル用ドラッグハンドル */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full sm:hidden" />
          <h2 className="text-sm font-semibold text-gray-900 mt-1 sm:mt-0">
            {mode === 'add' ? 'ユーザーを追加' : 'ユーザーを編集'}
          </h2>
          <button
            onClick={onClose}
            className="pressable w-10 h-10 -m-1.5 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* スクロール可能なフォーム領域 */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {mode === 'edit' && (
            <input type="hidden" name="userKey" value={user?.user_key} />
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-md px-3 py-2.5 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {mode === 'add' && (
              <div>
                <label className={lbl}>ユーザーID <span className="text-red-500">*</span></label>
                <input type="text" name="userId" required placeholder="例: USER001"
                  lang="en" autoComplete="off" autoCorrect="off" autoCapitalize="off"
                  className={inp} />
                <p className="text-xs text-gray-400 mt-1">半角英数字で入力（IMEをオフに）</p>
              </div>
            )}
            <div className={mode === 'add' ? '' : 'col-span-2'}>
              <label className={lbl}>ユーザー名 <span className="text-red-500">*</span></label>
              <input
                type="text" name="userName" required
                defaultValue={user?.user_name}
                placeholder="例: 山田太郎"
                autoComplete="off"
                className={inp}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>部署</label>
              <select name="departmentId" defaultValue={user?.department_id ?? ''} className={inp}>
                <option value="">未設定</option>
                {departments.map(d => (
                  <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>職種</label>
              <select name="jobId" defaultValue={user?.job_id ?? ''} className={inp}>
                <option value="">未設定</option>
                {jobs.map(j => (
                  <option key={j.job_id} value={j.job_id}>{j.job_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>役職</label>
              <select name="positionId" defaultValue={user?.position_id ?? ''} className={inp}>
                <option value="">未設定</option>
                {positions.map(p => (
                  <option key={p.position_id} value={p.position_id}>{p.position_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>雇用形態</label>
              <select name="employmentTypeId" defaultValue={user?.employment_type_id ?? ''} className={inp}>
                <option value="">未設定</option>
                {employmentTypes.map(et => (
                  <option key={et.employment_type_id} value={et.employment_type_id}>{et.employment_type_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>
              パスワード
              {mode === 'edit'
                ? <span className="text-gray-400 font-normal ml-1">（変更する場合のみ入力）</span>
                : <span className="text-red-500 ml-1">*</span>
              }
            </label>
            <input
              type="password" name="password"
              required={mode === 'add'} minLength={8}
              placeholder="8文字以上"
              autoComplete="new-password"
              className={inp}
            />
          </div>

          <div>
            <label className={lbl}>権限</label>
            <select name="role" defaultValue={user?.role ?? 'member'} className={inp}>
              {currentUserRole === 'admin' && (
                <option value="admin">管理者</option>
              )}
              <option value="leader">リーダー</option>
              <option value="member">メンバー</option>
            </select>
          </div>

          {mode === 'add' && (
            <label className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed cursor-pointer">
              <input type="checkbox" name="consent" value="agreed" required className="mt-0.5 w-5 h-5 shrink-0 accent-blue-600" />
              <span>
                登録する本人に
                <a href="/terms" target="_blank" className="underline hover:text-gray-800">利用規約</a>
                ・
                <a href="/privacy" target="_blank" className="underline hover:text-gray-800">プライバシーポリシー</a>
                の内容を説明し、同意を得ています
              </span>
            </label>
          )}
          <div className="flex gap-2.5 pt-1 pb-safe">
            <button
              type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-md hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit" disabled={isPending}
              className="flex-1 btn-pop disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" />保存中…</>
                : mode === 'add' ? '追加する' : '保存する'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
