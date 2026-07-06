# 修正方針・引き継ぎ指示書（AIアシスタント向け）

最終更新: 2026-07-07。このリポジトリで作業する AI モデルへの指示。着手前に必ず全文を読むこと。

## 前提（変更禁止の設計判断）

- 認証は独自JWT（`lib/session.ts`）。**Supabase Auth への移行は明示的な指示があるまで行わない**
- サーバー側は service role key で RLS をバイパスする設計。**全DBクエリの `.eq('organization_key', session.organizationKey)` がテナント分離の防衛線**（削除・更新系で漏れやすい。過去に複数回事故あり）
- `middleware.ts` のファイル名・配置は変更禁止（リネームすると認証ガードが無音で無効化される）
- Server Action は throw せず `{ error: string }` を返す
- 詳細規約: `CLAUDE.md`（要点）、`.claude/skills/`（context / feature / lessons / mobile / push）、`docs/SECURITY.md`（ISO27001マッピング）

## 環境情報

| 項目 | 値 |
|---|---|
| Vercel プロジェクト | `roscope`（リンク済み、CLI 認証済み。env・deploy・logs 操作可） |
| Supabase プロジェクト | `Socialworks's Project` / ref: `ajyyoifxatincvflzcpb` |
| Supabase 操作手段 | MCP サーバー（`~/.claude.json` にトークン設定済み）または Management API |
| DBマイグレーション | `supabase/migrations/*.sql` に記録 → Management API `POST /v1/projects/{ref}/database/query` で適用 |

**Windows PowerShell 5.1 の罠**: 日本語を含む JSON ボディを `Invoke-RestMethod` に渡すときは必ず `[Text.Encoding]::UTF8.GetBytes($json)` でバイト列にする（文字列のまま渡すとエンコーディングが壊れ、APIが不可解なエラーを返す）。

---

## 優先度1: Realtime のブロードキャスト方式への移行（✅ 2026-07-07 対応済み）

**旧症状**: `postgres_changes` を anon キーで購読していたが、対象テーブルに anon SELECT ポリシーがなく（かつ `writing_data` はパブリケーション未登録）、イベントが購読者に届いていなかった。掲示板・リアクション・コメントのリアルタイム更新が全滅していた。

**実装した解決策**: Broadcast 方式へ移行。
- `lib/realtime.ts` の `broadcastRefresh(orgKey)` が service role で REST（`/realtime/v1/api/broadcast`）に「refresh」シグナルを送信（ペイロード空）。Server Action の `after()` から呼ぶ（posts 作成/更新/削除、reaction、reply、api/posts/create）。
- クライアントは `RealtimeSocial.tsx` が組織チャンネル `rt-${orgKey}` の broadcast を購読し、受信時に `/api/data/*` の SWR キャッシュを再検証。全ページ（home/posts/department/member/notices）にマウント済み。
- `RealtimePosts.tsx` の postgres_changes 購読は撤去。データは SWR 再取得由来に一本化。

**残る注意点**: broadcast チャンネルは匿名購読可能な public チャンネル。ペイロードは空のシグナルのみ（実データは organization_key スコープ済みの `/api/data/*` から取得）だが、orgKey を推測すれば「その組織で更新があった時刻」は外部から観測可能（軽微なメタデータ漏れ）。完全な購読制限には Supabase Auth 導入＋Realtime Authorization（`realtime.messages` の RLS）が必要。旧 `supabase_realtime` パブリケーション（post_reactions/post_replies）は未使用のまま残置（無害）。

## 優先度2: schema.sql の実DB同期（陳腐化の解消）

`supabase/schema.sql` は実DBより古い。**存在しない定義**: position_data / employment_type_data / group_data / user_group_members / login_history / password_policy、user_info の追加カラム（role, is_active, must_change_password, password_changed_at, position_id, employment_type_id）、writing_data.display_until 等。

**方針**: Management API で `information_schema` から実スキーマをダンプし、schema.sql を「実DBと一致する新規構築スクリプト」として再生成する。適用済みマイグレーション（migrations/*.sql）の内容も統合する。再生成後、`.claude/skills/context/SKILL.md` のテーブル表と食い違いがないか照合する。

## 優先度3: ISO27001 残課題（docs/SECURITY.md §7 と同期）

1. **RLS ポリシーの本格導入**（多層防御）: 現状は「anon 全拒否」のみ。アプリ層のフィルタ漏れに備えた組織スコープのポリシー導入は、Supabase Auth 移行（前提の変更）が必要なため、**ユーザーの明示的な承認を得てから**設計すること
2. **レート制限の永続化**: `actions/auth.ts` のログインレート制限はプロセス内 Map。Vercel でインスタンスが分かれると効果が薄れる。Upstash Redis（Vercel Marketplace で導入可）+ `@upstash/ratelimit` へ移行
3. **パスワード履歴**: 過去N世代の再利用禁止（`password_history` テーブル追加）
4. **依存脆弱性の自動監視**: GitHub リポジトリで Dependabot を有効化（`.github/dependabot.yml` 追加）
5. **バックアップ確認**: Supabase の自動バックアップ設定の有効化状態を確認し、SECURITY.md に記載

## 優先度4: 品質改善バックログ（余力があれば）

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
