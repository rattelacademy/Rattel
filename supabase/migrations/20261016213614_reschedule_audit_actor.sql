create function private.capture_reschedule_decision_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.decided_by := (select auth.uid());
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.capture_reschedule_decision_actor() from public, anon, authenticated;

create trigger capture_reschedule_decision_actor
  before update on public.reschedule_requests
  for each row execute function private.capture_reschedule_decision_actor();
