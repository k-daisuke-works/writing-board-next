-- ================================================
-- 監査ログテーブル（ISO27001 A.8.15 ログ取得 対応）
-- Supabase ダッシュボード → SQL Editor で実行
-- ================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_key INTEGER NOT NULL
    REFERENCES organization_data(organization_key) ON DELETE CASCADE,
  actor_user_key   INTEGER,          -- 操作者（削除済みユーザーも追跡できるよう FK なし）
  actor_name       TEXT NOT NULL,
  action           TEXT NOT NULL,    -- 例: user.create / user.password_reset / auth.login_failed
  target           TEXT,             -- 例: user:12 / policy / organization
  detail           JSONB,
  ip_address       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time
  ON audit_logs (organization_key, created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
