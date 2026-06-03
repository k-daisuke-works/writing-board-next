import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const [{ data: members }, { data: departments }] = await Promise.all([
    supabase.from('user_info')
      .select('user_key, user_name, avatar_url, affiliation, profile, department_id')
      .eq('organization_key', session.organizationKey).order('user_name'),
    supabase.from('department_data')
      .select('department_id, department_name').eq('organization_key', session.organizationKey),
  ])

  const deptMap = Object.fromEntries((departments ?? []).map(d => [d.department_id, d.department_name]))

  return NextResponse.json({ members: members ?? [], deptMap, fetchedAt: Date.now() })
}
