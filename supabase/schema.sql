-- ================================================
-- WritingBoard スキーマ（最新版）
-- Supabase ダッシュボード → SQL Editor に貼り付けて実行
-- ================================================

-- 組織テーブル
CREATE TABLE IF NOT EXISTS organization_data (
  organization_key  SERIAL PRIMARY KEY,
  organization_id   TEXT UNIQUE NOT NULL,
  organization_name TEXT NOT NULL,
  organization_password TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 部署テーブル
CREATE TABLE IF NOT EXISTS department_data (
  department_id    SERIAL PRIMARY KEY,
  department_name  TEXT NOT NULL,
  organization_key INTEGER NOT NULL
    REFERENCES organization_data(organization_key) ON DELETE CASCADE
);

-- 職種テーブル
CREATE TABLE IF NOT EXISTS job_data (
  job_id           SERIAL PRIMARY KEY,
  job_name         TEXT NOT NULL,
  organization_key INTEGER NOT NULL
    REFERENCES organization_data(organization_key) ON DELETE CASCADE
);

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS user_info (
  user_key         SERIAL PRIMARY KEY,
  user_id          TEXT NOT NULL,
  user_name        TEXT NOT NULL,
  job_id           INTEGER REFERENCES job_data(job_id),
  department_id    INTEGER REFERENCES department_data(department_id),
  admin_flag       BOOLEAN DEFAULT FALSE,
  organization_key INTEGER NOT NULL
    REFERENCES organization_data(organization_key) ON DELETE CASCADE,
  password         TEXT NOT NULL,
  avatar_url       TEXT,
  profile          TEXT,
  affiliation      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_key)
);

-- 投稿テーブル
CREATE TABLE IF NOT EXISTS writing_data (
  writing_id            SERIAL PRIMARY KEY,
  user_key              INTEGER REFERENCES user_info(user_key) ON DELETE SET NULL,
  job_id                INTEGER,
  department_id         INTEGER REFERENCES department_data(department_id),
  organization_key      INTEGER NOT NULL
    REFERENCES organization_data(organization_key) ON DELETE CASCADE,
  user_name_stamp       TEXT NOT NULL,
  job_name_stamp        TEXT,
  department_name_stamp TEXT,
  pin                   TEXT,
  message               TEXT NOT NULL,
  pdf_url               TEXT,
  image_url             TEXT,
  video_url             TEXT,
  post_type             TEXT NOT NULL DEFAULT 'board',  -- board / team / notice
  is_important          BOOLEAN NOT NULL DEFAULT FALSE,
  writing_time          TIMESTAMPTZ DEFAULT NOW()
);

-- 既読テーブル
CREATE TABLE IF NOT EXISTS post_reads (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id          INTEGER NOT NULL REFERENCES writing_data(writing_id) ON DELETE CASCADE,
  user_key         INTEGER NOT NULL,
  user_name        TEXT NOT NULL,
  organization_key INTEGER NOT NULL,
  read_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_key)
);

-- リアクションテーブル
CREATE TABLE IF NOT EXISTS post_reactions (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id          INTEGER NOT NULL REFERENCES writing_data(writing_id) ON DELETE CASCADE,
  user_key         INTEGER NOT NULL,
  user_name        TEXT NOT NULL,
  organization_key INTEGER NOT NULL,
  emoji            TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_key, emoji)
);

-- リプライテーブル
CREATE TABLE IF NOT EXISTS post_replies (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id          INTEGER NOT NULL REFERENCES writing_data(writing_id) ON DELETE CASCADE,
  user_key         INTEGER NOT NULL,
  user_name_stamp  TEXT NOT NULL,
  organization_key INTEGER NOT NULL,
  message          TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- プッシュ通知購読テーブル
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_key         INTEGER NOT NULL,
  organization_key INTEGER NOT NULL,
  endpoint         TEXT NOT NULL UNIQUE,
  p256dh           TEXT NOT NULL,
  auth             TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 日程調整イベントテーブル
CREATE TABLE IF NOT EXISTS schedule_events (
  event_id                SERIAL PRIMARY KEY,
  organization_key        INTEGER NOT NULL
    REFERENCES organization_data(organization_key) ON DELETE CASCADE,
  created_by              INTEGER REFERENCES user_info(user_key) ON DELETE SET NULL,
  created_by_name         TEXT NOT NULL,
  title                   TEXT NOT NULL,
  description             TEXT,
  scope                   TEXT NOT NULL DEFAULT 'all_departments',  -- all_departments / department
  target_department_id    INTEGER REFERENCES department_data(department_id),
  target_department_name  TEXT,
  status                  TEXT NOT NULL DEFAULT 'open',  -- open / closed
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 日程調整候補日テーブル
CREATE TABLE IF NOT EXISTS schedule_dates (
  date_id     SERIAL PRIMARY KEY,
  event_id    INTEGER NOT NULL REFERENCES schedule_events(event_id) ON DELETE CASCADE,
  candidate_dt TIMESTAMPTZ NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- 日程調整回答テーブル
CREATE TABLE IF NOT EXISTS schedule_responses (
  response_id      SERIAL PRIMARY KEY,
  event_id         INTEGER NOT NULL REFERENCES schedule_events(event_id) ON DELETE CASCADE,
  date_id          INTEGER NOT NULL REFERENCES schedule_dates(date_id) ON DELETE CASCADE,
  respondent_type  TEXT NOT NULL,  -- department / user
  respondent_id    INTEGER NOT NULL,
  respondent_name  TEXT NOT NULL,
  answer           TEXT NOT NULL,  -- ok / maybe / ng
  answered_by      INTEGER REFERENCES user_info(user_key),
  answered_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date_id, respondent_type, respondent_id)
);

-- カレンダーイベントテーブル
CREATE TABLE IF NOT EXISTS calendar_events (
  id                 SERIAL PRIMARY KEY,
  organization_key   INTEGER NOT NULL
    REFERENCES organization_data(organization_key) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  event_date         DATE NOT NULL,
  note               TEXT,
  location           TEXT,
  scope              TEXT NOT NULL DEFAULT 'all',  -- all / department
  department_id      INTEGER REFERENCES department_data(department_id),
  source_schedule_id INTEGER REFERENCES schedule_events(event_id) ON DELETE SET NULL,
  created_by         TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 監査ログテーブル（ISO27001 A.8.15。migrations/20260706_audit_logs.sql と同一）
CREATE TABLE IF NOT EXISTS audit_logs (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_key INTEGER NOT NULL
    REFERENCES organization_data(organization_key) ON DELETE CASCADE,
  actor_user_key   INTEGER,
  actor_name       TEXT NOT NULL,
  action           TEXT NOT NULL,
  target           TEXT,
  detail           JSONB,
  ip_address       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time
  ON audit_logs (organization_key, created_at DESC);

-- 福祉情報キャッシュテーブル（全組織共通）
CREATE TABLE IF NOT EXISTS welfare_news (
  id           SERIAL PRIMARY KEY,
  source_name  TEXT NOT NULL,
  title        TEXT NOT NULL,
  url          TEXT NOT NULL UNIQUE,
  published_at TIMESTAMPTZ,
  fetched_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Realtime 有効化
-- ================================================
ALTER TABLE writing_data   REPLICA IDENTITY FULL;
ALTER TABLE post_reactions REPLICA IDENTITY FULL;
ALTER TABLE post_replies   REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE writing_data;
ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE post_replies;

-- ================================================
-- Storage バケット作成
-- ================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs',    'pdfs',    false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('images',  'images',  true)  ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('videos',  'videos',  true)  ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)  ON CONFLICT DO NOTHING;

-- ================================================
-- Row Level Security（service_role でバイパスされるため実質無効）
-- ================================================
ALTER TABLE organization_data  ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_data    ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_data           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_info          ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_data       ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_replies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_dates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE welfare_news       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;
