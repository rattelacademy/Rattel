begin;

select plan(11);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher-one@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Teacher One"}', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher-two@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Teacher Two"}', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'parent-one@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Parent One"}', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'parent-two@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Parent Two"}', now(), now()),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Owner"}', now(), now());

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-000000000001', 'teacher'),
  ('00000000-0000-0000-0000-000000000002', 'teacher'),
  ('00000000-0000-0000-0000-000000000003', 'parent'),
  ('00000000-0000-0000-0000-000000000004', 'parent'),
  ('00000000-0000-0000-0000-000000000005', 'owner');

insert into public.teacher_earnings (teacher_id, period_start, period_end, amount, currency, status) values
  ('00000000-0000-0000-0000-000000000001', '2026-10-01', '2026-10-31', 100, 'SAR', 'pending'),
  ('00000000-0000-0000-0000-000000000002', '2026-10-01', '2026-10-31', 200, 'SAR', 'approved');

insert into public.parent_invoices (parent_id, amount, currency, status) values
  ('00000000-0000-0000-0000-000000000003', 300, 'SAR', 'open'),
  ('00000000-0000-0000-0000-000000000004', 450, 'SAR', 'paid');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select is((select count(*) from public.user_roles), 1::bigint, 'teacher sees only their own role rows');
select is((select count(*) from public.teacher_earnings), 1::bigint, 'teacher sees only their own earnings');
select is((select count(*) from public.parent_invoices), 0::bigint, 'teacher cannot see parent invoices');
select ok(not has_table_privilege('authenticated', 'public.teacher_earnings', 'UPDATE'), 'teacher cannot update earnings');
select ok(not has_table_privilege('authenticated', 'public.teacher_earnings', 'INSERT'), 'teacher cannot insert earnings');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
select is((select count(*) from public.parent_invoices), 1::bigint, 'parent sees only their own invoice');
select is((select count(*) from public.teacher_earnings), 0::bigint, 'parent cannot see teacher earnings');
select ok(not has_table_privilege('authenticated', 'public.parent_invoices', 'UPDATE'), 'parent cannot change invoices');

select is((select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'parent_invoice_summary' and column_name = 'teacher_amount'), 0::bigint, 'parent API has no teacher split column');
select is((select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'parent_invoice_summary' and column_name = 'academy_amount'), 0::bigint, 'parent API has no academy split column');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000005', true);
select is((select count(*) from public.teacher_earnings), 2::bigint, 'owner can review all teacher earnings');

reset role;
select * from finish();
rollback;
