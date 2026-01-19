-- ==========================================
-- UPDATE STRUKTUR DATABASE (SAFE TO RUN REPEATEDLY)
-- ==========================================

-- 1. UPDATE TABEL PROFILES (Tambah Kolom Custom)
alter table public.profiles add column if not exists wali_kelas text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists mengajar_mapel text; -- Tambahan Baru

-- 2. UPDATE TABEL SISWA (Tambah NIS & Kolom Baru)
alter table public.students add column if not exists nis text;
alter table public.students add column if not exists gender text; -- Baru (L/P)
alter table public.students add column if not exists jenjang text; -- Baru (7, 8, 9)

-- 3. BUAT TABEL JADWAL (SCHEDULES)
create table if not exists public.schedules (
  id uuid default gen_random_uuid() primary key,
  day_of_week int not null, -- 1=Senin, 2=Selasa, dst
  hour text not null, -- Jam ke-
  kelas text not null,
  subject text not null,
  teacher_id uuid references public.profiles(id), -- Opsional, bisa null jika guru belum terdaftar
  teacher_nip text, -- Menyimpan NIP guru untuk referensi saat import
  created_at timestamptz default now()
);

-- 4. BUAT TABEL GURU (Master Data Guru)
create table if not exists public.tabel_guru (
  id uuid default gen_random_uuid() primary key,
  nip text unique not null,
  nama_lengkap text not null,
  mapel text,
  wali_kelas text,
  created_at timestamptz default now()
);

-- SECURITY UNTUK TABEL BARU
alter table public.schedules enable row level security;
alter table public.tabel_guru enable row level security;

-- ==========================================
-- RESET & CREATE POLICIES (Agar tidak error 42710)
-- ==========================================

-- Policy Schedules
drop policy if exists "Read schedules" on public.schedules;
create policy "Read schedules" 
  on public.schedules for select to authenticated using (true);

drop policy if exists "Admin manage schedules" on public.schedules;
create policy "Admin manage schedules" 
  on public.schedules for all to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Policy Tabel Guru
drop policy if exists "Public read tabel_guru" on public.tabel_guru;
create policy "Public read tabel_guru" 
  on public.tabel_guru for select to authenticated, anon using (true);

drop policy if exists "Admin manage tabel_guru" on public.tabel_guru;
create policy "Admin manage tabel_guru" 
  on public.tabel_guru for all to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
  
-- Policy Profiles (PENTING: Agar Admin bisa update user lain)
-- FIX: Hapus policy lama jika ada sebelum membuat baru
drop policy if exists "Admin update all profiles" on public.profiles;
create policy "Admin update all profiles" 
  on public.profiles for update to authenticated 
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- INDEXING (Agar pencarian cepat)
create index if not exists idx_students_kelas on public.students(kelas);
create index if not exists idx_schedules_kelas on public.schedules(kelas);
create index if not exists idx_profiles_nip on public.profiles(nip);
create index if not exists idx_tabel_guru_nip on public.tabel_guru(nip);

-- UPDATE FUNCTION DASHBOARD (Opsional, menyesuaikan perubahan)
create or replace function get_public_dashboard_stats()
returns json
language plpgsql
security definer
as $$
declare
  count7 int;
  count8 int;
  count9 int;
  jp_completed int;
begin
  select count(*) into count7 from students where kelas like '7%';
  select count(*) into count8 from students where kelas like '8%';
  select count(*) into count9 from students where kelas like '9%';
  
  select coalesce(sum(array_length(string_to_array(hours, ','), 1)), 0) 
  into jp_completed 
  from journals 
  where date(created_at) = CURRENT_DATE;

  return json_build_object(
    'count7', count7,
    'count8', count8,
    'count9', count9,
    'totalJpRequired', 200, 
    'completedJp', jp_completed,
    'cleanestClass', '9A', 
    'unfilledKbm', json_build_array()
  );
end;
$$;

-- SETUP STORAGE
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar Public Read" on storage.objects;
create policy "Avatar Public Read"
on storage.objects for select
using ( bucket_id = 'avatars' );

drop policy if exists "Avatar User Upload" on storage.objects;
create policy "Avatar User Upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars' );

drop policy if exists "Avatar User Update" on storage.objects;
create policy "Avatar User Update"
on storage.objects for update
to authenticated
using ( bucket_id = 'avatars' );