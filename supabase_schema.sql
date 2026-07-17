-- ============================================================================
-- Mutafidz PRO — Supabase Schema
-- ----------------------------------------------------------------------------
-- Jalankan file ini di Supabase SQL Editor untuk membuat seluruh database.
-- Skema ini mendukung multi-user (per-akun) dengan Row Level Security (RLS).
-- Setiap baris dimiliki oleh user_id (auth.uid()) sehingga data tiap pengguna
-- terisolasi. Jika ingin single-user (mode lama), lihat catatan di bawah.
-- ============================================================================

-- Ekstensi yang dibutuhkan
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1) SANTRI (Students)
-- ============================================================================
create table if not exists public.students (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  place_of_birth text,
  date_of_birth  date,
  class_name     text,               -- Kelas / Halaqah
  guardian       text,               -- Nama Wali
  phone          text,
  address        text,
  photo_url      text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists students_user_id_idx  on public.students (user_id);
create index if not exists students_name_idx     on public.students (name);
create index if not exists students_class_idx    on public.students (class_name);

grant select, insert, update, delete on public.students to authenticated;
grant all on public.students to service_role;

alter table public.students enable row level security;

create policy "students_select_own" on public.students
  for select to authenticated using (auth.uid() = user_id);
create policy "students_insert_own" on public.students
  for insert to authenticated with check (auth.uid() = user_id);
create policy "students_update_own" on public.students
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "students_delete_own" on public.students
  for delete to authenticated using (auth.uid() = user_id);

-- ============================================================================
-- 2) MUROJAAH (Sesi Muroja'ah / Review)
-- ============================================================================
create table if not exists public.murojaah (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  student_id    uuid not null references public.students(id) on delete cascade,
  session_date  date not null,
  surah_number  int,                 -- 1..114
  surah_name    text,
  ayah_from     int,
  ayah_to       int,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists murojaah_user_id_idx     on public.murojaah (user_id);
create index if not exists murojaah_student_id_idx  on public.murojaah (student_id);
create index if not exists murojaah_date_idx        on public.murojaah (session_date desc);

grant select, insert, update, delete on public.murojaah to authenticated;
grant all on public.murojaah to service_role;

alter table public.murojaah enable row level security;

create policy "murojaah_select_own" on public.murojaah
  for select to authenticated using (auth.uid() = user_id);
create policy "murojaah_insert_own" on public.murojaah
  for insert to authenticated with check (auth.uid() = user_id);
create policy "murojaah_update_own" on public.murojaah
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "murojaah_delete_own" on public.murojaah
  for delete to authenticated using (auth.uid() = user_id);

-- ============================================================================
-- 3) MEMORIZATION (Setoran Hafalan Baru)
-- ============================================================================
create table if not exists public.memorization (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  student_id    uuid not null references public.students(id) on delete cascade,
  session_date  date not null,
  surah_number  int,
  surah_name    text,
  ayah_from     int,
  ayah_to       int,
  total_verses  int,                 -- Total Ayat
  mistakes      int not null default 0,
  score         numeric(5,2),        -- Nilai (0..100)
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists memorization_user_id_idx     on public.memorization (user_id);
create index if not exists memorization_student_id_idx  on public.memorization (student_id);
create index if not exists memorization_date_idx        on public.memorization (session_date desc);

grant select, insert, update, delete on public.memorization to authenticated;
grant all on public.memorization to service_role;

alter table public.memorization enable row level security;

create policy "memorization_select_own" on public.memorization
  for select to authenticated using (auth.uid() = user_id);
create policy "memorization_insert_own" on public.memorization
  for insert to authenticated with check (auth.uid() = user_id);
create policy "memorization_update_own" on public.memorization
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memorization_delete_own" on public.memorization
  for delete to authenticated using (auth.uid() = user_id);

-- ============================================================================
-- 4) USER SETTINGS (konfigurasi per user — dark mode, tema, qari, dsb.)
-- ============================================================================
create table if not exists public.user_settings (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  dark_mode   boolean not null default false,
  theme       text    not null default 'theme-green',
  qari        text    not null default 'ar.alafasy',
  extra       jsonb   not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

grant select, insert, update, delete on public.user_settings to authenticated;
grant all on public.user_settings to service_role;

alter table public.user_settings enable row level security;

create policy "user_settings_select_own" on public.user_settings
  for select to authenticated using (auth.uid() = user_id);
create policy "user_settings_upsert_own" on public.user_settings
  for insert to authenticated with check (auth.uid() = user_id);
create policy "user_settings_update_own" on public.user_settings
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- 5) SURAHS CACHE (opsional — cache daftar 114 surah dari alquran.cloud)
--     Bisa dibaca semua orang (data publik Al-Qur'an). Tidak ada user_id.
-- ============================================================================
create table if not exists public.surahs (
  number          int primary key,   -- 1..114
  name            text not null,     -- Arabic
  english_name    text,
  english_translation text,
  revelation_type text,
  ayah_count      int,
  updated_at      timestamptz not null default now()
);

grant select on public.surahs to anon, authenticated;
grant all    on public.surahs to service_role;

alter table public.surahs enable row level security;

create policy "surahs_public_read" on public.surahs
  for select to anon, authenticated using (true);

-- ============================================================================
-- 6) TRIGGER: auto-update kolom updated_at
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_students_updated_at     on public.students;
drop trigger if exists trg_murojaah_updated_at     on public.murojaah;
drop trigger if exists trg_memorization_updated_at on public.memorization;
drop trigger if exists trg_user_settings_updated_at on public.user_settings;

create trigger trg_students_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

create trigger trg_murojaah_updated_at
  before update on public.murojaah
  for each row execute function public.set_updated_at();

create trigger trg_memorization_updated_at
  before update on public.memorization
  for each row execute function public.set_updated_at();

create trigger trg_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ============================================================================
-- CATATAN
-- ----------------------------------------------------------------------------
-- • Mode single-user (tanpa login): hapus kolom user_id + policy owner, lalu
--   ganti policy menjadi `using (true) with check (true)` untuk role anon.
--   Ini TIDAK direkomendasikan di production (data terbuka untuk semua).
-- • Untuk import data awal, gunakan Table Editor Supabase atau `\copy` psql.
-- ============================================================================
