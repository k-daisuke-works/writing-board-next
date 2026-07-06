-- ================================================
-- Storage バケットのサイズ・MIME制限（2026-07-07 適用済み）
-- 未設定だと認証済みユーザーが任意形式・無制限サイズのファイルを
-- 公開バケットにアップロードできてしまう（HTMLホスティング悪用・容量枯渇）
-- ================================================

UPDATE storage.buckets SET file_size_limit = 10485760,  -- 10MB
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif']
  WHERE id = 'images';

UPDATE storage.buckets SET file_size_limit = 104857600, -- 100MB
  allowed_mime_types = ARRAY['video/mp4','video/quicktime','video/webm']
  WHERE id = 'videos';

UPDATE storage.buckets SET file_size_limit = 10485760,  -- 10MB（MAX_PDF_SIZE_BYTES と一致）
  allowed_mime_types = ARRAY['application/pdf']
  WHERE id = 'pdfs';

UPDATE storage.buckets SET file_size_limit = 5242880,   -- 5MB
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif']
  WHERE id = 'avatars';
