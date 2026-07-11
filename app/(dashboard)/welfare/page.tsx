import { getSession } from '@/lib/session'
import { createOrgClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExternalLink, RefreshCw, Newspaper } from 'lucide-react'
import { WELFARE_SOURCES } from '@/lib/welfare-rss'

const SOURCE_NAMES = WELFARE_SOURCES.map(s => s.name)

function fmtDate(dt: string | null) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

export default async function WelfarePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { source } = await searchParams
  const supabase = await createOrgClient(session.organizationKey)

  // 60日以内の記事を最大200件
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('welfare_news')
    .select('id, source_name, title, url, published_at, fetched_at')
    .gte('fetched_at', since)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(200)

  if (source && SOURCE_NAMES.includes(source)) {
    query = query.eq('source_name', source)
  }

  const { data: news } = await query

  // ソース別にグループ化
  const grouped = SOURCE_NAMES.reduce<Record<string, typeof news>>((acc, name) => {
    acc[name] = (news ?? []).filter(n => n.source_name === name)
    return acc
  }, {})

  const totalCount = news?.length ?? 0
  const lastFetched = news?.[0]?.fetched_at ?? null

  const activeSource = source && SOURCE_NAMES.includes(source) ? source : null

  return (
    <div className="anim-fade-in max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">福祉情報</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
            {totalCount}件
            {lastFetched && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <RefreshCw className="w-3 h-3" />最終取得 {fmtDate(lastFetched)}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ソースフィルター */}
      <div className="flex gap-2 flex-wrap mb-5">
        <a
          href="/welfare"
          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
            !activeSource
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300 hover:text-blue-600'
          }`}
        >
          すべて
        </a>
        {SOURCE_NAMES.map(name => (
          <a
            key={name}
            href={`/welfare?source=${encodeURIComponent(name)}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              activeSource === name
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {name.replace('厚生労働省（', '').replace('）', '').replace('WAM NET（', 'WAM ').replace('）', '')}
          </a>
        ))}
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-1">まだ記事がありません</p>
          <p className="text-xs text-gray-400">新しい記事が入り次第ここに表示されます</p>
        </div>
      ) : activeSource ? (
        // 特定ソースフィルター時はフラットリスト
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <NewsList items={news ?? []} />
        </div>
      ) : (
        // 全件表示時はソース別グループ
        <div className="space-y-4">
          {SOURCE_NAMES.map(name => {
            const items = grouped[name] ?? []
            if (!items.length) return null
            return (
              <section key={name}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{name}</h2>
                  <a href={`/welfare?source=${encodeURIComponent(name)}`}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                    すべて見る →
                  </a>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <NewsList items={items.slice(0, 10)} />
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

type NewsItem = {
  id: number
  source_name: string
  title: string
  url: string
  published_at: string | null
  fetched_at: string
}

function NewsList({ items }: { items: NewsItem[] }) {
  return (
    <ul className="divide-y divide-gray-100">
      {items.map(item => (
        <li key={item.id}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                {item.title}
              </p>
              {item.published_at && (
                <p className="text-xs text-gray-400 mt-0.5">{fmtDate(item.published_at)}</p>
              )}
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors shrink-0 mt-0.5" />
          </a>
        </li>
      ))}
    </ul>
  )
}
