import { getSession } from '@/lib/session'
import { createOrgClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExpandableText } from '@/app/(dashboard)/components/ExpandableText'
import Link from 'next/link'
import { Search, Clock, Building2 } from 'lucide-react'
import SearchForm from './SearchForm'
import { fmtDatetime } from '@/lib/utils'

const POST_TYPE_LABEL: Record<string, string> = {
  board: '全体掲示板',
  team: 'チーム',
  notice: 'お知らせ',
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { q } = await searchParams
  const query = q?.trim() ?? ''

  let results: Awaited<ReturnType<typeof fetchResults>> = []
  if (query.length >= 1) {
    results = await fetchResults(session.organizationKey, session.departmentId, query)
  }

  return (
    <div className="anim-fade-in max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">投稿検索</h1>
        <p className="text-sm text-gray-500 mt-0.5">全投稿からキーワードで検索します</p>
      </div>

      <SearchForm defaultValue={query} />

      {query && (
        <p className="text-sm text-gray-500 mt-4 mb-3">
          「<span className="font-medium text-gray-800">{query}</span>」の検索結果：{results.length}件
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-2.5 mt-2">
          {results.map((post) => (
            <Link
              key={post.writing_id}
              href={post.post_type === 'board' ? `/department/${post.department_id}` : `/member/${post.user_key}`}
              className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {post.user_name_stamp.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{post.user_name_stamp}</span>
                    <span className="text-xs text-gray-400">{post.job_name_stamp}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {POST_TYPE_LABEL[post.post_type] ?? post.post_type}
                    </span>
                    {post.department_name_stamp && (
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <Building2 className="w-3 h-3" />{post.department_name_stamp}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Clock className="w-3 h-3" />{fmtDatetime(post.writing_time)}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <ExpandableText
                  text={post.message}
                  className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                />
              </div>
            </Link>
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200 mt-2">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">該当する投稿が見つかりませんでした</p>
        </div>
      )}

      {!query && (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200 mt-4">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">キーワードを入力して検索してください</p>
        </div>
      )}
    </div>
  )
}

async function fetchResults(organizationKey: number, departmentId: number, query: string) {
  const supabase = await createOrgClient(organizationKey)
  const { data } = await supabase
    .from('writing_data')
    .select('writing_id, user_key, user_name_stamp, job_name_stamp, department_id, department_name_stamp, post_type, message, writing_time')
    .eq('organization_key', organizationKey)
    // 閲覧範囲は各ページと同じ: board は組織全体、team / notice は自部署のみ
    .or(`post_type.eq.board,department_id.eq.${departmentId}`)
    .ilike('message', `%${query}%`)
    .order('writing_time', { ascending: false })
    .limit(50)
  return data ?? []
}
