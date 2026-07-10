import webpush from 'web-push'
import { createOrgClient } from '@/lib/supabase/server'

// VAPID は遅延初期化（モジュールレベル初期化は env 未設定時にデプロイ全体を壊す）
let vapidReady: boolean | null = null
function initVapid(): boolean {
  if (vapidReady !== null) return vapidReady
  const subject = process.env.VAPID_SUBJECT
  const pub     = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv    = process.env.VAPID_PRIVATE_KEY
  vapidReady = Boolean(subject && pub && priv)
  if (vapidReady) webpush.setVapidDetails(subject!, pub!, priv!)
  return vapidReady
}

export type PushTarget = {
  organizationKey: number
  /** 指定時はその部署のメンバーのみに送信 */
  departmentId?: number
  /** 指定時はこのユーザーのみに送信（departmentId より優先） */
  userKeys?: number[]
  /** 送信者自身に通知しない */
  excludeUserKey?: number
}

export type PushPayload = {
  title: string
  body: string
  url: string
  /** 同一タグの通知は端末上で置き換えられる */
  tag?: string
}

/**
 * Web Push を対象者に送信する。Server Action / Route Handler から
 * `after(() => sendPush(...))` で呼ぶこと（レスポンスをブロックしない）。
 * 失敗しても throw しない。戻り値は送信成功数。
 */
export async function sendPush(target: PushTarget, payload: PushPayload): Promise<number> {
  try {
    if (!initVapid()) return 0
    const supabase = await createOrgClient(target.organizationKey)

    let userKeys = target.userKeys ?? null
    if (!userKeys && target.departmentId) {
      const { data } = await supabase
        .from('user_info')
        .select('user_key')
        .eq('organization_key', target.organizationKey)
        .eq('department_id', target.departmentId)
      userKeys = (data ?? []).map(u => u.user_key)
      if (userKeys.length === 0) return 0
    }

    let query = supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('organization_key', target.organizationKey)
    if (userKeys) query = query.in('user_key', userKeys)
    if (target.excludeUserKey != null) query = query.neq('user_key', target.excludeUserKey)

    const { data: subs } = await query
    if (!subs || subs.length === 0) return 0

    const json = JSON.stringify(payload)
    const results = await Promise.allSettled(
      subs.map(s =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          json
        )
      )
    )

    // 期限切れ・解除済み購読（410 Gone / 404）は次回以降の無駄送信を防ぐため削除
    const deadEndpoints = results
      .map((r, i) => {
        if (r.status !== 'rejected') return null
        const code = (r.reason as { statusCode?: number })?.statusCode
        return code === 404 || code === 410 ? subs[i].endpoint : null
      })
      .filter((e): e is string => e !== null)
    if (deadEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', deadEndpoints)
        .eq('organization_key', target.organizationKey)
    }

    return results.filter(r => r.status === 'fulfilled').length
  } catch {
    return 0
  }
}
