
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { 
  User, Bell, Activity, BookOpen, Clock, Stethoscope, CheckCircle2, XCircle, FileText, ClipboardList, 
  CalendarDays, TrendingUp, Users, Edit2, Plus, X, Loader2, Save, Flag
} from 'lucide-react';
import { getWIBDate, getWIBISOString, formatDateIndo } from '../utils/dateUtils';
import { Student } from '../types';

interface MonthlyStats {
    totalJp: number;
    totalMeetings: number;
    classProgress: Record<string, number>;
}

interface WaliKelasAbsence {
    student_name: string;
    kelas: string;
    status: string;
    source: 'wali' | 'guru'; // To differentiate
    hours?: string; 
}

const Dashboard: React.FC = () => {
  const { isAdmin, profile } = useAuth();
  
  const [stats, setStats] = useState<MonthlyStats>({ totalJp: 0, totalMeetings: 0, classProgress: {} });
  const [homeroomAbsences, setHomeroomAbsences] = useState<WaliKelasAbsence[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter Date
  const [filterDate, setFilterDate] = useState(getWIBISOString());

  // MODAL STATE
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [modalStudents, setModalStudents] = useState<Student[]>([]);
  const [modalAttendance, setModalAttendance] = useState<Record<string, 'S' | 'I' | 'A' | 'D'>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    if (profile && !isAdmin) {
        fetchDashboardData();
    } else {
        setLoading(false);
    }
  }, [profile, filterDate]);

  const fetchDashboardData = async () => {
    try {
        const date = getWIBDate();
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        
        const startOfDay = `${filterDate}T00:00:00+07:00`;
        const endOfDay = `${filterDate}T23:59:59+07:00`;

        // 1. Fetch Journals Stats (Monthly)
        const { data: journals } = await supabase
            .from('journals')
            .select('hours, kelas')
            .eq('teacher_id', profile?.id)
            .gte('created_at', firstDayOfMonth);

        let jp = 0;
        let meetings = 0;
        const classMap: Record<string, number> = {};

        if (journals) {
            meetings = journals.length;
            journals.forEach(j => {
                const parts = j.hours.split(',').filter(h => h.trim().length > 0);
                jp += parts.length;
                classMap[j.kelas] = (classMap[j.kelas] || 0) + 1;
            });
        }
        setStats({ totalJp: jp, totalMeetings: meetings, classProgress: classMap });

        // 2. ABSENSI WALI KELAS LOGIC
        if (profile?.wali_kelas) {
            const { data: students } = await supabase.from('students').select('*').eq('kelas', profile.wali_kelas).order('name');
            
            if (students && students.length > 0) {
                const studentIds = students.map(s => s.id);

                // A. Cek Absensi Mutlak Wali Kelas (homeroom_attendance)
                const { data: homeroomLogs } = await supabase
                    .from('homeroom_attendance')
                    .select('student_id, status')
                    .eq('date', filterDate)
                    .in('student_id', studentIds);

                const homeroomMap: Record<string, string> = {};
                homeroomLogs?.forEach(log => {
                    homeroomMap[log.student_id] = log.status;
                });

                // B. Cek Absensi Guru Mapel (Sebagai fallback jika Wali Kelas belum input)
                const { data: teacherLogs } = await supabase
                    .from('attendance_logs')
                    .select(`student_id, status, journals (hours)`)
                    .in('student_id', studentIds)
                    .gte('created_at', startOfDay)
                    .lte('created_at', endOfDay)
                    .neq('status', 'D'); // Guru mapel biasanya tidak handle 'D', tapi kalau ada kita ignore dulu utk logic S/I/A

                // Proses Merging
                const finalAbsences: WaliKelasAbsence[] = [];

                students.forEach(student => {
                    let finalStatus = '';
                    let source: 'wali' | 'guru' = 'guru';
                    let hoursStr = '';

                    // 1. Prioritas Utama: Input Wali Kelas
                    if (homeroomMap[student.id]) {
                        finalStatus = homeroomMap[student.id];
                        source = 'wali';
                    } 
                    // 2. Fallback: Input Guru Mapel (Kalkulasi)
                    else {
                         // Cari semua log dari guru mapel untuk siswa ini
                         const myLogs = teacherLogs?.filter((l: any) => l.student_id === student.id) || [];
                         if (myLogs.length > 0) {
                             const statuses = new Set(myLogs.map((l:any) => l.status));
                             
                             // Logic: S > I > A
                             if (statuses.has('S')) finalStatus = 'S';
                             else if (statuses.has('I')) finalStatus = 'I';
                             else if (statuses.has('A')) finalStatus = 'A';
                             
                             // Collect hours
                             const hoursSet = new Set<number>();
                             myLogs.forEach((l: any) => {
                                 if(l.journals?.hours) {
                                     l.journals.hours.split(',').forEach((h: string) => {
                                        const val = parseInt(h.trim());
                                        if(!isNaN(val)) hoursSet.add(val);
                                     });
                                 }
                             });
                             hoursStr = Array.from(hoursSet).sort((a,b) => a-b).join(', ');
                         }
                    }

                    if (finalStatus) {
                        finalAbsences.push({
                            student_name: student.name,
                            kelas: profile.wali_kelas!,
                            status: finalStatus,
                            source: source,
                            hours: hoursStr || 'Full Day'
                        });
                    }
                });

                finalAbsences.sort((a, b) => a.student_name.localeCompare(b.student_name));
                setHomeroomAbsences(finalAbsences);
            }
        }

    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // --- MODAL LOGIC ---
  const handleOpenAbsenceModal = async () => {
      setSavingAttendance(true); // show loading state temporarily
      try {
          // 1. Load Students
          const { data: students } = await supabase.from('students').select('*').eq('kelas', profile?.wali_kelas).order('name');
          setModalStudents(students || []);

          // 2. Load Existing Homeroom Attendance
          const { data: existing } = await supabase
             .from('homeroom_attendance')
             .select('student_id, status')
             .eq('date', filterDate)
             .in('student_id', (students || []).map(s => s.id));
          
          const attMap: Record<string, 'S'|'I'|'A'|'D'> = {};
          existing?.forEach(log => {
              attMap[log.student_id] = log.status as any;
          });
          setModalAttendance(attMap);

          setShowAbsenceModal(true);
      } catch(e) { console.error(e); }
      finally { setSavingAttendance(false); }
  };

  const handleSaveHomeroomAttendance = async () => {
      if (!profile?.wali_kelas) return;
      setSavingAttendance(true);
      try {
          // 1. Delete existing for this date/class (to handle unchecks) - or upsert.
          // Better strategy: Delete all for this date+class, insert new ones.
          
          // Get IDs of students in this class to safeguard delete
          const studentIds = modalStudents.map(s => s.id);
          
          await supabase.from('homeroom_attendance')
            .delete()
            .eq('date', filterDate)
            .in('student_id', studentIds);

          // 2. Insert New
          const inserts = Object.entries(modalAttendance).map(([studentId, status]) => ({
              date: filterDate,
              kelas: profile.wali_kelas,
              student_id: studentId,
              status: status,
              created_by: profile.id
          }));

          if (inserts.length > 0) {
              const { error } = await supabase.from('homeroom_attendance').insert(inserts);
              if (error) throw error;
          }

          setShowAbsenceModal(false);
          fetchDashboardData(); // Refresh Dashboard

      } catch(e) { 
          alert("Gagal menyimpan absensi: " + e); 
      } finally { 
          setSavingAttendance(false); 
      }
  };

  const toggleModalStatus = (studentId: string, status: 'S'|'I'|'A'|'D') => {
      setModalAttendance(prev => {
          const next = { ...prev };
          if (next[studentId] === status) {
              delete next[studentId]; // Toggle OFF
          } else {
              next[studentId] = status; // Toggle ON (Overwrite others)
          }
          return next;
      });
  };

  // Helper to filter absences
  const filterAbsences = (status: string) => homeroomAbsences.filter(a => a.status === status);
  const listAlpa = filterAbsences('A');
  const listIzin = filterAbsences('I');
  const listSakit = filterAbsences('S');
  const listDispen = filterAbsences('D');

  // Reusable component for a list section
  const AbsenceSection = ({ title, list, colorClass, icon: Icon, onEdit }: any) => {
      if (list.length === 0) return null;
      return (
        <div className="flex flex-col gap-2 min-w-[200px] flex-1 animate-fade-in">
            <div className={`flex items-center gap-1.5 pb-1 border-b border-gray-100 mb-0.5 ${colorClass}`}>
                <Icon size={14} strokeWidth={2.5}/>
                <span className="text-[10px] font-extrabold uppercase tracking-wider">{title}</span>
                <div className="ml-auto flex items-center gap-1">
                     <span className="text-[9px] font-bold bg-white px-1.5 py-0.5 rounded-md border border-current opacity-80">{list.length}</span>
                     <button onClick={onEdit} className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500 transition-colors">
                        <Edit2 size={12} />
                     </button>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                {list.map((a: any, i: number) => (
                    <div key={i} className="flex justify-between items-center w-full text-[11px] leading-tight text-slate-700 font-medium group">
                        <span className="truncate pr-2">{a.student_name}</span>
                        {a.source === 'wali' && <span className="text-[9px] px-1 bg-purple-100 text-purple-600 rounded mr-1" title="Input Wali Kelas">W</span>}
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 group-hover:border-slate-200 transition-colors whitespace-nowrap">
                             {a.hours === 'Full Day' ? 'Seharian' : `Jam ${a.hours}`}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      );
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        
        {/* 1. UNIFIED HEADER */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
             {/* ... Header Content Same as Before ... */}
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                 <Clock size={200} className="-mr-10 -mt-10" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="flex-shrink-0">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white/20 shadow-inner overflow-hidden bg-white/10 flex items-center justify-center">
                            {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={32} className="text-white/80" />}
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-extrabold leading-tight tracking-tight">{profile?.full_name}</h1>
                        <p className="text-blue-100 text-sm font-mono opacity-90 mb-2">{isAdmin ? 'Administrator' : (profile?.nip || 'NIP -')}</p>
                        <div className="flex flex-wrap gap-2">
                            {!isAdmin && profile?.mengajar_mapel && <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider">{profile.mengajar_mapel}</span>}
                            {!isAdmin && profile?.wali_kelas && <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-orange-500/90 text-white border border-orange-400 text-[10px] font-bold uppercase tracking-wider shadow-sm">Wali Kelas {profile.wali_kelas}</span>}
                        </div>
                    </div>
                </div>
                {!isAdmin && (
                    <div className="flex items-center gap-4 md:gap-8 overflow-x-auto pb-1 md:pb-0">
                        <div className="flex items-center gap-3 min-w-max">
                            <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm border border-white/10"><Activity size={24} className="text-blue-200"/></div>
                            <div><span className="block text-2xl font-extrabold leading-none">{stats.totalMeetings}</span><span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Pertemuan</span></div>
                        </div>
                        <div className="w-px h-8 bg-white/20"></div>
                        <div className="flex items-center gap-3 min-w-max">
                            <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm border border-white/10"><Clock size={24} className="text-blue-200"/></div>
                            <div><span className="block text-2xl font-extrabold leading-none">{stats.totalJp}</span><span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Total JP</span></div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* 2. MAIN WIDGETS */}
        {!isAdmin && (
            <div className="flex flex-col gap-6">
                
                {/* WALI KELAS ABSENCE WIDGET */}
                {profile?.wali_kelas && (
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
                        <div className="absolute -top-6 -right-6 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity rotate-12"><ClipboardList size={140} className="text-slate-800" /></div>

                        <div className="flex flex-col md:flex-row gap-4 md:gap-8 relative z-10">
                            {/* Header Section (Left) */}
                            <div className="flex flex-row md:flex-col items-center md:items-start gap-4 flex-shrink-0 md:min-w-[180px] md:border-r md:border-slate-100 md:pr-4 pt-2 md:pt-0">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-sm border transition-colors ${homeroomAbsences.length > 0 ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                     {homeroomAbsences.length > 0 ? <Bell size={20} className="animate-pulse" /> : <CheckCircle2 size={22} />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide leading-relaxed">Rekap Absensi <br className="hidden md:block"/>Kelas {profile.wali_kelas}</h3>
                                    <p className={`text-[10px] font-bold mt-1 leading-tight ${homeroomAbsences.length > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                        {homeroomAbsences.length > 0 ? `${homeroomAbsences.length} Murid Absen` : 'Semua Hadir'}
                                    </p>
                                    
                                    <button 
                                        onClick={handleOpenAbsenceModal}
                                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-200 transition-all active:scale-95"
                                    >
                                        <Plus size={12}/> Input Absensi (sebagai Wali Kelas)
                                    </button>
                                </div>
                            </div>

                            {/* Content Section (Right) */}
                            <div className="flex-1 min-w-0 flex flex-col gap-4">
                                {/* NEW DATE FILTER PLACEMENT: Row Layout */}
                                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <CalendarDays size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-wide">Tanggal Rekap</span>
                                    </div>
                                    <input 
                                        type="date" 
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    />
                                </div>

                                {homeroomAbsences.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-slate-400 text-xs font-medium italic bg-slate-50/50 rounded-xl px-4 py-8 border border-slate-100 border-dashed">
                                        <CheckCircle2 size={14} className="mr-2"/> Tidak ada laporan ketidakhadiran murid pada tanggal ini.
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-x-8 gap-y-6">
                                        <AbsenceSection title="ALPA" list={listAlpa} colorClass="text-red-600" icon={XCircle} onEdit={handleOpenAbsenceModal} />
                                        <AbsenceSection title="IZIN" list={listIzin} colorClass="text-blue-600" icon={FileText} onEdit={handleOpenAbsenceModal} />
                                        <AbsenceSection title="SAKIT" list={listSakit} colorClass="text-yellow-600" icon={Stethoscope} onEdit={handleOpenAbsenceModal} />
                                        <AbsenceSection title="DISPEN" list={listDispen} colorClass="text-purple-600" icon={Flag} onEdit={handleOpenAbsenceModal} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Class Progress Widget (Existing) */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-6 p-4 opacity-5 pointer-events-none rotate-12"><BookOpen size={180} className="text-slate-900" /></div>
                    <h3 className="relative z-10 text-xs font-bold text-gray-500 uppercase mb-6 flex items-center gap-2 tracking-wide"><TrendingUp size={16} className="text-blue-500"/> Distribusi Pertemuan Kelas (Bulanan)</h3>
                    <div className="relative z-10 space-y-3">
                        {Object.keys(stats.classProgress).length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-400 font-medium italic bg-slate-50 rounded-2xl border border-slate-100 border-dashed">Belum ada data mengajar bulan ini.</div>
                        ) : (
                            Object.entries(stats.classProgress).sort().map(([kelas, count]) => (
                                <div key={kelas} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors group relative overflow-hidden">
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shadow-sm border border-blue-200">{kelas}</div>
                                        <div><h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">Kelas {kelas}</h4><p className="text-xs text-slate-400 font-medium flex items-center gap-1"><Users size={10} /> Data KBM</p></div>
                                    </div>
                                    <div className="text-right relative z-10">
                                        <span className="block text-2xl font-extrabold text-slate-800 leading-none group-hover:text-blue-600 transition-colors">{count}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pertemuan</span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 h-1 bg-blue-500/10 w-full"><div className="h-full bg-blue-500/30" style={{ width: `${Math.min(Number(count) * 10, 100)}%` }}></div></div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL INPUT ABSENSI WALI KELAS --- */}
        {showAbsenceModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                    
                    {/* Modal Header */}
                    <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-lg">Daftar Murid ({modalStudents.length})</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Absensi Mutlak - {formatDateIndo(filterDate)}</p>
                        </div>
                        <button 
                            onClick={() => { setModalAttendance({}); setShowAbsenceModal(false); }} 
                            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Modal Content (Table List) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                         <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-end">
                              <button 
                                onClick={() => setModalAttendance({})}
                                className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                  Default: Hadir Semua
                              </button>
                         </div>

                         <div className="divide-y divide-slate-100">
                             {/* Table Header */}
                             <div className="flex items-center px-6 py-2 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                                 <div className="flex-1">Nama</div>
                                 <div className="flex gap-4">
                                     <span className="w-6 text-center">S</span>
                                     <span className="w-6 text-center">I</span>
                                     <span className="w-6 text-center">A</span>
                                     <span className="w-6 text-center">D</span>
                                 </div>
                             </div>

                             {/* Rows */}
                             {modalStudents.map(student => (
                                 <div key={student.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors group">
                                     <div className="flex-1 pr-4">
                                         <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{student.name}</p>
                                     </div>
                                     <div className="flex gap-4">
                                         {['S', 'I', 'A', 'D'].map(status => (
                                             <button 
                                                key={status}
                                                onClick={() => toggleModalStatus(student.id, status as any)}
                                                className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${
                                                    modalAttendance[student.id] === status
                                                    ? 'bg-slate-800 border-slate-800 text-white' // Hitam/Gelap saat terpilih sesuai skrinsut
                                                    : 'border-slate-200 bg-white text-transparent hover:border-slate-300'
                                                }`}
                                             >
                                                 {/* Kotak saja, jika selected jadi solid */}
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 border-t border-slate-100 bg-white">
                        <button 
                            onClick={handleSaveHomeroomAttendance}
                            disabled={savingAttendance}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all"
                        >
                            {savingAttendance ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />} 
                            Simpan Data Absensi
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </Layout>
  );
};

export default Dashboard;
