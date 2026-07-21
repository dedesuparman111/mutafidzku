-- ============================================================================
-- Mutafidz PRO — Supabase Schema (Full Setup for supabase.com)
-- ----------------------------------------------------------------------------
-- Jalankan file ini di Supabase SQL Editor (project baru) untuk membuat
-- seluruh database + auth roles + bootstrap admin.
--
-- Setelah dijalankan:
--   1. Aktifkan Email provider di Auth > Providers (default sudah aktif).
--   2. Daftar / sign up dengan email admin (default: dedesuparman333@gmail.com)
--      → trigger otomatis assign role 'admin'.
--   3. Untuk user lain → otomatis role 'user'.
-- ============================================================================

-- Ekstensi
create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUM: app_role
-- ============================================================================
do $$ begin
  create type public.app_role as enum ('admin', 'user');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- FUNCTIONS: updated_at, has_role, generate_student_code, handle_new_user
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- ============================================================================
-- TABLE: profiles
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- TABLE: user_roles
-- ============================================================================
create table if not exists public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.app_role not null,
  created_at  timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

drop policy if exists "user_roles_select_own_or_admin" on public.user_roles;
create policy "user_roles_select_own_or_admin" on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "user_roles_admin_insert" on public.user_roles;
create policy "user_roles_admin_insert" on public.user_roles
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "user_roles_admin_update" on public.user_roles;
create policy "user_roles_admin_update" on public.user_roles
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "user_roles_admin_delete" on public.user_roles;
create policy "user_roles_admin_delete" on public.user_roles
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- TRIGGER: handle_new_user — bootstrap profile + role saat signup
-- Ganti email admin di baris `lower(NEW.email) = '...'` sesuai kebutuhan.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;

  if lower(new.email) = 'dedesuparman333@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
      on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user')
      on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- TABLE: students
-- ============================================================================
create table if not exists public.students (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  code            text,                 -- Format YYMMXXXX (auto-generated)
  name            text not null,
  place_of_birth  text,
  date_of_birth   date,
  class_name      text,
  guardian        text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists students_user_id_idx on public.students (user_id);
create index if not exists students_code_idx    on public.students (code);
create index if not exists students_name_idx    on public.students (name);

grant select, insert, update, delete on public.students to authenticated;
grant all on public.students to service_role;

alter table public.students enable row level security;

drop policy if exists "students_select_own" on public.students;
create policy "students_select_own" on public.students
  for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "students_insert_own" on public.students;
create policy "students_insert_own" on public.students
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "students_update_own" on public.students;
create policy "students_update_own" on public.students
  for update to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "students_delete_own" on public.students;
create policy "students_delete_own" on public.students
  for delete to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- Auto-generate kode santri format YYMMXXXX
create or replace function public.generate_student_code()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  prefix text := to_char(now(), 'YYMM');
  next_seq int;
begin
  if new.code is null or new.code = '' then
    select coalesce(max(substring(code from 5 for 4)::int), 0) + 1
      into next_seq
      from public.students
     where user_id = new.user_id and code like prefix || '%';
    new.code := prefix || lpad(next_seq::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_students_code on public.students;
create trigger trg_students_code
  before insert on public.students
  for each row execute function public.generate_student_code();

drop trigger if exists trg_students_updated_at on public.students;
create trigger trg_students_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

-- ============================================================================
-- TABLE: memorization
-- ============================================================================
create table if not exists public.memorization (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  student_id  uuid references public.students(id) on delete cascade,
  date        date not null default current_date,
  surah       text,
  from_ayah   int,
  to_ayah     int,
  score       numeric(5,2),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists memorization_user_id_idx     on public.memorization (user_id);
create index if not exists memorization_student_id_idx  on public.memorization (student_id);
create index if not exists memorization_date_idx        on public.memorization (date desc);

grant select, insert, update, delete on public.memorization to authenticated;
grant all on public.memorization to service_role;

alter table public.memorization enable row level security;

drop policy if exists "memorization_all_own" on public.memorization;
create policy "memorization_all_own" on public.memorization
  for all to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = user_id);

drop trigger if exists trg_memorization_updated_at on public.memorization;
create trigger trg_memorization_updated_at
  before update on public.memorization
  for each row execute function public.set_updated_at();

-- ============================================================================
-- TABLE: murojaah
-- ============================================================================
create table if not exists public.murojaah (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  student_id  uuid references public.students(id) on delete cascade,
  date        date not null default current_date,
  surah       text,
  from_ayah   int,
  to_ayah     int,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists murojaah_user_id_idx     on public.murojaah (user_id);
create index if not exists murojaah_student_id_idx  on public.murojaah (student_id);
create index if not exists murojaah_date_idx        on public.murojaah (date desc);

grant select, insert, update, delete on public.murojaah to authenticated;
grant all on public.murojaah to service_role;

alter table public.murojaah enable row level security;

drop policy if exists "murojaah_all_own" on public.murojaah;
create policy "murojaah_all_own" on public.murojaah
  for all to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = user_id);

drop trigger if exists trg_murojaah_updated_at on public.murojaah;
create trigger trg_murojaah_updated_at
  before update on public.murojaah
  for each row execute function public.set_updated_at();

-- ============================================================================
-- TABLE: user_settings
-- ============================================================================
create table if not exists public.user_settings (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

grant select, insert, update, delete on public.user_settings to authenticated;
grant all on public.user_settings to service_role;

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_all_own" on public.user_settings;
create policy "user_settings_all_own" on public.user_settings
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ============================================================================
-- BACKFILL: kalau admin sudah sign-up sebelum trigger dibuat
-- ============================================================================
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', u.email)
  from auth.users u
 where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
  from auth.users u
 where lower(u.email) = 'dedesuparman333@gmail.com'
   and not exists (select 1 from public.user_roles r where r.user_id = u.id and r.role = 'admin');

insert into public.user_roles (user_id, role)
select u.id, 'user'::public.app_role
  from auth.users u
 where lower(u.email) <> 'dedesuparman333@gmail.com'
   and not exists (select 1 from public.user_roles r where r.user_id = u.id);

-- ============================================================================
-- SELESAI. Verifikasi:
--   select * from public.profiles;
--   select * from public.user_roles;
-- ============================================================================
