export interface Profile {
  id: string;
  nip: string;
  full_name: string;
  role: 'admin' | 'user';
  mengajar_mapel?: string;
  wali_kelas?: string;
  avatar_url?: string;
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
  teacher?: Profile;
}

export interface AttendanceRecord {
  id: string;
  journal_id: string;
  student_name: string;
  status: 'S' | 'I' | 'A' | 'D';
}

export interface PublicStats {
  count7: number;
  count8: number;
  count9: number;
  totalJpRequired: number;
  completedJp: number;
  cleanestClass: string;
  unfilledKbm: { guru: string; kelas: string; jam: string }[];
}