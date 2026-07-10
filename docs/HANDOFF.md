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
| Supabase プロジェクト | `Socialworks's Project` / ref: `ajyyoifxatincvflzcpb` |
| Supabase 操作手段 | MCP サーバー（`~/.claude.json` にトークン設定済み）または Management API |
| DBマイグレーション | `supabase/migrations/*.sql` に記録 → Management API `POST /v1/projects/{ref}/database/query` で適用 |

**Windows PowerShell 5.1 の罠**: 日本語を含む JSON ボディを `Invoke-RestMethod` に渡すときは必ず `[Text.Encoding]::UTF8.GetBytes($json)` でバイト列にする（文字列のまま渡すとエンコーディングが壊れ、APIが不可解なエラーを返す）。

---

## Realtime は Broadcast 方式（変更しない設計判断・2026-07-07 移行済み）

`lib/realtime.ts` の `broadcastRefresh(orgKey)` が空ペイロードの「refresh」シグナルを送信し、クライアント（`RealtimeSocial.tsx`、チャンネル名 `rt-${orgKey}`）が受信して SWR キャッシュを再検証する。postgres_changes 方式には戻さないこと（anon ポリシーがなくイベントが届かない）。

**注意点**: broadcast チャンネルは匿名購読可能。実データは流れないが、orgKey を推測すれば更新タイミングは外部観測可能（軽微なメタデータ漏れ）。完全な購読制限には Supabase Auth＋Realtime Authorization が必要。

## 優先度1: Supabase 東京リージョン移行（個人情報の国内化）🔴最優先

**背景**: 現DBはシンガポール（ap-southeast-1。db ホストの IPv6 プレフィックス 2406:da12 で確認済み）。会員情報・要配慮個人情報の取り扱いを見据え、国内（東京 ap-northeast-1）へ移す。**データ量が少ない今のうちに実施する**（2026-07-10 ユーザー決定。ローカル環境で実行予定）。Vercel 関数は現在 sin1 固定（DB隣接のため）— 移行完了時に hnd1 へ変更する。

**手順**（作業1〜2時間＋切替メンテ数分。夜間推奨）:

1. **東京で新プロジェクト作成**: Supabase ダッシュボード → New Project → Region: Northeast Asia (Tokyo)。DBパスワードを控える。無料プランでも2プロジェクト並行可
2. **スキーマ移行**: 旧DBから `pg_dump --schema-only`（または `supabase db dump`）→ 東京へ適用。**このダンプで旧優先度タスク「schema.sql の実DB同期」も同時に解消する**（ダンプ結果を `supabase/schema.sql` として再生成し、`.claude/skills/context/SKILL.md` のテーブル表と照合）
3. **データ移行**: `pg_dump --data-only --disable-triggers` → 東京へ restore。`push_subscriptions`・`audit_logs`・`login_history` も忘れず対象に
4. **Storage 移行**: バケット4つを再作成（`images`/`videos`/`avatars` = public、`pdfs` = 非公開）→ ファイルをコピー
5. **保存済みURLの書き換え**: `writing_data.image_url/video_url/pdf_url`・`post_attachments.url`・`user_info.avatar_url` に旧プロジェクトドメインの完全URLが入っている場合、新ドメインへ一括置換:
   `UPDATE ... SET url = replace(url, 'ajyyoifxatincvflzcpb.supabase.co', '<新ref>.supabase.co')`
6. **Vercel 環境変数差し替え**（Production）: `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` を新プロジェクトの値に
7. **vercel.json の regions を `["sin1"]` → `["hnd1"]`** に変更してデプロイ（関数もDBも東京になり現状よりさらに速くなる）
8. `next.config.ts` の remotePatterns は `*.supabase.co` ワイルドカードなので変更不要（念のため確認）
9. **動作確認**: ログイン / 投稿＋画像添付 / アバター表示 / PDF署名URL / プッシュ通知 / 日程調整 / リアルタイム更新（broadcast はコード側チャンネルなので設定不要）/ 監査ログ記録
10. 旧プロジェクトは数日残し、問題なければ削除（それまでは env を戻すだけでロールバック可能）

**注意**: 切替の瞬間の書き込みは失われるため、事前に掲示板でメンテ告知を。移行後に更新するもの: ①HANDOFF 冒頭の環境情報表（ref: ajyyoifxatincvflzcpb）、②**`app/privacy/page.tsx` の「データの保管場所」記載**（シンガポール→日本国内。外的環境の公表事項のため必須）。

## 優先度2: ISO27001 残課題（docs/SECURITY.md §7 と同期）

1. **RLS ポリシーの本格導入**（多層防御）: 現状は「anon 全拒否」のみ。アプリ層のフィルタ漏れに備えた組織スコープのポリシー導入は、Supabase Auth 移行（前提の変更）が必要なため、**ユーザーの明示的な承認を得てから**設計すること
2. **レート制限の永続化**: `actions/auth.ts` のログインレート制限はプロセス内 Map。Vercel でインスタンスが分かれると効果が薄れる。Upstash Redis（Vercel Marketplace で導入可）+ `@upstash/ratelimit` へ移行
3. **パスワード履歴**: 過去N世代の再利用禁止（`password_history` テーブル追加）
4. **依存脆弱性の自動監視**: GitHub リポジトリで Dependabot を有効化（`.github/dependabot.yml` 追加）
5. **バックアップ確認**: Supabase の自動バックアップ設定の有効化状態を確認し、SECURITY.md に記載

## 優先度3: 品質改善バックログ（余力があれば）

- プッシュ通知のユーザー別設定（通知種別のオン/オフ。現状は購読するか否かの二択）
- 監査ログの保持期間ポリシー（例: 1年経過分の自動削除 Cron）と CSV エクスポート
- `vercel env ls` で Preview 環境に VAPID 系が未設定（Production のみ設定済み）。プレビューで通知テストが必要になったら追加

---

## 作業の進め方（必須手順）

1. 実装前に `/context`・`/feature` スキルを読む（Claude Code 以外のツールの場合は `.claude/skills/*/SKILL.md` を直接読む）
2. Server Action・DBクエリを触ったら、コミット前に organization_key フィルタと認可チェックを全数確認（Claude Code なら `tenant-audit` エージェントに委譲）
3. DBスキーマ変更は必ず `supabase/migrations/` にファイルを残してから適用する
4. セキュリティに関わる変更をしたら `docs/SECURITY.md` を更新する
5. 完了の定義 = 型チェック/ビルド通過 → コミット → プッシュ（`git add .` 禁止、ファイル明示）
