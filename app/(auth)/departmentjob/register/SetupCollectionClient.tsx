'use client'

import { useRef, useState, useTransition } from 'react'
import { Building2, Briefcase, Check, LoaderCircle, Plus } from 'lucide-react'
import { createDepartment, createJob } from '@/actions/admin'
import { setupInput } from '../../setup-ui'

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
        description="班・委員会などの単位"
        placeholder="例：広報班"
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
        placeholder="例：社会福祉士"
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
    <section className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm shadow-amber-900/5">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-full bg-[#fff4d1] text-[#001e5a]">{icon}</div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-maru font-bold text-[#001e5a]">{title}</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">{items.length}</span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
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
        <input name={name} required maxLength={100} disabled={isPending} placeholder={placeholder}
          className={`${setupInput} min-w-0 flex-1 disabled:opacity-60`} />
        <button disabled={isPending}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-[#001e5a] text-white shadow-[0_3px_0_#001240] transition-transform hover:-translate-y-0.5 active:scale-95 disabled:cursor-wait disabled:translate-y-0 disabled:opacity-70"
          aria-label={`${title}を追加`}>
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
        </button>
      </form>
      {error && <p className="mt-2 text-xs font-medium text-red-600" role="alert">{error}</p>}

      <div className="mt-4 min-h-20 space-y-2">
        {items.length ? items.map(item => (
          <div key={item.id} className="flex items-center gap-2 rounded-xl bg-[#fdf9ee] px-3 py-2 text-sm text-gray-700">
            <span className="grid size-5 place-items-center rounded-full bg-[#e9f5cf] text-[#5f9a00]"><Check className="size-3" /></span>
            <span className="truncate">{item.name}</span>
          </div>
        )) : <div className="grid min-h-20 place-items-center rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">まだ登録されていません</div>}
      </div>
    </section>
  )
}
