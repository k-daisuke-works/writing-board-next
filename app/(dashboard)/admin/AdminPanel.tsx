'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  deleteUser, deleteDepartment, deleteJob,
  createDepartment, createJob, updateDepartment, updateJob,
  createPosition, updatePosition, deletePosition,
  createEmploymentType, updateEmploymentType, deleteEmploymentType,
  createGroup, updateGroup, deleteGroup,
  toggleUserActive, resetUserPassword,
  updateOrgName, updateOrgPassword, upsertPasswordPolicy, updateMyEmail,
} from '@/actions/admin'
import type {
  UserInfo, Department, Job, Position, EmploymentType,
  Group, LoginHistoryEntry, PasswordPolicy, UserRole, AuditLogEntry,
} from '@/types/database'
import UserFormModal from './UserFormModal'
import GroupModal from './GroupModal'
import {
  ArrowLeft, Users, Building2, Briefcase, UserCog, Briefcase as BriefcaseIcon,
  Plus, Pencil, Trash2, Check, X, Loader2, KeyRound,
  Shield, Clock, HardDrive, Users2, Lock, Settings,
  BanIcon, CheckCircle2, Search,
} from 'lucide-react'

type Props = {
  users:           UserInfo[]
  departments:     Department[]
  jobs:            Job[]
  positions:       Position[]
  employmentTypes: EmploymentType[]
  groups:          Group[]
  loginHistory:    LoginHistoryEntry[]
  auditLogs:       AuditLogEntry[]
  passwordPolicy:  PasswordPolicy | null
  myEmail:         string | null
  attachmentCounts: { image: number; video: number; pdf: number }
  currentUserKey:  number
  currentUserRole: UserRole
  deptCnt:         Record<number, number>
  jobCnt:          Record<number, number>
  posCnt:          Record<number, number>
  etCnt:           Record<number, number>
  orgName:         string
}

type UserModalState   = { open: false } | { open: true; mode: 'add' } | { open: true; mode: 'edit'; user: UserInfo }
type GroupModalState  = { open: false } | { open: true; group: Group }
type ResetPwState     = { open: false } | { open: true; userKey: number; userName: string }

const AUDIT_ACTION_LABELS: Record<string, string> = {
  'auth.login_failed':    'ログイン失敗',
  'auth.password_change': 'パスワード変更',
  'auth.reset_request':   'メール再設定リクエスト',
  'auth.reset_complete':  'メール再設定完了',
  'user.email_change':    'メールアドレス変更',
  'user.create':          'ユーザー作成',
  'user.update':          'ユーザー更新',
  'user.delete':          'ユーザー削除',
  'user.password_reset':  'パスワードリセット',
  'user.freeze':          'アカウント凍結',
  'user.unfreeze':        '凍結解除',
  'org.password_change':  '団体パス変更',
  'policy.update':        'ポリシー変更',
}

const addInp = "flex-1 min-w-0 border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
const formInp = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
const sectionHdr = "flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 shrink-0"

// ─── インライン編集 ───────────────────────────────────────────
function InlineEdit({ defaultValue, onSave, onCancel, isPending }: {
  defaultValue: string; onSave: (v: string) => void; onCancel: () => void; isPending: boolean
}) {
  const [val, setVal] = useState(defaultValue)
  return (
    <div className="flex-1 flex items-center gap-1">
      <input type="text" value={val} autoFocus onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSave(val) } if (e.key === 'Escape') onCancel() }}
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

// ─── 汎用マスタセクション（部署・職種・役職・雇用形態で共通） ───
function MasterSection<T extends { id: number; name: string }>({
  icon, label, items, cnt, editId, setEditId, newName, setNewName,
  onAdd, onUpdate, onDelete, placeholder, isPending,
}: {
  icon: React.ReactNode; label: string; items: T[]
  cnt: Record<number, number>; editId: number | null; setEditId: (id: number | null) => void
  newName: string; setNewName: (v: string) => void
  onAdd: (e: React.FormEvent) => void; onUpdate: (id: number, name: string) => void
  onDelete: (id: number, name: string, cnt: number) => void
  placeholder: string; isPending: boolean
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      <div className={sectionHdr}>
        {icon}
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{items.length}</span>
      </div>
      <div className="flex-1 divide-y divide-gray-50">
        {items.map(item => {
          const c = cnt[item.id] ?? 0
          return (
            <div key={item.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50/70 transition-colors min-h-[44px]">
              {editId === item.id ? (
                <InlineEdit defaultValue={item.name} onSave={v => onUpdate(item.id, v)} onCancel={() => setEditId(null)} isPending={isPending} />
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-800">{item.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{c}名</span>
                  <button onClick={() => setEditId(item.id)} className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(item.id, item.name, c)} disabled={isPending}
                    className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          )
        })}
        {items.length === 0 && <p className="px-5 py-6 text-sm text-gray-400 text-center">まだ登録されていません</p>}
      </div>
      <form onSubmit={onAdd} className="flex gap-2 px-4 py-3 border-t border-gray-100 shrink-0">
        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder={placeholder} className={addInp} />
        <button type="submit" disabled={isPending || !newName.trim()}
          className="shrink-0 flex items-center gap-1 btn-pop disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}追加
        </button>
      </form>
    </section>
  )
}

// ─── メインコンポーネント ─────────────────────────────────────
export default function AdminPanel({
  users, departments, jobs, positions, employmentTypes, groups,
  loginHistory, auditLogs, passwordPolicy, myEmail, attachmentCounts,
  currentUserKey, currentUserRole, deptCnt, jobCnt, posCnt, etCnt, orgName,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [userModal,  setUserModal]   = useState<UserModalState>({ open: false })
  const [groupModal, setGroupModal]  = useState<GroupModalState>({ open: false })
  const [resetPwModal, setResetPwModal] = useState<ResetPwState>({ open: false })
  const [resetPwInput, setResetPwInput] = useState('')
  const [toast, setToast]            = useState<{ msg: string; ok: boolean } | null>(null)
  const [userQuery, setUserQuery]    = useState('')
  const router = useRouter()

  // 各マスタの編集中 ID
  const [editDeptId, setEditDeptId] = useState<number | null>(null)
  const [editJobId,  setEditJobId]  = useState<number | null>(null)
  const [editPosId,  setEditPosId]  = useState<number | null>(null)
  const [editEtId,   setEditEtId]   = useState<number | null>(null)
  const [editGrpId,  setEditGrpId]  = useState<number | null>(null)

  // 各マスタの追加入力値
  const [newDept, setNewDept] = useState('')
  const [newJob,  setNewJob]  = useState('')
  const [newPos,  setNewPos]  = useState('')
  const [newEt,   setNewEt]   = useState('')
  const [newGrp,  setNewGrp]  = useState('')

  // 団体設定フォーム
  const [orgNameInput,    setOrgNameInput]    = useState(orgName)
  const [currentOrgPw,    setCurrentOrgPw]    = useState('')
  const [newOrgPw,        setNewOrgPw]        = useState('')
  const [confirmOrgPw,    setConfirmOrgPw]    = useState('')
  const [myEmailInput,    setMyEmailInput]    = useState(myEmail ?? '')

  // パスワードポリシーフォーム
  const [minLength,   setMinLength]   = useState(passwordPolicy?.min_length ?? 8)
  const [expiryDays,  setExpiryDays]  = useState(String(passwordPolicy?.expiry_days ?? '0'))

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // ユーザー一覧の絞り込み（名前・ID・部署名）
  const uq = userQuery.trim().toLowerCase()
  const filteredUsers = uq
    ? users.filter(u =>
        u.user_name.toLowerCase().includes(uq) ||
        u.user_id.toLowerCase().includes(uq) ||
        ((u.department as { department_name?: string } | null)?.department_name ?? '').toLowerCase().includes(uq)
      )
    : users

  // ── ユーザー削除 ────────────────────────────────────────────
  function handleDeleteUser(userKey: number, name: string) {
    if (!confirm(`${name} を削除しますか？`)) return
    const fd = new FormData(); fd.set('userKey', String(userKey))
    startTransition(async () => {
      const r = await deleteUser(fd)
      if (r?.error) showToast(r.error, false)
    })
  }

  // ── アカウント凍結/解除 ─────────────────────────────────────
  function handleToggleActive(userKey: number, name: string, currentlyActive: boolean) {
    const action = currentlyActive ? '凍結' : '解除'
    if (!confirm(`${name} のアカウントを${action}しますか？`)) return
    const fd = new FormData()
    fd.set('userKey', String(userKey))
    fd.set('isActive', String(!currentlyActive))
    startTransition(async () => {
      const r = await toggleUserActive(fd)
      if (r?.error) showToast(r.error, false)
      else showToast(`${name} のアカウントを${action}しました`)
    })
  }

  // ── パスワードリセット ─────────────────────────────────────
  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetPwModal.open) return
    const fd = new FormData()
    fd.set('userKey', String(resetPwModal.userKey))
    fd.set('newPassword', resetPwInput)
    startTransition(async () => {
      const r = await resetUserPassword(fd)
      if (r?.error) { showToast(r.error, false); return }
      showToast(`${resetPwModal.userName} のパスワードをリセットしました`)
      setResetPwModal({ open: false }); setResetPwInput('')
    })
  }

  // ── 部署 CRUD ───────────────────────────────────────────────
  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault(); if (!newDept.trim()) return
    const fd = new FormData(); fd.set('departmentName', newDept.trim())
    startTransition(async () => {
      const r = await createDepartment(fd)
      if (r?.error) { showToast(r.error, false) } else { setNewDept(''); showToast('追加しました') }
    })
  }
  const handleUpdateDept = (id: number, name: string) => {
    if (!name.trim()) return
    const fd = new FormData(); fd.set('departmentId', String(id)); fd.set('departmentName', name.trim())
    startTransition(async () => {
      const r = await updateDepartment(fd)
      if (r?.error) { showToast(r.error, false) } else { setEditDeptId(null); showToast('更新しました') }
    })
  }
  const handleDeleteDept = (id: number, name: string, cnt: number) => {
    if (cnt > 0) { showToast('所属ユーザーがいるため削除できません', false); return }
    if (!confirm(`${name} を削除しますか？`)) return
    const fd = new FormData(); fd.set('departmentId', String(id))
    startTransition(async () => { const r = await deleteDepartment(fd); if (r?.error) showToast(r.error, false) })
  }

  // ── 職種 CRUD ───────────────────────────────────────────────
  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault(); if (!newJob.trim()) return
    const fd = new FormData(); fd.set('jobName', newJob.trim())
    startTransition(async () => {
      const r = await createJob(fd)
      if (r?.error) { showToast(r.error, false) } else { setNewJob(''); showToast('追加しました') }
    })
  }
  const handleUpdateJob = (id: number, name: string) => {
    if (!name.trim()) return
    const fd = new FormData(); fd.set('jobId', String(id)); fd.set('jobName', name.trim())
    startTransition(async () => {
      const r = await updateJob(fd)
      if (r?.error) { showToast(r.error, false) } else { setEditJobId(null); showToast('更新しました') }
    })
  }
  const handleDeleteJob = (id: number, name: string, cnt: number) => {
    if (cnt > 0) { showToast('所属ユーザーがいるため削除できません', false); return }
    if (!confirm(`${name} を削除しますか？`)) return
    const fd = new FormData(); fd.set('jobId', String(id))
    startTransition(async () => { const r = await deleteJob(fd); if (r?.error) showToast(r.error, false) })
  }

  // ── 役職 CRUD ───────────────────────────────────────────────
  const handleAddPos = (e: React.FormEvent) => {
    e.preventDefault(); if (!newPos.trim()) return
    const fd = new FormData(); fd.set('positionName', newPos.trim())
    startTransition(async () => {
      const r = await createPosition(fd)
      if (r?.error) { showToast(r.error, false) } else { setNewPos(''); showToast('追加しました') }
    })
  }
  const handleUpdatePos = (id: number, name: string) => {
    if (!name.trim()) return
    const fd = new FormData(); fd.set('positionId', String(id)); fd.set('positionName', name.trim())
    startTransition(async () => {
      const r = await updatePosition(fd)
      if (r?.error) { showToast(r.error, false) } else { setEditPosId(null); showToast('更新しました') }
    })
  }
  const handleDeletePos = (id: number, name: string, cnt: number) => {
    if (cnt > 0) { showToast('この役職のユーザーがいるため削除できません', false); return }
    if (!confirm(`${name} を削除しますか？`)) return
    const fd = new FormData(); fd.set('positionId', String(id))
    startTransition(async () => { const r = await deletePosition(fd); if (r?.error) showToast(r.error, false) })
  }

  // ── 雇用形態 CRUD ──────────────────────────────────────────
  const handleAddEt = (e: React.FormEvent) => {
    e.preventDefault(); if (!newEt.trim()) return
    const fd = new FormData(); fd.set('employmentTypeName', newEt.trim())
    startTransition(async () => {
      const r = await createEmploymentType(fd)
      if (r?.error) { showToast(r.error, false) } else { setNewEt(''); showToast('追加しました') }
    })
  }
  const handleUpdateEt = (id: number, name: string) => {
    if (!name.trim()) return
    const fd = new FormData(); fd.set('employmentTypeId', String(id)); fd.set('employmentTypeName', name.trim())
    startTransition(async () => {
      const r = await updateEmploymentType(fd)
      if (r?.error) { showToast(r.error, false) } else { setEditEtId(null); showToast('更新しました') }
    })
  }
  const handleDeleteEt = (id: number, name: string, cnt: number) => {
    if (cnt > 0) { showToast('この雇用形態のユーザーがいるため削除できません', false); return }
    if (!confirm(`${name} を削除しますか？`)) return
    const fd = new FormData(); fd.set('employmentTypeId', String(id))
    startTransition(async () => { const r = await deleteEmploymentType(fd); if (r?.error) showToast(r.error, false) })
  }

  // ── グループ CRUD ──────────────────────────────────────────
  const handleAddGrp = (e: React.FormEvent) => {
    e.preventDefault(); if (!newGrp.trim()) return
    const fd = new FormData(); fd.set('groupName', newGrp.trim())
    startTransition(async () => {
      const r = await createGroup(fd)
      if (r?.error) { showToast(r.error, false) } else { setNewGrp(''); showToast('追加しました') }
    })
  }
  const handleUpdateGrp = (id: number, name: string) => {
    if (!name.trim()) return
    const fd = new FormData(); fd.set('groupId', String(id)); fd.set('groupName', name.trim())
    startTransition(async () => {
      const r = await updateGroup(fd)
      if (r?.error) { showToast(r.error, false) } else { setEditGrpId(null); showToast('更新しました') }
    })
  }
  const handleDeleteGrp = (id: number, name: string) => {
    if (!confirm(`${name} を削除しますか？`)) return
    const fd = new FormData(); fd.set('groupId', String(id))
    startTransition(async () => { const r = await deleteGroup(fd); if (r?.error) showToast(r.error, false) })
  }

  // ── 団体設定 ───────────────────────────────────────────────
  const handleUpdateOrgName = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(); fd.set('orgName', orgNameInput.trim())
    startTransition(async () => {
      const r = await updateOrgName(fd)
      if (r?.error) { showToast(r.error, false) } else { showToast('団体名を更新しました') }
    })
  }
  const handleUpdateOrgPw = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.set('currentOrgPassword', currentOrgPw)
    fd.set('newOrgPassword', newOrgPw)
    fd.set('confirmOrgPassword', confirmOrgPw)
    startTransition(async () => {
      const r = await updateOrgPassword(fd)
      if (r?.error) showToast(r.error, false)
      else { showToast('団体パスを変更しました'); setCurrentOrgPw(''); setNewOrgPw(''); setConfirmOrgPw('') }
    })
  }

  const handleUpdateMyEmail = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(); fd.set('email', myEmailInput.trim())
    startTransition(async () => {
      const r = await updateMyEmail(fd)
      if (r?.error) { showToast(r.error, false) }
      else { showToast(myEmailInput.trim() ? 'メールアドレスを登録しました' : 'メールアドレスを解除しました') }
    })
  }

  // ── パスワードポリシー ─────────────────────────────────────
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.set('minLength', String(minLength))
    fd.set('expiryDays', expiryDays)
    startTransition(async () => {
      const r = await upsertPasswordPolicy(fd)
      if (r?.error) { showToast(r.error, false) } else { showToast('ポリシーを保存しました') }
    })
  }

  // ─── JSX ─────────────────────────────────────────────────────
  return (
    <div className="anim-fade-in max-w-4xl">

      {(isPending || toast) && (
        <div className={`fixed top-4 right-4 z-50 anim-slide-down flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl text-sm text-white ${
          toast ? (toast.ok ? 'bg-gray-900' : 'bg-red-600') : 'bg-gray-600'
        }`}>
          {toast
            ? (toast.ok ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />)
            : <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
          }
          {toast ? toast.msg : '処理中…'}
        </div>
      )}

      {/* ページヘッダー */}
      <div className="mb-6">
        <Link href="/home" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-3 w-fit">
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
            <button onClick={() => setUserModal({ open: true, mode: 'add' })}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />追加
            </button>
          </div>

          {/* 検索（10名以上で表示） */}
          {users.length >= 10 && (
            <div className="border-b border-gray-100 px-4 py-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={userQuery}
                  onChange={e => setUserQuery(e.target.value)}
                  placeholder="名前・ID・部署で絞り込み"
                  className="w-full min-h-[40px] rounded-md border border-gray-300 bg-white pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* モバイル */}
          <div className="sm:hidden divide-y divide-gray-100">
            {filteredUsers.map(user => (
              <div key={user.user_key} className={`flex items-center gap-3 px-4 py-3 ${!user.is_active ? 'opacity-50' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {user.user_name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{user.user_name}</span>
                    {!user.is_active && <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-medium">凍結中</span>}
                    {user.role === 'admin' && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">管理者</span>}
                    {user.role === 'leader' && <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-medium">リーダー</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    {user.user_id}
                    {(user.department as { department_name?: string } | null)?.department_name && ` · ${(user.department as { department_name: string }).department_name}`}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setUserModal({ open: true, mode: 'edit', user })} className="p-2 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                  {currentUserRole === 'admin' && (
                    <>
                      <button onClick={() => { setResetPwModal({ open: true, userKey: user.user_key, userName: user.user_name }); setResetPwInput('') }}
                        className="p-2 rounded text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-colors" title="パスワードリセット">
                        <KeyRound className="w-4 h-4" />
                      </button>
                      {user.user_key !== currentUserKey && (
                        <button onClick={() => handleToggleActive(user.user_key, user.user_name, user.is_active)}
                          className={`p-2 rounded transition-colors ${user.is_active ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-orange-400 hover:text-green-600 hover:bg-green-50'}`}
                          title={user.is_active ? '凍結' : '解除'}>
                          {user.is_active ? <BanIcon className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      )}
                    </>
                  )}
                  {user.user_key !== currentUserKey ? (
                    <button onClick={() => handleDeleteUser(user.user_key, user.user_name)} disabled={isPending}
                      className="p-2 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : <span className="text-xs text-gray-300 px-2">自分</span>}
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-400">
                {users.length === 0 ? 'ユーザーがいません' : '該当するユーザーがいません'}
              </p>
            )}
          </div>

          {/* デスクトップ */}
          <table className="hidden sm:table w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['名前', '部署', '職種', '役職', '権限', ''].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map(user => (
                <tr key={user.user_key} className={`hover:bg-gray-50/70 transition-colors ${!user.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{user.user_name.slice(0, 1)}</div>
                      <div>
                        <div className="font-medium text-gray-900 leading-tight flex items-center gap-1.5">
                          {user.user_name}
                          {!user.is_active && <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-1 py-0.5 rounded">凍結</span>}
                        </div>
                        <div className="text-xs text-gray-400">{user.user_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{(user.department as { department_name?: string } | null)?.department_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{(user.job as { job_name?: string } | null)?.job_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{(user.position as { position_name?: string } | null)?.position_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {user.role === 'admin' ? <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">管理者</span>
                      : user.role === 'leader' ? <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-medium">リーダー</span>
                      : <span className="text-xs text-gray-400">メンバー</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <button onClick={() => setUserModal({ open: true, mode: 'edit', user })} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="編集"><Pencil className="w-3.5 h-3.5" /></button>
                      {currentUserRole === 'admin' && (
                        <>
                          <button onClick={() => { setResetPwModal({ open: true, userKey: user.user_key, userName: user.user_name }); setResetPwInput('') }}
                            className="p-1.5 rounded text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-colors" title="パスワードリセット">
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          {user.user_key !== currentUserKey && (
                            <button onClick={() => handleToggleActive(user.user_key, user.user_name, user.is_active)}
                              className={`p-1.5 rounded transition-colors ${user.is_active ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-orange-400 hover:text-green-600 hover:bg-green-50'}`}
                              title={user.is_active ? '凍結' : '解除'}>
                              {user.is_active ? <BanIcon className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </>
                      )}
                      {user.user_key !== currentUserKey ? (
                        <button onClick={() => handleDeleteUser(user.user_key, user.user_name)} disabled={isPending}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40" title="削除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : <span className="text-xs text-gray-300 px-2">自分</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">{users.length === 0 ? 'ユーザーがいません' : '該当するユーザーがいません'}</td></tr>}
            </tbody>
          </table>
        </section>

        {/* ── 組織構造（admin のみ） ─────────────────────────── */}
        {currentUserRole === 'admin' && (
          <div className="grid sm:grid-cols-2 gap-5">
            <MasterSection
              icon={<Building2 className="w-4 h-4 text-gray-400" strokeWidth={1.75} />}
              label="部署" items={departments.map(d => ({ id: d.department_id, name: d.department_name }))}
              cnt={deptCnt} editId={editDeptId} setEditId={setEditDeptId}
              newName={newDept} setNewName={setNewDept}
              onAdd={handleAddDept} onUpdate={handleUpdateDept} onDelete={handleDeleteDept}
              placeholder="部署名を入力…" isPending={isPending}
            />
            <MasterSection
              icon={<Briefcase className="w-4 h-4 text-gray-400" strokeWidth={1.75} />}
              label="職種" items={jobs.map(j => ({ id: j.job_id, name: j.job_name }))}
              cnt={jobCnt} editId={editJobId} setEditId={setEditJobId}
              newName={newJob} setNewName={setNewJob}
              onAdd={handleAddJob} onUpdate={handleUpdateJob} onDelete={handleDeleteJob}
              placeholder="職種名を入力…" isPending={isPending}
            />
            <MasterSection
              icon={<UserCog className="w-4 h-4 text-gray-400" strokeWidth={1.75} />}
              label="役職" items={positions.map(p => ({ id: p.position_id, name: p.position_name }))}
              cnt={posCnt} editId={editPosId} setEditId={setEditPosId}
              newName={newPos} setNewName={setNewPos}
              onAdd={handleAddPos} onUpdate={handleUpdatePos} onDelete={handleDeletePos}
              placeholder="役職名を入力…" isPending={isPending}
            />
            <MasterSection
              icon={<BriefcaseIcon className="w-4 h-4 text-gray-400" strokeWidth={1.75} />}
              label="雇用形態" items={employmentTypes.map(et => ({ id: et.employment_type_id, name: et.employment_type_name }))}
              cnt={etCnt} editId={editEtId} setEditId={setEditEtId}
              newName={newEt} setNewName={setNewEt}
              onAdd={handleAddEt} onUpdate={handleUpdateEt} onDelete={handleDeleteEt}
              placeholder="例: 正規・パート…" isPending={isPending}
            />
          </div>
        )}

        {/* ── グループ/委員会（admin のみ） ──────────────────── */}
        {currentUserRole === 'admin' && (
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className={sectionHdr}>
              <Users2 className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-gray-900">グループ/委員会</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{groups.length}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {groups.map(g => (
                <div key={g.group_id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50/70 transition-colors min-h-[44px]">
                  {editGrpId === g.group_id ? (
                    <InlineEdit defaultValue={g.group_name} onSave={v => handleUpdateGrp(g.group_id, v)} onCancel={() => setEditGrpId(null)} isPending={isPending} />
                  ) : (
                    <>
                      <button onClick={() => setGroupModal({ open: true, group: g })}
                        className="flex-1 text-sm text-gray-800 text-left hover:text-blue-600 transition-colors">
                        {g.group_name}
                      </button>
                      <span className="text-xs text-gray-400 shrink-0">{(g.members ?? []).length}名</span>
                      <button onClick={() => setEditGrpId(g.group_id)} className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteGrp(g.group_id, g.group_name)} disabled={isPending} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              ))}
              {groups.length === 0 && <p className="px-5 py-6 text-sm text-gray-400 text-center">まだ登録されていません</p>}
            </div>
            <form onSubmit={handleAddGrp} className="flex gap-2 px-4 py-3 border-t border-gray-100">
              <input type="text" value={newGrp} onChange={e => setNewGrp(e.target.value)} placeholder="グループ名を入力…" className={addInp} />
              <button type="submit" disabled={isPending || !newGrp.trim()}
                className="shrink-0 flex items-center gap-1 btn-pop disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}追加
              </button>
            </form>
          </section>
        )}

        {/* ── 団体設定（admin のみ） ──────────────────────────── */}
        {currentUserRole === 'admin' && (
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className={sectionHdr}>
              <Settings className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-gray-900">団体設定</span>
            </div>
            <div className="p-5 space-y-6">
              {/* 団体名 */}
              <form onSubmit={handleUpdateOrgName} className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">団体名</label>
                <div className="flex gap-2">
                  <input type="text" value={orgNameInput} onChange={e => setOrgNameInput(e.target.value)}
                    maxLength={100} className={`${formInp} flex-1`} />
                  <button type="submit" disabled={isPending || orgNameInput.trim() === orgName}
                    className="shrink-0 btn-pop disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    更新
                  </button>
                </div>
              </form>

              {/* 団体パス変更 */}
              <form onSubmit={handleUpdateOrgPw} className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">団体パス変更</label>
                <input type="password" value={currentOrgPw} onChange={e => setCurrentOrgPw(e.target.value)}
                  placeholder="現在の団体パス" autoComplete="current-password" className={formInp} />
                <input type="password" value={newOrgPw} onChange={e => setNewOrgPw(e.target.value)}
                  placeholder="新しい団体パス（8文字以上）" autoComplete="new-password" className={formInp} />
                <input type="password" value={confirmOrgPw} onChange={e => setConfirmOrgPw(e.target.value)}
                  placeholder="新しい団体パス（確認）" autoComplete="new-password" className={formInp} />
                <button type="submit" disabled={isPending || !currentOrgPw || !newOrgPw || !confirmOrgPw}
                  className="btn-pop disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  団体パスを変更
                </button>
              </form>

              {/* パスワード再設定用メールアドレス */}
              <form onSubmit={handleUpdateMyEmail} className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">パスワード再設定用メールアドレス（自分用）</label>
                <p className="text-xs text-gray-400">
                  登録すると、パスワードを忘れたときにログイン画面の「メールで再設定」が使えます。空欄で保存すると解除されます。
                </p>
                <div className="flex gap-2">
                  <input type="email" value={myEmailInput} onChange={e => setMyEmailInput(e.target.value)}
                    placeholder="admin@example.com" maxLength={254} autoComplete="email" lang="en"
                    className={`${formInp} flex-1`} />
                  <button type="submit" disabled={isPending || myEmailInput.trim() === (myEmail ?? '')}
                    className="shrink-0 btn-pop disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    保存
                  </button>
                </div>
              </form>

              {/* ストレージ使用状況 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">添付ファイル数</label>
                <div className="flex gap-4 text-sm">
                  {[['画像', attachmentCounts.image], ['動画', attachmentCounts.video], ['PDF', attachmentCounts.pdf]].map(([label, cnt]) => (
                    <div key={String(label)} className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-500">{label}:</span>
                      <span className="font-medium text-gray-900">{cnt}件</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── パスワードポリシー（admin のみ） ───────────────── */}
        {currentUserRole === 'admin' && (
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className={sectionHdr}>
              <Lock className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-gray-900">パスワードポリシー</span>
            </div>
            <form onSubmit={handleSavePolicy} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">最低文字数</label>
                <div className="flex items-center gap-2">
                  <input type="number" min={8} max={32} value={minLength} onChange={e => setMinLength(Number(e.target.value))}
                    className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  <span className="text-sm text-gray-500">文字（8〜32）</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">有効期限</label>
                <select value={expiryDays} onChange={e => setExpiryDays(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="0">無期限</option>
                  <option value="90">90日（3ヶ月）</option>
                  <option value="180">180日（6ヶ月）</option>
                  <option value="365">365日（1年）</option>
                </select>
              </div>
              <button type="submit" disabled={isPending}
                className="btn-pop disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                保存
              </button>
            </form>
          </section>
        )}

        {/* ── ログイン履歴（admin のみ） ──────────────────────── */}
        {currentUserRole === 'admin' && (
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className={sectionHdr}>
              <Clock className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-gray-900">ログイン履歴</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">直近50件</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['ユーザーID', '日時', 'IPアドレス'].map(h => (
                      <th key={h} className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loginHistory.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-2.5 text-gray-700 font-medium">{entry.user_name_stamp}</td>
                      <td className="px-5 py-2.5 text-gray-500 whitespace-nowrap">
                        {new Date(entry.logged_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-2.5 text-gray-400 font-mono text-xs">{entry.ip_address ?? '—'}</td>
                    </tr>
                  ))}
                  {loginHistory.length === 0 && (
                    <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-400">履歴がありません</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── 監査ログ（admin のみ） ──────────────────────────── */}
        {currentUserRole === 'admin' && (
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className={sectionHdr}>
              <Shield className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-gray-900">監査ログ</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">直近50件</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['日時', '操作者', '操作', '対象'].map(h => (
                      <th key={h} className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {auditLogs.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-2.5 text-gray-500 whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-2.5 text-gray-700 font-medium whitespace-nowrap">{entry.actor_name}</td>
                      <td className="px-5 py-2.5 whitespace-nowrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          entry.action === 'auth.login_failed' ? 'bg-red-50 text-red-700'
                          : entry.action.includes('delete') || entry.action.includes('freeze') ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}>
                          {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-gray-400 font-mono text-xs">{entry.target ?? '—'}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">ログがありません</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* ユーザーモーダル */}
      {userModal.open && (
        <UserFormModal
          mode={userModal.mode}
          user={userModal.mode === 'edit' ? userModal.user : undefined}
          departments={departments} jobs={jobs}
          positions={positions} employmentTypes={employmentTypes}
          currentUserRole={currentUserRole}
          onClose={() => setUserModal({ open: false })}
          onSuccess={() => {
            setUserModal({ open: false })
            showToast(userModal.mode === 'add' ? '追加しました' : '更新しました')
            router.refresh()
          }}
        />
      )}

      {/* グループモーダル */}
      {groupModal.open && (
        <GroupModal
          group={groupModal.group}
          allUsers={users}
          onClose={() => setGroupModal({ open: false })}
          onSuccess={() => {
            setGroupModal({ open: false })
            showToast('メンバーを更新しました')
            router.refresh()
          }}
        />
      )}

      {/* パスワードリセットモーダル */}
      {resetPwModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) setResetPwModal({ open: false }) }}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-yellow-600" />
              <h3 className="text-sm font-semibold text-gray-900">パスワードリセット — {resetPwModal.userName}</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">仮パスワードを設定します。次回ログイン時に変更が求められます。</p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input type="text" value={resetPwInput} onChange={e => setResetPwInput(e.target.value)}
                placeholder="仮パスワード（8文字以上）" minLength={8} required autoComplete="off" className={formInp} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setResetPwModal({ open: false })}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-md hover:bg-gray-50 transition-colors">
                  キャンセル
                </button>
                <button type="submit" disabled={isPending || resetPwInput.length < 8}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md transition-colors">
                  {isPending ? 'リセット中…' : 'リセット'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
