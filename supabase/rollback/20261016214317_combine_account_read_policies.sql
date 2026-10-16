drop policy if exists "user_roles_select_self_or_owner" on public.user_roles;
create policy "user_roles_select_self"
  on public.user_roles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "user_roles_select_owner"
  on public.user_roles for select to authenticated
  using (private.has_app_role('owner'));

drop policy if exists "profiles_select_self_or_owner" on public.profiles;
create policy "profiles_select_self"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles_select_owner"
  on public.profiles for select to authenticated
  using (private.has_app_role('owner'));
