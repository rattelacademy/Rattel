create index session_reports_teacher_created_idx
  on public.session_reports (teacher_id, created_at desc);

create index reschedule_requests_requested_by_created_idx
  on public.reschedule_requests (requested_by, created_at desc);

create index reschedule_requests_decided_by_idx
  on public.reschedule_requests (decided_by);
