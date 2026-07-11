import { createOrgClient } from '@/lib/supabase/server'

/**
 * 監査ログのアクション種別。
 * 「誰が・いつ・何に・何をしたか」を追跡する（ISO27001 A.8.15）。
 */
export type AuditAction =
  | 'auth.login_failed'
  | 'auth.password_change'
  | 'auth.reset_request'
  | 'auth.reset_complete'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.password_reset'
  | 'user.freeze'
  | 'user.unfreeze'
  | 'user.email_change'
  | 'org.password_change'
  | 'policy.update'
  | 'post.force_delete'
  | 'post.remind_unread'
  | 'dm.disclose'
  | 'dm.disclosed_view'

export type AuditEntry = {
  organizationKey: number
  actorUserKey?: number | null
  actorName: string
  action: AuditAction
  /** 操作対象（例: 'user:12'） */
  target?: string
  detail?: Record<string, unknown>
  ipAddress?: string
}

/**
 * 監査ログを記録する。失敗しても throw しない（業務処理を止めない）。
 * Server Action からは `after(() => logAudit(...))` で呼ぶとレスポンスをブロックしない。
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await createOrgClient(entry.organizationKey)
    await supabase.from('audit_logs').insert({
      organization_key: entry.organizationKey,
      actor_user_key:   entry.actorUserKey ?? null,
      actor_name:       entry.actorName,
      action:           entry.action,
      target:           entry.target ?? null,
      detail:           entry.detail ?? null,
      ip_address:       entry.ipAddress ?? null,
    })
  } catch {
    // 監査ログの失敗は業務処理に影響させない
  }
}
