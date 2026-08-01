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
    
    if (jpPerClass === 0 || !isSupabaseConfigured) {
        useMockData(); return;
    }

    try {
        const [studentsRes, journalsRes, attendanceRes, homeroomRes] = await Promise.all([
            supabase.from('students').select('id, kelas, gender').eq('academic_year', academicYear || '2025/2026').then(async (res) => {
                  if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year'))) {
                      return supabase.from('students').select('id, kelas, gender').eq('academic_year', academicYear || '2025/2026');
                  }
                  return res;
            }),
            supabase.from('journals').select('hours').eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').gte('created_at', semesterStart ? `${semesterStart}T00:00:00+07:00` : '2000-01-01T00:00:00+07:00').lte('created_at', semesterEnd ? `${semesterEnd}T23:59:59+07:00` : '2100-01-01T23:59:59+07:00').gte('created_at', startOfDay),
            supabase.from('attendance_logs').select('student_id, student_name, status, created_at, subject').eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').gte('created_at', semesterStart ? `${semesterStart}T00:00:00+07:00` : '2000-01-01T00:00:00+07:00').lte('created_at', semesterEnd ? `${semesterEnd}T23:59:59+07:00` : '2100-01-01T23:59:59+07:00').gte('created_at', startOfDay),
            supabase.from('homeroom_attendance').select('student_id, status, kelas').eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').gte('date', semesterStart ? `${semesterStart}` : '2000-01-01').lte('date', semesterEnd ? `${semesterEnd}` : '2100-01-01').eq('date', todayStr)
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
        if (journalsRes.data) {
            journalsRes.data.forEach((j: any) => {
                if (typeof j.hours === 'string') {
                    const parts = j.hours.split(',').filter((h: string) => h.trim().length > 0);
                    completedJp += parts.length;
                }
            });
        }

        const combinedAttendance: Record<string, {name: string, status: string, source: 'Wali' | 'Guru'}> = {};

        if (homeroomRes.data) {
            homeroomRes.data.forEach((h: any) => {
                if (['S', 'I', 'A'].includes(h.status)) {
                    combinedAttendance[h.student_id] = { name: 'Loading...', status: h.status, source: 'Wali' };
                }
            });
        }

        if (attendanceRes.data) {
            attendanceRes.data.forEach((log: any) => {
                if (['S', 'I', 'A'].includes(log.status)) {
                    if (!combinedAttendance[log.student_id]) {
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
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-center border border-slate-100 min-h-[140px]">
              {/* Decorative wave at bottom right */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-blue-600/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-16 -right-4 w-48 h-32 bg-blue-500/10 rounded-[100%] rotate-12 pointer-events-none"></div>
              
              <div className="flex items-center justify-between z-10 relative h-full gap-2">
                  <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-14 sm:w-14 sm:h-16 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center p-1 shrink-0 relative overflow-hidden">
                          <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                      <div className="flex flex-col">
                          <h1 className="text-base sm:text-xl font-black text-slate-800 leading-tight tracking-tight mb-0.5">UPT SMP NEGERI 1<br/>PASURUAN</h1>
                          <p className="text-[9px] sm:text-xs text-slate-500 leading-tight font-medium line-clamp-1">Sistem Informasi KBM</p>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-right">
                      <div className="hidden sm:flex w-[38px] h-[38px] bg-blue-50 rounded-full items-center justify-center text-blue-600 shrink-0">
                          <Calendar size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col">
                          <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 mb-0.5">{formatDateIndo(time)}</p>
                          <div className="flex items-baseline justify-end gap-0.5 sm:gap-1 text-blue-600">
                              <span className="text-lg sm:text-2xl font-black tracking-tighter leading-none">{formatTimeIndo(time).replace(' WIB', '')}</span>
                              <span className="text-[9px] sm:text-[10px] font-bold text-blue-500">WIB</span>
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
                  <div className="grid grid-cols-2 gap-3">
                      {/* KBM Terlaksana */}
                      <div className="bg-white rounded-[1.75rem] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 relative overflow-hidden flex flex-col justify-between min-h-[140px] text-left hover:shadow-md transition-all group">
                          <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-50/50 rounded-tl-full transition-colors z-0"></div>
                          
                          <div className="w-[34px] h-[34px] rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 relative z-10">
                              <BookOpen size={18} strokeWidth={2} />
                          </div>
                          
                          <div className="relative z-10 mt-auto">
                              <div className="flex items-baseline gap-1">
                                  <span className="text-[32px] font-black text-purple-700 tracking-tighter leading-none">{stats.completedJp}</span>
                                  <span className="text-[11px] font-bold text-slate-600">/ {stats.totalJpRequired} JP</span>
                              </div>
                              <div className="text-[10px] font-black text-slate-700 uppercase mt-2 tracking-wide leading-tight">KBM Terlaksana</div>
                          </div>

                          {/* 3D-like Icon Simulation */}
                          <div className="absolute right-4 bottom-4 w-[60px] h-[60px] bg-gradient-to-br from-[#c4b5fd] to-[#8b5cf6] rounded-[1.25rem] shadow-[0_8px_16px_rgba(139,92,246,0.3)] flex items-center justify-center transform -rotate-3 border-t-[3px] border-l-[3px] border-white/40 z-10">
                              <div className="w-10 h-10 bg-white rounded-xl shadow-inner flex items-center justify-center relative overflow-hidden">
                                 <div className="absolute top-0 w-full h-2.5 bg-gradient-to-b from-slate-100 to-white"></div>
                                 <Check size={24} strokeWidth={4} className="text-[#8b5cf6] drop-shadow-sm z-10" />
                              </div>
                              {/* Binder rings */}
                              <div className="absolute -top-1.5 left-3 w-1.5 h-3.5 bg-slate-200 rounded-full shadow-sm border border-slate-300"></div>
                              <div className="absolute -top-1.5 right-3 w-1.5 h-3.5 bg-slate-200 rounded-full shadow-sm border border-slate-300"></div>
                          </div>
                      </div>

                      {/* Ketidakhadiran */}
                      <button onClick={handleAbsenceClick} className="bg-white rounded-[1.75rem] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 relative overflow-hidden flex flex-col justify-between min-h-[140px] text-left hover:shadow-md transition-all group">
                          <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-50/50 rounded-tl-full transition-colors z-0"></div>
                          
                          <div className="w-[34px] h-[34px] rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 relative z-10">
                              <AlertCircle size={18} strokeWidth={2} />
                          </div>
                          
                          <div className="relative z-10 mt-auto">
                              <div className="text-[32px] font-black text-orange-500 tracking-tighter leading-none">{stats.absenceCount}</div>
                              <div className="text-[10px] font-black text-slate-700 uppercase mt-2 tracking-wide leading-tight">Ketidakhadiran<br/>Murid</div>
                          </div>

                           {/* 3D-like Icon Simulation */}
                           <div className="absolute right-4 bottom-4 w-[56px] h-[64px] bg-gradient-to-br from-[#fed7aa] to-[#f97316] rounded-xl shadow-[0_8px_16px_rgba(249,115,22,0.3)] flex flex-col items-center justify-center transform rotate-6 border-t-[3px] border-l-[3px] border-white/50 z-10 pt-2">
                              {/* Paper */}
                              <div className="w-10 h-10 bg-white rounded shadow-inner flex flex-col items-center justify-center gap-1">
                                  <div className="w-6 h-0.5 bg-slate-200 rounded-full"></div>
                                  <div className="w-6 h-0.5 bg-slate-200 rounded-full"></div>
                                  <div className="w-4 h-0.5 bg-slate-200 rounded-full mr-2"></div>
                              </div>
                              {/* Clip */}
                              <div className="absolute -top-1 w-6 h-3 bg-slate-700 rounded-md shadow-md border-b-2 border-slate-800"></div>
                              <div className="absolute -top-3 w-3 h-3 border-2 border-slate-700 rounded-full"></div>
                              
                              {/* Alert Badge */}
                              <div className="absolute -right-2 -bottom-2 w-7 h-7 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg text-white font-black text-[13px] leading-none">!</div>
                          </div>
                      </button>
                  </div>

                  {/* 5. PROGRESS BAR */}
                  <div className="bg-white rounded-[1.5rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex items-center gap-4 sm:gap-5">
                      {(() => {
                          const percentage = stats.totalJpRequired > 0 ? (Math.round((stats.completedJp / stats.totalJpRequired) * 1000) / 10) : 0;
                          return (
                              <>
                                  {/* Icon */}
                                  <div className="w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-full bg-[#f4f7ff] shadow-[0_4px_20px_rgba(37,99,235,0.12)] flex items-center justify-center shrink-0 border-[3px] border-white">
                                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1d4ed8]">
                                          <path d="M22 6L14.5 13.5L9.5 8.5L2 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                          <path d="M16 6H22V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                          <path d="M12 21V13" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                          <path d="M18 21V16" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                          <path d="M6 21V17" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                      </svg>
                                  </div>
                                  
                                  <div className="flex-1 flex flex-col justify-center">
                                      <span className="text-[12px] sm:text-[13px] font-black text-[#1e3a8a] tracking-wide mb-2">PROGRESS KBM HARI INI</span>
                                      
                                      <div className="flex items-center gap-4">
                                          <div className="flex-1 flex flex-col gap-1.5">
                                              <div className="h-2.5 sm:h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                                  <div className="h-full bg-[#1d4ed8] rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%`}}></div>
                                              </div>
                                              <span className="text-[11px] sm:text-[12px] font-semibold text-[#1e40af]">{percentage}% Terlaksana</span>
                                          </div>
                                          <div className="text-[26px] sm:text-[32px] font-black text-[#1d4ed8] leading-none shrink-0">
                                              {percentage}%
                                          </div>
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
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-3xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-[0.98] mt-2 group"
          >
              <LogIn size={20} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
              <span className="font-extrabold text-sm">Login</span>
          </button>

          {/* 7. FOOTER QUOTE */}
          <div className="bg-white rounded-full py-2.5 px-4 flex items-center justify-between shadow-sm border border-slate-100 mx-4 mt-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </div>
              <p className="text-[9px] font-bold text-slate-600 text-center leading-tight mx-2">
                  <span className="text-blue-500 font-serif font-black text-sm mr-1">"</span>
                  Setiap hari adalah kesempatan baru<br/>untuk belajar, mengajar, dan menginspirasi.
              </p>
              <div className="w-6 h-6 text-blue-400 flex items-center justify-center shrink-0 relative">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"/></svg>
                 <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="absolute top-0 right-0"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"/></svg>
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
                                        return (
                                            <div key={cls} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                                                <button onClick={() => setExpandedClass(isExpanded ? null : cls)} className="w-full flex items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-black text-slate-700 dark:text-white mr-3 shrink-0 text-sm">
                                                        {cls}
                                                    </div>
                                                    <div className="flex-1 px-1">
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
