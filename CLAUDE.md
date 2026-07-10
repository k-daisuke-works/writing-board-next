@AGENTS.md

# writing-board-next 開発ルール

福祉系団体向けチーム情報共有ボード。マルチテナント（複数団体が1システム共有）。主利用者は社会福祉士会（department＝班。訴求・例文は「チームの情報共有」主体で書く）。
**スタック:** Next.js App Router / Supabase（service role key・RLSなし）/ Vercel / TypeScript / Tailwind CSS

このファイルは要点のみ。詳細は以下のスキルを**該当作業の前に**読むこと:

| スキル | 読むタイミング |
|---|---|
| `/context` | 機能追加・修正の前（DBスキーマ・ルーティング・ファイル構成・認可パターン） |
| `/feature` | 新機能の実装を始める前（Server Action / ページ / DB変更 / 通知 / 監査ログの定型手順） |
| `/lessons` | DBクエリ・Server Action・外部API・フォーム実装の前（実バグ由来のコード例集） |
| `/mobile` | UIの新規作成・変更の前（モバイルファーストチェックリスト） |
| `/push` | 実装完了時（検証→コミット→プッシュの完了パイプライン） |
| `/delegate` | サブエージェントに委譲する前・エージェント定義を書く前（モデル別の指示文ベストプラクティス） |

## エージェント運用（トークン効率・モデル適材適所）

メイン会話は設計・実装に専念し、ノイズの多い検証はサブエージェントに委譲する:

| エージェント | モデル / effort | 使うタイミング |
|---|---|---|
| `build-check` | haiku / low | 複数ファイル変更後の型チェック・ビルド検証（ログをメイン会話に持ち込まない） |
| `tenant-audit` | sonnet / xhigh | Server Action・DBクエリ・API を追加/変更したらコミット前に（organization_key 漏れ監査） |
| `mobile-review` | haiku / low | TSX を追加/変更したらコミット前に（チェックリストは `/mobile` スキルをプリロード＝単一ソース） |

- 1〜2ファイルの小変更は委譲せず `npx tsc --noEmit` を直接実行する（エージェント起動自体にもコストがある）
- 独立した監査は並列に起動してよい。🔴指摘は修正してからコミット

## 🔴 絶対ルール（違反すると本番事故）

1. **全DBクエリに `.eq('organization_key', session.organizationKey)`** — RLSなしのためアプリ側フィルタが唯一の防衛線。特に UPDATE / DELETE で漏れやすい。書いたら全クエリの `.eq()` チェーンを目視確認。
2. **未認証セットアップ系アクションは組織の既存ユーザー数を確認**してから実行（organizationKey 推測による不正登録防止）。
3. **`middleware.ts` の名前・配置を変えない**（変えると認証ガードが無音で無効化）。matcher から `manifest.webmanifest` を除外。PUBLIC_PATHS の `'/'` は `===` 完全一致。
4. **ID系入力は Server Action 冒頭で `.normalize('NFKC').trim()`**（IME全角入力対策）。
5. **Server Action は throw せず `{ error: string }` を返す**（throwはUIフリーズ）。呼び出し側も try-catch。DBエラーコード（23505/23503）で意味のあるメッセージを返す。
6. **`datetime-local` の値は `new Date(v).toISOString()` に変換してから送る**（9時間ズレ防止）。

## 🟡 実装時チェック（詳細・コード例は `/lessons`）

- SELECT は使うカラムを明示列挙（`select('*')` 禁止）。表示用ユーザー情報は `avatar_url` も一緒に取得。
- Optional な FK は `Number(x) || null`（`''` → `0` でFK違反）。
- 独立クエリは `Promise.all` 並列化。「エンティティごとに最新1件」は1クエリ＋JSグルーピング（N+1禁止）。
- Server Action には影響する全ページの `revalidatePath` を列挙（`'layout'` 型の広域無効化は避ける）。
- Realtime チャンネル名に organizationKey を含める。Storage public URL に `?t=` を付けない。
- 外部URL（RSS・画像）はコードに書く前に curl で実在確認。外部ライブラリ初期化はモジュールレベル禁止（遅延初期化）。
- エラークエリパラメータの区切りは `errorBase.includes('?') ? '&' : '?'` で判別。
- 管理フォームは `autoComplete="off"` / `new-password`、半角英数字欄は `lang="en"`＋案内文。
- 新コンポーネント作成前に既存コンポーネントで対応できないか確認。探索的な要件（「〇〇できたらいいな」）は実装前に2〜3文で提案・確認。
- 共有ユーティリティは `lib/utils.ts` に集約（コピペ禁止）。架空の統計数字をUIに入れない。
- ページ遷移が遅ければ `loading.tsx`（`animate-pulse` スケルトン）で解決する。

## 🔴 完了の定義

実装・修正が終わったら確認を待たずに**コミット＆プッシュまで**行う。`git add .` ではなく変更ファイルを明示し、プッシュ前に `git status` で混入確認（手順は `/push`）。
