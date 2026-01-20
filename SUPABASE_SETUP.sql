
-- ==========================================
-- SETUP DATABASE LENGKAP (SI KBM)
-- Jalankan script ini di SQL Editor Supabase
-- ==========================================

-- 1. TABEL PROFILES (Sinkronisasi dengan Auth Users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nip text unique,
  full_name text,
  role text default 'user' check (role in ('admin', 'user')),
  avatar_url text,
  mengajar_mapel text,
  wali_kelas text,
  created_at timestamptz default now()
);

-- Trigger untuk membuat profile otomatis saat user sign up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. TABEL SISWA
create table if not exists public.students (
  id uuid default gen_random_uuid() primary key,
  nisn text unique not null,
  nis text,
  name text not null,
  kelas text not null,
  gender text, -- L/P
  jenjang text, -- 7, 8, 9
  created_at timestamptz default now()
);

-- 3. TABEL JADWAL (SCHEDULES)
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

-- 4. TABEL JURNAL (JOURNALS)
create table if not exists public.journals (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references public.profiles(id),
  kelas text not null,
  subject text not null,
  hours text not null,
  material text,
  cleanliness text,
  validation text, -- hadir_kbm, izin_tugas, inval
  notes text,
  assessment_type text, -- harian, tugas, none
  assessment_missing_students text, -- JSON String
  created_at timestamptz default now()
);

-- 5. TABEL ATTENDANCE LOGS
create table if not exists public.attendance_logs (
  id uuid default gen_random_uuid() primary key,
  journal_id uuid references public.journals(id) on delete cascade,
  student_id uuid references public.students(id),
  student_name text,
  status text check (status in ('S', 'I', 'A', 'D')),
  teacher_name text,
  subject text,
  created_at timestamptz default now()
);

-- 6. TABEL GURU (DATA MASTER REFERENSI)
create table if not exists public.tabel_guru (
  id uuid default gen_random_uuid() primary key,
  nip text unique not null,
  nama_lengkap text not null,
  mapel text,
  wali_kelas text,
  created_at timestamptz default now()
);

-- 7. TABEL SETTINGS
create table if not exists public.app_settings (
  key text primary key,
  value text,
  description text
);

-- SEED SETTINGS DEFAULT
insert into public.app_settings (key, value, description)
values 
  ('academic_year', '2024/2025', 'Tahun Ajaran Aktif'),
  ('semester', 'Genap', 'Semester Aktif'),
  ('headmaster', 'Nama Kepala Sekolah', 'Kepala Sekolah'),
  ('non_effective_days', '[]', 'Hari Libur'),
  ('subjects_list', '["Matematika","Bahasa Indonesia","IPA","IPS","PKn","Bahasa Inggris","PJOK","Seni Budaya","Prakarya","PAI","PAK"]', 'Master Mapel')
on conflict (key) do nothing;

-- ==========================================
-- UPDATE STRUKTUR TABEL (MIGRATION FIX)
-- Bagian ini memaksa penambahan kolom jika belum ada
-- ==========================================

DO $$
BEGIN
    -- Tambahkan kolom assessment_type ke journals jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journals' AND column_name = 'assessment_type') THEN
        ALTER TABLE public.journals ADD COLUMN assessment_type text;
    END IF;

    -- Tambahkan kolom assessment_missing_students ke journals jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journals' AND column_name = 'assessment_missing_students') THEN
        ALTER TABLE public.journals ADD COLUMN assessment_missing_students text;
    END IF;
END $$;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.schedules enable row level security;
alter table public.journals enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.tabel_guru enable row level security;
alter table public.app_settings enable row level security;

-- PROFILES
drop policy if exists "Public read profiles" on public.profiles;
create policy "Public read profiles" on public.profiles for select to authenticated, anon using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

drop policy if exists "Admin update all profiles" on public.profiles;
create policy "Admin update all profiles" on public.profiles for update to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- STUDENTS
drop policy if exists "Read students" on public.students;
create policy "Read students" on public.students for select to authenticated, anon using (true);

drop policy if exists "Admin manage students" on public.students;
create policy "Admin manage students" on public.students for all to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- SCHEDULES
drop policy if exists "Read schedules" on public.schedules;
create policy "Read schedules" on public.schedules for select to authenticated, anon using (true);

drop policy if exists "Admin manage schedules" on public.schedules;
create policy "Admin manage schedules" on public.schedules for all to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- JOURNALS
drop policy if exists "Read journals" on public.journals;
create policy "Read journals" on public.journals for select to authenticated, anon using (true);

drop policy if exists "Teachers create journals" on public.journals;
create policy "Teachers create journals" on public.journals for insert to authenticated with check (auth.uid() = teacher_id);

drop policy if exists "Teachers update own journals" on public.journals;
create policy "Teachers update own journals" on public.journals for update to authenticated using (auth.uid() = teacher_id);

-- ATTENDANCE LOGS
drop policy if exists "Read attendance" on public.attendance_logs;
create policy "Read attendance" on public.attendance_logs for select to authenticated, anon using (true);

drop policy if exists "Teachers create attendance" on public.attendance_logs;
create policy "Teachers create attendance" on public.attendance_logs for insert to authenticated with check (true);

drop policy if exists "Teachers delete attendance" on public.attendance_logs;
create policy "Teachers delete attendance" on public.attendance_logs for delete to authenticated using (true);

-- TABEL GURU
drop policy if exists "Read tabel_guru" on public.tabel_guru;
create policy "Read tabel_guru" on public.tabel_guru for select to authenticated, anon using (true);

drop policy if exists "Admin manage tabel_guru" on public.tabel_guru;
create policy "Admin manage tabel_guru" on public.tabel_guru for all to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- APP SETTINGS
drop policy if exists "Read settings" on public.app_settings;
create policy "Read settings" on public.app_settings for select to authenticated, anon using (true);

drop policy if exists "Admin manage settings" on public.app_settings;
create policy "Admin manage settings" on public.app_settings for all to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- STORAGE POLICIES
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

drop policy if exists "Avatar Public Read" on storage.objects;
create policy "Avatar Public Read" on storage.objects for select using ( bucket_id = 'avatars' );

drop policy if exists "Avatar Upload" on storage.objects;
create policy "Avatar Upload" on storage.objects for insert with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- INDEXING (Performance)
create index if not exists idx_students_kelas on public.students(kelas);
create index if not exists idx_schedules_teacher on public.schedules(teacher_id);
create index if not exists idx_journals_teacher on public.journals(teacher_id);
create index if not exists idx_attendance_journal on public.attendance_logs(journal_id);
