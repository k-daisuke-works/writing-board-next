import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutGrid, MessageSquare, Calendar, Newspaper, Search } from 'lucide-react'
import UserMenu from '@/app/(dashboard)/components/UserMenu'
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
    .eq('user_key', userKey).in('post_id', allIds)

  const readSet = new Set((reads ?? []).map(r => r.post_id))
  return {
    board: boardIds.filter(id => !readSet.has(id)).length,
    team:  teamIds.filter(id => !readSet.has(id)).length,
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const unread = await getUnreadCounts(session.organizationKey, session.userKey, session.departmentId)

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-100">
      <header className="sticky top-0 z-40 overflow-x-clip border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-screen-xl items-center gap-2 px-3 sm:gap-6 sm:px-6">

          <Link href="/home" className="w-[26px] shrink-0 overflow-hidden sm:w-auto" aria-label="RoScope ホーム">
            <RoScopeLogo size="sm" />
          </Link>

          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          <nav className="flex min-w-0 flex-1 items-center justify-center gap-0 sm:justify-start sm:gap-1" aria-label="メインナビゲーション">
            <Link href="/home"
              className="relative flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">ホーム</span>
              {unread.team > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
            <Link href="/posts"
              className="relative flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">全体掲示板</span>
              {unread.board > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
            <Link href="/schedule/calendar"
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">スケジュール</span>
            </Link>
            <Link href="/welfare"
              className="hidden items-center gap-1.5 rounded px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:flex">
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">福祉情報</span>
            </Link>
            <Link href="/search"
              className="hidden items-center gap-1.5 rounded px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:flex">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">検索</span>
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-medium text-gray-800 leading-none">{session.userName}</span>
              <span className="text-xs text-gray-400 leading-none mt-0.5">{session.departmentName || session.organizationName}</span>
            </div>
            <UserMenu session={session} />
          </div>
        </div>
      </header>

      <main className="safe-pb mx-auto w-full max-w-screen-xl flex-1 px-3 py-4 sm:px-6 sm:py-7">
        {children}
      </main>
    </div>
  )
}
