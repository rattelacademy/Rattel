-- Owner-only account directory and student placement controls.

create function private.has_app_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = (select auth.uid()) and r.role = required_role
  );
$$;
revoke all on function private.has_app_role(public.app_role) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_app_role(public.app_role) to authenticated;

create policy "profiles_select_owner"
  on public.profiles for select to authenticated
  using (private.has_app_role('owner'));

create policy "user_roles_select_owner"
  on public.user_roles for select to authenticated
  using (private.has_app_role('owner'));

grant insert (full_name, parent_user_ids, teacher_id, status),
  update (full_name, parent_user_ids, teacher_id, status)
  on public.students to authenticated;

create policy "students_owner_insert_valid_placement"
  on public.students for insert to authenticated
  with check (
    private.has_app_role('owner')
    and (
      teacher_id is null
      or exists (
        select 1 from public.user_roles r
        where r.user_id = students.teacher_id and r.role = 'teacher'
      )
    )
    and not exists (
      select 1 from unnest(parent_user_ids) parent_id
      where not exists (
        select 1 from public.user_roles r
        where r.user_id = parent_id and r.role = 'parent'
      )
    )
  );

create policy "students_owner_update_valid_placement"
  on public.students for update to authenticated
  using (private.has_app_role('owner'))
  with check (
    private.has_app_role('owner')
    and (
      teacher_id is null
      or exists (
        select 1 from public.user_roles r
        where r.user_id = students.teacher_id and r.role = 'teacher'
      )
    )
    and not exists (
      select 1 from unnest(parent_user_ids) parent_id
      where not exists (
        select 1 from public.user_roles r
        where r.user_id = parent_id and r.role = 'parent'
      )
    )
  );
