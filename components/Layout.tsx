
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getWIBISOString } from '../utils/dateUtils';
import {  Bell, CheckCircle2, XCircle, X , LayoutGrid, ChevronLeft, ChevronRight, Table, BookOpen, ClipboardList } from 'lucide-react';
import { supabase } from '../services/supabase';
import { LogOut, LayoutDashboard, Grid, User, MonitorPlay, Moon, Sun, Siren, Activity, Sunset, ArrowUp, AlertCircle, Settings, Database, Users, GraduationCap, Upload, Edit3, Calendar, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TeacherLoginSplash } from './TeacherLoginSplash';
import { AnimatePresence } from 'motion/react';

export const Layout: React.FC<{ children: React.ReactNode; showNav?: boolean; collapsed?: boolean }> = ({ children, showNav = true, collapsed: propCollapsed }) => {
  const { signOut, profile, isOperator, isAdmin, academicYear, semester, activeScheduleVersion } = useAuth();
    const navigate = useNavigate();
  const location = useLocation();
  
  // Interactive expandable/collapsible sidebar
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (propCollapsed !== undefined) return propCollapsed;
    const saved = localStorage.getItem('sidebar_is_collapsed');
    return saved !== null ? saved === 'true' : false;
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_is_collapsed', String(next));
      return next;
    });
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);
      const [currentTime, setCurrentTime] = useState(new Date());
  
  // NEW: State for Scroll-to-Top Button
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [waliNotifications, setWaliNotifications] = useState<any[]>([]);
  const [hasUnfilled, setHasUnfilled] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showTeacherSplash, setShowTeacherSplash] = useState(false);
  const pendingSplashCheck = React.useRef(false);

  const openNotifModal = () => {
      setShowNotifModal(true);
      const notifCount = notifications.filter(n => !n.isFilled).length + waliNotifications.length;
      const todayStr = new Date().toLocaleDateString('id-ID');
      localStorage.setItem(`lastSeenNotifCount_${profile?.id}_${todayStr}`, notifCount.toString());
  };

  useEffect(() => {
     if (location.state?.justLoggedIn && profile?.role === 'user') {
        pendingSplashCheck.current = true;
        const timer = setTimeout(() => {
            navigate(location.pathname, { replace: true, state: {} });
        }, 100);
        return () => clearTimeout(timer);
     }
  }, [location.state?.justLoggedIn, profile?.role, navigate, location.pathname]);
  


  // Logic to identify Headmaster
  const isHeadmaster = profile?.mengajar_mapel === 'Kepala Sekolah';
  // Logic to identify Dhuha Teacher
  const isDhuhaTeacher = profile?.mengajar_mapel?.toLowerCase().includes('dhuha');

  useEffect(() => {
    

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // NEW: Scroll Event Listener
  useEffect(() => {
    const handleScroll = () => {
        // Show button if scrolled down more than 300px
        if (window.scrollY > 300) {
            setShowScrollTop(true);
        } else {
            setShowScrollTop(false);
        }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // NEW: Scroll to Top Function
  const scrollToTop = () => {
      window.scrollTo({
          top: 0,
          behavior: 'smooth'
      });
  };

  
  useEffect(() => {
        if (profile && !isAdmin && !isOperator && !isHeadmaster) {
            const fetchNotifs = async () => {
                try {
                    const dateObj = new Date();
                    const jsDay = dateObj.getDay();
                    const dbDay = jsDay === 0 ? 7 : jsDay;
                    const todayStr = getWIBISOString();
                    const todayStart = `${todayStr}T00:00:00+07:00`;
                    const todayEnd = `${todayStr}T23:59:59+07:00`;

                    let { data: scheds, error: schedErr } = await supabase.from('schedules').select('*')
                        .eq('teacher_id', profile.id)
                        .eq('day_of_week', dbDay)
                        .eq('academic_year', academicYear || '2025/2026')
                        .eq('semester', semester || 'Ganjil')
                        .eq('schedule_version', activeScheduleVersion || 'Utama');
                        
                    if (schedErr && (schedErr.code === '42703' || schedErr.message?.includes('academic_year') || schedErr.message?.includes('schedule_version'))) {
                        const fallback = await supabase.from('schedules').select('*').eq('teacher_id', profile.id).eq('day_of_week', dbDay).eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Genap');
                        if (fallback.error) {
                             // If even academic_year doesn't exist
                             const ultraFallback = await supabase.from('schedules').select('*').eq('teacher_id', profile.id).eq('day_of_week', dbDay);
                             scheds = (ultraFallback.data || []).filter(s => s.academic_year === academicYear && s.semester === semester);
                        } else {
                             scheds = fallback.data;
                        }
                    }

                    // Cek kegiatan sekolah
                    const { data: activity } = await supabase.from('school_activities').select('*').eq('date', todayStr).single();
                    if (activity) {
                        scheds = [];
                        if (profile.wali_kelas) {
                            scheds = [
                                { id: 'act-pagi', hour: '1', kelas: profile.wali_kelas, subject: 'Presensi Pagi - ' + activity.name, teacher_id: profile.id, day_of_week: dbDay },
                                { id: 'act-pulang', hour: '2', kelas: profile.wali_kelas, subject: 'Presensi Pulang - ' + activity.name, teacher_id: profile.id, day_of_week: dbDay }
                            ];
                        }
                    }

                    const { data: journals } = await supabase.from('journals').select('id, kelas, subject, created_at')
                        .eq('teacher_id', profile.id)
                        .eq('academic_year', academicYear || '2025/2026')
                        .eq('semester', semester || 'Ganjil')
                        .gte('created_at', todayStart)
                        .lte('created_at', todayEnd);

                    const jData = journals || [];
                    const notifs = (scheds || []).map((s: any) => {
                        const isFilled = jData.some((j: any) => j.kelas === s.kelas && s.subject.toLowerCase().includes(j.subject.toLowerCase()));
                        return { ...s, isFilled };
                    });
                    
                    notifs.sort((a,b) => parseInt(a.hour) - parseInt(b.hour));
                    setNotifications(notifs);
                    setHasUnfilled(notifs.some(n => !n.isFilled));

                    let waliNotifs: any[] = [];
                    if (profile.wali_kelas) {
                        const { data: students } = await supabase.from('students').select('id, name')
                            .eq('kelas', profile.wali_kelas)
                            .eq('academic_year', academicYear || '2025/2026');
                        
                        if (students && students.length > 0) {
                            const studentIds = students.map((s: any) => s.id);
                            
                            // Fetch absences
                            const { data: absences } = await supabase.from('attendance_logs').select('id, student_name, teacher_name, subject, created_at')
                                .in('student_id', studentIds)
                                .eq('status', 'A')
                                .gte('created_at', todayStart)
                                .lte('created_at', todayEnd);
                                
                            // Fetch discipline notes
                            const { data: notes } = await supabase.from('journal_notes').select('id, student_name, category, note, created_at, journal_id')
                                .in('student_id', studentIds)
                                .eq('type', 'kedisiplinan')
                                .gte('created_at', todayStart)
                                .lte('created_at', todayEnd);
                                
                            if (absences) {
                                absences.forEach((a: any) => {
                                    waliNotifs.push({
                                        type: 'absence',
                                        studentName: a.student_name,
                                        teacherName: a.teacher_name,
                                        subject: a.subject,
                                        createdAt: new Date(a.created_at).getTime(),
                                        message: `Alpa di mapel ${a.subject || '-'} (${a.teacher_name || '-'}) `
                                    });
                                });
                            }
                            if (notes) {
                                notes.forEach((n: any) => {
                                    waliNotifs.push({
                                        type: 'discipline',
                                        studentName: n.student_name,
                                        category: n.category,
                                        note: n.note,
                                        createdAt: new Date(n.created_at).getTime(),
                                        message: `${n.category || 'Pelanggaran'}: ${n.note || '-'}`
                                    });
                                });
                            }
                        }
                    }
                    waliNotifs.sort((a,b) => b.createdAt - a.createdAt);
                    
                    const finalNotifCount = notifs.filter((n: any) => !n.isFilled).length + waliNotifs.length;
                    if (pendingSplashCheck.current) {
                        const todayStr = new Date().toLocaleDateString('id-ID');
                        const lsKey = `lastSeenNotifCount_${profile.id}_${todayStr}`;
                        const lastSeen = parseInt(localStorage.getItem(lsKey) || '0', 10);
                        if (finalNotifCount > 0 && finalNotifCount > lastSeen) {
                            setShowTeacherSplash(true);
                        }
                        pendingSplashCheck.current = false;
                    }
                    setWaliNotifications(waliNotifs);
                    
                    
                    
                    
                } catch(e) {}
            };
            fetchNotifs();
        }
  }, [profile, academicYear, semester, activeScheduleVersion]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await signOut();
    setShowLogoutModal(false);
    navigate('/');
  };

  const NavItem = ({ path, label, description, icon: Icon, badge }: { path: string; label: string; description?: string; icon: any; badge?: string }) => {
      const isActive = location.pathname === path;
      return (
          <button 
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative text-left ${
                isActive 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title={`${label}${description ? ` - ${description}` : ''}`} 
          >
              <div className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-white transition-colors'}`}>
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`font-bold text-xs leading-tight truncate ${isActive ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                      {label}
                    </span>
                    {badge && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase shrink-0 ${
                        isActive ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                      }`}>
                        {badge}
                      </span>
                    )}
                  </div>
                  {description && (
                    <span className={`text-[10px] leading-tight block truncate mt-0.5 ${
                      isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'
                    }`}>
                      {description}
                    </span>
                  )}
                </div>
              )}
          </button>
      );
  };

  // --- NEW: ANIMATED BOTTOM NAV ITEM ---
  const BottomNavItem = ({ path, label, icon: Icon }: any) => {
      const isActive = location.pathname === path;
      return (
          <button 
            onClick={() => navigate(path)}
            className="relative flex flex-col items-center justify-center w-[80px] h-[64px]"
          >
              {isActive ? (
                  <div className="absolute -top-[28px] flex flex-col items-center justify-center w-[72px] h-[72px] bg-[#1281ff] rounded-full shadow-[0_0_0_8px_rgba(18,129,255,0.1)] text-white z-10 transition-transform duration-300">
                      <Icon size={26} strokeWidth={2.5} className="mb-0.5" />
                      <span className="text-[10px] font-bold tracking-wide">{label}</span>
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mt-2">
                      <Icon size={24} strokeWidth={2} className="mb-1" />
                      <span className="text-[11px] font-semibold">{label}</span>
                  </div>
              )}
          </button>
      );
  };

  const formattedDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(currentTime);
  const formattedTime = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(currentTime).replace(/\./g, ':');

  return (
    <>
      <AnimatePresence>
        {showTeacherSplash && <TeacherLoginSplash key="tsplash" onFinish={() => setShowTeacherSplash(false)} hasUnfilled={hasUnfilled || waliNotifications.length > 0} notifCount={notifications.filter(n => !n.isFilled).length + waliNotifications.length} />}
      </AnimatePresence>
      <div className="min-h-screen flex bg-[#F0F4F8] dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* --- DESKTOP SIDEBAR (Expandable / Collapsible) --- */}
      {showNav && (
        <aside className={`hidden md:flex flex-col h-screen sticky top-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-20 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-76'}`}>
            {/* Logo & Header Area with Expand/Collapse Button */}
            <div className={`p-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 h-20 ${isCollapsed ? 'flex-col justify-center gap-1' : ''}`}>
                 <div className={`flex items-center gap-2.5 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
                   <img 
                      src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" 
                      alt="Logo" 
                      className="h-10 w-10 object-contain shrink-0" 
                    />
                   {!isCollapsed && (
                       <div className="min-w-0">
                          <h2 className="text-sm font-black text-slate-800 dark:text-white leading-tight truncate">UPT SMPN 1</h2>
                          <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold truncate">SI KBM Online</p>
                       </div>
                   )}
                 </div>

                 {/* Sidebar Toggle Button */}
                 <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-all active:scale-90"
                    title={isCollapsed ? "Lebarkan Menu (Tampilkan Keterangan)" : "Ciutkan Menu"}
                 >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                 </button>
            </div>

            {/* Navigation Menu (Grouped with Labels & Descriptions) */}
            <div className="flex-1 space-y-4 p-3 overflow-y-auto custom-scrollbar">
                {isAdmin ? (
                    <>
                        {/* 1. KBM & MONITORING */}
                        <div>
                            {!isCollapsed && (
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 px-3">
                                    KBM &amp; Monitoring
                                </div>
                            )}
                            <div className="space-y-1">
                                <NavItem path="/dashboard" label="Beranda" description="Agenda mengajar & ringkasan" icon={LayoutDashboard} />
                                <NavItem path="/operator-dashboard" label="Monitor KBM" description="Pantau KBM & presensi realtime" icon={MonitorPlay} />
                                <NavItem path="/input-jadwal" label="Input Jadwal" description="Pengaturan jadwal pelajaran" icon={Calendar} />
                                <NavItem path="/input-manual" label="Input Manual" description="Entri massal jurnal & absensi" icon={Edit3} />
                            </div>
                        </div>

                        {/* 2. LAPORAN & KINERJA */}
                        <div>
                            {!isCollapsed && (
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 px-3">
                                    Laporan &amp; Kinerja
                                </div>
                            )}
                            <div className="space-y-1">
                                <NavItem path="/rekap-kinerja" label="Rekap Kinerja Bulanan" description="Target JP & hari non-efektif" icon={Table} badge="Baru" />
                                <NavItem path="/kinerja" label="Monitoring Kinerja" description="Evaluasi jam mengajar guru" icon={Activity} />
                                <NavItem path="/laporan" label="Laporan Jurnal" description="Arsip jurnal KBM & cetak" icon={BookOpen} />
                                <NavItem path="/rekap-absensi" label="Rekap Kehadiran" description="Presensi harian & kehadiran siswa" icon={Users} />
                                <NavItem path="/absensi-rapor" label="Absensi Rapor" description="Rekap S/I/A buku rapor" icon={ClipboardList} />
                                <NavItem path="/rekap-dhuha" label="Rekap Sholat Dhuha" description="Monitoring pembiasaan ibadah" icon={Sunset} />
                                <NavItem path="/kedisiplinan" label="Buku Kedisiplinan" description="Catatan pelanggaran siswa" icon={Siren} />
                            </div>
                        </div>

                        {/* 3. DATA MASTER */}
                        <div>
                            {!isCollapsed && (
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 px-3">
                                    Data Master
                                </div>
                            )}
                            <div className="space-y-1">
                                <NavItem path="/users" label="Data Akun &amp; Guru" description="Kelola akun pengguna & guru" icon={Users} />
                                <NavItem path="/students" label="Data Siswa &amp; Mutasi" description="Manajemen rombel & mutasi" icon={GraduationCap} />
                                <NavItem path="/import-data" label="Import Data Master" description="Unggah file Excel & CSV" icon={Upload} />
                            </div>
                        </div>

                        {/* 4. SISTEM & PENGATURAN */}
                        <div>
                            {!isCollapsed && (
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 px-3">
                                    Sistem &amp; Pengaturan
                                </div>
                            )}
                            <div className="space-y-1">
                                <NavItem path="/penyimpanan" label="T.A &amp; Versi Jadwal" description="Tahun ajaran & versi jadwal" icon={Database} />
                                <NavItem path="/settings" label="Pengaturan Aplikasi" description="Hari non-efektif & mapel" icon={Settings} />
                                <NavItem path="/profile" label="Akun Saya" description="Profil pengguna & keamanan" icon={User} />
                            </div>
                        </div>
                    </>
                ) : isOperator ? (
                    <>
                        <div>
                            {!isCollapsed && (
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 px-3">
                                    Operator Panel
                                </div>
                            )}
                            <div className="space-y-1">
                                <NavItem path="/operator-dashboard" label="Dashboard KBM" description="Pantau presensi & jurnal guru" icon={MonitorPlay} />
                                <NavItem path="/rekap-kinerja" label="Rekap Kinerja Bulanan" description="Rekapitulasi jam mengajar" icon={Table} />
                                <NavItem path="/profile" label="Akun Saya" description="Profil pengguna" icon={User} />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            {!isCollapsed && (
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 px-3">
                                    {isHeadmaster ? 'Kepala Sekolah' : 'Menu Guru'}
                                </div>
                            )}
                            <div className="space-y-1">
                                <NavItem path="/dashboard" label="Beranda" description="Agenda & ringkasan mengajar" icon={LayoutDashboard} />
                                {isHeadmaster && (
                                    <>
                                        <NavItem path="/rekap-kinerja" label="Rekap Kinerja Bulanan" description="Target JP & hari non-efektif" icon={Table} badge="Baru" />
                                        <NavItem path="/kinerja" label="Monitoring Kinerja" description="Evaluasi jam mengajar guru" icon={Activity} />
                                        <NavItem path="/laporan" label="Laporan Jurnal" description="Arsip jurnal KBM sekolah" icon={BookOpen} />
                                        <NavItem path="/kedisiplinan" label="Buku Kedisiplinan" description="Catatan pelanggaran murid" icon={Siren} />
                                    </>
                                )}
                                {!isHeadmaster && <NavItem path="/apps" label="Menu KBM" description="Jurnal, presensi & rapor" icon={Grid} />}
                                {isDhuhaTeacher && <NavItem path="/rekap-dhuha" label="Rekap Dhuha" description="Monitoring sholat dhuha" icon={Sunset} />}
                                <NavItem path="/profile" label="Akun Saya" description="Profil pengguna" icon={User} />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Theme & Logout Area */}
            <div className="p-3.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <div className={`flex flex-col gap-3 ${isCollapsed ? 'items-center' : ''}`}>
                    {/* User Profile Mini */}
                    <div className={`flex items-center gap-2.5 overflow-hidden ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-600 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-slate-600 shadow-sm cursor-pointer" title={profile?.full_name}>
                                {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover"/> : <User size={18} className="m-2 text-gray-400 dark:text-gray-300"/>}
                            </div>
                            {!isCollapsed && (
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[130px]">{profile?.full_name?.split(' ')[0]}</p>
                                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                                    </p>
                                </div>
                            )}
                        </div>
                        {!isCollapsed && (
                            <button 
                                onClick={handleLogoutClick}
                                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                                title="Keluar"
                            >
                                <LogOut size={17} />
                            </button>
                        )}
                    </div>
                    {/* Collapsed Logout */}
                    {isCollapsed && (
                         <button 
                            onClick={handleLogoutClick}
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                            title="Keluar"
                        >
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
      )}
      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar relative bg-[#F8FAFC] dark:bg-slate-900 transition-colors duration-300">
      {/* --- MAIN CONTENT --- */}
          {/* Mobile Header */}
          <div className="md:hidden sticky top-0 bg-[#F8FAFC] dark:bg-slate-900 z-30 pt-[calc(env(safe-area-inset-top)+0.25rem)]">
             <div className="px-4 py-3 flex justify-between items-center">
                 <div className="flex items-center gap-2.5">
                     <img
                        src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0"
                        className="h-11 w-auto object-contain"
                        alt="Logo"
                     />
                     <div>
                         <h1 className="text-[11px] font-black text-[#0f172a] dark:text-white leading-tight">SISTEM INFORMASI<br/>KEGIATAN BELAJAR MENGAJAR</h1>
                         <p className="text-[9px] text-[#64748b] dark:text-slate-400 font-bold uppercase mt-0.5 tracking-wide">
                            SEMESTER {semester} <span className="mx-0.5 text-slate-300">|</span> T.A {academicYear}
                         </p>
                     </div>
                 </div>
                 <div className="flex items-center gap-2">
                     {!isAdmin && !isOperator && !isHeadmaster && (
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-full overflow-hidden shadow-sm">
                                <div className="w-full h-full bg-blue-400 animate-ping opacity-30"></div>
                            </div>
                            <button onClick={() => openNotifModal()} className="relative z-10 w-9 h-9 m-[2px] bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-[#475569] dark:text-gray-300 transition-transform active:scale-95 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
                                <Bell size={18} strokeWidth={2.5} className="animate-bell-ring text-blue-500" />
                            </button>
                            {((notifications.filter(n => !n.isFilled).length > 0) || waliNotifications.length > 0) && (
                                <span className="absolute -top-1 -right-1 z-20 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-800 rounded-full px-[3px] bg-red-500">
                                    {notifications.filter(n => !n.isFilled).length + waliNotifications.length}
                                </span>
                            )}
                        </div>
                    )}
                     <button onClick={handleLogoutClick} className="w-9 h-9 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-[#475569] dark:text-slate-300 active:bg-gray-50 flex-shrink-0 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
                         <LogOut size={18} strokeWidth={2.5} className="ml-0.5" />
                     </button>
                 </div>
             </div>
             
             {/* Running Date & Time Bar */}
             <div className="px-4 pb-3">
                 <div className="bg-white dark:bg-slate-800 px-3 py-2.5 rounded-[14px] flex justify-between items-center text-[11px] font-bold text-[#0f172a] dark:text-slate-400 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
                     <div className="flex items-center gap-2">
                         <div className="w-7 h-7 rounded-[10px] bg-[#2563eb] text-white flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(37,99,235,0.4)]">
                             <Calendar size={14} strokeWidth={2.5} />
                         </div>
                         <span className="ml-1 tracking-wide">{formattedDate}</span>
                     </div>
                     <div className="flex items-center gap-1.5 font-mono text-[#2563eb] dark:text-blue-400 pr-1">
                         <Clock size={15} strokeWidth={2.5} />
                         <span className="text-[12px]">{formattedTime} WIB</span>
                     </div>
                 </div>
             </div>
          </div>

          {/* DESKTOP TOP BAR */}
          <div className="hidden md:flex justify-between items-center sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-8 py-3 pt-[calc(env(safe-area-inset-top)+0.25rem)]">
              <div className="flex items-center gap-3 text-sm font-bold">
                  <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800/50 shadow-sm">
                      <span className="text-blue-400 dark:text-blue-500">T.A:</span> {academicYear}
                  </div>
                  <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-xl border border-purple-100 dark:border-purple-800/50 shadow-sm">
                      <span className="text-purple-400 dark:text-purple-500">Semester:</span> {semester}
                  </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                  {!isAdmin && !isOperator && !isHeadmaster && (
                      <div className="relative group hover:scale-105 transition-transform">
                          <div className="absolute inset-0 rounded-full overflow-hidden shadow-sm">
                              <div className="w-full h-full bg-blue-400 animate-ping opacity-30"></div>
                          </div>
                          <button onClick={() => openNotifModal()} className="relative z-10 w-[34px] h-[34px] m-[2px] bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-500 dark:text-blue-400 border border-slate-200 dark:border-slate-600 transition-transform active:scale-95">
                              <Bell size={16} className="animate-bell-ring text-blue-500 dark:text-blue-400" />
                          </button>
                          {((notifications.filter(n => !n.isFilled).length > 0) || waliNotifications.length > 0) && (
                              <span className="absolute -top-1 -right-1 z-20 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-800 rounded-full px-[3px] bg-red-500">
                                  {notifications.filter(n => !n.isFilled).length + waliNotifications.length}
                              </span>
                          )}
                      </div>
                  )}
                  
                  <span>{formattedDate}</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">{formattedTime} WIB</span>
                  <button onClick={handleLogoutClick} className="w-9 h-9 ml-2 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600 flex-shrink-0">
                      <LogOut size={18}/>
                  </button>
              </div>
          </div>

          {/* PAGE CONTENT */}
          <div className="p-4 md:p-8 max-w-[1920px] w-full mx-auto pb-28 md:pb-10 page-enter text-slate-800 dark:text-slate-100">
            {children}
          </div>

          {/* SCROLL TO TOP BUTTON (FLOATING) */}
          {showScrollTop && (
              <button 
                  onClick={scrollToTop}
                  className="fixed bottom-24 md:bottom-10 right-6 z-40 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all animate-fade-in hover:scale-110"
                  title="Kembali ke Atas"
              >
                  <ArrowUp size={24} />
              </button>
          )}
      </main>

      {/* --- MOBILE BOTTOM NAV (FLUTTER STYLE ANIMATED) --- */}
      {showNav && !isOperator && !isAdmin && (
        <div className="md:hidden fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
            <div className="relative pointer-events-auto p-[2px] rounded-full overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-w-[95vw] group">
                {/* Animated Glow Border */}
                
                <nav className="relative z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-[32px] flex items-center justify-around px-2 w-full h-[76px] border border-slate-200/50 dark:border-slate-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                <BottomNavItem path="/dashboard" label="Beranda" icon={LayoutDashboard} />

                {!isHeadmaster && (
                    <BottomNavItem path="/apps" label="KBM" icon={LayoutGrid} />
                )}

                {isHeadmaster && (
                    <BottomNavItem path="/kinerja" label="Kinerja" icon={Activity} />
                )}

                <BottomNavItem path="/profile" label="Akun" icon={User} />
            </nav>
            </div>
        </div>
      )}
  
      {/* Mobile Nav for Admin */}
      {showNav && isAdmin && (
           <div className="md:hidden fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
                <nav className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex items-center justify-around px-2 pointer-events-auto w-full max-w-[340px] h-[76px] relative">
                    <BottomNavItem path="/dashboard" label="Beranda" icon={LayoutDashboard} />
                    <BottomNavItem path="/penyimpanan" label="Buat T.A" icon={Database} />
                    <BottomNavItem path="/settings" label="Pengaturan" icon={Settings} />
                    <BottomNavItem path="/profile" label="Akun" icon={User} />
                </nav>
           </div>
      )}
      {/* Mobile Nav for Operator */}
      {showNav && isOperator && !isAdmin && (
           <div className="md:hidden fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
                <nav className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex items-center justify-around px-2 pointer-events-auto w-full max-w-[340px] h-[76px] relative">
                    <BottomNavItem path="/operator-dashboard" label="Monitor" icon={MonitorPlay} />
                    <BottomNavItem path="/profile" label="Akun" icon={User} />
                </nav>
           </div>
      )}

      {/* LOGOUT MODAL - TOP POSITIONED (MODERN) */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-start pt-16 md:pt-10 p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in w-screen h-[100dvh]" onClick={() => setShowLogoutModal(false)}>
           <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-5 transform scale-100 transition-all border border-slate-100 dark:border-slate-600 relative overflow-hidden group" onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
              
              <div className="flex gap-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <LogOut size={24} className="translate-x-0.5"/>
                  </div>
                  <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Konfirmasi Keluar</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Yakin ingin mengakhiri sesi ini?</p>
                  </div>
              </div>

              <div className="flex gap-3 mt-6 pl-16">
                  <button 
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 py-2 rounded-lg font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={confirmLogout}
                    className="flex-1 py-2 rounded-lg font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-colors"
                  >
                    Ya, Keluar
                  </button>
              </div>
           </div>
        </div>
      )}

    
      {showNotifModal && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowNotifModal(false)}>
           <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl w-full max-w-sm rounded-3xl shadow-2xl p-5 transform scale-100 transition-all border border-white/50 dark:border-slate-700/50 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100 dark:border-slate-700">
                  <div>
                      <h3 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2"><Bell size={20} className="text-blue-500"/> Jadwal Mengajar</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Klik salah satu untuk mengisi Jurnal Pembelajaran!</p>
                  </div>
                  <button onClick={() => setShowNotifModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-600 p-1 rounded-full transition-colors"><X size={20}/></button>
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                  <div>
                    {notifications.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Tidak ada jadwal mengajar hari ini.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                        {notifications.map((n, i) => (
                            <button 
                                key={i} 
                                onClick={() => { setShowNotifModal(false); navigate('/jurnal', { state: { scheduleId: n.id } }); }}
                                className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 transition-colors text-left group"
                            >
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{n.subject} - Kelas {n.kelas}</p>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Jam ke-{n.hour}</p>
                                </div>
                                <div>
                                    {n.isFilled ? (
                                        <CheckCircle2 size={24} className="text-emerald-500" />
                                    ) : (
                                        <XCircle size={24} className="text-red-500" />
                                    )}
                                </div>
                            </button>
                        ))}
                        </div>
                    )}
                  </div>

                  {waliNotifications.length > 0 && (
                      <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><Bell size={16} className="text-amber-500"/> Notifikasi Wali Kelas</h4>
                          <div className="space-y-2">
                              {waliNotifications.map((wn, i) => (
                                  <div key={'wn'+i} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{wn.studentName}</p>
                                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">{wn.message}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
           </div>
        </div>
      )}

    </div>
    </>
  );
};
