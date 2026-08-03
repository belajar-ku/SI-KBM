import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { PublicStats } from '../types';
import {  LogIn, Loader2, BookOpen, AlertCircle, X, School, ChevronDown, ChevronRight, Bookmark, Lock, User, ArrowRight, ShieldCheck, GraduationCap, MonitorPlay, Shield, ChevronLeft, Eye, EyeOff, BookX, Calendar, Check, Clock , CheckCircle2 } from 'lucide-react';
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
    await fetchStatsClientSide();
    setLoading(false);
  };

  const useMockData = () => { 
      setStats({
          count7: 0, count8: 0, count9: 0,
          classDetails: {}, classGenderDetails: {},
          totalJpRequired: 100, completedJp: 0,
          absenceCount: 0, absenceDetails: {S:0, I:0, A:0},
          absencePerClass: {}, filledClasses: [], unfilledKbm: []
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
    
    if (!isSupabaseConfigured) {
        useMockData(); return;
    }

    try {
        const [studentsRes, journalsRes, attendanceRes, homeroomRes] = await Promise.all([
            supabase.from('students').select('id, kelas, gender, name').eq('academic_year', academicYear || '2025/2026').then(async (res) => {
                  if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year'))) {
                      return supabase.from('students').select('id, kelas, gender, name');
                  }
                  
                  return res;
            }),
            supabase.from('journals').select('hours, kelas').eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').gte('created_at', semesterStart ? `${semesterStart}T00:00:00+07:00` : '2000-01-01T00:00:00+07:00').lte('created_at', semesterEnd ? `${semesterEnd}T23:59:59+07:00` : '2100-01-01T23:59:59+07:00').gte('created_at', startOfDay),
            supabase.from('attendance_logs').select('student_id, student_name, status, created_at, subject').eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').gte('created_at', semesterStart ? `${semesterStart}T00:00:00+07:00` : '2000-01-01T00:00:00+07:00').lte('created_at', semesterEnd ? `${semesterEnd}T23:59:59+07:00` : '2100-01-01T23:59:59+07:00').gte('created_at', startOfDay),
            supabase.from('homeroom_attendance').select('student_id, status, kelas').eq('date', todayStr).then(async (res) => {
                if (res.data) {
                    // Client-side filter to be safe, but actually we just want today's data regardless of academic_year since it's today
                    // The bug was that Wali input didn't have academic_year set, so it defaulted to 2025/2026, while the dashboard might be querying 2024/2025
                    return { data: res.data.filter((h: any) => h.academic_year === (academicYear || '2025/2026') || !h.academic_year || h.academic_year === '2025/2026'), error: res.error };
                }
                return res;
            })
        ]);

        const classCounts: Record<string, number> = {};
        const classGenderCounts: Record<string, { L: number, P: number }> = {};
        const sClassMap: Record<string, string> = {}; 
        let c7 = 0, c8 = 0, c9 = 0;
        
        if (studentsRes.data) {
            studentsRes.data.forEach((s: any) => {
                const rawKelas = s.kelas ? s.kelas.toUpperCase().trim() : '';
                const gender = s.gender === 'P' ? 'P' : 'L';
                sClassMap[s.id] = rawKelas;
                if (rawKelas) {
                    classCounts[rawKelas] = (classCounts[rawKelas] || 0) + 1;
                    if (!classGenderCounts[rawKelas]) classGenderCounts[rawKelas] = { L: 0, P: 0 };
                    classGenderCounts[rawKelas][gender]++;
                    
                    if (rawKelas.startsWith('7')) c7++; else if (rawKelas.startsWith('8')) c8++; else if (rawKelas.startsWith('9')) c9++;
                }
            });
        }
        setStudentClassMap(sClassMap);

        let completedJp = 0;
        const filledClassesSet = new Set<string>();
        if (journalsRes.data) {
            journalsRes.data.forEach((j: any) => {
                if (j.kelas) filledClassesSet.add(j.kelas);
                if (typeof j.hours === 'string') {
                    const parts = j.hours.split(',').filter((h: string) => h.trim().length > 0);
                    completedJp += parts.length;
                }
            });
        }
        
        if (homeroomRes.data) {
            homeroomRes.data.forEach((h: any) => {
                if (h.kelas) filledClassesSet.add(h.kelas);
            });
        }

        const combinedAttendance: Record<string, {name: string, status: string, source: 'Wali' | 'Guru'}> = {};
        
        const studentNameMap: Record<string, string> = {};
        if (studentsRes.data) {
            studentsRes.data.forEach((s: any) => {
                studentNameMap[s.id] = s.name || 'Unknown';
            });
        }

        const waliProcessed = new Set<string>();
        if (homeroomRes.data) {
            homeroomRes.data.forEach((h: any) => {
                waliProcessed.add(h.student_id);
                if (['S', 'I', 'A'].includes(h.status)) {
                    combinedAttendance[h.student_id] = { name: studentNameMap[h.student_id] || 'Unknown', status: h.status, source: 'Wali' };
                }
            });
        }

        if (attendanceRes.data) {
            attendanceRes.data.forEach((log: any) => {
                if (['S', 'I', 'A'].includes(log.status)) {
                    // Ignore guru's input if wali already processed this student
                    if (!waliProcessed.has(log.student_id) && !combinedAttendance[log.student_id]) {
                        combinedAttendance[log.student_id] = { name: log.student_name, status: log.status, source: 'Guru' };
                    }
                }
            });
        }

        const finalAttendanceList = Object.entries(combinedAttendance).map(([id, data]) => ({
            student_id: id,
            name: data.name,
            status: data.status,
            source: data.source
        }));

        const activeClassesCount = Object.keys(classCounts).length;
        const calculatedTotalJp = activeClassesCount * jpPerClass;

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
            classDetails: classCounts, classGenderDetails: classGenderCounts,
            totalJpRequired: calculatedTotalJp, 
            completedJp: completedJp,
            absenceCount: sCount + iCount + aCount,
            absenceDetails: { S: sCount, I: iCount, A: aCount },
            absencePerClass: absencePerClass,
            filledClasses: Array.from(filledClassesSet),
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

  const handleLogin = async (e: React.FormEvent) => {
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
              setIsSubmitting(false);
          } else {
              localStorage.setItem('saved_nip', userId);
              navigate('/dashboard', { state: { justLoggedIn: true } });
          }
      } catch (err: any) {
          setLoginError(err.message || 'Gagal login. Periksa kembali NIP/Username dan Password.');
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
      const absentStudents = rawAttendance.filter(log => studentClassMap[log.student_id] === cls);
      return absentStudents.map(s => ({
          name: s.name === 'Loading...' ? 'Siswa (Data Wali)' : s.name, 
          status: s.status,
          source: s.source
      }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Very soft background gradient/glows similar to image */}
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-[500px] mx-auto px-4 py-6 md:py-10 space-y-5">
          
          {/* 1. TOP HEADER CARD */}
          <div className="bg-white rounded-[2rem] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-center border border-slate-100 min-h-[150px]">
              {/* Decorative wave at bottom right */}
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-8 -right-4 w-48 h-24 bg-[#3b82f6] opacity-[0.08] rounded-[100%] -rotate-[15deg] pointer-events-none"></div>
              <div className="absolute -bottom-12 right-12 w-32 h-16 bg-[#2563eb] opacity-[0.06] rounded-[100%] -rotate-[25deg] pointer-events-none"></div>
              <div className="absolute top-4 right-10 w-32 h-32 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] opacity-20 pointer-events-none"></div>
              
              <div className="flex items-start justify-between z-10 relative h-full gap-2 w-full">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                      {/* Logo directly shown */}
                      <div className="w-[60px] h-[75px] sm:w-[70px] sm:h-[85px] shrink-0 relative flex items-center justify-center filter drop-shadow-md">
                          <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                      <div className="flex flex-col">
                          <h1 className="text-[17px] sm:text-[22px] font-black text-[#1e293b] leading-[1.1] tracking-tight mb-1.5">
                              UPT SMP NEGERI 1<br/>PASURUAN
                          </h1>
                          <p className="text-[11px] sm:text-[13px] text-[#64748b] leading-tight font-medium">
                              Sistem Informasi Kegiatan<br/>Belajar Mengajar (SI KBM)
                          </p>
                      </div>
                  </div>
                  
                  {/* Floating Date Time Pill */}
                  <div className="flex items-center gap-3 shrink-0 bg-white rounded-2xl py-3 px-3 sm:px-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-50 mt-1">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white border-2 border-[#eff6ff] rounded-full flex items-center justify-center text-[#2563eb] shrink-0 shadow-sm">
                          <Calendar size={20} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col text-left">
                          <p className="text-[9px] sm:text-[11px] font-bold text-[#64748b] mb-0.5">{formatDateIndo(time)}</p>
                          <div className="flex items-baseline justify-start gap-1 text-[#2563eb]">
                              <span className="text-[22px] sm:text-[26px] font-black tracking-tighter leading-none">{formatTimeIndo(time).replace(' WIB', '')}</span>
                              <span className="text-[10px] sm:text-[12px] font-bold text-[#3b82f6]">WIB</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          

          {/* 2. ACADEMIC YEAR PILL */}
          <div className="flex justify-center">
              <div className="bg-white rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 pl-1.5 pr-6 py-1.5 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
                      <GraduationCap size={16} strokeWidth={2.5}/>
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-700">
                      Tahun Ajaran: {academicYear} <span className="text-slate-300 mx-1">|</span> Semester: {semester}
                  </div>
              </div>
          </div>

          {/* 3. CLASS CARDS */}
          {loading || !stats ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={32}/></div>
          ) : (
              <>
                  <div className="grid grid-cols-3 gap-3">
                      {/* Kelas 7 */}
                      <button onClick={() => handleClassClick('7')} className="bg-white rounded-[1.5rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 text-left relative overflow-hidden group hover:shadow-md transition-all">
                          <svg className="absolute bottom-0 left-0 w-full h-auto text-blue-50/80 group-hover:text-blue-100/80 transition-colors" viewBox="0 0 100 40" preserveAspectRatio="none">
                              <path fill="currentColor" d="M0,20 Q25,40 50,20 T100,20 L100,40 L0,40 Z"></path>
                          </svg>
                          <div className="w-8 h-8 rounded-full border border-blue-200 flex items-center justify-center text-blue-500 mb-4 bg-white relative z-10 shadow-sm">
                              <User size={14} strokeWidth={2.5} />
                          </div>
                          <div className="relative z-10">
                              <div className="text-[28px] font-black text-slate-800 tracking-tighter leading-none">{stats.count7}</div>
                              <div className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase">Kelas 7</div>
                              <div className="w-6 h-1 bg-blue-500 rounded-full mt-2.5"></div>
                          </div>
                      </button>

                      {/* Kelas 8 */}
                      <button onClick={() => handleClassClick('8')} className="bg-white rounded-[1.5rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 text-left relative overflow-hidden group hover:shadow-md transition-all">
                          <svg className="absolute bottom-0 left-0 w-full h-auto text-emerald-50/80 group-hover:text-emerald-100/80 transition-colors" viewBox="0 0 100 40" preserveAspectRatio="none">
                              <path fill="currentColor" d="M0,20 Q25,40 50,20 T100,20 L100,40 L0,40 Z"></path>
                          </svg>
                          <div className="w-8 h-8 rounded-full border border-emerald-200 flex items-center justify-center text-emerald-500 mb-4 bg-white relative z-10 shadow-sm">
                              <User size={14} strokeWidth={2.5} />
                          </div>
                          <div className="relative z-10">
                              <div className="text-[28px] font-black text-slate-800 tracking-tighter leading-none">{stats.count8}</div>
                              <div className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase">Kelas 8</div>
                              <div className="w-6 h-1 bg-emerald-500 rounded-full mt-2.5"></div>
                          </div>
                      </button>

                      {/* Kelas 9 */}
                      <button onClick={() => handleClassClick('9')} className="bg-white rounded-[1.5rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 text-left relative overflow-hidden group hover:shadow-md transition-all">
                          <svg className="absolute bottom-0 left-0 w-full h-auto text-red-50/80 group-hover:text-red-100/80 transition-colors" viewBox="0 0 100 40" preserveAspectRatio="none">
                              <path fill="currentColor" d="M0,20 Q25,40 50,20 T100,20 L100,40 L0,40 Z"></path>
                          </svg>
                          <div className="w-8 h-8 rounded-full border border-red-200 flex items-center justify-center text-red-500 mb-4 bg-white relative z-10 shadow-sm">
                              <User size={14} strokeWidth={2.5} />
                          </div>
                          <div className="relative z-10">
                              <div className="text-[28px] font-black text-slate-800 tracking-tighter leading-none">{stats.count9}</div>
                              <div className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase">Kelas 9</div>
                              <div className="w-6 h-1 bg-red-500 rounded-full mt-2.5"></div>
                          </div>
                      </button>
                  </div>

                  {/* 4. SUMMARY ROW */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 my-2">
                      {/* KBM Terlaksana */}
                      <div className="bg-white rounded-[1.25rem] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 relative overflow-hidden flex flex-col justify-between min-h-[140px] text-left">
                          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#f3e8ff] rounded-tl-full blur-2xl z-0 opacity-50"></div>
                          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-[#f5d0fe]/20 to-transparent z-0"></div>
                          <svg className="absolute bottom-0 left-0 w-full h-auto text-[#f3e8ff] z-0" viewBox="0 0 100 30" preserveAspectRatio="none">
                              <path fill="currentColor" d="M0,30 Q25,10 50,20 T100,5 L100,30 L0,30 Z"></path>
                          </svg>
                          
                          <div className="w-[38px] h-[38px] rounded-xl bg-white border-2 border-[#f3e8ff] text-[#9333ea] flex items-center justify-center shadow-sm relative z-10 mb-2">
                              <BookOpen size={20} strokeWidth={2.5} />
                          </div>
                          
                          <div className="relative z-10 mt-auto">
                              <div className="flex items-baseline gap-1">
                                  <span className="text-[36px] sm:text-[42px] font-black text-[#7e22ce] tracking-tighter leading-none">{stats.completedJp}</span>
                                  <span className="text-[12px] font-bold text-[#475569] mb-1">/ {stats.totalJpRequired} JP</span>
                              </div>
                              <div className="text-[11px] font-bold text-[#334155] uppercase mt-1 tracking-wide leading-tight">KBM Terlaksana</div>
                          </div>

                          {/* 3D-like Icon Simulation - Calendar */}
                          <div className="absolute -right-2 -bottom-2 w-[85px] h-[85px] sm:w-[95px] sm:h-[95px] flex items-center justify-center transform -rotate-[8deg] z-10 pointer-events-none">
                              <div className="relative w-full h-full bg-[#f8fafc] rounded-2xl shadow-[inset_0_-4px_12px_rgba(0,0,0,0.1),_0_8px_16px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden flex items-center justify-center">
                                  <div className="absolute top-0 w-full h-1/3 bg-[#a855f7] border-b border-[#9333ea] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"></div>
                                  <div className="absolute top-3 flex justify-evenly w-full px-2">
                                     <div className="w-1.5 h-4 bg-[#334155] rounded-full shadow-md border border-[#1e293b]"></div>
                                     <div className="w-1.5 h-4 bg-[#334155] rounded-full shadow-md border border-[#1e293b]"></div>
                                     <div className="w-1.5 h-4 bg-[#334155] rounded-full shadow-md border border-[#1e293b]"></div>
                                     <div className="w-1.5 h-4 bg-[#334155] rounded-full shadow-md border border-[#1e293b]"></div>
                                  </div>
                                  <div className="relative z-10 mt-3 w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center border border-slate-100">
                                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#a855f7]">
                                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                                     </svg>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Ketidakhadiran */}
                      <button onClick={handleAbsenceClick} className="bg-white rounded-[1.25rem] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 relative overflow-hidden flex flex-col justify-between min-h-[140px] text-left transition-all group hover:shadow-md">
                          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#ffedd5] rounded-tl-full blur-2xl z-0 opacity-50"></div>
                          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-[#ffedd5]/40 to-transparent z-0"></div>
                          <svg className="absolute bottom-0 left-0 w-full h-auto text-[#ffedd5] z-0" viewBox="0 0 100 30" preserveAspectRatio="none">
                              <path fill="currentColor" d="M0,30 Q25,10 50,20 T100,5 L100,30 L0,30 Z"></path>
                          </svg>
                          
                          <div className="w-[38px] h-[38px] rounded-xl bg-white border-2 border-[#ffedd5] text-[#ea580c] flex items-center justify-center shadow-sm relative z-10 mb-2">
                              <AlertCircle size={20} strokeWidth={2.5} />
                          </div>
                          
                          <div className="relative z-10 mt-auto">
                              <div className="text-[36px] sm:text-[42px] font-black text-[#ea580c] tracking-tighter leading-none">{stats.absenceCount}</div>
                              <div className="text-[11px] font-bold text-[#334155] uppercase mt-2 tracking-wide leading-tight">Ketidakhadiran<br/>Murid</div>
                          </div> 

                          {/* 3D-like Icon Simulation - Clipboard */}
                          <div className="absolute -right-1 -bottom-2 w-[75px] h-[95px] sm:w-[85px] sm:h-[105px] flex flex-col items-center justify-center transform rotate-[6deg] z-10 pointer-events-none">
                              {/* Board */}
                              <div className="relative w-full h-full bg-[#f97316] rounded-xl shadow-[inset_0_-4px_12px_rgba(0,0,0,0.1),_0_8px_16px_rgba(0,0,0,0.15)] border border-[#ea580c] p-2 flex flex-col items-center">
                                  {/* Clip */}
                                  <div className="absolute -top-2 w-10 h-4 bg-slate-200 rounded-md shadow-md border border-slate-300 z-20 flex justify-center">
                                      <div className="w-4 h-1.5 bg-slate-400 rounded-full mt-1"></div>
                                  </div>
                                  {/* Paper */}
                                  <div className="w-full h-full bg-white rounded-md mt-1 shadow-sm p-2 flex flex-col gap-2 relative">
                                      <div className="flex items-center gap-1.5 mt-2">
                                          <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                                          <div className="h-1 w-full bg-slate-200 rounded-full"></div>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                          <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                                          <div className="h-1 w-3/4 bg-slate-200 rounded-full"></div>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                          <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                                          <div className="h-1 w-5/6 bg-slate-200 rounded-full"></div>
                                      </div>
                                      
                                      {/* Alert Badge */}
                                      <div className="absolute -right-4 -bottom-2 w-8 h-8 bg-[#ef4444] rounded-full border-2 border-white flex items-center justify-center shadow-lg text-white font-black text-[16px] leading-none z-20">!</div>
                                  </div>
                              </div>
                          </div>
                      </button>
                  </div>

                  {/* 5. PROGRESS BAR */}
                  <div className="bg-white rounded-[1.25rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col gap-4">
                      {(() => {
                          const percentage = stats.totalJpRequired > 0 ? (Math.round((stats.completedJp / stats.totalJpRequired) * 1000) / 10) : 0;
                          return (
                              <>
                                  <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-3">
                                          {/* Icon */}
                                          <div className="w-[42px] h-[42px] rounded-full bg-[#eff6ff] flex items-center justify-center text-[#2563eb] border border-[#dbeafe]">
                                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M18 20V10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                  <path d="M12 20V4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                  <path d="M6 20V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                          </div>
                                          <span className="text-[12px] font-black text-[#1e293b] tracking-widest uppercase">PROGRESS KBM HARI INI</span>
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-end justify-between w-full gap-4">
                                      <div className="flex-1 flex flex-col gap-2 pb-1">
                                          <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                              <div className="h-full bg-[#2563eb] rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%`}}></div>
                                          </div>
                                          <span className="text-[12px] font-bold text-[#475569]">{percentage}% Terlaksana</span>
                                      </div>
                                      <div className="text-[38px] font-black text-[#2563eb] leading-none shrink-0 tracking-tighter">
                                          {percentage}%
                                      </div>
                                  </div>
                              </>
                          );
                      })()}
                  </div>
              </>
          )}

          {/* 6. LOGIN BUTTON */}
          <button 
              onClick={() => setShowLoginModal(true)}
              className="w-full bg-[#007aff] hover:bg-[#0062cc] text-white rounded-[1.25rem] py-4 flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,122,255,0.25)] transition-all active:scale-[0.98] mt-3 group"
          >
              <LogIn size={20} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
              <span className="font-extrabold text-[15px]">Login Sebagai</span>
          </button>

          {/* 7. FOOTER QUOTE */}
          <div className="bg-white rounded-full py-3 px-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 mx-2 mt-4">
              <div className="w-[38px] h-[38px] rounded-full bg-[#2563eb] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </div>
              <p className="text-[10px] font-bold text-[#475569] text-center leading-[1.3] mx-3">
                  <span className="text-[#3b82f6] font-serif font-black text-base mr-1">"</span>
                  Setiap hari adalah kesempatan baru<br/>untuk belajar, mengajar, dan menginspirasi.
              </p>
              <div className="flex flex-col items-center justify-center shrink-0 w-8">
                 <div className="w-8 h-8 text-[#60a5fa] relative flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="absolute top-1 right-2"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"/></svg>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="absolute bottom-1 left-0"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"/></svg>
                 </div>
              </div>
          </div>

      </div>
      
      {/* MODALS RETAINED FROM ORIGINAL (Just appended exactly as they were conceptually) */}
      
      {/* MODALS WRAPPER */}
      {modalOpen && modalContent && (
          <div className="fixed inset-0 z-[99999] flex justify-center items-end sm:items-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setModalOpen(false)}>
              <div className="bg-white dark:bg-slate-800 w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up sm:animate-zoom-in flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
                      <div>
                          <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{modalContent.title}</h2>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                              {modalContent.type === 'class' ? 'Statistik Kelas' : 'Rekap Ketidakhadiran'}
                          </p>
                      </div>
                      <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"><X size={20}/></button>
                  </div>
                  
                  <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white dark:bg-slate-800 pb-10 md:pb-6">
                      {modalContent.type === 'class' ? (
                          <div className="grid grid-cols-3 gap-3">
                              {modalContent.data.map(([cls, count]: any) => {
                                  const genderData = stats?.classGenderDetails?.[cls] || { L: 0, P: 0 };
                                  return (
                                  <div key={cls} className="bg-white dark:bg-slate-700/50 p-3 rounded-2xl text-center border border-gray-100 dark:border-slate-600 shadow-sm hover:border-blue-200 transition-colors">
                                      <div className="font-extrabold text-slate-700 dark:text-white text-xl">{cls}</div>
                                      <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">{count} Murid</div>
                                      <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 border-t border-slate-100 dark:border-slate-600 pt-1 flex justify-center gap-2">
                                          <span className="text-blue-500">L: {genderData.L}</span> | <span className="text-pink-500">P: {genderData.P}</span>
                                      </div>
                                  </div>
                              )})}
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
                                <h3 className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase mb-3 flex items-center gap-2"><School size={14}/> Per Kelas</h3>
                                <div className="space-y-3">
                                    {Object.keys(modalContent.data.classDetails).sort().map(cls => {
                                        const totalStudents = modalContent.data.classDetails[cls] || 0;
                                        const absentCount = modalContent.data.absencePerClass[cls] || 0;
                                        const presentCount = totalStudents - absentCount;
                                        const isExpanded = expandedClass === cls;
                                        
                                        const isFilled = modalContent.data.filledClasses?.includes(cls);
                                        const showAsEmpty = absentCount === 0 && !isFilled;

                                        return (
                                            <div key={cls} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                                                <button onClick={() => setExpandedClass(isExpanded ? null : cls)} className="w-full flex items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-black text-slate-700 dark:text-white mr-3 shrink-0 text-sm">
                                                        {cls}
                                                    </div>
                                                    <div className="flex-1 px-1">
                                                        <div className="flex items-center gap-2 text-xs font-bold">
                                                            <span className={showAsEmpty ? "text-gray-400 dark:text-gray-500" : "text-green-600 dark:text-green-400"}>{presentCount} Hadir</span>
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
                                                    <div className={showAsEmpty ? "bg-gray-50 dark:bg-slate-800 p-3 text-center text-xs text-gray-500 dark:text-gray-400 font-bold border-t border-gray-100 dark:border-slate-700" : "bg-green-50 dark:bg-green-900/20 p-3 text-center text-xs text-green-700 dark:text-green-400 font-bold border-t border-green-100 dark:border-green-900/30"}>
                                                        {showAsEmpty ? "Belum ada laporan absen/jurnal." : "Semua murid hadir."}
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
                  <div className="w-full max-w-sm mx-auto space-y-4 animate-fade-in">
                      <div className="flex justify-between items-center mb-6 px-1">
                          <h2 className="text-2xl font-black text-white">Masuk Sebagai</h2>
                          <button onClick={() => setShowLoginModal(false)} className="text-white/70 hover:text-white p-2 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"><X size={24}/></button>
                      </div>
                      
                      <button 
                        onClick={() => handleRoleSelect('guru')}
                        className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-6 rounded-[1.75rem] shadow-lg flex items-center gap-5 transition-transform active:scale-[0.98] group"
                      >
                          <div className="w-16 h-16 rounded-full bg-blue-100/80 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                              <GraduationCap size={28} strokeWidth={2.5} />
                          </div>
                          <div className="text-left flex-1">
                              <h3 className="text-[17px] font-black text-slate-800 dark:text-white leading-tight">Guru / Tenaga<br/>Pendidik</h3>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-snug">Masuk untuk mengisi jurnal<br/>& absensi.</p>
                          </div>
                          <div className="text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors">
                              <ArrowRight size={20} strokeWidth={2.5} />
                          </div>
                      </button>

                      <button 
                        onClick={() => handleRoleSelect('operator')}
                        className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-6 rounded-[1.75rem] shadow-lg flex items-center gap-5 transition-transform active:scale-[0.98] group"
                      >
                          <div className="w-16 h-16 rounded-full bg-orange-100/80 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                              <MonitorPlay size={28} strokeWidth={2.5} />
                          </div>
                          <div className="text-left flex-1">
                              <h3 className="text-[17px] font-black text-slate-800 dark:text-white leading-tight">Operator<br/>Monitor</h3>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-snug">Dashboard monitoring<br/>jadwal real-time.</p>
                          </div>
                          <div className="text-slate-300 dark:text-slate-600 group-hover:text-orange-400 transition-colors">
                              <ArrowRight size={20} strokeWidth={2.5} />
                          </div>
                      </button>

                      <button 
                        onClick={() => handleRoleSelect('admin')}
                        className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-6 rounded-[1.75rem] shadow-lg flex items-center gap-5 transition-transform active:scale-[0.98] group"
                      >
                          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                              <Shield size={28} strokeWidth={2.5} />
                          </div>
                          <div className="text-left flex-1">
                              <h3 className="text-[17px] font-black text-slate-800 dark:text-white leading-tight">Administrator</h3>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-snug">Pengaturan sistem &<br/>database master.</p>
                          </div>
                          <div className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors">
                              <ArrowRight size={20} strokeWidth={2.5} />
                          </div>
                      </button>
                  </div>
               ) : (
                  <div className="bg-white dark:bg-slate-800 w-full max-w-sm mx-auto p-8 py-10 rounded-[2.5rem] shadow-2xl relative animate-zoom-in">
                      <button onClick={() => setLoginViewMode('selection')} className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                          <ChevronLeft size={24} strokeWidth={2.5}/>
                      </button>
                      
                      <div className="text-center mb-8">
                          <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-[6px] border-blue-50 dark:border-blue-900/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                              {selectedRoleLabel === 'Administrator' ? <Shield size={36} className="text-blue-500" strokeWidth={2.5}/> : <GraduationCap size={36} className="text-blue-500" strokeWidth={2.5}/>}
                          </div>
                          <h2 className="text-[26px] font-black text-slate-800 dark:text-white mb-1">Login {selectedRoleLabel}</h2>
                          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Sistem Informasi KBM</p>
                      </div>

                      <form onSubmit={handleLogin} className="space-y-5">
                          {loginError && (
                              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 rounded-2xl flex gap-3 text-red-600 dark:text-red-400 animate-shake">
                                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                  <p className="text-xs font-bold leading-relaxed">{loginError}</p>
                              </div>
                          )}
                          
                          <div>
                              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest">ID Pengguna / NIP</label>
                              <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                      <User size={20} strokeWidth={2} />
                                  </div>
                                  <input
                                      type="text"
                                      required
                                      value={userId}
                                      onChange={(e) => setUserId(e.target.value)}
                                      className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:font-normal placeholder:text-slate-300 shadow-sm"
                                      placeholder="Masukkan NIP"
                                  />
                              </div>
                          </div>

                          <div>
                              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest">Kata Sandi</label>
                              <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                      <Lock size={20} strokeWidth={2} />
                                  </div>
                                  <input
                                      type={showPassword ? "text" : "password"}
                                      required
                                      value={password}
                                      onChange={(e) => setPassword(e.target.value)}
                                      className="w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:font-normal placeholder:text-slate-300 shadow-sm"
                                      placeholder="••••••••"
                                  />
                                  <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-500 transition-colors"
                                  >
                                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                  </button>
                              </div>
                          </div>

                          <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-[1.25rem] py-4 mt-2 font-black text-[15px] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(37,99,235,0.25)] transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                              {isSubmitting ? (
                                  <><Loader2 size={20} className="animate-spin" /> Sedang Masuk...</>
                              ) : (
                                  <>Masuk Sekarang <ArrowRight size={20} strokeWidth={2.5} /></>
                              )}
                          </button>
                      </form>
                  </div>
               )}
           </div>
        </div>
      )}
    </div>
  );
};

export default PublicDashboard;
