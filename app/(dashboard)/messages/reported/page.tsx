import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ShieldAlert } from 'lucide-react'
import { fmtDatetime } from '@/lib/utils'
import type { DmPair, DmMessage } from '@/types/database'

export default async function ReportedDmPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect('/home')

  // tenant-ok: 当事者が開示操作した DM スレッドのみを管理者が閲覧する画面。disclosed_at IS NOT NULL ＋ org フィルタで限定
  const supabase = createServiceClient()

  const { data: pairsRaw } = await supabase
    .from('dm_pairs')
    .select('pair_id, user_a, user_b, requested_by, disclosed_at, disclosed_by')
    .eq('organization_key', session.organizationKey)
    .not('disclosed_at', 'is', null)
    .order('disclosed_at', { ascending: false })
  const pairs = (pairsRaw ?? []) as DmPair[]

  // 関係するユーザー名をまとめて取得
  const userKeys = [...new Set(pairs.flatMap((p) => [p.user_a, p.user_b]))]
  const nameMap: Record<number, string> = {}
  if (userKeys.length > 0) {
    const { data: users } = await supabase
      .from('user_info')
      .select('user_key, user_name')
      .eq('organization_key', session.organizationKey)
      .in('user_key', userKeys)
    for (const u of users ?? []) nameMap[u.user_key] = u.user_name
  }

  // 各スレッドの全メッセージを1クエリで取得しJSグルーピング
  const pairIds = pairs.map((p) => p.pair_id)
  const msgMap: Record<number, DmMessage[]> = {}
  if (pairIds.length > 0) {
    const { data: msgs } = await supabase
      .from('dm_messages')
      .select('message_id, pair_id, sender_key, message, created_at')
      .eq('organization_key', session.organizationKey)
      .in('pair_id', pairIds)
      .order('created_at', { ascending: true })
    for (const m of (msgs ?? []) as DmMessage[]) {
      if (!msgMap[m.pair_id]) msgMap[m.pair_id] = []
      msgMap[m.pair_id].push(m)
    }
  }

  // 開示スレッドの閲覧は監査ログに記録（レスポンス後）
  after(() =>
    logAudit({
      organizationKey: session.organizationKey,
      actorUserKey: session.userKey,
      actorName: session.userName,
      action: 'dm.disclosed_view',
      target: 'dm_pairs:disclosed',
      detail: { count: pairs.length },
    }),
  )

  const nameOf = (k: number) => nameMap[k] ?? '不明なユーザー'

  return (
    <div className="anim-fade-in max-w-3xl">
      <Link href="/messages" className="mb-4 flex w-fit items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" />
        メッセージに戻る
      </Link>

      <h1 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <ShieldAlert className="h-5 w-5 text-red-500" />
        報告されたスレッド
      </h1>
      <p className="mb-5 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-500">
        ここに表示されるのは当事者が報告・開示したスレッドのみです。閲覧は監査ログに記録されます。
      </p>

      {pairs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">報告されたスレッドはありません</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {pairs.map((p) => {
            const reporter = p.disclosed_by ? nameOf(p.disclosed_by) : '不明'
            const otherKey = p.disclosed_by === p.user_a ? p.user_b : p.user_a
            const otherName = p.disclosed_by ? nameOf(otherKey) : `${nameOf(p.user_a)} / ${nameOf(p.user_b)}`
            const msgs = msgMap[p.pair_id] ?? []
            return (
              <details key={p.pair_id} className="group/card overflow-hidden rounded-lg border border-gray-200 bg-white">
                <summary className="flex min-h-[44px] cursor-pointer select-none list-none items-center gap-2 px-4 py-3 hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {reporter} <span className="text-gray-400">→</span> {otherName}
                    </p>
                    <p className="text-xs text-gray-400">
                      報告日時: {p.disclosed_at ? fmtDatetime(p.disclosed_at) : '-'} ・ {msgs.length}件
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open/card:rotate-180" />
                </summary>

                <div className="space-y-2 border-t border-gray-100 bg-gray-50 px-4 py-4">
                  {msgs.length === 0 ? (
                    <p className="text-sm text-gray-400">メッセージはありません</p>
                  ) : (
                    msgs.map((m) => (
                      <div key={m.message_id} className="rounded-lg bg-white px-3 py-2">
                        <div className="mb-0.5 flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-700">{nameOf(m.sender_key)}</span>
                          <span className="shrink-0 text-[10px] text-gray-400">{fmtDatetime(m.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm text-gray-800">{m.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
