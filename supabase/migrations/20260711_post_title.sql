-- 投稿タイトル（任意）: 履歴画面（/notices・/member/[id]）でタイトルのみの
-- 折りたたみ一覧を表示するため。旧投稿は NULL のまま（表示側で本文1行目を代替見出しにする）
ALTER TABLE writing_data ADD COLUMN IF NOT EXISTS title text;
