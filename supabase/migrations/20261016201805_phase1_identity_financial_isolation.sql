-- Phase 1 foundation. Apply only to a local database or an explicitly approved
-- staging branch. Financial policy decisions D-04 through D-08 stay configurable.

create type public.app_role as enum ('owner', 'teacher', 'parent');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.create_profile_for_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and (select auth.uid()) <> new.id then
    raise exception 'Cannot create a profile for a different authenticated user';
  end if;

  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), '')
  );
  return new;
end;
$$;

revoke all on function private.create_profile_for_new_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute function private.create_profile_for_new_auth_user();

create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.teacher_earnings (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete restrict,
  period_start date not null,
  period_end date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null check (status in ('pending', 'approved', 'paid')),
  created_at timestamptz not null default now(),
  constraint teacher_earnings_period_order check (period_end >= period_start)
);

create index teacher_earnings_teacher_period_idx
  on public.teacher_earnings (teacher_id, period_start desc);

-- The parent-facing ledger intentionally has one total and no academy/teacher
-- split fields. Keep split calculations in a separately authorized domain.
create table public.parent_invoices (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete restrict,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null check (status in ('draft', 'open', 'paid', 'void')),
  issued_at timestamptz not null default now()
);

create index parent_invoices_parent_issued_idx
  on public.parent_invoices (parent_id, issued_at desc);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.teacher_earnings enable row level security;
alter table public.parent_invoices enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.user_roles from anon, authenticated;
revoke all on table public.teacher_earnings from anon, authenticated;
revoke all on table public.parent_invoices from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;
grant select on table public.user_roles to authenticated;
grant select on table public.teacher_earnings to authenticated;
grant select on table public.parent_invoices to authenticated;

create policy "profiles_select_self"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "user_roles_select_self"
  on public.user_roles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "teacher_earnings_select_self_or_owner"
  on public.teacher_earnings for select to authenticated
  using (
    teacher_id = (select auth.uid())
    or exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid()) and r.role = 'owner'
    )
  );

create policy "parent_invoices_select_self_or_owner"
  on public.parent_invoices for select to authenticated
  using (
    parent_id = (select auth.uid())
    or exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid()) and r.role = 'owner'
    )
  );

-- API read model used to verify that the parent Data API exposes totals only.
-- The view runs with caller privileges and the underlying table's RLS policies.
create view public.parent_invoice_summary
  with (security_invoker = true)
as
  select id, parent_id, amount, currency, status, issued_at
  from public.parent_invoices;

revoke all on table public.parent_invoice_summary from anon, authenticated;
grant select on table public.parent_invoice_summary to authenticated;
