-- Roll back only the core academic workflow schema from this migration.
drop table if exists public.notifications;
drop table if exists public.reschedule_requests;
drop table if exists public.session_reports;
drop table if exists public.lesson_sessions;
drop table if exists public.students;

drop type if exists public.reschedule_requester_role;
drop type if exists public.reschedule_status;
drop type if exists public.attendance_status;
drop type if exists public.lesson_status;
drop type if exists public.lesson_subject;
