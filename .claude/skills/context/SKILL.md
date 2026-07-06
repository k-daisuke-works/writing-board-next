---
name: context
description: writing-board-next のプロジェクト構成リファレンス（DBスキーマ・ルーティング・主要ファイル・認可パターン・UI規約）。新機能の実装、既存機能の修正、テーブルやルートの確認が必要なときに読む。
---

# writing-board-next 開発コンテキスト

## プロジェクト概要

福祉事業所向け業務連絡ボード。複数の団体（organization）が1システムを共有するマルチテナント構成。

**スタック:** Next.js App Router / Supabase（service role key、RLS未使用）/ Vercel / TypeScript / Tailwind CSS

**認証:** Supabase Auth は使っていない — 独自JWT（`lib/session.ts`）。全ページ冒頭で:

```typescript
const session = await getSession()
if (!session) redirect('/login')
```

## DBテーブル

| テーブル | 主要カラム |
|---|---|
| `organization_data` | organization_key, organization_id, organization_name |
| `user_info` | user_key, user_id, user_name, department_id, job_id, admin_flag, organization_key, profile, affiliation, avatar_url |
| `department_data` | department_id, department_name, organization_key |
| `job_data` | job_id, job_name, organization_key |
| `writing_data` | writing_id, user_key, organization_key, message, post_type('board'/'team'/'notice'), pdf_url, image_url, video_url |
| `schedule_events` | event_id, organization_key, created_by, title, scope('all_departments'/'department'), target_department_id, status('open'/'closed') |
| `schedule_dates` | date_id, event_id, candidate_dt, sort_order |
| `schedule_responses` | response_id, event_id, date_id, respondent_type, respondent_id, answer('ok'/'maybe'/'ng') |
| `calendar_events` | id, organization_key, title, event_date(date), scope('all'/'department'), department_id, location, note, source_schedule_id |
| `welfare_news` | id, source_name, title, url, published_at, fetched_at（全団体共通）|

**Storage バケット:** `images` / `videos` / `pdfs` / `avatars`（public）

## ルーティング

```
/login /setup
/home                         ホーム（部署カード＋メンバーカード、HomeMenuDropdown）
/posts                        連絡ボード
/notices                      お知らせ履歴
/department/[id]              部署投稿
/member/[id]                  メンバー詳細・プロフィール・投稿履歴
/members                      メンバー一覧
/schedule                     日程調整（layout.tsxでサブナビ付き）
/schedule/calendar            全体スケジュール（CalendarView）
/schedule/department          部署スケジュール（CalendarView）
/schedule/[id]                日程調整詳細グリッド
/schedule/unison              ユニゾンプラザ空き状況（iframe）
/welfare                      福祉情報RSS
/expenses                     活動費請求（Googleフォーム）
/admin                        管理（adminFlagのみ）
```

## 主要ファイル

```
actions/
  auth.ts          ログイン・ログアウト
  posts.ts         投稿CRUD（revalidatePath: /home, /posts, /department/*, /member/*）
  admin.ts         ユーザー・部署・職種管理（adminFlag必須）
  schedule.ts      日程調整（作成・回答・クローズ）
  calendar.ts      カレンダーイベント（作成・削除・日程確定）
  profile.ts       プロフィール更新・アバターアップロード

lib/
  session.ts       JWT検証・UserSession取得
  supabase/server.ts  createServiceClient()（同期関数、service roleはcookie不要）
  storage.ts       getPublicMediaUrl()
  utils.ts         relativeTime() / isRecent()（共有ユーティリティ）
  welfare-rss.ts   RSSパーサー・フィード定義

app/(dashboard)/
  layout.tsx       共通ヘッダーナビ
  home/
    HomeView.tsx           ホーム画面（TeamCard等）
    HomeMenuDropdown.tsx   メニューボタン（adminOnly制御）
  schedule/
    layout.tsx     サブナビラッパー
    SubNav.tsx     サブナビ（usePathname）
    calendar/CalendarView.tsx  カレンダーグリッドUI
```

## 認可パターン

```typescript
// 管理者専用
if (!session?.adminFlag) return { error: '管理者権限が必要です。' }

// 本人または管理者
if (targetUserKey !== session.userKey && !session.adminFlag) throw new Error('Forbidden')

// 自分の部署回答のみ
if (respondentType === 'department' && respondentId !== session.departmentId) return { error: ... }
```

## Server Action の定型

```typescript
'use server'
export async function someAction(formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  // adminFlag チェック（必要な場合）
  // organization_key フィルタ付きDBクエリ
  // revalidatePath（影響ページを全列挙）
}
```

## UI規約

- Tailwind CSS のみ（外部UIライブラリなし）
- アイコン: `lucide-react`
- アニメーション: `anim-fade-in` クラス（ページ入場）
- モーダル: 固定オーバーレイ + 白カード、`onClick={e => e.stopPropagation()}`
- コメントは最小限（WHYだけ書く、WHATは書かない）
