-- Run exactly once in the isolated development project's SQL editor, only after
-- creating the verified owner account in Supabase Auth. Never run in production.
-- Replace the email literal below with the owner's verified sign-in email.
do $$
declare
  owner_count integer;
  target_user_id uuid;
begin
  select count(*) into owner_count
  from public.user_roles
  where role = 'owner';

  if owner_count <> 0 then
    raise exception 'Bootstrap stopped: an owner role already exists';
  end if;

  select id into target_user_id
  from auth.users
  where lower(email) = lower('REPLACE_WITH_VERIFIED_OWNER_EMAIL');

  if target_user_id is null then
    raise exception 'Bootstrap stopped: no Auth user matches the supplied email';
  end if;

  insert into public.user_roles (user_id, role)
  values (target_user_id, 'owner');
end;
$$;

-- Rollback, only if this was the wrong account and before any owner activity:
-- delete from public.user_roles
-- where role = 'owner'
--   and user_id = (select id from auth.users where lower(email) = lower('REPLACE_WITH_VERIFIED_OWNER_EMAIL'));
