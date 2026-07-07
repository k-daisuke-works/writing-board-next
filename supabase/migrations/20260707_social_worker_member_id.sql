-- 社会福祉士会の会員番号。活動費請求フォームの事前入力に使用する。
ALTER TABLE public.user_info
  ADD COLUMN IF NOT EXISTS social_worker_member_id TEXT;

COMMENT ON COLUMN public.user_info.social_worker_member_id IS
  '社会福祉士会の会員番号（活動費請求フォーム事前入力用）';
