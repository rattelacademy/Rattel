begin;

select plan(11);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'flow-teacher-one@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'flow-teacher-two@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'flow-parent-one@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'flow-parent-two@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'flow-owner@example.test', '', now(), '{}', '{}', now(), now());

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-000000000010', 'teacher'),
  ('00000000-0000-0000-0000-000000000011', 'teacher'),
  ('00000000-0000-0000-0000-000000000012', 'parent'),
  ('00000000-0000-0000-0000-000000000013', 'parent'),
  ('00000000-0000-0000-0000-000000000014', 'owner');

insert into public.students (id, full_name, parent_user_ids, teacher_id) values
  ('00000000-0000-0000-0000-000000001001', 'Student One', array['00000000-0000-0000-0000-000000000012'::uuid], '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000001002', 'Student Two', array['00000000-0000-0000-0000-000000000013'::uuid], '00000000-0000-0000-0000-000000000011');

insert into public.lesson_sessions (id, student_id, teacher_id, subject, starts_at, ends_at, status) values
  ('00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000000010', 'hifz', now(), now() + interval '45 minutes', 'completed'),
  ('00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000000011', 'tajweed', now(), now() + interval '45 minutes', 'completed');

insert into public.session_reports (session_id, student_id, teacher_id, teacher_notes) values
  ('00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000000010', 'Private report one'),
  ('00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000000011', 'Private report two');

insert into public.reschedule_requests (id, session_id, requested_by, requester_role, reason) values
  ('00000000-0000-0000-0000-000000003001', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000000012', 'parent', 'Family schedule conflict');

insert into public.notifications (recipient_id, title, message, target_path) values
  ('00000000-0000-0000-0000-000000000012', 'Request update', 'Review the proposed time.', '/app/reschedule/00000000-0000-0000-0000-000000003001'),
  ('00000000-0000-0000-0000-000000000013', 'Other account', 'Private notification.', '/app/notifications');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000010', true);
select is((select count(*) from public.students), 1::bigint, 'teacher sees only assigned students');
select is((select count(*) from public.lesson_sessions), 1::bigint, 'teacher sees only own sessions');
select is((select count(*) from public.session_reports), 1::bigint, 'teacher sees only own session reports');
select is((select count(*) from public.reschedule_requests), 1::bigint, 'teacher can review request for own session');
select ok(not has_table_privilege('authenticated', 'public.students', 'INSERT'), 'users cannot create or assign students through the Data API');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', true);
select is((select count(*) from public.students), 1::bigint, 'parent sees only linked students');
select is((select count(*) from public.lesson_sessions), 1::bigint, 'parent sees only linked student sessions');
select is((select count(*) from public.notifications), 1::bigint, 'user sees only own notifications');
select is((with updated as (update public.lesson_sessions set attendance_status = 'attended' where id = '00000000-0000-0000-0000-000000002001' returning 1) select count(*) from updated), 0::bigint, 'parent cannot record attendance');
select is((with updated as (update public.reschedule_requests set status = 'accepted' where id = '00000000-0000-0000-0000-000000003001' returning 1) select count(*) from updated), 0::bigint, 'parent cannot decide a request');
select ok(not has_column_privilege('authenticated', 'public.reschedule_requests', 'decided_by', 'UPDATE'), 'user cannot rewrite decision audit identity');

reset role;
select * from finish();
rollback;
