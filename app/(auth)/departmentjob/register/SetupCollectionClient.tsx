'use client'

import { useRef, useState, useTransition } from 'react'
import { Building2, Briefcase, Check, LoaderCircle, Plus } from 'lucide-react'
import { createDepartment, createJob } from '@/actions/admin'

type Department = { department_id: number; department_name: string }
type Job = { job_id: number; job_name: string }

export function SetupCollectionClient({
  initialDepartments,
  initialJobs,
  setupToken,
}: {
  initialDepartments: Department[]
  initialJobs: Job[]
  setupToken?: string
}) {
  const [departments, setDepartments] = useState(initialDepartments)
  const [jobs, setJobs] = useState(initialJobs)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CollectionCard
        title="部署"
        description="所属するチームや事業部"
        placeholder="例：営業部"
        name="departmentName"
        icon={<Building2 className="size-5" />}
        items={departments.map(item => ({ id: item.department_id, name: item.department_name }))}
        onCreate={async formData => {
          if (setupToken) formData.set('setupToken', setupToken)
          const result = await createDepartment(formData)
          if ('item' in result && result.item) setDepartments(current => [...current, result.item])
          return result.error
        }}
      />
      <CollectionCard
        title="職種"
        description="メンバーの仕事の種類"
        placeholder="例：生活支援員"
        name="jobName"
        icon={<Briefcase className="size-5" />}
        items={jobs.map(item => ({ id: item.job_id, name: item.job_name }))}
        onCreate={async formData => {
          if (setupToken) formData.set('setupToken', setupToken)
          const result = await createJob(formData)
          if ('item' in result && result.item) setJobs(current => [...current, result.item])
          return result.error
        }}
      />
    </div>
  )
}

function CollectionCard({ title, description, placeholder, name, icon, items, onCreate }: {
  title: string
  description: string
  placeholder: string
  name: string
  icon: React.ReactNode
  items: { id: number; name: string }[]
  onCreate: (formData: FormData) => Promise<string | undefined>
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-teal-50 to-indigo-50 text-indigo-600">{icon}</div>
        <div>
          <div className="flex items-center gap-2"><h2 className="font-bold text-slate-900">{title}</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{items.length}</span></div>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>

      <form ref={formRef} className="flex gap-2" onSubmit={event => {
        event.preventDefault()
        setError('')
        const formData = new FormData(event.currentTarget)
        startTransition(async () => {
          const message = await onCreate(formData)
          if (message) setError(message)
          else formRef.current?.reset()
        })
      }}>
        <input name={name} required maxLength={100} disabled={isPending} placeholder={placeholder} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:opacity-60" />
        <button disabled={isPending} className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-white transition hover:bg-indigo-600 disabled:cursor-wait disabled:opacity-70" aria-label={`${title}を追加`}>
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
        </button>
      </form>
      {error && <p className="mt-2 text-xs font-medium text-red-600" role="alert">{error}</p>}

      <div className="mt-4 min-h-20 space-y-2">
        {items.length ? items.map(item => (
          <div key={item.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check className="size-3" /></span>
            <span className="truncate">{item.name}</span>
          </div>
        )) : <div className="grid min-h-20 place-items-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">まだ登録されていません</div>}
      </div>
    </section>
  )
}
