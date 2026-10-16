begin;

select plan(4);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-roles@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher-roles@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'parent-roles@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'invited-user@example.test', '', now(), '{}', '{}', now(), now());

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-000000000030', 'owner'),
  ('00000000-0000-0000-0000-000000000031', 'teacher'),
  ('00000000-0000-0000-0000-000000000032', 'parent');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000030', true);
select lives_ok(
  $$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-000000000033', 'teacher')$$,
  'owner can assign a non-owner role'
);
select throws_ok(
  $$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-000000000033', 'owner')$$,
  '42501', null, 'owner cannot assign another owner through the Data API'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000031', true);
select throws_ok(
  $$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-000000000033', 'parent')$$,
  '42501', null, 'teacher cannot assign roles'
);
delete from public.user_roles where user_id = '00000000-0000-0000-0000-000000000033';
reset role;
select is((select count(*) from public.user_roles where user_id = '00000000-0000-0000-0000-000000000033'), 1::bigint, 'teacher cannot remove an assigned role');

select * from finish();
rollback;
