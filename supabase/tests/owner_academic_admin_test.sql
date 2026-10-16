begin;

select plan(4);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-admin@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher-admin@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'parent-admin@example.test', '', now(), '{}', '{}', now(), now());

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-000000000020', 'owner'),
  ('00000000-0000-0000-0000-000000000021', 'teacher'),
  ('00000000-0000-0000-0000-000000000022', 'parent');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000020', true);
select is((select count(*) from public.profiles), 3::bigint, 'owner can read the account directory');
select lives_ok(
  $$insert into public.students (full_name, parent_user_ids, teacher_id) values ('Placement test', array['00000000-0000-0000-0000-000000000022'::uuid], '00000000-0000-0000-0000-000000000021')$$,
  'owner can place a student with a parent and teacher'
);
select throws_ok(
  $$insert into public.students (full_name, parent_user_ids, teacher_id) values ('Invalid placement', array['00000000-0000-0000-0000-000000000021'::uuid], '00000000-0000-0000-0000-000000000021')$$,
  '42501', null, 'owner cannot assign a teacher as a parent'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000021', true);
update public.students set status = 'inactive' where full_name = 'Placement test';
select is((select count(*) from public.students where full_name = 'Placement test' and status = 'inactive'), 0::bigint, 'teacher cannot change student placement');

reset role;
select * from finish();
rollback;
