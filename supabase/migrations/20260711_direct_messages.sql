-- 1対1ダイレクトメッセージ（相互承認制）
--
-- 設計判断（2026-07-11 ユーザー決定）:
-- - 相互承認制: リクエスト → 相手が accepted にして初めて送信可能
-- - 通信の秘密への配慮: 運営・管理者は原則本文を読めない（participant限定RLS＋
--   アプリ層でも参加者チェック）。当事者の一方が「管理者に開示して報告」した
--   スレッドのみ管理者が閲覧できる（disclosed_at で記録・監査ログ必須）
-- - RLS は組織スコープに加え participant 本人限定（JWT の user_key クレームで判定。
--   user_key クレームのない組織トークンからは一切見えない = fail-closed）

CREATE TABLE IF NOT EXISTS dm_pairs (
  pair_id          bigserial PRIMARY KEY,
  organization_key integer NOT NULL REFERENCES organization_data(organization_key) ON DELETE CASCADE,
  user_a           integer NOT NULL REFERENCES user_info(user_key) ON DELETE CASCADE,
  user_b           integer NOT NULL REFERENCES user_info(user_key) ON DELETE CASCADE,
  requested_by     integer NOT NULL,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  -- 当事者報告による管理者開示（NULL = 非開示）
  disclosed_at     timestamptz,
  disclosed_by     integer,
  created_at       timestamptz NOT NULL DEFAULT now(),
  responded_at     timestamptz,
  CHECK (user_a < user_b),
  UNIQUE (organization_key, user_a, user_b)
);

CREATE TABLE IF NOT EXISTS dm_messages (
  message_id       bigserial PRIMARY KEY,
  organization_key integer NOT NULL REFERENCES organization_data(organization_key) ON DELETE CASCADE,
  pair_id          bigint NOT NULL REFERENCES dm_pairs(pair_id) ON DELETE CASCADE,
  sender_key       integer NOT NULL,
  message          text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  read_at          timestamptz
);

CREATE INDEX IF NOT EXISTS idx_dm_pairs_org_users ON dm_pairs (organization_key, user_a, user_b);
CREATE INDEX IF NOT EXISTS idx_dm_messages_pair   ON dm_messages (pair_id, created_at DESC);

ALTER TABLE dm_pairs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;

-- JWT から本人の user_key を取り出す（クレームがなければ NULL = 全拒否）
CREATE OR REPLACE FUNCTION public.jwt_user_key() RETURNS integer
LANGUAGE sql STABLE
AS $$ SELECT nullif(auth.jwt()->>'user_key','')::integer $$;

-- dm_pairs: 組織一致＋参加者本人のみ。
-- 注意: FOR ALL の WITH CHECK は UPDATE にも適用されるため、INSERT 限定の
-- 「requested_by = 本人」条件はコマンド別ポリシーに分ける（相手の承認操作を塞がない）
DROP POLICY IF EXISTS participant_only   ON dm_pairs;
DROP POLICY IF EXISTS participant_select ON dm_pairs;
DROP POLICY IF EXISTS participant_insert ON dm_pairs;
DROP POLICY IF EXISTS participant_update ON dm_pairs;
DROP POLICY IF EXISTS participant_delete ON dm_pairs;
CREATE POLICY participant_select ON dm_pairs FOR SELECT TO authenticated
  USING (organization_key = (SELECT public.jwt_org_key())
     AND (SELECT public.jwt_user_key()) IN (user_a, user_b));
CREATE POLICY participant_insert ON dm_pairs FOR INSERT TO authenticated
  WITH CHECK (organization_key = (SELECT public.jwt_org_key())
     AND (SELECT public.jwt_user_key()) IN (user_a, user_b)
     AND requested_by = (SELECT public.jwt_user_key()));
CREATE POLICY participant_update ON dm_pairs FOR UPDATE TO authenticated
  USING (organization_key = (SELECT public.jwt_org_key())
     AND (SELECT public.jwt_user_key()) IN (user_a, user_b))
  WITH CHECK (organization_key = (SELECT public.jwt_org_key())
     AND (SELECT public.jwt_user_key()) IN (user_a, user_b));
-- DELETE は機能として提供しない（開示後の証拠隠滅防止。ポリシー自体を作らない＝デフォルト拒否）
DROP POLICY IF EXISTS participant_delete ON dm_pairs;

-- dm_messages: 参加者のみ閲覧。送信は「承認済みペア」かつ「送信者本人」のみ。
-- UPDATE は既読（read_at）マーク用に参加者へ許可（送信者制限なし）
DROP POLICY IF EXISTS participant_only   ON dm_messages;
DROP POLICY IF EXISTS participant_select ON dm_messages;
DROP POLICY IF EXISTS participant_insert ON dm_messages;
DROP POLICY IF EXISTS participant_update ON dm_messages;
CREATE POLICY participant_select ON dm_messages FOR SELECT TO authenticated
  USING (organization_key = (SELECT public.jwt_org_key())
     AND EXISTS (SELECT 1 FROM dm_pairs p
                 WHERE p.pair_id = dm_messages.pair_id
                   AND p.organization_key = (SELECT public.jwt_org_key())
                   AND (SELECT public.jwt_user_key()) IN (p.user_a, p.user_b)));
CREATE POLICY participant_insert ON dm_messages FOR INSERT TO authenticated
  WITH CHECK (organization_key = (SELECT public.jwt_org_key())
     AND sender_key = (SELECT public.jwt_user_key())
     AND EXISTS (SELECT 1 FROM dm_pairs p
                 WHERE p.pair_id = dm_messages.pair_id
                   AND p.organization_key = (SELECT public.jwt_org_key())
                   AND p.status = 'accepted'
                   AND (SELECT public.jwt_user_key()) IN (p.user_a, p.user_b)));
CREATE POLICY participant_update ON dm_messages FOR UPDATE TO authenticated
  USING (organization_key = (SELECT public.jwt_org_key())
     AND EXISTS (SELECT 1 FROM dm_pairs p
                 WHERE p.pair_id = dm_messages.pair_id
                   AND p.organization_key = (SELECT public.jwt_org_key())
                   AND (SELECT public.jwt_user_key()) IN (p.user_a, p.user_b)))
  WITH CHECK (organization_key = (SELECT public.jwt_org_key())
     AND EXISTS (SELECT 1 FROM dm_pairs p
                 WHERE p.pair_id = dm_messages.pair_id
                   AND p.organization_key = (SELECT public.jwt_org_key())
                   AND (SELECT public.jwt_user_key()) IN (p.user_a, p.user_b)));

-- カラム単位の更新制限（RLSは「どのカラムを変えるか」を制限できないため GRANT で補完）:
-- dm_pairs は参加者のすり替え（user_a/user_b/organization_key の書き換え）を、
-- dm_messages は本文改ざん・送信者の付け替えを DB 層でも不可能にする
REVOKE UPDATE ON dm_pairs FROM authenticated;
GRANT UPDATE (status, responded_at, requested_by, disclosed_at, disclosed_by) ON dm_pairs TO authenticated;
REVOKE UPDATE ON dm_messages FROM authenticated;
GRANT UPDATE (read_at) ON dm_messages TO authenticated;
-- DELETE 権限も剥奪（ポリシー不在＋権限なしの二重）
REVOKE DELETE ON dm_pairs, dm_messages FROM authenticated;
