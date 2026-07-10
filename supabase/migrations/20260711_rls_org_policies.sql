-- 組織スコープRLSポリシー（多層防御）
-- 背景: サーバーは従来 service role（RLSバイパス）のみで全クエリにアプリ層の
-- .eq('organization_key', ...) を必須としてきた。本マイグレーションで
-- authenticated ロール向けの組織スコープポリシーを導入し、サーバー側は
-- 自己署名JWT（role=authenticated + organization_key クレーム）で接続する。
-- アプリ層フィルタが漏れてもDB層で他団体のデータには到達できない。
-- service role は引き続きバイパスするため、本ポリシー適用自体は無停止。

-- JWTクレームから組織キーを取り出すヘルパー（int比較用）
create or replace function public.jwt_org_key() returns integer
language sql stable
as $$ select nullif(auth.jwt()->>'organization_key','')::integer $$;

-- organization_key (integer) を持つテーブル: 自組織の行のみ全操作可
do $$
declare t text;
begin
  foreach t in array array[
    'audit_logs','department_data','employment_type_data','group_data',
    'job_data','login_history','organization_data','password_policy',
    'position_data','post_attachments','post_reactions','post_reads',
    'post_replies','push_subscriptions','schedule_events','user_info',
    'writing_data'
  ] loop
    execute format('drop policy if exists org_isolation on public.%I', t);
    execute format(
      'create policy org_isolation on public.%I for all to authenticated
         using (organization_key = (select public.jwt_org_key()))
         with check (organization_key = (select public.jwt_org_key()))', t);
  end loop;
end $$;

-- calendar_events は organization_key が text 型
drop policy if exists org_isolation on public.calendar_events;
create policy org_isolation on public.calendar_events for all to authenticated
  using (organization_key = (select auth.jwt()->>'organization_key'))
  with check (organization_key = (select auth.jwt()->>'organization_key'));

-- 子テーブル: 親テーブル経由で組織スコープ（親側のRLSも同時に効く）
drop policy if exists org_isolation on public.schedule_dates;
create policy org_isolation on public.schedule_dates for all to authenticated
  using (exists (select 1 from public.schedule_events e
                 where e.event_id = schedule_dates.event_id
                   and e.organization_key = (select public.jwt_org_key())))
  with check (exists (select 1 from public.schedule_events e
                      where e.event_id = schedule_dates.event_id
                        and e.organization_key = (select public.jwt_org_key())));

drop policy if exists org_isolation on public.schedule_responses;
create policy org_isolation on public.schedule_responses for all to authenticated
  using (exists (select 1 from public.schedule_dates d
                 join public.schedule_events e on e.event_id = d.event_id
                 where d.date_id = schedule_responses.date_id
                   and e.organization_key = (select public.jwt_org_key())))
  with check (exists (select 1 from public.schedule_dates d
                      join public.schedule_events e on e.event_id = d.event_id
                      where d.date_id = schedule_responses.date_id
                        and e.organization_key = (select public.jwt_org_key())));

drop policy if exists org_isolation on public.user_group_members;
create policy org_isolation on public.user_group_members for all to authenticated
  using (exists (select 1 from public.group_data g
                 where g.group_id = user_group_members.group_id
                   and g.organization_key = (select public.jwt_org_key())))
  with check (exists (select 1 from public.group_data g
                      where g.group_id = user_group_members.group_id
                        and g.organization_key = (select public.jwt_org_key())));

-- 全団体共通の読み取り専用キャッシュ（書き込みは service role の Cron のみ）
drop policy if exists authenticated_read on public.welfare_news;
create policy authenticated_read on public.welfare_news for select to authenticated
  using (true);
