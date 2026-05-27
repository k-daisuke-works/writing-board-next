'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  deleteUser, deleteDepartment, deleteJob,
  createDepartment, createJob,
  updateDepartment, updateJob,
} from '@/actions/admin'
import type { UserInfo, Department, Job } from '@/types/database'
import UserFormModal from './UserFormModal'
import {
  ArrowLeft, Users, Building2, Briefcase,
  Plus, Pencil, Trash2, Check, X, Loader2,
} from 'lucide-react'

// ─── 型 ──────────────────────────────────────────────────
type Props = {
  users:          UserInfo[]
  departments:    Department[]
  jobs:           Job[]
  currentUserKey: number
  deptCnt:        Record<number, number>
  jobCnt:         Record<number, number>
  orgName:        string
}

type UserModalState =
  | { open: false }
  | { open: true; mode: 'add' }
  | { open: true; mode: 'edit'; user: UserInfo }

// ─── スタイル定数 ─────────────────────────────────────────
const addInp = "flex-1 min-w-0 border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"

// ─── インライン編集コンポーネント ────────────────────────
function InlineEdit({
  defaultValue, onSave, onCancel, isPending,
}: {
  defaultValue: string
  onSave: (v: string) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [val, setVal] = useState(defaultValue)
  return (
    <div className="flex-1 flex items-center gap-1">
      <input
        type="text" value={val} autoFocus
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter')  { e.preventDefault(); onSave(val) }
          if (e.key === 'Escape') onCancel()
        }}
        className="flex-1 min-w-0 border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
      <button type="button" onClick={() => onSave(val)} disabled={isPending}
        className="p-1 rounded text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50">
        <Check className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={onCancel}
        className="p-1 rounded text-gray-400 hover:bg-gray-100 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── メインコンポーネント ────────────────────────────────
export default function AdminPanel({
  users, departments, jobs, currentUserKey, deptCnt, jobCnt, orgName,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [userModal, setUserModal]    = useState<UserModalState>({ open: false })
  const [editDeptId, setEditDeptId]  = useState<number | null>(null)
  const [editJobId,  setEditJobId]   = useState<number | null>(null)
  const [newDept,    setNewDept]     = useState('')
  const [newJob,     setNewJob]      = useState('')
  const [toast, setToast]            = useState<{ msg: string; ok: boolean } | null>(null)

  // ── トースト ────────────────────────────────────────────
  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // ── ユーザー削除 ────────────────────────────────────────
  function handleDeleteUser(userKey: number, name: string) {
    if (!confirm(`${name} を削除しますか？`)) return
    const fd = new FormData(); fd.set('userKey', String(userKey))
    startTransition(async () => {
      const r = await deleteUser(fd)
      if (r?.error) showToast(r.error, false)
    })
  }

  // ── 部署 CRUD ───────────────────────────────────────────
  function handleAddDept(e: React.FormEvent) {
    e.preventDefault()
    if (!newDept.trim()) return
    const fd = new FormData(); fd.set('departmentName', newDept.trim())
    startTransition(async () => {
      const r = await createDepartment(fd)
      if (r?.error) showToast(r.error, false)
      else { setNewDept(''); showToast('追加しました') }
    })
  }

  function handleUpdateDept(deptId: number, name: string) {
    if (!name.trim()) return
    const fd = new FormData()
    fd.set('departmentId', String(deptId))
    fd.set('departmentName', name.trim())
    startTransition(async () => {
      const r = await updateDepartment(fd)
      if (r?.error) showToast(r.error, false)
      else { setEditDeptId(null); showToast('更新しました') }
    })
  }

  function handleDeleteDept(deptId: number, name: string, cnt: number) {
    if (cnt > 0) { showToast('所属ユーザーがいるため削除できません', false); return }
    if (!confirm(`${name} を削除しますか？`)) return
    const fd = new FormData(); fd.set('departmentId', String(deptId))
    startTransition(async () => {
      const r = await deleteDepartment(fd)
      if (r?.error) showToast(r.error, false)
    })
  }

  // ── 職種 CRUD ───────────────────────────────────────────
  function handleAddJob(e: React.FormEvent) {
    e.preventDefault()
    if (!newJob.trim()) return
    const fd = new FormData(); fd.set('jobName', newJob.trim())
    startTransition(async () => {
      const r = await createJob(fd)
      if (r?.error) showToast(r.error, false)
      else { setNewJob(''); showToast('追加しました') }
    })
  }

  function handleUpdateJob(jobId: number, name: string) {
    if (!name.trim()) return
    const fd = new FormData()
    fd.set('jobId', String(jobId))
    fd.set('jobName', name.trim())
    startTransition(async () => {
      const r = await updateJob(fd)
      if (r?.error) showToast(r.error, false)
      else { setEditJobId(null); showToast('更新しました') }
    })
  }

  function handleDeleteJob(jobId: number, name: string, cnt: number) {
    if (cnt > 0) { showToast('所属ユーザーがいるため削除できません', false); return }
    if (!confirm(`${name} を削除しますか？`)) return
    const fd = new FormData(); fd.set('jobId', String(jobId))
    startTransition(async () => {
      const r = await deleteJob(fd)
      if (r?.error) showToast(r.error, false)
    })
  }

  // ─────────────────────────────────────────────────────────
  return (
    <div className="anim-fade-in max-w-4xl">

      {/* トースト */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 anim-slide-down flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl text-sm text-white ${
          toast.ok ? 'bg-gray-900' : 'bg-red-600'
        }`}>
          {toast.ok ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ページヘッダー */}
      <div className="mb-6">
        <Link href="/home"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-3 w-fit">
          <ArrowLeft className="w-4 h-4" />ホームに戻る
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">管理設定</h1>
        <p className="text-sm text-gray-400 mt-0.5">{orgName}</p>
      </div>

      <div className="space-y-5">

        {/* ── ユーザーセクション ──────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-gray-900">ユーザー</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{users.length}</span>
            </div>
            <button
              onClick={() => setUserModal({ open: true, mode: 'add' })}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />追加
            </button>
          </div>

          {/* ── モバイル: カードリスト ─────────────────── */}
          <div className="sm:hidden divide-y divide-gray-100">
            {users.map(user => (
              <div key={user.user_key} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {user.user_name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{user.user_name}</span>
                    {user.admin_flag
                      ? <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">管理者</span>
                      : null}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    {user.user_id}
                    {user.department?.department_name && ` · ${user.department.department_name}`}
                    {user.job?.job_name && ` · ${user.job.job_name}`}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setUserModal({ open: true, mode: 'edit', user })}
                    className="p-2 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {user.user_key !== currentUserKey ? (
                    <button
                      onClick={() => handleDeleteUser(user.user_key, user.user_name)}
                      disabled={isPending}
                      className="p-2 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300 px-2">自分</span>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-400">ユーザーがいません</p>
            )}
          </div>

          {/* ── デスクトップ: テーブル ───────────────── */}
          <table className="hidden sm:table w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['名前', '部署', '職種', '権限', ''].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.user_key} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {user.user_name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 leading-tight">{user.user_name}</div>
                        <div className="text-xs text-gray-400">{user.user_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{user.department?.department_name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{user.job?.job_name ?? '—'}</td>
                  <td className="px-5 py-3">
                    {user.admin_flag
                      ? <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">管理者</span>
                      : <span className="text-xs text-gray-400">一般</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={() => setUserModal({ open: true, mode: 'edit', user })}
                        className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="編集"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {user.user_key !== currentUserKey ? (
                        <button
                          onClick={() => handleDeleteUser(user.user_key, user.user_name)}
                          disabled={isPending}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300 px-2">自分</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                    ユーザーがいません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* ── 部署 + 職種グリッド ─────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-5">

          {/* 部署 */}
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 shrink-0">
              <Building2 className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-gray-900">部署</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{departments.length}</span>
            </div>

            <div className="flex-1 divide-y divide-gray-50">
              {departments.map(dept => {
                const cnt = deptCnt[dept.department_id] ?? 0
                return (
                  <div key={dept.department_id}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50/70 transition-colors min-h-[44px]">
                    {editDeptId === dept.department_id ? (
                      <InlineEdit
                        defaultValue={dept.department_name}
                        onSave={v => handleUpdateDept(dept.department_id, v)}
                        onCancel={() => setEditDeptId(null)}
                        isPending={isPending}
                      />
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-gray-800">{dept.department_name}</span>
                        <span className="text-xs text-gray-400 shrink-0">{cnt}名</span>
                        <button
                          onClick={() => setEditDeptId(dept.department_id)}
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="名前を変更"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDept(dept.department_id, dept.department_name, cnt)}
                          disabled={isPending}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title={cnt > 0 ? '所属ユーザーがいます' : '削除'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )
              })}
              {departments.length === 0 && (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">まだ登録されていません</p>
              )}
            </div>

            {/* インライン追加フォーム */}
            <form onSubmit={handleAddDept} className="flex gap-2 px-4 py-3 border-t border-gray-100 shrink-0">
              <input
                type="text" value={newDept} onChange={e => setNewDept(e.target.value)}
                placeholder="部署名を入力…"
                className={addInp}
              />
              <button
                type="submit"
                disabled={isPending || !newDept.trim()}
                className="shrink-0 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                追加
              </button>
            </form>
          </section>

          {/* 職種 */}
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 shrink-0">
              <Briefcase className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-gray-900">職種</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{jobs.length}</span>
            </div>

            <div className="flex-1 divide-y divide-gray-50">
              {jobs.map(job => {
                const cnt = jobCnt[job.job_id] ?? 0
                return (
                  <div key={job.job_id}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50/70 transition-colors min-h-[44px]">
                    {editJobId === job.job_id ? (
                      <InlineEdit
                        defaultValue={job.job_name}
                        onSave={v => handleUpdateJob(job.job_id, v)}
                        onCancel={() => setEditJobId(null)}
                        isPending={isPending}
                      />
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-gray-800">{job.job_name}</span>
                        <span className="text-xs text-gray-400 shrink-0">{cnt}名</span>
                        <button
                          onClick={() => setEditJobId(job.job_id)}
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="名前を変更"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.job_id, job.job_name, cnt)}
                          disabled={isPending}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title={cnt > 0 ? '所属ユーザーがいます' : '削除'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )
              })}
              {jobs.length === 0 && (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">まだ登録されていません</p>
              )}
            </div>

            {/* インライン追加フォーム */}
            <form onSubmit={handleAddJob} className="flex gap-2 px-4 py-3 border-t border-gray-100 shrink-0">
              <input
                type="text" value={newJob} onChange={e => setNewJob(e.target.value)}
                placeholder="職種名を入力…"
                className={addInp}
              />
              <button
                type="submit"
                disabled={isPending || !newJob.trim()}
                className="shrink-0 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                追加
              </button>
            </form>
          </section>

        </div>
      </div>

      {/* ユーザーモーダル */}
      {userModal.open && (
        <UserFormModal
          mode={userModal.mode}
          user={userModal.mode === 'edit' ? userModal.user : undefined}
          departments={departments}
          jobs={jobs}
          onClose={() => setUserModal({ open: false })}
          onSuccess={() => {
            setUserModal({ open: false })
            showToast(userModal.mode === 'add' ? '追加しました' : '更新しました')
          }}
        />
      )}

    </div>
  )
}
