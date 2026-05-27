-- ================================================
-- WritingBoard スキーマ
-- Supabase ダッシュボード → SQL Editor に貼り付けて実行
-- ================================================

-- 組織テーブル
CREATE TABLE IF NOT EXISTS organization_data (
  organization_key SERIAL PRIMARY KEY,
  organization_id  TEXT UNIQUE NOT NULL,
  organization_name TEXT NOT NULL,
  organization_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 部署テーブル
CREATE TABLE IF NOT EXISTS department_data (
  department_id   SERIAL PRIMARY KEY,
  department_name TEXT NOT NULL,
  organization_key INTEGER NOT NULL
    REFERENCES organization_data(organization_key) ON DELETE CASCADE
);

-- 職種テーブル
CREATE TABLE IF NOT EXISTS job_data (
  job_id   SERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  organization_key INTEGER NOT NULL
    REFERENCES organization_data(organization_key) ON DELETE CASCADE
);

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS user_info (
  user_key        SERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL,
  user_name       TEXT NOT NULL,
  job_id          INTEGER REFERENCES job_data(job_id),
  department_id   INTEGER REFERENCES department_data(department_id),
  admin_flag      BOOLEAN DEFAULT FALSE,
  organization_key INTEGER NOT NULL
    REFERENCES organization_data(organization_key) ON DELETE CASCADE,
  password        TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_key)
);

-- 投稿テーブル
CREATE TABLE IF NOT EXISTS writing_data (
  writing_id          SERIAL PRIMARY KEY,
  user_key            INTEGER REFERENCES user_info(user_key) ON DELETE SET NULL,
  job_id              INTEGER,
  department_id       INTEGER REFERENCES department_data(department_id),
  organization_key    INTEGER NOT NULL
    REFERENCES organization_data(organization_key) ON DELETE CASCADE,
  user_name_stamp     TEXT NOT NULL,
  job_name_stamp      TEXT,
  department_name_stamp TEXT,
  pin                 TEXT,           -- BCrypt ハッシュ済み
  message             TEXT NOT NULL,
  pdf_url             TEXT,           -- Supabase Storage の URL
  writing_time        TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Realtime 有効化（投稿テーブルのみ）
-- ================================================
ALTER TABLE writing_data REPLICA IDENTITY FULL;

-- ================================================
-- Storage バケット作成（PDF保存用）
-- ================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', false)
ON CONFLICT DO NOTHING;

-- PDFバケットのポリシー（認証済みユーザーのみアップロード・閲覧）
CREATE POLICY "Authenticated users can upload PDFs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pdfs');

CREATE POLICY "Authenticated users can read PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'pdfs');

-- ================================================
-- Row Level Security（全テーブルで有効化）
-- サーバーサイドは service_role key を使うため RLS をバイパス
-- ================================================
ALTER TABLE organization_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_data   ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_data          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_info         ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_data      ENABLE ROW LEVEL SECURITY;
