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
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">

          <Link href="/home" className="shrink-0">
            <RoScopeLogo size="sm" />
          </Link>

          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          <nav className="flex items-center gap-1 flex-1">
            <Link href="/home"
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">ホーム</span>
              {unread.team > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
            <Link href="/posts"
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">全体掲示板</span>
              {unread.board > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
            <Link href="/schedule/calendar"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">スケジュール</span>
            </Link>
            <Link href="/welfare"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">福祉情報</span>
            </Link>
            <Link href="/search"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">検索</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-medium text-gray-800 leading-none">{session.userName}</span>
              <span className="text-xs text-gray-400 leading-none mt-0.5">{session.departmentName || session.organizationName}</span>
            </div>
            <UserMenu session={session} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {children}
      </main>
    </div>
  )
}
