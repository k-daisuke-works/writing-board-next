import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Building2, ChevronRight } from 'lucide-react'

export default async function MembersPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()

  const [{ data: members }, { data: departments }] = await Promise.all([
    supabase.from('user_info')
      .select('user_key, user_name, avatar_url, affiliation, profile, department_id')
      .eq('organization_key', session.organizationKey)
      .order('user_name'),
    supabase.from('department_data')
      .select('department_id, department_name')
      .eq('organization_key', session.organizationKey),
  ])

  const deptMap = Object.fromEntries(
    (departments ?? []).map(d => [d.department_id, d.department_name])
  )

  return (
    <div className="anim-fade-in max-w-2xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">メンバー一覧</h1>
        <p className="text-sm text-gray-500 mt-0.5">{members?.length ?? 0}名</p>
      </div>

      {members && members.length > 0 ? (
        <div className="space-y-2">
          {members.map(member => (
            <Link
              key={member.user_key}
              href={`/member/${member.user_key}`}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg px-4 py-3.5 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              {/* アバター */}
              <div className="w-11 h-11 rounded-full overflow-hidden bg-blue-100 shrink-0 border border-gray-200">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-600 text-sm font-bold">
                    {member.user_name.slice(0, 1)}
                  </div>
                )}
              </div>

              {/* 情報 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                    {member.user_name}
                  </span>
                  {member.user_key === session.userKey && (
                    <span className="text-xs text-blue-500 font-medium">（自分）</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {deptMap[member.department_id] && (
                    <span className="text-xs text-gray-500">{deptMap[member.department_id]}</span>
                  )}
                  {member.affiliation && (
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <Building2 className="w-3 h-3 shrink-0" />
                      {member.affiliation}
                    </span>
                  )}
                </div>
                {member.profile && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{member.profile}</p>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">メンバーがいません</p>
        </div>
      )}
    </div>
  )
}
