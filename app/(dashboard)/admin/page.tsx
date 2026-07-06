import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPanel from './AdminPanel'
import type { UserInfo, Department, Job, Position, EmploymentType, Group, LoginHistoryEntry, PasswordPolicy, AuditLogEntry } from '@/types/database'

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role === 'member') redirect('/home')

  const supabase = createServiceClient()
  const orgKey   = session.organizationKey

  let usersQuery = supabase
    .from('user_info')
    .select('*, department:department_data(department_name), job:job_data(job_name), position:position_data(position_name), employment_type:employment_type_data(employment_type_name)')
    .eq('organization_key', orgKey)
    .order('created_at', { ascending: true })

  if (session.role === 'leader') {
    usersQuery = usersQuery.eq('department_id', session.departmentId)
  }

  const [usersRes, deptsRes, jobsRes] = await Promise.all([
    usersQuery,
    supabase.from('department_data').select('*').eq('organization_key', orgKey).order('department_id'),
    supabase.from('job_data').select('*').eq('organization_key', orgKey).order('job_id'),
  ])

  const users       = (usersRes.data ?? []) as unknown as UserInfo[]
  const departments = (deptsRes.data ?? []) as unknown as Department[]
  const jobs        = (jobsRes.data ?? []) as unknown as Job[]

  let positions:       Position[]       = []
  let employmentTypes: EmploymentType[] = []
  let groups:          Group[]          = []
  let loginHistory:    LoginHistoryEntry[] = []
  let auditLogs:       AuditLogEntry[] = []
  let passwordPolicy:  PasswordPolicy | null = null
  let myEmail:         string | null = null
  let attachmentCounts = { image: 0, video: 0, pdf: 0 }

  if (session.role === 'admin') {
    const [posRes, etRes, grpRes, lhRes, alRes, ppRes, attRes, meRes] = await Promise.all([
      supabase.from('position_data').select('*').eq('organization_key', orgKey).order('position_id'),
      supabase.from('employment_type_data').select('*').eq('organization_key', orgKey).order('employment_type_id'),
      supabase.from('group_data').select('*, members:user_group_members(user_key, user_info(user_name))').eq('organization_key', orgKey).order('group_id'),
      supabase.from('login_history').select('*').eq('organization_key', orgKey).order('logged_at', { ascending: false }).limit(50),
      supabase.from('audit_logs').select('*').eq('organization_key', orgKey).order('created_at', { ascending: false }).limit(50),
      supabase.from('password_policy').select('*').eq('organization_key', orgKey).maybeSingle(),
      supabase.from('post_attachments').select('file_type').eq('organization_key', orgKey),
      supabase.from('user_info').select('email').eq('user_key', session.userKey).eq('organization_key', orgKey).single(),
    ])

    positions       = (posRes.data ?? []) as unknown as Position[]
    employmentTypes = (etRes.data ?? []) as unknown as EmploymentType[]

    groups = ((grpRes.data ?? []) as Record<string, unknown>[]).map(g => ({
      group_id:         g.group_id as number,
      group_name:       g.group_name as string,
      organization_key: g.organization_key as number,
      members: ((g.members as { user_key: number; user_info: { user_name: string } | null }[]) ?? []).map(m => ({
        user_key:  m.user_key,
        user_name: m.user_info?.user_name ?? '',
      })),
    }))

    loginHistory  = (lhRes.data ?? []) as unknown as LoginHistoryEntry[]
    auditLogs     = (alRes.data ?? []) as unknown as AuditLogEntry[]
    passwordPolicy = ppRes.data as PasswordPolicy | null
    myEmail       = (meRes.data as { email: string | null } | null)?.email ?? null

    const counts = { image: 0, video: 0, pdf: 0 }
    for (const row of (attRes.data ?? []) as { file_type: string }[]) {
      if (row.file_type === 'image')      counts.image++
      else if (row.file_type === 'video') counts.video++
      else if (row.file_type === 'pdf')   counts.pdf++
    }
    attachmentCounts = counts
  }

  const deptCnt: Record<number, number> = {}
  const jobCnt:  Record<number, number> = {}
  const posCnt:  Record<number, number> = {}
  const etCnt:   Record<number, number> = {}
  for (const u of users) {
    if (u.department_id)       deptCnt[u.department_id]       = (deptCnt[u.department_id]       ?? 0) + 1
    if (u.job_id)              jobCnt[u.job_id]               = (jobCnt[u.job_id]               ?? 0) + 1
    if (u.position_id)         posCnt[u.position_id]         = (posCnt[u.position_id]         ?? 0) + 1
    if (u.employment_type_id)  etCnt[u.employment_type_id]   = (etCnt[u.employment_type_id]   ?? 0) + 1
  }

  return (
    <AdminPanel
      users={users}
      departments={departments}
      jobs={jobs}
      positions={positions}
      employmentTypes={employmentTypes}
      groups={groups}
      loginHistory={loginHistory}
      auditLogs={auditLogs}
      passwordPolicy={passwordPolicy}
      myEmail={myEmail}
      attachmentCounts={attachmentCounts}
      currentUserKey={session.userKey}
      currentUserRole={session.role}
      deptCnt={deptCnt}
      jobCnt={jobCnt}
      posCnt={posCnt}
      etCnt={etCnt}
      orgName={session.organizationName}
    />
  )
}
