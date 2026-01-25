
export interface Profile {
  id: string;
  nip: string;
  full_name: string;
  role: 'admin' | 'user' | 'operator';
  mengajar_mapel?: string;
  wali_kelas?: string;
  avatar_url?: string;
  password_info?: string; // Kolom untuk menyimpan password (admin only)
}

export interface TeacherData {
  id: string;
  nip: string;
  nama_lengkap: string;
  mapel?: string;
  wali_kelas?: string;
}

export interface Student {
  id: string;
  nisn: string;
  nis?: string;
  name: string;
  kelas: string;
  gender?: 'L' | 'P';
  jenjang?: string;
}

export interface Schedule {
  id: string;
  day_of_week: number; // 1=Senin, etc.
  hour: string;
  kelas: string;
  subject: string;
  teacher_nip?: string;
  teacher_id?: string;
}

export interface Journal {
  id: string;
  created_at: string;
  teacher_id: string;
  kelas: string;
  subject: string;
  hours: string; // "1, 2"
  material: string;
  cleanliness: 'mengarahkan_piket' | 'sudah_bersih';
  validation: 'izin_tugas' | 'hadir_kbm' | 'inval';
  inval_teacher_name?: string;
  notes?: string; // New: Catatan KBM
  teacher?: Profile;
}

export interface AttendanceRecord {
  id: string;
  journal_id: string;
  student_name: string;
  status: 'S' | 'I' | 'A' | 'D';
  teacher_name?: string; // New
  subject?: string; // New
}

export interface PublicStats {
  count7: number;
  count8: number;
  count9: number;
  classDetails: Record<string, number>; // New: {'7A': 32, '7B': 30}
  totalJpRequired: number;
  completedJp: number;
  absenceCount: number; // Total S+I+A hari ini
  absenceDetails: { S: number; I: number; A: number }; // Rincian Global
  absencePerClass: Record<string, number>; // New: {'7A': 1, '7B': 0} (Jumlah yg tidak hadir)
  unfilledKbm: { guru: string; kelas: string; jam: string }[];
}

export interface AppSetting {
  key: string;
  value: string;
  description?: string;
}

export interface NonEffectiveDay {
  date: string;
  reason: string;
  hours: string; // "Full Day" or "1-4"
}
