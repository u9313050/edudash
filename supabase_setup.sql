create table if not exists public.edudash_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.edudash_user_data enable row level security;

drop policy if exists "edudash_user_data_select" on public.edudash_user_data;
drop policy if exists "edudash_user_data_insert" on public.edudash_user_data;
drop policy if exists "edudash_user_data_update" on public.edudash_user_data;

create policy "edudash_user_data_select"
on public.edudash_user_data
for select
to authenticated
using (auth.uid() = user_id);

create policy "edudash_user_data_insert"
on public.edudash_user_data
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "edudash_user_data_update"
on public.edudash_user_data
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.edudash_question_banks (
  bank_key text primary key,
  questions jsonb not null default '[]'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.edudash_question_banks enable row level security;

drop policy if exists "edudash_question_banks_select" on public.edudash_question_banks;
drop policy if exists "edudash_question_banks_insert_admin" on public.edudash_question_banks;
drop policy if exists "edudash_question_banks_update_admin" on public.edudash_question_banks;
drop policy if exists "edudash_question_banks_delete_admin" on public.edudash_question_banks;

create policy "edudash_question_banks_select"
on public.edudash_question_banks
for select
to authenticated
using (true);

create policy "edudash_question_banks_insert_admin"
on public.edudash_question_banks
for insert
to authenticated
with check ((auth.jwt() -> 'user_metadata' ->> 'username') = 'u9313050');

create policy "edudash_question_banks_update_admin"
on public.edudash_question_banks
for update
to authenticated
using ((auth.jwt() -> 'user_metadata' ->> 'username') = 'u9313050')
with check ((auth.jwt() -> 'user_metadata' ->> 'username') = 'u9313050');

create policy "edudash_question_banks_delete_admin"
on public.edudash_question_banks
for delete
to authenticated
using ((auth.jwt() -> 'user_metadata' ->> 'username') = 'u9313050');
