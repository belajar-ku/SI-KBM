-- ==========================================
-- UPDATE STRUKTUR DATABASE (SAFE TO RUN REPEATEDLY)
-- ==========================================

-- 1. UPDATE TABEL PROFILES (Tambah Kolom Custom)
alter table public.profiles add column if not exists wali_kelas text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists mengajar_mapel text; 

-- 2. UPDATE TABEL SISWA (Tambah NIS & Kolom Baru)
alter table public.students add column if not exists nis text;
alter table public.students add column if not exists gender text;
alter table public.students add column if not exists jenjang text;

-- 3. BUAT TABEL JADWAL (SCHEDULES)
create table if not exists public.schedules (
  id uuid default gen_random_uuid() primary key,
  day_of_week int not null,
  hour text not null,
  kelas text not null,
  subject text not null,
  teacher_id uuid references public.profiles(id),
  teacher_nip text,
  created_at timestamptz default now()
);

-- 4. BUAT TABEL GURU
create table if not exists public.tabel_guru (
  id uuid default gen_random_uuid() primary key,
  nip text unique not null,
  nama_lengkap text not null,
  mapel text,
  wali_kelas text,
  created_at timestamptz default now()
);

-- 5. BUAT TABEL ATTENDANCE LOGS
create table if not exists public.attendance_logs (
  id uuid default gen_random_uuid() primary key,
  journal_id uuid references public.journals(id) on delete cascade,
  student_id uuid references public.students(id),
  student_name text,
  status text check (status in ('S', 'I', 'A', 'D')),
  teacher_name text, -- New Column
  subject text, -- New Column
  created_at timestamptz default now()
);

-- CRITICAL FIX: Pastikan kolom baru ada jika tabel sudah dibuat sebelumnya
alter table public.attendance_logs add column if not exists teacher_name text;
alter table public.attendance_logs add column if not exists subject text;

-- 6. BUAT TABEL SETTINGS (NEW)
create table if not exists public.app_settings (
  key text primary key,
  value text,
  description text
);

-- 7. UPDATE TABEL JOURNALS (Tambah Kolom Notes)
alter table public.journals add column if not exists notes text;

-- Seed Default Settings jika belum ada
insert into public.app_settings (key, value, description)
values 
  ('academic_year', '2024/2025', 'Tahun Ajaran Aktif'),
  ('semester', 'Genap', 'Semester Aktif'),
  ('headmaster', 'Kepala Sekolah, M.Pd', 'Nama Kepala Sekolah'),
  ('non_effective_days', '[]', 'JSON Array Hari Libur/Non Efektif')
on conflict (key) do nothing;


-- SECURITY
alter table public.schedules enable row level security;
alter table public.tabel_guru enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.app_settings enable row level security;

-- ==========================================
-- RESET & CREATE POLICIES
-- ==========================================

-- Policy Schedules
drop policy if exists "Read schedules" on public.schedules;
create policy "Read schedules" on public.schedules for select to authenticated using (true);

drop policy if exists "Admin manage schedules" on public.schedules;
create policy "Admin manage schedules" on public.schedules for all to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Policy Tabel Guru
drop policy if exists "Public read tabel_guru" on public.tabel_guru;
create policy "Public read tabel_guru" on public.tabel_guru for select to authenticated, anon using (true);

drop policy if exists "Admin manage tabel_guru" on public.tabel_guru;
create policy "Admin manage tabel_guru" on public.tabel_guru for all to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
  
-- Policy Profiles
drop policy if exists "Admin update all profiles" on public.profiles;
create policy "Admin update all profiles" on public.profiles for update to authenticated 
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Policy Students (Agar Admin bisa CRUD Murid)
drop policy if exists "Read students" on public.students;
create policy "Read students" on public.students for select to authenticated, anon using (true);

drop policy if exists "Admin manage students" on public.students;
create policy "Admin manage students" on public.students for all to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Policy Attendance Logs
drop policy if exists "Public read attendance" on public.attendance_logs;
create policy "Public read attendance" on public.attendance_logs for select to authenticated, anon using (true);

drop policy if exists "Teacher create attendance" on public.attendance_logs;
create policy "Teacher create attendance" on public.attendance_logs for insert to authenticated with check (true);

-- Policy App Settings
drop policy if exists "Read settings" on public.app_settings;
create policy "Read settings" on public.app_settings for select to authenticated, anon using (true);

drop policy if exists "Admin manage settings" on public.app_settings;
create policy "Admin manage settings" on public.app_settings for all to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
  
-- INDEXING
create index if not exists idx_students_kelas on public.students(kelas);
create index if not exists idx_schedules_kelas on public.schedules(kelas);
create index if not exists idx_profiles_nip on public.profiles(nip);
create index if not exists idx_attendance_created on public.attendance_logs(created_at);

-- SETUP STORAGE
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;