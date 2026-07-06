// サーバーからの Realtime Broadcast（WebSocket 不要の REST 送信）。
//
// 旧実装は anon キーで postgres_changes を購読していたが、対象テーブルの
// RLS SELECT ポリシーが無いためイベントが購読者に届いていなかった。
// service role からの broadcast に切り替える。
//
// チャンネルは匿名購読可能な public チャンネルのため、ペイロードには
// 組織を識別できる情報や機密を一切含めない（「更新があった」シグナルのみ）。
// クライアントはこれを受けて organization_key スコープ済みの /api/data/* を
// 再取得する。完全な購読制限には Supabase Auth 導入が必要（HANDOFF 参照）。

import { createHmac } from 'crypto'

/**
 * 組織単位の Realtime チャンネル名。
 * organizationKey は連番で推測可能なため、そのままチャンネル名にすると
 * 第三者が総当りで各組織の更新タイミングを観測できてしまう。
 * JWT_SECRET による HMAC で推測困難な名前にする（サーバーでのみ算出）。
 */
export function realtimeTopic(organizationKey: number): string {
  const secret = process.env.JWT_SECRET ?? ''
  const h = createHmac('sha256', secret).update(`rt:${organizationKey}`).digest('hex').slice(0, 24)
  return `rt-${h}`
}

/** 組織のクライアントに「データ更新あり」を通知する。失敗しても throw しない */
export async function broadcastRefresh(organizationKey: number): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ topic: realtimeTopic(organizationKey), event: 'refresh', payload: {} }],
      }),
    })
  } catch {
    // リアルタイム通知の失敗は業務処理に影響させない
  }
}
