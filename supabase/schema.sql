-- Jalankan sekali dalam Supabase → SQL Editor.
-- Satu baris pelan bagi setiap pengguna; hanya pemilik boleh baca/tulis (RLS).
create table if not exists public.plans (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.plans enable row level security;

drop policy if exists "plans_select_own" on public.plans;
drop policy if exists "plans_insert_own" on public.plans;
drop policy if exists "plans_update_own" on public.plans;
drop policy if exists "plans_delete_own" on public.plans;

create policy "plans_select_own" on public.plans for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "plans_insert_own" on public.plans for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "plans_update_own" on public.plans for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "plans_delete_own" on public.plans for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.plans to authenticated;

-- =====================================================================
-- PELAN DIKONGSI (v2 awan): satu pelan boleh diguna beberapa e-mel.
-- Jalankan keseluruhan fail ini sekali lagi — selamat diulang.
-- Jadual lama `plans` dikekalkan (app memindahkan datanya secara automatik).
-- =====================================================================
create table if not exists public.shared_plans (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  owner_email text not null default lower(coalesce(auth.jwt() ->> 'email', '')),
  data        jsonb not null default '{}'::jsonb,
  version     bigint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.plan_members (
  plan_id  uuid not null references public.shared_plans (id) on delete cascade,
  email    text not null check (email = lower(email)),
  added_at timestamptz not null default now(),
  primary key (plan_id, email)
);

-- Fungsi bantuan (security definer — elak rekursi RLS)
create or replace function public.is_plan_owner(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.shared_plans p where p.id = pid and p.owner_id = (select auth.uid()));
$$;

create or replace function public.is_plan_member(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.plan_members m
                 where m.plan_id = pid and m.email = lower(coalesce((select auth.jwt() ->> 'email'), '')));
$$;

create or replace function public.can_access_plan(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_plan_owner(pid) or public.is_plan_member(pid);
$$;

alter table public.shared_plans enable row level security;
alter table public.plan_members enable row level security;

drop policy if exists "sp_select" on public.shared_plans;
drop policy if exists "sp_insert" on public.shared_plans;
drop policy if exists "sp_update" on public.shared_plans;
drop policy if exists "sp_delete" on public.shared_plans;
create policy "sp_select" on public.shared_plans for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_plan_member(id));
create policy "sp_insert" on public.shared_plans for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "sp_update" on public.shared_plans for update to authenticated
  using (owner_id = (select auth.uid()) or public.is_plan_member(id))
  with check (owner_id = (select auth.uid()) or public.is_plan_member(id));
create policy "sp_delete" on public.shared_plans for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "pm_select" on public.plan_members;
drop policy if exists "pm_insert" on public.plan_members;
drop policy if exists "pm_delete" on public.plan_members;
create policy "pm_select" on public.plan_members for select to authenticated using (public.can_access_plan(plan_id));
create policy "pm_insert" on public.plan_members for insert to authenticated with check (public.is_plan_owner(plan_id));
create policy "pm_delete" on public.plan_members for delete to authenticated
  using (public.is_plan_owner(plan_id) or email = lower(coalesce((select auth.jwt() ->> 'email'), '')));

-- Ahli hanya boleh ubah data, bukan pemilik.
revoke all on public.shared_plans from anon, authenticated;
grant select, insert, delete on public.shared_plans to authenticated;
grant update (data, version, updated_at) on public.shared_plans to authenticated;
revoke all on public.plan_members from anon, authenticated;
grant select, insert, delete on public.plan_members to authenticated;
revoke all on function public.is_plan_owner(uuid) from public, anon;
revoke all on function public.can_access_plan(uuid) from public, anon;
revoke all on function public.is_plan_member(uuid) from public, anon;
grant execute on function public.is_plan_member(uuid) to authenticated;
grant execute on function public.is_plan_owner(uuid) to authenticated;
grant execute on function public.can_access_plan(uuid) to authenticated;

-- Kemas kini masa nyata antara telefon
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shared_plans') then
    alter publication supabase_realtime add table public.shared_plans;
  end if;
end $$;
