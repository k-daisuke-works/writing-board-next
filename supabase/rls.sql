-- ============================================================
-- WritingBoard — Row Level Security ポリシー
-- ============================================================
-- 前提: schema.sql を実行済みで、各テーブルで
--   ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
-- が完了していること。
--
-- 実行方法: Supabase ダッシュボード → SQL Editor に貼り付けて実行
--
-- 設計方針:
--   - サーバーサイド（Next.js Server Actions）は SUPABASE_SERVICE_ROLE_KEY を
--     使用するため RLS をバイパスします → サーバー側は影響なし
--   - anon キー（ブラウザ・外部ツール）による直接 DB アクセスを制限します
--   - RLS 有効化 + ポリシーなし = 該当ロールのアクセスを暗黙的に全拒否
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- organization_data
--   anon: すべての操作を拒否（パスワードハッシュを含むため厳重に保護）
--   → ポリシー不要（RLS 有効化だけで全拒否になる）
-- ──────────────────────────────────────────────────────────
-- (no policies needed — default deny)


-- ──────────────────────────────────────────────────────────
-- user_info
--   anon: すべての操作を拒否（パスワードハッシュ・admin_flag を保護）
--   → ポリシー不要
-- ──────────────────────────────────────────────────────────
-- (no policies needed — default deny)


-- ──────────────────────────────────────────────────────────
-- department_data
--   anon: すべての操作を拒否
--   → ポリシー不要
-- ──────────────────────────────────────────────────────────
-- (no policies needed — default deny)


-- ──────────────────────────────────────────────────────────
-- job_data
--   anon: すべての操作を拒否
--   → ポリシー不要
-- ──────────────────────────────────────────────────────────
-- (no policies needed — default deny)


-- ──────────────────────────────────────────────────────────
-- writing_data
--   SELECT のみ anon に許可
--
--   【理由】
--   RealtimePosts.tsx はブラウザから NEXT_PUBLIC_SUPABASE_ANON_KEY で
--   Supabase Realtime (postgres_changes) に接続しています。
--   Supabase の postgres_changes 認可はサブスクライバーの RLS SELECT
--   権限を確認するため、anon に SELECT を許可しないとリアルタイム
--   更新イベントが届きません。
--
--   【リスク】
--   anon キーを知る外部ツールから writing_data を直接 SELECT できます。
--   posts 自体は業務連絡テキストのみ（パスワード等は含まない）ですが、
--   組織を横断した閲覧が可能になります。
--
--   【将来の改善策 — Supabase Auth への移行】
--   1. ログイン時に supabase.auth.signInWithPassword() を使い、
--      Supabase Auth セッション（JWT）を発行する
--   2. JWT カスタムクレームに organization_key を埋め込む
--      (Database Function + hook で実装)
--   3. 以下の policy を置き換える:
--      USING (organization_key = (auth.jwt() ->> 'organization_key')::int)
--   これにより組織間のデータ分離が RLS レベルで保証されます。
-- ──────────────────────────────────────────────────────────
CREATE POLICY "anon_select_writing_data"
  ON writing_data
  FOR SELECT
  TO anon
  USING (true);


-- ──────────────────────────────────────────────────────────
-- storage.objects (PDFバケット)
--   schema.sql で以下を実行済みの場合は不要:
--     CREATE POLICY "Authenticated users can upload PDFs" ...
--     CREATE POLICY "Authenticated users can read PDFs" ...
--
--   もし未実行の場合は以下を有効化してください:
-- ──────────────────────────────────────────────────────────
/*
CREATE POLICY "service_role_storage_upload"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'pdfs');

CREATE POLICY "service_role_storage_select"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'pdfs');
*/


-- ============================================================
-- 確認クエリ（実行後に RLS 設定を確認する場合）
-- ============================================================
/*
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/
