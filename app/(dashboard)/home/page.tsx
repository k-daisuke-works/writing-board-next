import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, ChevronRight } from 'lucide-react'
import type { WritingData } from '@/types/database'
import HomeMenuDropdown from './HomeMenuDropdown'

function relativeTime(t: string) {
  const m = Math.floor((Date.now() - new Date(t).getTime()) / 60000)
  if (m < 1) return 'たった今'
  if (m < 60) return `${m}分前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}時間前`
  const d = Math.floor(h / 24)
  return `${d}日前`
}

function truncate(s: string, n = 60) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

export default async function HomePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const hasDept = session.departmentId > 0

  // 4クエリを同時並列実行
  const [
    { data: departments },
    { data: membersRaw },
    { data: allOrgPosts },
    { data: teamRecentPosts },
  ] = await Promise.all([
    // 1. 部署一覧
    supabase
      .from('department_data')
      .select('*')
      .eq('organization_key', session.organizationKey)
      .order('department_id'),

    // 2. チームメンバー（部署未設定なら空）
    hasDept
      ? supabase
          .from('user_info')
          .select('user_key, user_name')
          .eq('department_id', session.departmentId)
          .eq('organization_key', session.organizationKey)
          .order('user_name')
      : Promise.resolve({ data: [] as { user_key: number; user_name: string }[], error: null }),

    // 3. 全部署の投稿を1クエリ取得 → JSで部署ごとに最新1件をdedup
    supabase
      .from('writing_data')
      .select('*')
      .eq('organization_key', session.organizationKey)
      .order('writing_time', { ascending: false })
      .limit(200),

    // 4. チームの7日以内投稿（department_idで絞るのでメンバーリスト不要）
    hasDept
      ? supabase
          .from('writing_data')
          .select('*')
          .eq('department_id', session.departmentId)
          .eq('organization_key', session.organizationKey)
          .gte('writing_time', sevenDaysAgo)
          .order('writing_time', { ascending: false })
      : Promise.resolve({ data: [] as WritingData[], error: null }),
  ])

  // 部署ごとに最新1件をJS dedup（投稿時刻降順なので先勝ち）
  const deptLatest: Record<number, WritingData> = {}
  for (const post of allOrgPosts ?? []) {
    if (post.department_id && !deptLatest[post.department_id]) {
      deptLatest[post.department_id] = post
    }
  }

  // メンバーごとに最新1件をJS dedup
  const teamMembers = membersRaw ?? []
  const memberLatest: Record<number, WritingData | null> = {}
  const seen = new Set<number>()
  for (const post of teamRecentPosts ?? []) {
    if (post.user_key != null && !seen.has(post.user_key)) {
      seen.add(post.user_key)
      memberLatest[post.user_key] = post
    }
  }
  for (const m of teamMembers) {
    if (!(m.user_key in memberLatest)) memberLatest[m.user_key] = null
  }

  return (
    <div className="anim-fade-in space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            おはようございます、{session.userName}さん
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {session.organizationName}
            {session.departmentName && ` · ${session.departmentName}`}
            {session.jobName && ` · ${session.jobName}`}
          </p>
        </div>
        <HomeMenuDropdown adminFlag={session.adminFlag} />
      </div>

      {/* 部署からのお知らせ */}
      {departments && departments.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-600 mb-2">各部署からのお知らせ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {departments.map((dept) => {
              const post = deptLatest[dept.department_id]
              return (
                <Link
                  key={dept.department_id}
                  href={`/department/${dept.department_id}`}
                  className="group"
                >
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-2 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{dept.department_name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {post ? truncate(post.message) : '投稿なし'}
                      </p>
                    </div>
                    {post && (
                      <span className="text-xs text-gray-400 shrink-0">{relativeTime(post.writing_time)}</span>
                    )}
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-400 shrink-0 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* チームのメッセージ */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 mb-2">
          チームのメッセージ
          {session.departmentName && (
            <span className="font-normal text-gray-400 ml-1.5">· {session.departmentName}</span>
          )}
        </h2>

        {session.departmentId <= 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-6 text-center">
            <p className="text-sm text-gray-400">所属部署が設定されていません</p>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-6 text-center">
            <p className="text-sm text-gray-400">チームメンバーが見つかりません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {teamMembers.map((member) => {
              const post = memberLatest[member.user_key]
              const isMe = member.user_key === session.userKey

              return (
                <div
                  key={member.user_key}
                  className={`rounded-lg px-3 py-2.5 flex items-center gap-2.5 min-w-0 border ${
                    isMe
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {/* アバター */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {member.user_name.slice(0, 1)}
                  </div>

                  {/* 名前 + メッセージ */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{member.user_name}</p>
                    <p className={`text-xs truncate ${post ? 'text-gray-500' : 'text-gray-300'}`}>
                      {post ? truncate(post.message) : 'まだ投稿がありません'}
                    </p>
                  </div>

                  {/* 投稿時刻 */}
                  {post && (
                    <span className="text-xs text-gray-400 shrink-0">{relativeTime(post.writing_time)}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
