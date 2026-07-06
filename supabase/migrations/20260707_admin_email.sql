-- ================================================
-- 管理者メールアドレス（パスワード再設定用）
-- ================================================
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN user_info.email IS '管理者のパスワード再設定用メールアドレス（管理者のみ設定、任意）';
