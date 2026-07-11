import { getSession } from '@/lib/session'
import { createOrgClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessagesSquare, ChevronRight, Clock, ShieldAlert } from 'lucide-react'
import { relativeTime } from '@/lib/utils'
import RespondDmButtons from './RespondDmButtons'
import DmRealtime from '@/app/(dashboard)/components/DmRealtime'
import type { DmPair, DmMessage } from '@/types/database'

type OtherUser = { user_name: string; avatar_url: string | null }

function Avatar({ user, size = 44 }: { user?: OtherUser; size?: number }) {
  const name = user?.user_name ?? '?'
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full border border-gray-200 bg-blue-100"
      style={{ width: size, height: size }}
    >
      {user?.avatar_url ? (
        <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-blue-600">
          {name.slice(0, 1)}
        </div>
      )}
    </div>
  )
}

export default async function MessagesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const me = session.userKey
  // DM は participant 限定 RLS のため userKey クレーム必須（渡さないと全行不可視）
  const supabase = await createOrgClient(session.organizationKey, { userKey: me })

  const { data: pairsRaw } = await supabase
    .from('dm_pairs')
    .select('pair_id, user_a, user_b, requested_by, status, created_at, responded_at')
    .eq('organization_key', session.organizationKey)
    .or(`user_a.eq.${me},user_b.eq.${me}`)
  const pairs = (pairsRaw ?? []) as DmPair[]

  const otherOf = (p: DmPair) => (p.user_a === me ? p.user_b : p.user_a)

  // 相手ユーザーをまとめて取得（N+1回避・1クエリ）
  const otherKeys = [...new Set(pairs.map(otherOf))]
  const userMap: Record<number, OtherUser> = {}
  if (otherKeys.length > 0) {
    const { data: users } = await supabase
      .from('user_info')
      .select('user_key, user_name, avatar_url')
      .eq('organization_key', session.organizationKey)
      .in('user_key', otherKeys)
    for (const u of users ?? []) userMap[u.user_key] = { user_name: u.user_name, avatar_url: u.avatar_url ?? null }
  }

  const accepted = pairs.filter((p) => p.status === 'accepted')
  const incoming = pairs.filter((p) => p.status === 'pending' && p.requested_by !== me)
  // ブロックの秘匿: ブロックされた側（=requested_by が自分の blocked）には承認待ちと同じ表示を出す
  const outgoing = pairs.filter((p) => p.requested_by === me && (p.status === 'pending' || p.status === 'blocked'))

  // 承認済みスレッドの最終メッセージ・自分宛未読件数を1クエリ＋JS集計で
  const acceptedIds = accepted.map((p) => p.pair_id)
  const lastMsg: Record<number, DmMessage> = {}
  const unread: Record<number, number> = {}
  if (acceptedIds.length > 0) {
    const { data: msgs } = await supabase
      .from('dm_messages')
      .select('pair_id, sender_key, message, created_at, read_at')
      .eq('organization_key', session.organizationKey)
      .in('pair_id', acceptedIds)
      .order('created_at', { ascending: false })
    for (const m of (msgs ?? []) as DmMessage[]) {
      if (!lastMsg[m.pair_id]) lastMsg[m.pair_id] = m // 降順なので最初が最新
      if (m.sender_key !== me && m.read_at === null) unread[m.pair_id] = (unread[m.pair_id] ?? 0) + 1
    }
  }

  const sortedAccepted = [...accepted].sort((a, b) => {
    const ta = lastMsg[a.pair_id]?.created_at ?? a.responded_at ?? a.created_at
    const tb = lastMsg[b.pair_id]?.created_at ?? b.responded_at ?? b.created_at
    return new Date(tb).getTime() - new Date(ta).getTime()
  })

  return (
    <div className="anim-fade-in max-w-2xl">
      <DmRealtime channel={session.realtimeChannel} />

      <Link href="/home" className="mb-4 flex w-fit items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" />
        ホームに戻る
      </Link>

      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-gray-900">メッセージ</h1>
        {session.role === 'admin' && (
          <Link href="/messages/reported" className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600">
            <ShieldAlert className="h-3.5 w-3.5" />
            報告一覧
          </Link>
        )}
      </div>

      {/* ① 自分宛のリクエスト */}
      {incoming.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-500">受け取ったリクエスト</h2>
          <div className="space-y-2.5">
            {incoming.map((p) => {
              const other = userMap[otherOf(p)]
              return (
                <div key={p.pair_id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <Avatar user={other} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{other?.user_name ?? '不明なユーザー'}</p>
                      <p className="text-xs text-gray-400">メッセージのリクエストが届いています</p>
                    </div>
                  </div>
                  <RespondDmButtons pairId={p.pair_id} />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ② 承認済みの会話 */}
      <section className="mb-6">
        {sortedAccepted.length > 0 ? (
          <div className="space-y-2">
            {sortedAccepted.map((p) => {
              const other = userMap[otherOf(p)]
              const last = lastMsg[p.pair_id]
              const count = unread[p.pair_id] ?? 0
              return (
                <Link
                  key={p.pair_id}
                  href={`/messages/${p.pair_id}`}
                  className="flex min-h-[44px] items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
                >
                  <Avatar user={other} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                        {other?.user_name ?? '不明なユーザー'}
                      </span>
                      {last && <span className="shrink-0 text-xs text-gray-400">{relativeTime(last.created_at)}</span>}
                    </div>
                    <p className="truncate text-xs text-gray-500">
                      {last ? last.message : 'まだメッセージがありません'}
                    </p>
                  </div>
                  {count > 0 ? (
                    <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white">
                      {count}
                    </span>
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  )}
                </Link>
              )
            })}
          </div>
        ) : incoming.length === 0 && outgoing.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
            <MessagesSquare className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-400">まだ会話がありません</p>
            <p className="mt-1 text-xs text-gray-400">メンバー詳細からメッセージをリクエストできます</p>
          </div>
        ) : null}
      </section>

      {/* ③ 自分が送って承認待ちのもの */}
      {outgoing.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-500">承認待ち</h2>
          <div className="space-y-2">
            {outgoing.map((p) => {
              const other = userMap[otherOf(p)]
              return (
                <div key={p.pair_id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
                  <Avatar user={other} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{other?.user_name ?? '不明なユーザー'}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3 shrink-0" />
                      相手の承認を待っています
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">承認待ち</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
