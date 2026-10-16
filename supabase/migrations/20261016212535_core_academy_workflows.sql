-- Core academic workflows only. Do not apply to the production project.
-- The financial policy decisions D-04 through D-08 remain outside this schema.

create type public.lesson_subject as enum ('hifz', 'tajweed', 'qiraat', 'other');
create type public.lesson_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled');
create type public.attendance_status as enum ('unrecorded', 'attended', 'absent');
create type public.reschedule_status as enum ('pending', 'offered', 'accepted', 'rejected', 'cancelled');
create type public.reschedule_requester_role as enum ('parent', 'teacher');

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 1 and 160),
  parent_user_ids uuid[] not null default '{}',
  teacher_id uuid references public.profiles (id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'unassigned', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index students_teacher_status_idx on public.students (teacher_id, status);
create index students_parents_idx on public.students using gin (parent_user_ids);

create table public.lesson_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete restrict,
  teacher_id uuid not null references public.profiles (id) on delete restrict,
  subject public.lesson_subject not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.lesson_status not null default 'scheduled',
  attendance_status public.attendance_status not null default 'unrecorded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_sessions_time_order check (ends_at > starts_at)
);

create index lesson_sessions_teacher_start_idx on public.lesson_sessions (teacher_id, starts_at);
create index lesson_sessions_student_start_idx on public.lesson_sessions (student_id, starts_at);

create table public.session_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.lesson_sessions (id) on delete restrict,
  student_id uuid not null references public.students (id) on delete restrict,
  teacher_id uuid not null references public.profiles (id) on delete restrict,
  new_surah text,
  ayah_start integer check (ayah_start is null or ayah_start > 0),
  ayah_end integer check (ayah_end is null or ayah_end > 0),
  memorization_score smallint check (memorization_score between 1 and 5),
  revision_score smallint check (revision_score between 1 and 5),
  tajweed_notes text not null default '',
  teacher_notes text not null default '',
  homework text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint session_reports_ayah_order check (ayah_start is null or ayah_end is null or ayah_end >= ayah_start)
);

create index session_reports_student_created_idx on public.session_reports (student_id, created_at desc);

create table public.reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.lesson_sessions (id) on delete restrict,
  requested_by uuid not null references public.profiles (id) on delete restrict,
  requester_role public.reschedule_requester_role not null,
  reason text not null check (length(trim(reason)) between 1 and 1200),
  proposed_times timestamptz[] not null default '{}',
  status public.reschedule_status not null default 'pending',
  decision_note text not null default '',
  decided_by uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reschedule_requests_session_created_idx on public.reschedule_requests (session_id, created_at desc);
create index reschedule_requests_status_created_idx on public.reschedule_requests (status, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 180),
  message text not null default '',
  target_path text check (target_path is null or target_path like '/app/%'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_created_idx on public.notifications (recipient_id, created_at desc);

alter table public.students enable row level security;
alter table public.lesson_sessions enable row level security;
alter table public.session_reports enable row level security;
alter table public.reschedule_requests enable row level security;
alter table public.notifications enable row level security;

revoke all on public.students, public.lesson_sessions, public.session_reports, public.reschedule_requests, public.notifications from anon, authenticated;

grant select on public.students, public.lesson_sessions, public.session_reports, public.reschedule_requests, public.notifications to authenticated;
grant update (attendance_status) on public.lesson_sessions to authenticated;
grant insert (session_id, student_id, teacher_id, new_surah, ayah_start, ayah_end, memorization_score, revision_score, tajweed_notes, teacher_notes, homework)
  on public.session_reports to authenticated;
grant update (new_surah, ayah_start, ayah_end, memorization_score, revision_score, tajweed_notes, teacher_notes, homework)
  on public.session_reports to authenticated;
grant insert (session_id, requested_by, requester_role, reason, proposed_times)
  on public.reschedule_requests to authenticated;
grant update (status, proposed_times, decision_note) on public.reschedule_requests to authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy "students_select_owner_teacher_or_parent"
  on public.students for select to authenticated
  using (
    exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'owner')
    or teacher_id = (select auth.uid())
    or (select auth.uid()) = any(parent_user_ids)
  );

create policy "sessions_select_assigned_people"
  on public.lesson_sessions for select to authenticated
  using (
    exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'owner')
    or teacher_id = (select auth.uid())
    or exists (
      select 1 from public.students s
      where s.id = lesson_sessions.student_id and (select auth.uid()) = any(s.parent_user_ids)
    )
  );

create policy "sessions_teacher_attendance_update"
  on public.lesson_sessions for update to authenticated
  using (
    teacher_id = (select auth.uid())
    or exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'owner')
  )
  with check (
    teacher_id = (select auth.uid())
    or exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'owner')
  );

create policy "session_reports_select_assigned_people"
  on public.session_reports for select to authenticated
  using (
    teacher_id = (select auth.uid())
    or exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'owner')
    or exists (
      select 1 from public.students s
      where s.id = session_reports.student_id and (select auth.uid()) = any(s.parent_user_ids)
    )
  );

create policy "session_reports_teacher_insert_own_session"
  on public.session_reports for insert to authenticated
  with check (
    teacher_id = (select auth.uid())
    and exists (
      select 1 from public.lesson_sessions s
      where s.id = session_reports.session_id
        and s.teacher_id = (select auth.uid())
        and s.student_id = session_reports.student_id
    )
  );

create policy "session_reports_teacher_update_own_session"
  on public.session_reports for update to authenticated
  using (teacher_id = (select auth.uid()))
  with check (
    teacher_id = (select auth.uid())
    and exists (
      select 1 from public.lesson_sessions s
      where s.id = session_reports.session_id
        and s.teacher_id = (select auth.uid())
        and s.student_id = session_reports.student_id
    )
  );

create policy "reschedule_requests_select_assigned_people"
  on public.reschedule_requests for select to authenticated
  using (
    requested_by = (select auth.uid())
    or exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'owner')
    or exists (
      select 1 from public.lesson_sessions s
      where s.id = session_id and s.teacher_id = (select auth.uid())
    )
    or exists (
      select 1 from public.lesson_sessions s
      join public.students st on st.id = s.student_id
      where s.id = session_id and (select auth.uid()) = any(st.parent_user_ids)
    )
  );

create policy "reschedule_requests_insert_by_session_participant"
  on public.reschedule_requests for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and (
      (requester_role = 'teacher' and exists (
        select 1 from public.lesson_sessions s where s.id = session_id and s.teacher_id = (select auth.uid())
      ))
      or (requester_role = 'parent' and exists (
        select 1 from public.lesson_sessions s
        join public.students st on st.id = s.student_id
        where s.id = session_id and (select auth.uid()) = any(st.parent_user_ids)
      ))
    )
  );

create policy "reschedule_requests_update_owner_or_teacher"
  on public.reschedule_requests for update to authenticated
  using (
    exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'owner')
    or exists (select 1 from public.lesson_sessions s where s.id = session_id and s.teacher_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'owner')
    or exists (select 1 from public.lesson_sessions s where s.id = session_id and s.teacher_id = (select auth.uid()))
  );

create policy "notifications_select_recipient_or_owner"
  on public.notifications for select to authenticated
  using (
    recipient_id = (select auth.uid())
    or exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'owner')
  );

create policy "notifications_recipient_mark_read"
  on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));
