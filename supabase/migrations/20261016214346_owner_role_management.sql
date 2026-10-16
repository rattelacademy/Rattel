grant insert (user_id, role), delete on public.user_roles to authenticated;

create policy "user_roles_owner_insert_non_owner_role"
  on public.user_roles for insert to authenticated
  with check (private.has_app_role('owner') and role <> 'owner');

create policy "user_roles_owner_delete_non_owner_role"
  on public.user_roles for delete to authenticated
  using (private.has_app_role('owner') and role <> 'owner');
