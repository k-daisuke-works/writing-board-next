-- 日次バックアップ用: public スキーマ全テーブルを jsonb で書き出す関数。
-- 無料プランは自動バックアップ対象外のため、Cron（/api/cron/backup）がこれを呼び
-- 同プロジェクトの非公開 Storage バケット `backups` に14日分保存する（国内保管を維持）。
-- security definer（RLSバイパス）のため service role 以外から実行できないよう revoke する。
create or replace function public.export_all_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  t jsonb;
  result jsonb := '{}'::jsonb;
begin
  for r in
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  loop
    execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) from %I x', r.table_name) into t;
    result := result || jsonb_build_object(r.table_name, t);
  end loop;
  return result;
end $$;

revoke execute on function public.export_all_data() from public, anon, authenticated;
