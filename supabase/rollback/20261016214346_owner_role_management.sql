drop policy if exists "user_roles_owner_delete_non_owner_role" on public.user_roles;
drop policy if exists "user_roles_owner_insert_non_owner_role" on public.user_roles;
revoke insert (user_id, role), delete on public.user_roles from authenticated;
