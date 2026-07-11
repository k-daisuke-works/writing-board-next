# 修正方針・引き継ぎ指示書（AIアシスタント向け）

最終更新: 2026-07-10。このリポジトリで作業する AI モデルへの指示。着手前に必ず全文を読むこと。

## 前提（変更禁止の設計判断）

- 認証は独自JWT（`lib/session.ts`）。**Supabase Auth への移行は明示的な指示があるまで行わない**
- サーバー側は service role key で RLS をバイパスする設計。**全DBクエリの `.eq('organization_key', session.organizationKey)` がテナント分離の防衛線**（削除・更新系で漏れやすい。過去に複数回事故あり）
- `middleware.ts` のファイル名・配置は変更禁止（リネームすると認証ガードが無音で無効化される）
- Server Action は throw せず `{ error: string }` を返す
- 詳細規約: `CLAUDE.md`（要点）、`.claude/skills/`（context / feature / lessons / mobile / push / delegate）、`docs/SECURITY.md`（ISO27001マッピング）

## 環境情報

| 項目 | 値 |
|---|---|
| Vercel プロジェクト | `roscope`（リンク済み、CLI 認証済み。env・deploy・logs 操作可） |
| Supabase プロジェクト | `Socialworks Tokyo` / ref: `qzehjiaxevghmvusdzrt`（東京 ap-northeast-1。2026-07-11 移行完了） |
| 旧 Supabase プロジェクト | `Socialworks's Project` / ref: `ajyyoifxatincvflzcpb`（ソウル ap-northeast-2。ロールバック用に数日残置 → 問題なければ削除） |
| Supabase 操作手段 | MCP サーバー（`~/.claude.json` にトークン設定済み）または Management API |
| DBマイグレーション | `supabase/migrations/*.sql` に記録 → Management API `POST /v1/projects/{ref}/database/query` で適用 |

**Windows PowerShell 5.1 の罠**: 日本語を含む JSON ボディを `Invoke-RestMethod` に渡すときは必ず `[Text.Encoding]::UTF8.GetBytes($json)` でバイト列にする（文字列のまま渡すとエンコーディングが壊れ、APIが不可解なエラーを返す）。

---

## Realtime は Broadcast 方式（変更しない設計判断・2026-07-07 移行済み）

`lib/realtime.ts` の `broadcastRefresh(orgKey)` が空ペイロードの「refresh」シグナルを送信し、クライアント（`RealtimeSocial.tsx`、チャンネル名 `rt-${orgKey}`）が受信して SWR キャッシュを再検証する。postgres_changes 方式には戻さないこと（anon ポリシーがなくイベントが届かない）。

**注意点**: broadcast チャンネルは匿名購読可能。実データは流れないが、orgKey を推測すれば更新タイミングは外部観測可能（軽微なメタデータ漏れ）。完全な購読制限には Supabase Auth＋Realtime Authorization が必要。

## Instagram 連携（2026-07-10 実装・トークン登録待ち）

会の公式 Instagram をアプリ内表示する機能（`/sns`）。埋め込みウィジェットではなく、Cron（`/api/cron/instagram`・1日2回）がサーバー側で取得して `instagram_posts` にキャッシュし、ネイティブ表示する。トークンは Cron が自動延長（60日 → 残10日で更新）。

- **有効化に必要な作業**: ①マイグレーション `20260710_instagram.sql` の適用、②会の IG をプロアカウント化して長期トークンを発行し `instagram_accounts` に INSERT（手順はマイグレーションファイルのコメント）。未登録の間は `/sns` が「未連携」表示・ホームメニューのカードは非表示（連携すると自動で現れる。2026-07-10 会のIGアカウントにログインできず登録保留中）
- 東京リージョン移行時は他テーブル同様にデータ移行対象（access_token を含むので注意）
- **運用メモ（2026-07-10 legal-check 指摘）**: ①Meta の Instagram Platform 利用規約（キャッシュ保持・帰属表示要件）への適合はトークン発行時に最新版を確認する、②IG 側で投稿を削除してもキャッシュ反映は次回 Cron（最大12時間後）— 緊急の削除要請時は SQL Editor で `DELETE FROM instagram_posts WHERE media_id = '...'` を直接実行、③access_token は平文保存（漏洩時は会の公式アカウント操作権限に影響。将来 Supabase Vault 化を検討）

## ~~優先度1: Supabase 東京リージョン移行（個人情報の国内化）~~ → **完了（2026-07-11）**

DB・Storage・Vercel 関数（hnd1）とも東京リージョンへ移行済み。旧DBの実リージョンはシンガポールではなく**ソウル（ap-northeast-2）**だった（Management API で確認。IPv6 プレフィックスからの推測が誤り）。

- 移行方法: Management API＋pg_dump/psql（セッションプーラー経由・ポート5432）。スキーマ22テーブル・全データ・Storage 4バケット5ファイルを移行し、行数一致を確認済み
- `supabase/schema.sql` は移行時の `pg_dump --schema-only` で実DB同期済み（旧課題解消）
- 新 `videos` バケットの file_size_limit は 50MB（旧は100MB設定だったがプロジェクト全体上限50MBで頭打ちのため実効挙動は同じ）
- `instagram_accounts` / `instagram_posts` は旧DB未適用のマイグレーションのため新DBにも未適用（IG連携有効化時に `20260710_instagram.sql` を適用する）
- Vercel env は Production に加えて Preview の `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` も新プロジェクト値に更新済み
- **ロールバック**: Vercel env と vercel.json を戻すだけ（旧プロジェクトは数日残置。問題なければダッシュボードから削除）

## 実利用開始前チェックリスト（現在はテスト運用・利用者ゼロ）

提供形態は**無償・実験提供**（2026-07-10 ユーザー確認。契約締結の予定なし）。法的な芯はアプリ内の /terms・/privacy＋同意動線でカバー済み。実際に会のメンバーに使ってもらう前に:

1. ~~東京リージョン移行~~ → **完了（2026-07-11）**
2. ~~移行後、`app/privacy/page.tsx` の保管場所記載を更新~~ → **完了（2026-07-11）**
3. `docs/legal/RoScopeテスト利用のご案内.docx`（A4ビジネス文書・Word形式）を会に渡す — 契約書ではなく説明文書。日付・団体名・運営者名・連絡先の〔 〕を埋めて使う（本文の元データは trial-notice.md）
4. 利用開始

※ `docs/legal/service-agreement-draft.md` は**将来、有償化や正式提供に切り替えるとき用の参考ドラフト**として残置（その際は弁護士レビューを経て締結）。

## 優先度2: ISO27001 残課題（docs/SECURITY.md §7 と同期）

1. ~~RLS ポリシーの本格導入~~ → **完了（2026-07-11・実効化済み）**: 組織スコープポリシー（`20260711_rls_org_policies.sql`、東京DBに適用）＋ `createOrgClient`（role=authenticated の自己署名JWT。Supabase Auth 移行は不要だった）。認証済みコンテキストは org クライアント・セッション確立前/Cron/内部API/Storage は service role＋`// tenant-ok`。`SUPABASE_JWT_SECRET`（レガシーJWTシークレット）は Vercel Production/Preview と `.env.local` に設定済み。自己署名トークンで PostgREST を直接叩き、越境の読取（空）・更新（0件）・自組織の正常動作を実証済み。**未設定環境では service role フォールバックで動作しRLS層だけが無効になる**（起動時に console.error 1回。新環境構築時は設定を忘れないこと）
2. **レート制限の永続化**: `actions/auth.ts` のログインレート制限はプロセス内 Map。Vercel でインスタンスが分かれると効果が薄れる。Upstash Redis（Vercel Marketplace で導入可）+ `@upstash/ratelimit` へ移行
3. **パスワード履歴**: 過去N世代の再利用禁止（`password_history` テーブル追加）
4. ~~依存脆弱性の自動監視~~ → **解消済み（2026-07-10）**: `.github/dependabot.yml` 追加（npm / github-actions 週次）
5. ~~バックアップ確認~~ → **確認・対策済み（2026-07-11）**: 無料プランは自動バックアップ対象外（`pitr_enabled: false`・復元ポイントゼロ）と確認。下記「バックアップと復元」の日次JSONバックアップを導入

## バックアップと復元（2026-07-11 導入）

- **日次 3:30 JST** に `/api/cron/backup` が DB関数 `export_all_data()`（service role 専用・migration `20260711_backup_export.sql`）で全テーブルをJSON化し、同プロジェクトの非公開バケット `backups` に `db/backup-YYYY-MM-DD.json` として保存（**14日分保持・国内保管を維持**）
- **復元手順**: ダッシュボード → Storage → `backups` から該当日のJSONをダウンロード → SQL Editor で対象テーブルへ戻す:
  ```sql
  -- 例: writing_data の全行復元（部分復元は WHERE で絞る）
  insert into writing_data
  select * from jsonb_populate_recordset(null::writing_data, '<JSONの tables.writing_data の配列>'::jsonb)
  on conflict do nothing;
  ```
- **対象外**: Storage のファイル実体（images/videos/avatars/pdfs）。誤削除リスクが低くサイズが大きいため対象外の判断。必要になったら別途検討
- 実利用でデータが増えたら Supabase Pro（自動バックアップ・PITR）への移行を検討

## 優先度3: 品質改善バックログ（余力があれば）

- **既存 lint エラー6件の解消**（react-hooks v6 厳格ルール: `PostReactions.tsx`・`welfare/page.tsx`・`InteractiveDemo.tsx` の setState-in-effect / Date.now-in-render）。解消後、`.github/workflows/ci.yml` の Lint ステップから `continue-on-error: true` を外してブロッキング化する
- `setGroupMembers`（グループメンバー変更＝実質的な権限操作）に `logAudit()` がない（既存ギャップ。2026-07-10 の tenant-audit で指摘）
- プッシュ通知のユーザー別設定（通知種別のオン/オフ。現状は購読するか否かの二択）
- 監査ログの保持期間ポリシー（例: 1年経過分の自動削除 Cron）と CSV エクスポート
- `vercel env ls` で Preview 環境に VAPID 系が未設定（Production のみ設定済み）。プレビューで通知テストが必要になったら追加

---

## 作業の進め方（必須手順）

1. 実装前に `/context`・`/feature` スキルを読む（Claude Code 以外のツールの場合は `.claude/skills/*/SKILL.md` を直接読む）
2. Server Action・DBクエリを触ったら、コミット前に `npm run check:tenant`（organization_key フィルタの機械検査。CI でも実行される）＋認可チェックの確認（Claude Code なら `tenant-audit` エージェントに委譲）。正当な例外は `// tenant-ok: 理由` 注釈
3. DBスキーマ変更は必ず `supabase/migrations/` にファイルを残してから適用する
4. セキュリティに関わる変更をしたら `docs/SECURITY.md` を更新する
5. 完了の定義 = 型チェック/ビルド通過 → コミット → プッシュ（`git add .` 禁止、ファイル明示）
