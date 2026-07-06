-- ================================================
-- Supabase セキュリティアドバイザー ERROR 対応（2026-07-07）
-- rls_disabled_in_public: RLS未有効の6テーブルを有効化
--   （service role はRLSをバイパスするためアプリ動作に影響なし。
--     anon キーからの直接アクセスがデフォルト全拒否になる）
-- ================================================

ALTER TABLE position_data        ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_type_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_data           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_group_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history        ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_policy     ENABLE ROW LEVEL SECURITY;

-- rls_policy_always_true 対応:
-- team_message は 0行・コード参照なしの未使用テーブルで、
-- 「誰でもINSERT可」の危険なポリシーが付いていたため削除
DROP TABLE IF EXISTS team_message;
