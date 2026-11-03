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
