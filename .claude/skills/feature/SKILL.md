---
name: feature
description: 新機能・機能変更の実装規約チェックリスト。Server Action / ページ / DBスキーマ変更 / 通知 / 監査ログの定型手順。新しい機能の実装を始める前と、実装完了時の自己チェックに読む。
---

# 機能実装の定型手順

`/context`（構成リファレンス）と併用する。ここは「作るときに従う手順」。

## Server Action を新設するとき

```typescript
'use server'
export async function someAction(formData: FormData) {
  // 1. 認証（必須）
  const session = await getSession()
  if (!session) return { error: '認証が必要です。' }
  // 2. 認可（管理操作なら）: session.role !== 'admin' / isAdminOrLeader(session.role)
  //    リーダーは自部署スコープに制限する
  // 3. 入力検証: ID系は .normalize('NFKC').trim() / 長さ制限 / Number(x) || null
  // 4. DBクエリ: 必ず .eq('organization_key', session.organizationKey)
  // 5. エラーは throw せず { error } を返す（23505/23503 は意味のあるメッセージに変換）
  // 6. revalidatePath: 影響する全ページを列挙
  // 7. 副作用（通知・監査ログ）は after() でレスポンス後に実行
}
```

### セキュリティ上重要な操作には監査ログ（ISO27001 A.8.15）

対象: ユーザーCRUD・パスワード変更/リセット・凍結/解除・ポリシー変更・ログイン失敗

```typescript
import { after } from 'next/server'
import { logAudit } from '@/lib/audit'

after(() => logAudit({
  organizationKey: session.organizationKey,
  actorUserKey: session.userKey,
  actorName: session.userName,
  action: 'user.update',          // lib/audit.ts の AuditAction 型に追加してから使う
  target: `user:${userKey}`,
  detail: { /* 変更内容の要点 */ },
}))
```

### 新しいコンテンツ種別にはプッシュ通知

```typescript
import { sendPush } from '@/lib/push'

after(() => sendPush(
  // 対象: 組織全体 or departmentId（部署のみ）or userKeys（特定ユーザー）。送信者は excludeUserKey で除外
  { organizationKey: session.organizationKey, excludeUserKey: session.userKey },
  { title: '...', body: `${session.userName}: ${text.slice(0, 80)}`, url: '/posts', tag: `xxx-${id}` }
))
```

## Server Page を新設するとき

1. 冒頭で `getSession()` → なければ `redirect('/login')`
2. 独立クエリは `Promise.all` で並列化
3. SELECT は使うカラムを明示列挙（表示用ユーザー情報は `avatar_url` も）
4. 「エンティティごとに最新1件」は1クエリ＋JSグルーピング（N+1禁止）
5. UI は `/mobile` チェックリスト準拠（幅375px起点）

## DBスキーマを変更するとき

1. `supabase/migrations/YYYYMMDD_<内容>.sql` を新規作成（`CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`）
2. `supabase/schema.sql` にも同じ定義を反映（新規テーブルは RLS 有効化行も追加）
3. `types/database.ts` に型を追加
4. **ユーザーに「Supabase SQL Editor でマイグレーション実行が必要」と必ず伝える**（MCP未認証のため自動適用できない）

## 実装完了時のチェック

1. 小さい変更: `npx tsc --noEmit` を直接実行
2. 大きい変更（複数ファイル・ビルド影響あり）: **build-check エージェント**に委譲（ビルドログをメイン会話に持ち込まない）
3. Server Action・DBクエリ・APIを触った: **tenant-audit エージェント**で監査
4. TSX を触った: **mobile-review エージェント**で監査
5. `/push` でコミット＆プッシュ
