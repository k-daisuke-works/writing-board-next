// Instagram 投稿のサーバー側取得（Instagram API with Instagram Login）。
//
// クライアントに Meta の埋め込みスクリプトを読み込まず、Cron がサーバー側で
// 取得して DB にキャッシュし、アプリ内でネイティブ表示する（welfare_news と同パターン）。
// media_url は数日で失効する署名付き URL のため、Cron は1日2回実行して更新する。
// アカウント登録手順は supabase/migrations/20260710_instagram.sql のコメントを参照。

import { createServiceClient } from '@/lib/supabase/server'

const GRAPH = 'https://graph.instagram.com'
const FETCH_LIMIT = 24
/** トークン残り有効期間がこれを下回ったら延長する（60日トークンを10日前に更新） */
const REFRESH_BEFORE_MS = 10 * 24 * 60 * 60 * 1000

type IgMedia = {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink: string
  timestamp?: string
}

async function refreshTokenIfNeeded(account: {
  organization_key: number
  access_token: string
  token_expires_at: string | null
}): Promise<string> {
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0
  if (expiresAt - Date.now() > REFRESH_BEFORE_MS) return account.access_token

  const res = await fetch(
    `${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(account.access_token)}`,
    { signal: AbortSignal.timeout(10000) },
  )
  if (!res.ok) return account.access_token // 失効間際でなければ旧トークンで続行できる

  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!json.access_token) return account.access_token

  const supabase = createServiceClient()
  await supabase.from('instagram_accounts')
    .update({
      access_token: json.access_token,
      token_expires_at: new Date(Date.now() + (json.expires_in ?? 60 * 86400) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_key', account.organization_key)

  return json.access_token
}

/**
 * 連携済み全組織の Instagram 投稿を取得して DB キャッシュを更新する。
 * 失敗した組織はスキップし、エラーメッセージを返す（throw しない）。
 */
export async function refreshInstagramCache(): Promise<{ orgs: number; posts: number; errors: string[] }> {
  const supabase = createServiceClient()
  const errors: string[] = []
  let orgs = 0
  let posts = 0

  // tenant-ok: 全組織横断の Cron バッチ。取得結果は各行の organization_key でスコープして保存する
  const { data: accounts } = await supabase
    .from('instagram_accounts')
    .select('organization_key, ig_user_id, access_token, token_expires_at')

  for (const account of accounts ?? []) {
    try {
      const token = await refreshTokenIfNeeded(account)
      const runStart = new Date().toISOString()

      const res = await fetch(
        `${GRAPH}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=${FETCH_LIMIT}&access_token=${encodeURIComponent(token)}`,
        { signal: AbortSignal.timeout(15000) },
      )
      if (!res.ok) {
        errors.push(`org:${account.organization_key} media fetch ${res.status}`)
        continue
      }
      const json = (await res.json()) as { data?: IgMedia[] }
      const media = json.data ?? []
      if (media.length === 0) { orgs++; continue }

      const rows = media.map(m => ({
        organization_key: account.organization_key,
        media_id:      m.id,
        caption:       m.caption?.slice(0, 2000) ?? null,
        media_type:    m.media_type,
        media_url:     m.media_url ?? null,
        thumbnail_url: m.thumbnail_url ?? null,
        permalink:     m.permalink,
        posted_at:     m.timestamp ? new Date(m.timestamp).toISOString() : null,
        fetched_at:    new Date().toISOString(),
      }))

      const { error: upsertError } = await supabase
        .from('instagram_posts')
        .upsert(rows, { onConflict: 'organization_key,media_id' })
      if (upsertError) {
        errors.push(`org:${account.organization_key} upsert: ${upsertError.message}`)
        continue
      }

      // 今回の取得に含まれなかった行（削除された投稿・古い投稿）は media_url が失効するため掃除する
      await supabase.from('instagram_posts')
        .delete()
        .eq('organization_key', account.organization_key)
        .lt('fetched_at', runStart)

      orgs++
      posts += rows.length
    } catch (e) {
      errors.push(`org:${account.organization_key} ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  return { orgs, posts, errors }
}
