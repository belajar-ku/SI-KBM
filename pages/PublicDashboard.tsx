
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { PublicStats } from '../types';
import { LogIn, Loader2, BookOpen, AlertCircle, X, School, ChevronDown, ChevronRight, Bookmark, Lock, User, ArrowRight, ShieldCheck, GraduationCap, MonitorPlay, Shield, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { getWIBDate, getWIBISOString, formatDateIndo, formatTimeIndo } from '../utils/dateUtils';

const PublicDashboard: React.FC = () => {
  const { academicYear, semester , semesterStart, semesterEnd } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginViewMode, setLoginViewMode] = useState<'selection' | 'form'>('selection');
  const [selectedRoleLabel, setSelectedRoleLabel] = useState('');
  const [userId, setUserId] = useState(() => localStorage.getItem('saved_nip') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();

  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(getWIBDate());
  
  const [rawAttendance, setRawAttendance] = useState<any[]>([]);
  const [studentClassMap, setStudentClassMap] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    type: 'class' | 'absence';
    data: any;
  } | null>(null);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(getWIBDate()), 1000);
    fetchData();

    if (isSupabaseConfigured) {
        const channel = supabase
            .channel('public-dashboard-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => { fetchStatsClientSide(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'journals' }, () => { fetchStatsClientSide(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'homeroom_attendance' }, () => { fetchStatsClientSide(); })
            .subscribe();
        return () => { clearInterval(timer); supabase.removeChannel(channel); };
    }
    return () => clearInterval(timer);
  }, [academicYear, semester, semesterStart, semesterEnd]);

  const fetchData = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) { useMockData(); setLoading(false); return; }
    await fetchStatsClientSide();
    setLoading(false);
  };

  const useMockData = () => { 
      setStats({
          count7: 0, count8: 0, count9: 0,
          classDetails: {},
          totalJpRequired: 100, completedJp: 0,
          absenceCount: 0, absenceDetails: {S:0, I:0, A:0},
          absencePerClass: {}, unfilledKbm: []
      });
  };

  const fetchStatsClientSide = async () => {
    const todayStr = getWIBISOString();
    const startOfDay = `${todayStr}T00:00:00+07:00`;

    
    const todayObj = new Date(todayStr);
    const jsDay = todayObj.getDay();
    let jpPerClass = 0;
    if (jsDay === 1) jpPerClass = 7;
    else if (jsDay >= 2 && jsDay <= 4) jpPerClass = 8;
    else if (jsDay === 5) jpPerClass = 5;
    else if (jsDay === 6) jpPerClass = 6;
    
    const calculatedTotalJp = jpPerClass * 24;

    try {
        const [studentsRes, journalsRes, attendanceRes, homeroomRes] = await Promise.all([
            supabase.from('students').select('id, kelas').eq('academic_year', academicYear || '2025/2026').then(async (res) => {
                  if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year'))) {
                      return supabase.from('students').select('id, kelas').eq('academic_year', academicYear || '2025/2026');
                  }
                  return res;
              }),
            supabase.from('journals').select('hours').eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').gte('created_at', semesterStart ? `${semesterStart}T00:00:00+07:00` : '2000-01-01T00:00:00+07:00').lte('created_at', semesterEnd ? `${semesterEnd}T23:59:59+07:00` : '2100-01-01T23:59:59+07:00').gte('created_at', startOfDay),
            supabase.from('attendance_logs').select('student_id, student_name, status, created_at, subject').eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').gte('created_at', semesterStart ? `${semesterStart}T00:00:00+07:00` : '2000-01-01T00:00:00+07:00').lte('created_at', semesterEnd ? `${semesterEnd}T23:59:59+07:00` : '2100-01-01T23:59:59+07:00').gte('created_at', startOfDay),
            supabase.from('homeroom_attendance').select('student_id, status, kelas').eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').gte('date', semesterStart ? `${semesterStart}` : '2000-01-01').lte('date', semesterEnd ? `${semesterEnd}` : '2100-01-01').eq('date', todayStr)
        ]);

        const classCounts: Record<string, number> = {};
        const sClassMap: Record<string, string> = {}; 
        let c7 = 0, c8 = 0, c9 = 0;
        
        if (studentsRes.data) {
            studentsRes.data.forEach((s: any) => {
                const rawKelas = s.kelas ? s.kelas.toUpperCase().trim() : '';
                sClassMap[s.id] = rawKelas;
                if (rawKelas) {
                    classCounts[rawKelas] = (classCounts[rawKelas] || 0) + 1;
                    if (rawKelas.startsWith('7')) c7++; else if (rawKelas.startsWith('8')) c8++; else if (rawKelas.startsWith('9')) c9++;
                }
            });
        }
        setStudentClassMap(sClassMap);

        let completedJp = 0;
        if (journalsRes.data) {
            journalsRes.data.forEach((j: any) => {
                if (typeof j.hours === 'string') {
                    const parts = j.hours.split(',').filter((h: string) => h.trim().length > 0);
                    completedJp += parts.length;
                }
            });
        }

        // --- MERGE ATTENDANCE LOGIC (Homeroom Priority) ---
        const combinedAttendance: Record<string, {name: string, status: string, source: 'Wali' | 'Guru'}> = {};

        // 1. Homeroom Attendance (Absensi Wali Kelas - Mutlak)
        if (homeroomRes.data) {
            homeroomRes.data.forEach((h: any) => {
                if (['S', 'I', 'A'].includes(h.status)) {
                    // We need name, but homeroom_attendance might not have it joined. 
                    // However, we have student ID. We can map it if needed, or rely on logic below.
                    combinedAttendance[h.student_id] = { 
                        name: 'Loading...', // Name might be missing here if not joined, but handled in detail list
                        status: h.status, 
                        source: 'Wali' 
                    };
                }
            });
        }

        // 2. Teacher Logs ( Guru Mapel) - Only if not already set by Homeroom
        // FILTER: Exclude Salat Dhuha
        const validTeacherLogs = (attendanceRes.data || []).filter((log: any) => {
            const subject = log.subject ? log.subject.toLowerCase() : '';
            return !subject.includes('dhuha');
        });

        validTeacherLogs.forEach((log: any) => {
            if (!combinedAttendance[log.student_id]) {
                if (['S', 'I', 'A'].includes(log.status)) {
                    combinedAttendance[log.student_id] = { 
                        name: log.student_name, 
                        status: log.status, 
                        source: 'Guru' 
                    };
                }
            }
        });

        // Convert back to Array for processing
        const finalAttendanceList = Object.entries(combinedAttendance).map(([id, val]) => ({
            student_id: id,
            ...val
        }));

        setRawAttendance(finalAttendanceList);

        let sCount = 0, iCount = 0, aCount = 0;
        const absencePerClass: Record<string, number> = {};
        Object.keys(classCounts).forEach(cls => absencePerClass[cls] = 0);

        finalAttendanceList.forEach((log) => {
            if (log.status === 'S') sCount++;
            else if (log.status === 'I') iCount++;
            else if (log.status === 'A') aCount++;
            
            const cls = sClassMap[log.student_id];
            if (cls) absencePerClass[cls] = (absencePerClass[cls] || 0) + 1;
        });

        setStats({
            count7: c7, count8: c8, count9: c9,
            classDetails: classCounts,
            totalJpRequired: calculatedTotalJp, 
            completedJp: completedJp,
            absenceCount: sCount + iCount + aCount,
            absenceDetails: { S: sCount, I: iCount, A: aCount },
            absencePerClass: absencePerClass,
            unfilledKbm: []
        });
    } catch (err) { console.error(err); }
  };

  
  const handleRoleSelect = (role: 'guru' | 'operator' | 'admin') => {
      if (role === 'operator') {
          navigate('/operator-dashboard');
      } else {
          setSelectedRoleLabel(role === 'admin' ? 'Administrator' : 'Guru / Staf');
          setLoginViewMode('form');
      }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      const { error } = await signIn(userId, password);
      if (error) {
        if (error.message === 'Failed to fetch') {
           setLoginError('Gagal terhubung ke Database.');
        } else if (error.message.includes('Invalid login')) {
           setLoginError('NIP atau Password salah.');
        } else {
           setLoginError(error.message);
        }
      } else {
        localStorage.setItem('saved_nip', userId);
        navigate('/dashboard', { state: { justLoggedIn: true } });
      }
    } catch (err) {
      setLoginError('Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClassClick = (grade: string) => {
      if (!stats) return;
      const details = Object.entries(stats.classDetails).filter(([cls]) => cls.startsWith(grade)).sort(); 
      setModalContent({ title: `Rincian Murid Kelas ${grade}`, type: 'class', data: details });
      setModalOpen(true);
  };

  const handleAbsenceClick = () => {
      if (!stats) return;
      setExpandedClass(null);
      setModalContent({ title: 'Rincian Ketidakhadiran Hari Ini', type: 'absence', data: stats });
      setModalOpen(true);
  };

  const getAbsentStudentsForClass = (cls: string) => {
      // Find students in rawAttendance that belong to this class
      // Note: rawAttendance now contains merged data
      const absentStudents = rawAttendance.filter(log => studentClassMap[log.student_id] === cls);
      
      // Need to fetch real names if missing from Homeroom source
      // In a real app, I'd pre-fetch names map. For now, rely on teacher logs or generic.
      return absentStudents.map(s => ({
          name: s.name === 'Loading...' ? 'Siswa (Data Wali)' : s.name, 
          status: s.status,
          source: s.source
      }));
  };

  const ClassCard = ({ label, count, colorClass, iconColorClass, onClick }: any) => (
      <button 
        onClick={onClick}
        className="app-card p-5 flex flex-col items-center justify-center text-center transition-transform active:scale-95 h-36"
      >
          <div className={`mb-2 text-3xl ${iconColorClass}`}>
              <School size={32} strokeWidth={1.5} />
          </div>
          <h2 className={`text-4xl font-extrabold ${colorClass} mb-1 tracking-tight`}>{count}</h2>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      </button>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] font-sans bg-[#F0F4F8] dark:bg-slate-900 transition-colors duration-300">
      <main className="w-full max-w-md space-y-4 my-auto">
        
        {/* HEADER CARD */}
        <div className="app-card p-5 flex items-center justify-between bg-white dark:bg-slate-800">
             <div className="flex items-center gap-3">
                 <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="h-14 w-auto object-contain" />
                 <div>
                    <h1 className="text-md font-extrabold text-slate-800 dark:text-white leading-tight">UPT SMP NEGERI 1 <br/> PASURUAN</h1>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">Sistem Informasi Kegiatan <br/> Belajar Mengajar (SI KBM)</p>
                 </div>
             </div>
             <div className="text-right">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">{formatDateIndo(time)}</p>
                <p className="text-2xl font-bold text-blue-500 dark:text-blue-400 font-mono tracking-tight leading-none">{formatTimeIndo(time)} <span className="text-xs font-bold">WIB</span></p>
             </div>
        </div>

        {loading ? (
            <div className="app-card p-10 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800">
                <Loader2 className="animate-spin mb-3 text-blue-500" size={32} />
                <p className="text-xs font-bold">Memuat Data...</p>
            </div> 
        ) : stats ? (
          <>
            {/* ROW 1 */}
            <div className="flex justify-center mb-4">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-6 py-2 rounded-full shadow-sm text-sm font-bold text-slate-700 dark:text-slate-300">
                    Tahun Ajaran: {academicYear} | Semester: {semester}
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
               <ClassCard label="Kelas 7" count={stats.count7} colorClass="text-blue-600 dark:text-blue-400" iconColorClass="text-blue-400 dark:text-blue-500" onClick={() => handleClassClick('7')} />
               <ClassCard label="Kelas 8" count={stats.count8} colorClass="text-emerald-500 dark:text-emerald-400" iconColorClass="text-emerald-400 dark:text-emerald-500" onClick={() => handleClassClick('8')} />
               <ClassCard label="Kelas 9" count={stats.count9} colorClass="text-red-500 dark:text-red-400" iconColorClass="text-red-400 dark:text-red-500" onClick={() => handleClassClick('9')} />
            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-2 gap-3">
                <div className="app-card p-6 flex flex-col items-center justify-center text-center h-44 bg-white dark:bg-slate-800">
                     <div className="mb-3 text-purple-500 dark:text-purple-400">
                        <BookOpen size={40} strokeWidth={1.5} />
                     </div>
                     <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-4xl font-extrabold text-purple-600 dark:text-purple-400">{stats.completedJp}</span>
                        <span className="text-lg font-bold text-gray-400 dark:text-gray-500">/ {stats.totalJpRequired} JP</span>
                     </div>
                     <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mt-1">KBM Terlaksana</p>
                </div>

                <button 
                    onClick={handleAbsenceClick}
                    className="app-card p-6 flex flex-col items-center justify-center text-center h-44 transition-transform active:scale-95 bg-white dark:bg-slate-800 group"
                >
                     <div className="mb-3 text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform">
                        <AlertCircle size={40} strokeWidth={1.5} />
                     </div>
                     <span className="text-4xl font-extrabold text-orange-500 dark:text-orange-400 mb-1">{stats.absenceCount}</span>
                     <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mt-1 leading-tight">Ketidakhadiran <br/> Murid</p>
                </button>
            </div>

            {/* PROGRESS BAR */}
            <div className="app-card p-6 bg-white dark:bg-slate-800">
                <h3 className="font-bold text-gray-600 dark:text-gray-300 text-xs uppercase mb-3 text-center">Progress KBM Hari Ini</h3>
                <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-4 mb-2 overflow-hidden shadow-inner">
                    <div 
                      className="bg-blue-500 h-4 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.min((stats.completedJp / stats.totalJpRequired) * 100, 100)}%` }}
                    ></div>
                </div>
                <div className="text-left">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                        {((stats.completedJp / stats.totalJpRequired) * 100).toFixed(1)}% Terlaksana
                    </span>
                </div>
            </div>

            {/* LOGIN */}
            <div className="pt-2">
                <div className="relative p-[3px] rounded-2xl overflow-hidden group">
                    <div className="absolute inset-[-100%] z-0 animate-[spin_4s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, transparent 0 340deg, #f59e0b 360deg)' }}></div>
                    <button 
                        onClick={() => setShowLoginModal(true)} 
                        className="relative z-10 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-[14px] flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none active:translate-y-0.5 transition-all"
                    >
                        <span className="relative overflow-hidden inline-flex items-center justify-center gap-2 group-hover:scale-105 transition-transform"><span className="absolute inset-0 z-20 w-[50%] h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-[200%] animate-[shimmer_2s_infinite]"></span><LogIn size={24} className="relative z-10" /> <span className="relative z-10">Login Sebagai</span></span>
                    </button>
                </div>
            </div>
          </>
        ) : <p className="text-center text-gray-400 text-sm mt-10">Gagal memuat data.</p>}
      </main>

      {/* MODAL - FIXED VIEWPORT (Z-9999) */}
      {modalOpen && modalContent && (
          <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in w-screen h-[100dvh]" onClick={() => setModalOpen(false)}>
              <div className="app-card w-full md:w-full md:max-w-sm flex flex-col max-h-[85vh] overflow-hidden bg-white dark:bg-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl mb-0 md:mb-auto transition-transform transform scale-100" onClick={e => e.stopPropagation()}>
                  
                  {/* Modal Header */}
                  <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-lg leading-tight">{modalContent.title}</h3>
                      <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 bg-gray-50 dark:bg-slate-700 rounded-full">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white dark:bg-slate-800 pb-10 md:pb-6">
                      
                      {modalContent.type === 'class' ? (
                          <div className="grid grid-cols-3 gap-3">
                              {modalContent.data.map(([cls, count]: any) => (
                                  <div key={cls} className="bg-white dark:bg-slate-700/50 p-3 rounded-2xl text-center border border-gray-100 dark:border-slate-600 shadow-sm hover:border-blue-200 transition-colors">
                                      <div className="font-extrabold text-slate-700 dark:text-white text-xl">{cls}</div>
                                      <div className="text-[10px] text-gray-400 dark:text-gray-400 font-bold uppercase mt-1">{count} Murid</div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                        <>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center justify-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-2xl border border-yellow-100 dark:border-yellow-800/50">
                                    <span className="text-yellow-700 dark:text-yellow-400 font-bold text-[10px] uppercase mb-1">Sakit</span>
                                    <span className="text-3xl font-extrabold text-yellow-600 dark:text-yellow-400">{modalContent.data.absenceDetails.S}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                    <span className="text-blue-700 dark:text-blue-400 font-bold text-[10px] uppercase mb-1">Izin</span>
                                    <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{modalContent.data.absenceDetails.I}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-3 bg-red-50 dark:bg-red-900/30 rounded-2xl border border-red-100 dark:border-red-800/50">
                                    <span className="text-red-700 dark:text-red-400 font-bold text-[10px] uppercase mb-1">Alpa</span>
                                    <span className="text-3xl font-extrabold text-red-600 dark:text-red-400">{modalContent.data.absenceDetails.A}</span>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-600 rounded-xl text-center">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">*Termasuk input dari Wali Kelas & Guru Mapel.</span>
                            </div>

                            <hr className="border-gray-100 dark:border-slate-700" />

                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Bookmark size={16} className="text-orange-500 fill-orange-500"/>
                                    <h4 className="font-bold text-slate-700 dark:text-white text-sm">Rincian Per Kelas</h4>
                                </div>
                                
                                <div className="space-y-3">
                                    {Object.keys(modalContent.data.classDetails).sort().map(cls => {
                                        const totalStudents = modalContent.data.classDetails[cls] || 0;
                                        const absentCount = modalContent.data.absencePerClass[cls] || 0;
                                        const presentCount = totalStudents - absentCount;
                                        const isExpanded = expandedClass === cls;

                                        return (
                                            <div key={cls} className="border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden transition-all hover:shadow-sm">
                                                <button 
                                                    onClick={() => setExpandedClass(isExpanded ? null : cls)} 
                                                    className="w-full flex items-center p-3 bg-white dark:bg-slate-700/30"
                                                >
                                                    <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl font-bold text-slate-700 dark:text-white text-sm shadow-sm">
                                                        {cls}
                                                    </div>
                                                    <div className="flex-1 px-4 text-left">
                                                        <div className="flex items-center gap-2 text-xs font-bold">
                                                            <span className="text-green-600 dark:text-green-400">{presentCount} Hadir</span>
                                                            <span className="text-gray-300 dark:text-gray-600">|</span>
                                                            <span className={absentCount > 0 ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}>
                                                                {absentCount} Tidak Hadir
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-gray-300 dark:text-gray-600">
                                                        {isExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                                                    </div>
                                                </button>

                                                {isExpanded && absentCount > 0 && (
                                                    <div className="bg-gray-50 dark:bg-slate-800 p-3 border-t border-gray-100 dark:border-slate-700 space-y-2 animate-fade-in">
                                                        {getAbsentStudentsForClass(cls).map((s: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-700 p-3 rounded-xl border border-gray-100 dark:border-slate-600 text-xs shadow-sm">
                                                                <span className="font-bold text-slate-700 dark:text-white">{s.name}</span>
                                                                <div className="flex items-center gap-2">
                                                                    {s.source === 'Wali' && <span className="text-[9px] bg-purple-100 text-purple-600 px-1 rounded border border-purple-200">Wali</span>}
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.status === 'S' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100' : s.status === 'I' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100'}`}>
                                                                        {s.status === 'S' ? 'Sakit' : s.status === 'I' ? 'Izin' : 'Alpa'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {isExpanded && absentCount === 0 && (
                                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 text-center text-xs text-green-700 dark:text-green-400 font-bold border-t border-green-100 dark:border-green-900/30">
                                                        Semua murid hadir.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                      )}
                  </div>
              </div>
          </div>
      )}
    
      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[99999] flex justify-center items-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setShowLoginModal(false)}>
           <div className="bg-transparent w-full max-w-lg flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
               {loginViewMode === 'selection' ? (
                  <div className="w-full grid gap-4 animate-fade-in">
                      <div className="flex justify-between items-center mb-2">
                          <h2 className="text-xl font-extrabold text-white">Masuk Sebagai</h2>
                          <button onClick={() => setShowLoginModal(false)} className="text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X size={24}/></button>
                      </div>
                      
                      <button 
                        onClick={() => handleRoleSelect('guru')}
                        className="bg-white dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-500/50 p-5 rounded-3xl shadow-xl flex items-center gap-5 transition-all group"
                      >
                          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <GraduationCap size={32} />
                          </div>
                          <div className="text-left">
                              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">Guru / Tenaga Pendidik</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Masuk untuk mengisi jurnal & absensi.</p>
                          </div>
                          <div className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-blue-500">
                              <ArrowRight size={24} />
                          </div>
                      </button>

                      <button 
                        onClick={() => handleRoleSelect('operator')}
                        className="bg-white dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border-2 border-transparent hover:border-orange-300 dark:hover:border-orange-500/50 p-5 rounded-3xl shadow-xl flex items-center gap-5 transition-all group"
                      >
                          <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <MonitorPlay size={32} />
                          </div>
                          <div className="text-left">
                              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-400">Operator Monitor</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Dashboard monitoring jadwal real-time.</p>
                          </div>
                          <div className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-orange-500">
                              <ArrowRight size={24} />
                          </div>
                      </button>

                      <button 
                        onClick={() => handleRoleSelect('admin')}
                        className="bg-white dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border-2 border-transparent hover:border-slate-400 dark:hover:border-slate-500/50 p-5 rounded-3xl shadow-xl flex items-center gap-5 transition-all group"
                      >
                          <div className="w-16 h-16 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <Shield size={32} />
                          </div>
                          <div className="text-left">
                              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Administrator</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pengaturan sistem dan data master.</p>
                          </div>
                          <div className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-slate-800 dark:group-hover:text-white">
                              <ArrowRight size={24} />
                          </div>
                      </button>
                  </div>
               ) : (
                  <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-white/50 dark:border-slate-700 overflow-hidden relative animate-fade-in transition-colors">
                      <div className="p-8">
                          <div className="flex justify-between items-start mb-6">
                              <button 
                                onClick={() => setLoginViewMode('selection')}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors -ml-2"
                                title="Kembali"
                              >
                                  <ChevronLeft size={24} />
                              </button>
                              <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors -mr-2"><X size={24}/></button>
                          </div>
                          
                          <div className="flex flex-col items-center justify-center gap-1 mb-6 -mt-4">
                              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full mb-2">
                                  <ShieldCheck size={28} />
                              </div>
                              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Login {selectedRoleLabel}</h2>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Silakan masukkan kredensial Anda.</p>
                          </div>

                          <form onSubmit={handleLoginSubmit} className="space-y-5">
                            <div>
                              <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">User ID (NIP/NIPPPK)</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  name="nip"
                                  id="nip"
                                  autoComplete="username"
                                  type="text"
                                  value={userId}
                                  onChange={(e) => setUserId(e.target.value)}
                                  className="pl-12 block w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3.5 text-slate-800 dark:text-white text-sm font-bold transition-all placeholder:text-gray-300 dark:placeholder:text-slate-600 placeholder:font-normal"
                                  placeholder="Contoh: 19870101..."
                                  required
                                  autoFocus
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Password</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  name="password"
                                  id="password"
                                  autoComplete="current-password"
                                  type={showPassword ? "text" : "password"}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="pl-12 pr-12 block w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3.5 text-slate-800 dark:text-white text-sm font-bold transition-all placeholder:text-gray-300 dark:placeholder:text-slate-600 placeholder:font-normal"
                                  placeholder="Masukkan Password"
                                  required
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer z-10"
                                    tabIndex={-1}
                                    title={showPassword ? "Sembunyikan" : "Lihat Password"}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                              </div>
                            </div>

                            {loginError && (
                              <div className="flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
                                <AlertCircle size={18} className="flex-shrink-0" />
                                <span>{loginError}</span>
                              </div>
                            )}

                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full bg-[#3B82F6] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-200 dark:shadow-none mt-4 active:translate-y-0.5"
                            >
                              {isSubmitting ? 'Memproses...' : (
                                <>
                                  Masuk Aplikasi <ArrowRight size={20} />
                                </>
                              )}
                            </button>
                          </form>
                      </div>
                  </div>
               )}
           </div>
        </div>
      )}

    </div>
  );
};

export default PublicDashboard;
