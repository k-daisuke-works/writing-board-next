import { getSession } from '@/lib/session'
import { createOrgClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { fmtDatetime, relativeTime } from '@/lib/utils'
import DmSendForm from './DmSendForm'
import MarkDmReadOnMount from './MarkDmReadOnMount'
import ReportThreadButton from './ReportThreadButton'
import DmRealtime from '@/app/(dashboard)/components/DmRealtime'
import type { DmPair, DmMessage } from '@/types/database'

export default async function DmThreadPage({ params }: { params: Promise<{ pairId: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { pairId: pairIdRaw } = await params
  const pairId = Number(pairIdRaw)
  if (!Number.isInteger(pairId) || pairId <= 0) redirect('/messages')

  const me = session.userKey
  // DM は participant 限定 RLS のため userKey クレーム必須
  const supabase = await createOrgClient(session.organizationKey, { userKey: me })

  const { data: pairRaw } = await supabase
    .from('dm_pairs')
    .select('pair_id, user_a, user_b, status, disclosed_by')
    .eq('pair_id', pairId)
    .eq('organization_key', session.organizationKey)
    .maybeSingle()
  const pair = pairRaw as Pick<DmPair, 'pair_id' | 'user_a' | 'user_b' | 'status' | 'disclosed_by'> | null

  // 存在しない / 参加者でない（RLSで不可視）/ 未承認ペアは開けない
  if (!pair) redirect('/messages')
  if (pair.user_a !== me && pair.user_b !== me) redirect('/messages')
  if (pair.status !== 'accepted') redirect('/messages')

  const otherKey = pair.user_a === me ? pair.user_b : pair.user_a

  const [{ data: other }, { data: msgsRaw }] = await Promise.all([
    supabase
      .from('user_info')
      .select('user_key, user_name, avatar_url')
      .eq('user_key', otherKey)
      .eq('organization_key', session.organizationKey)
      .maybeSingle(),
    supabase
      .from('dm_messages')
      .select('message_id, sender_key, message, created_at')
      .eq('pair_id', pairId)
      .eq('organization_key', session.organizationKey)
      .order('created_at', { ascending: true }),
  ])

  const messages = (msgsRaw ?? []) as DmMessage[]
  const otherName = other?.user_name ?? '不明なユーザー'
  const otherAvatar = other?.avatar_url ?? null
  // 開示済みバナーは報告した本人にのみ表示（相手には見せない＝報復リスク回避）
  const iDisclosed = pair.disclosed_by === me

  return (
    <div className="anim-fade-in mx-auto flex min-h-[calc(100dvh-8rem)] max-w-2xl flex-col">
      <MarkDmReadOnMount pairId={pairId} />
      <DmRealtime channel={session.realtimeChannel} />

      {/* ヘッダー */}
      <div className="mb-3 flex items-center gap-2">
        <Link href="/messages" className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-blue-600">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-violet-100">
          {otherAvatar ? (
            <img src={otherAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-violet-600">
              {otherName.slice(0, 1)}
            </div>
          )}
        </div>
        <span className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900">{otherName}</span>
        <ReportThreadButton pairId={pairId} />
      </div>

      {iDisclosed && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          このスレッドは管理者に開示済みです
        </div>
      )}

      {/* メッセージ一覧 */}
      <div className="flex-1 space-y-3 py-2">
        {messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">まだメッセージがありません。最初のメッセージを送りましょう。</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_key === me
            return (
              <div key={m.message_id} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && (
                  <div className="h-7 w-7 shrink-0 self-end overflow-hidden rounded-full border border-gray-200 bg-violet-100">
                    {otherAvatar ? (
                      <img src={otherAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-violet-600">
                        {otherName.slice(0, 1)}
                      </div>
                    )}
                  </div>
                )}
                <div className={`flex max-w-[75%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      mine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {m.message}
                  </div>
                  <span className="mt-0.5 px-1 text-[10px] text-gray-400" title={fmtDatetime(m.created_at)}>
                    {relativeTime(m.created_at)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <DmSendForm pairId={pairId} />
    </div>
  )
}
