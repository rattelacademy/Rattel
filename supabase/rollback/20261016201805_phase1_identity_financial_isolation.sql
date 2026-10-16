-- Roll back only in the same local database or approved staging branch where
-- the matching migration was applied. This does not delete Auth users.
drop view if exists public.parent_invoice_summary;
drop table if exists public.parent_invoices;
drop table if exists public.teacher_earnings;
drop table if exists public.user_roles;
drop trigger if exists on_auth_user_created_create_profile on auth.users;
drop function if exists private.create_profile_for_new_auth_user();
drop table if exists public.profiles;
drop type if exists public.app_role;
