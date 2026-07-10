import { Suspense } from 'react'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UserMenu from '@/app/(dashboard)/components/UserMenu'
import NavLinks from '@/app/(dashboard)/components/NavLinks'
import { RoScopeLogo } from '@/app/components/RoScopeLogo'

async function getUnreadCounts(organizationKey: number, userKey: number, departmentId: number) {
  const supabase = createServiceClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [boardResult, teamResult] = await Promise.all([
    supabase.from('writing_data').select('writing_id')
      .eq('organization_key', organizationKey).eq('post_type', 'board')
      .gte('writing_time', sevenDaysAgo),
    departmentId > 0
      ? supabase.from('writing_data').select('writing_id')
          .eq('organization_key', organizationKey).eq('post_type', 'team')
          .eq('department_id', departmentId).gte('writing_time', sevenDaysAgo)
      : Promise.resolve({ data: [] as { writing_id: number }[] }),
  ])

  const boardIds = (boardResult.data ?? []).map(p => p.writing_id)
  const teamIds  = (teamResult.data  ?? []).map(p => p.writing_id)
  const allIds   = [...boardIds, ...teamIds]

  if (allIds.length === 0) return { board: 0, team: 0 }

  const { data: reads } = await supabase
    .from('post_reads').select('post_id')
    .eq('organization_key', organizationKey)
    .eq('user_key', userKey).in('post_id', allIds)

  const readSet = new Set((reads ?? []).map(r => r.post_id))
  return {
    board: boardIds.filter(id => !readSet.has(id)).length,
    team:  teamIds.filter(id => !readSet.has(id)).length,
  }
}

// 未読カウントは Suspense 内で非同期に取得し、ページ本体の描画をブロックしない
async function NavWithUnread({ organizationKey, userKey, departmentId }: {
  organizationKey: number; userKey: number; departmentId: number
}) {
  const unread = await getUnreadCounts(organizationKey, userKey, departmentId)
  return <NavLinks unreadBoard={unread.board} unreadTeam={unread.team} />
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#faf7ee]">
      <header className="sticky top-0 z-40 overflow-x-clip border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-screen-xl items-center gap-2 px-3 sm:gap-6 sm:px-6">

          <Link href="/home" className="w-[26px] shrink-0 overflow-hidden sm:w-auto" aria-label="RoScope ホーム">
            <RoScopeLogo size="sm" />
          </Link>

          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          <Suspense fallback={<NavLinks unreadBoard={0} unreadTeam={0} />}>
            <NavWithUnread
              organizationKey={session.organizationKey}
              userKey={session.userKey}
              departmentId={session.departmentId}
            />
          </Suspense>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-medium text-gray-800 leading-none">{session.userName}</span>
              <span className="text-xs text-gray-400 leading-none mt-0.5">{session.departmentName || session.organizationName}</span>
            </div>
            <UserMenu session={session} />
          </div>
        </div>
      </header>

      <main className="pop-headings safe-pb mx-auto w-full max-w-screen-xl flex-1 px-3 py-4 sm:px-6 sm:py-7">
        {children}
      </main>
    </div>
  )
}
