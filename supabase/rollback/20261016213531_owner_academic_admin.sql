drop policy if exists "students_owner_update_valid_placement" on public.students;
drop policy if exists "students_owner_insert_valid_placement" on public.students;
revoke insert (full_name, parent_user_ids, teacher_id, status),
  update (full_name, parent_user_ids, teacher_id, status)
  on public.students from authenticated;
drop policy if exists "user_roles_select_owner" on public.user_roles;
drop policy if exists "profiles_select_owner" on public.profiles;
revoke execute on function private.has_app_role(public.app_role) from authenticated;
revoke usage on schema private from authenticated;
drop function if exists private.has_app_role(public.app_role);
