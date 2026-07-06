---
name: context
description: writing-board-next のプロジェクト構成リファレンス（DBスキーマ・ルーティング・主要ファイル・認可パターン・UI規約）。新機能の実装、既存機能の修正、テーブルやルートの確認が必要なときに読む。
---

# writing-board-next 開発コンテキスト

## プロジェクト概要

福祉事業所向け業務連絡ボード「RoScope」。複数の団体（organization）が1システムを共有するマルチテナント構成。PWA対応（プッシュ通知・オフラインフォールバック）。

**スタック:** Next.js 16 App Router / Supabase（service role key、RLS未使用）/ Vercel / TypeScript / Tailwind CSS

**認証:** Supabase Auth は使っていない — 独自JWT（`lib/session.ts`、8時間有効・httpOnly Cookie）。全ページ冒頭で:

```typescript
const session = await getSession()
if (!session) redirect('/login')
```

## ロールと認可パターン

ロールは `admin` / `leader` / `member` の3種（`session.role`）。`adminFlag` は後方互換で残っているが**新規コードは role を使う**。

```typescript
// 管理者専用
if (session?.role !== 'admin') return { error: '管理者権限が必要です。' }

// 管理者またはリーダー（リーダーは自部署スコープに制限すること）
function isAdminOrLeader(role?: UserRole) { return role === 'admin' || role === 'leader' }

// 本人または管理者
if (targetUserKey !== session.userKey && session.role !== 'admin') return { error: '権限がありません。' }
```

アカウント状態: `is_active`（凍結）/ `must_change_password`（初回・リセット後の強制変更）/ `password_changed_at`（有効期限判定）

## DBテーブル

| テーブル | 主要カラム / 用途 |
|---|---|
| `organization_data` | organization_key, organization_id, organization_name, organization_password |
| `user_info` | user_key, user_id, user_name, department_id, job_id, position_id, employment_type_id, role, admin_flag, is_active, must_change_password, password_changed_at, organization_key, profile, affiliation, avatar_url |
| `department_data` / `job_data` / `position_data` / `employment_type_data` | 各マスタ（organization_key 付き） |
| `group_data` + `user_group_members` | 任意グループとメンバー |
| `writing_data` | writing_id, user_key, organization_key, message, post_type('board'/'team'/'notice'), is_important, display_until, pin, pdf_url, image_url, video_url |
| `post_attachments` | post_id, file_type('image'/'video'/'pdf'), url（複数添付） |
| `post_reads` / `post_reactions` / `post_replies` | 既読・リアクション・コメント |
| `push_subscriptions` | user_key, organization_key, endpoint(UNIQUE), p256dh, auth |
| `schedule_events` / `schedule_dates` / `schedule_responses` | 日程調整 |
| `calendar_events` | 確定イベント（scope: 'all'/'department'） |
| `welfare_news` | 福祉RSS キャッシュ（全団体共通） |
| `login_history` | ログイン成功履歴（user_key, ip_address, logged_at） |
| `audit_logs` | 監査ログ（actor, action, target, detail, ip）— `lib/audit.ts` 経由で記録 |
| `password_policy` | 組織ごとの min_length / expiry_days |

**Storage バケット:** `images` / `videos` / `avatars`（public）、`pdfs`（非公開・60秒署名URL）

**スキーマ変更:** `supabase/migrations/` にSQLを追加し `schema.sql` にも反映。適用は Supabase SQL Editor で手動（ユーザーに依頼する）。

## ルーティング

```
/login /register /setup系      公開（middleware.ts の PUBLIC_PATHS）
/change-password              パスワード変更（must_change_password 時に強制遷移）
/home                         ホーム（部署カード＋メンバーカード）
/posts                        連絡ボード
/notices                      お知らせ履歴
/department/[id]              部署投稿
/member/[id] /members         メンバー詳細・一覧
/search                       検索
/schedule                     日程調整（/calendar /department /[id] /unison）
/welfare                      福祉情報RSS
/expenses                     活動費請求（Googleフォーム埋め込み）
/manual                       利用マニュアル
/admin                        管理（admin/leader。監査ログ・ログイン履歴・ポリシー設定あり）
```

## 主要ファイル

```
actions/
  auth.ts          ログイン（レート制限・ポリシー期限判定・監査）・パスワード変更
  posts.ts         投稿CRUD＋新着プッシュ通知
  social.ts        既読・リアクション・コメント（＋投稿者への通知）
  admin.ts         ユーザー・マスタ・グループ管理、パスワードリセット、凍結、ポリシー（監査ログ付き）
  schedule.ts / calendar.ts / profile.ts / push.ts（購読管理）

lib/
  session.ts       JWT検証・UserSession取得（毎リクエストDB照合）
  push.ts          sendPush() — 対象絞り込み（部署/ユーザー/送信者除外）・無効購読の自動削除
  audit.ts         logAudit() — 監査ログ記録（AuditAction 型）
  supabase/server.ts  createServiceClient()
  storage.ts / utils.ts / welfare-rss.ts

app/
  layout.tsx       viewport themeColor・SW常時登録（ServiceWorkerRegistration）
  manifest.ts      PWAマニフェスト（icon-192/512、maskable）
  api/push/send    内部用送信API（INTERNAL_SECRET、Cron等の外部トリガー向け）

public/sw.js       プッシュ受信・通知クリック・オフラインフォールバック（offline.html）
middleware.ts      JWT検証ガード。matcher除外: sw.js / offline.html / manifest 等
next.config.ts     CSP・セキュリティヘッダー・画像remotePatterns
docs/SECURITY.md   ISO27001 附属書A 管理策マッピング（セキュリティ変更時に更新する）
```

## 副作用の定型（レスポンス後実行）

通知・監査ログは `next/server` の `after()` で:

```typescript
after(() => sendPush({ organizationKey, excludeUserKey: session.userKey }, { title, body, url, tag }))
after(() => logAudit({ organizationKey, actorUserKey, actorName, action, target }))
```

## UI規約

- Tailwind CSS のみ（外部UIライブラリなし）、アイコンは `lucide-react`
- アニメーション: `anim-fade-in`、モーダル: 固定オーバーレイ＋白カード＋`stopPropagation`
- コメントは最小限（WHYだけ書く）
- モバイルファースト（幅375px起点）— 詳細は `/mobile`

## 環境変数

`JWT_SECRET` / `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SUPABASE_URL` / `VAPID_SUBJECT` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `INTERNAL_SECRET` / `NEXT_PUBLIC_APP_URL`
