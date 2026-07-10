-- Instagram 連携: 組織ごとの連携アカウントと投稿キャッシュ
-- 取得はサーバー側 Cron（/api/cron/instagram）のみ。クライアントに Meta のスクリプトは読み込まない。
--
-- アカウント登録（組織側の1回きりの作業）:
--   1. 会の Instagram をプロアカウント（ビジネス/クリエイター）に切り替え
--   2. Meta developers でアプリ作成 → Instagram API (Instagram Login) → 長期トークン発行
--   3. 下記を SQL Editor で実行（トークンは60日有効・Cron が自動延長する）
--   INSERT INTO instagram_accounts (organization_key, ig_user_id, account_name, access_token, token_expires_at)
--   VALUES (<org_key>, '<IGユーザーID>', '<アカウント名>', '<長期トークン>', now() + interval '60 days');

CREATE TABLE IF NOT EXISTS instagram_accounts (
  organization_key integer PRIMARY KEY REFERENCES organization_data(organization_key) ON DELETE CASCADE,
  ig_user_id       text NOT NULL,
  account_name     text,
  access_token     text NOT NULL,
  token_expires_at timestamptz,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instagram_posts (
  id               bigserial PRIMARY KEY,
  organization_key integer NOT NULL REFERENCES organization_data(organization_key) ON DELETE CASCADE,
  media_id         text NOT NULL,
  caption          text,
  media_type       text NOT NULL,
  media_url        text,
  thumbnail_url    text,
  permalink        text NOT NULL,
  posted_at        timestamptz,
  fetched_at       timestamptz NOT NULL DEFAULT now(),
  -- media_id 単独の UNIQUE にすると、同一アカウントを複数組織に誤登録した場合に
  -- upsert が他組織の行を付け替えてしまうため、テナント込みの複合制約にする
  UNIQUE (organization_key, media_id)
);

CREATE INDEX IF NOT EXISTS idx_instagram_posts_org ON instagram_posts (organization_key, posted_at DESC);

ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_posts    ENABLE ROW LEVEL SECURITY;

-- 組織スコープRLS（20260711_rls_org_policies.sql と同型）。
-- access_token を含む instagram_accounts は読み取りも投稿キャッシュ表示に不要なため
-- authenticated には instagram_posts の SELECT のみ許可（書き込みは Cron の service role）。
DROP POLICY IF EXISTS org_read ON instagram_posts;
CREATE POLICY org_read ON instagram_posts FOR SELECT TO authenticated
  USING (organization_key = (SELECT public.jwt_org_key()));
