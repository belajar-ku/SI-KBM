
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

-- 5. TABEL ATTENDANCE LOGS (INPUT DARI GURU MAPEL)
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

-- 6. TABEL JOURNAL NOTES (UNTUK CATATAN MURID)
create table if not exists public.journal_notes (
  id uuid default gen_random_uuid() primary key,
  journal_id uuid references public.journals(id) on delete cascade, 
  student_id uuid references public.students(id),
  student_name text,
  type text check (type in ('kedisiplinan', 'keaktifan')),
  category text, -- e.g. "Terlambat", "Bertanya"
  note text,
  follow_up text, -- NEW: Jenis Tindak Lanjut
  created_at timestamptz default now()
);
alter table public.journal_notes alter column journal_id drop not null;

-- 7. TABEL HOMEROOM ATTENDANCE (ABSENSI HARIAN WALI KELAS - MUTLAK)
create table if not exists public.homeroom_attendance (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  kelas text not null,
  student_id uuid references public.students(id),
  status text check (status in ('S', 'I', 'A', 'D')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  unique(date, student_id) -- Satu siswa hanya punya satu status per hari dari wali kelas
);

-- 8. TABEL GURU (DATA MASTER REFERENSI)
create table if not exists public.tabel_guru (
  id uuid default gen_random_uuid() primary key,
  nip text unique not null,
  nama_lengkap text not null,
  mapel text,
  wali_kelas text,
  created_at timestamptz default now()
);

-- 9. TABEL SETTINGS
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
  ('subjects_list', '["Matematika","Bahasa Indonesia","IPA","IPS","PKn","Bahasa Inggris","PJOK","Seni Budaya","Prakarya","PAI","PAK"]', 'Master Mapel'),
  ('discipline_types', '["Terlambat Masuk","Tidur di Kelas","Tidak Membawa Buku","Mengganggu Teman","Bermain HP","Seragam Tidak Lengkap"]', 'Master Jenis Kedisiplinan'),
  ('follow_up_types', '["Teguran Lisan","Teguran Tertulis","Pindah Tempat Duduk","Konfiskasi HP","Lapor Wali Kelas","Lapor BK"]', 'Master Jenis Tindak Lanjut'),
  ('activity_types', '["Bertanya","Menjawab Pertanyaan","Mengerjakan di Depan","Presentasi","Membantu Teman"]', 'Master Jenis Keaktifan')
on conflict (key) do nothing;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================

-- Enable RLS (Aman dijalankan berulang)
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.schedules enable row level security;
alter table public.journals enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.journal_notes enable row level security;
alter table public.homeroom_attendance enable row level security;
alter table public.tabel_guru enable row level security;
alter table public.app_settings enable row level security;

-- PROFILES
drop policy if exists "Public read profiles" on public.profiles;
create policy "Public read profiles" on public.profiles for select to authenticated, anon using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

-- STUDENTS
drop policy if exists "Read students" on public.students;
create policy "Read students" on public.students for select to authenticated, anon using (true);

-- SCHEDULES
drop policy if exists "Read schedules" on public.schedules;
create policy "Read schedules" on public.schedules for select to authenticated, anon using (true);

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

-- JOURNAL NOTES
drop policy if exists "Read journal notes" on public.journal_notes;
create policy "Read journal notes" on public.journal_notes for select to authenticated, anon using (true);

drop policy if exists "Teachers manage journal notes" on public.journal_notes;
create policy "Teachers manage journal notes" on public.journal_notes for all to authenticated using (true);

-- HOMEROOM ATTENDANCE
drop policy if exists "Read homeroom_attendance" on public.homeroom_attendance;
create policy "Read homeroom_attendance" on public.homeroom_attendance for select to authenticated, anon using (true);

drop policy if exists "Wali Kelas manage homeroom_attendance" on public.homeroom_attendance;
create policy "Wali Kelas manage homeroom_attendance" on public.homeroom_attendance for all to authenticated using (true);

-- TABEL GURU & SETTINGS
drop policy if exists "Read tabel_guru" on public.tabel_guru;
create policy "Read tabel_guru" on public.tabel_guru for select to authenticated, anon using (true);

drop policy if exists "Read settings" on public.app_settings;
create policy "Read settings" on public.app_settings for select to authenticated, anon using (true);

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

drop policy if exists "Avatar Public Read" on storage.objects;
create policy "Avatar Public Read" on storage.objects for select using ( bucket_id = 'avatars' );

drop policy if exists "Avatar Upload" on storage.objects;
create policy "Avatar Upload" on storage.objects for insert with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );
