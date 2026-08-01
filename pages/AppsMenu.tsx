import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

import { supabase } from '../services/supabase';
import { getWIBDate, getWIBISOString } from '../utils/dateUtils';
import { User, ChevronRight, BookOpenText, TrendingUp, UserCheck, ShieldAlert, ScanLine, Compass, Database, UserCog, CalendarRange, GraduationCap, Settings, UserMinus, Keyboard, Sun, BookOpen, Users, FileText, Star, Clock, Check } from 'lucide-react';

const AppsMenu: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, profile, academicYear, semester } = useAuth();

  // Logic to identify Dhuha Teacher
  const isDhuhaTeacher = profile?.mengajar_mapel?.toLowerCase().includes('dhuha');
  const [stats, setStats] = useState({ totalJp: 0, targetJp: 0, totalMeetings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && !isAdmin) {
        fetchDashboardData();
    } else {
        setLoading(false);
    }
  }, [profile, academicYear, semester]);

  const fetchDashboardData = async () => {
    try {
        const date = getWIBDate();
        const currentYear = date.getFullYear();
        const currentMonth = date.getMonth(); 
        
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const firstDayStr = firstDayOfMonth.toISOString();

        const { data: journals } = await supabase.from('journals').select('id, created_at, hours, kelas, material')
            .eq('teacher_id', profile?.id)
            .gte('created_at', firstDayStr);

        let jp = 0;
        let meetings = 0;

        if (journals) {
            meetings = journals.length;
            journals.forEach(j => {
                const parts = j.hours.split(',').filter((h: string) => h.trim().length > 0);
                jp += parts.length;
            });
        }

        let { data: mySchedules, error: mySchedError } = await supabase.from('schedules').select('day_of_week, hour')
            .eq('teacher_id', profile?.id)
            .eq('academic_year', academicYear || '2026/2027')
            .eq('semester', semester || 'Ganjil');
            
        if (mySchedError && mySchedError.message?.includes('academic_year')) {
            const fallback = await supabase.from('schedules').select('*').eq('teacher_id', profile?.id);
            if (fallback.data && fallback.data.length > 0 && fallback.data[0].academic_year !== undefined) {
                mySchedules = fallback.data.filter(s => s.academic_year === (academicYear || '2026/2027') && s.semester === (semester || 'Ganjil'));
            } else {
                mySchedules = fallback.data;
            }
        }

        let targetJp = 0;
        if (mySchedules) {
            const dayCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
            for (let d = 1; d <= date.getDate(); d++) {
                const tempDate = new Date(currentYear, currentMonth, d);
                const jsDay = tempDate.getDay(); 
                const dbDay = jsDay === 0 ? 7 : jsDay;
                dayCounts[dbDay as keyof typeof dayCounts]++;
            }
            mySchedules.forEach(s => {
                const jpCount = s.hour.split(',').filter((h: string) => h.trim()).length;
                const occurrences = dayCounts[s.day_of_week as keyof typeof dayCounts] || 0;
                targetJp += (jpCount * occurrences);
            });
        }
        setStats({ totalJp: jp, targetJp: targetJp, totalMeetings: meetings });
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const currentMonthName = getWIBDate().toLocaleDateString('id-ID', { month: 'long' });

  let performanceStatus = "TIDAK ADA DATA";
  let performanceColor = "text-slate-400";
  
  if (stats.targetJp > 0) {
      const percentage = (stats.totalJp / stats.targetJp) * 100;
      if (percentage >= 90) {
          performanceStatus = "DI ATAS EKSPEKTASI";
          performanceColor = "text-emerald-500";
      } else if (percentage >= 70) {
          performanceStatus = "SESUAI EKSPEKTASI";
          performanceColor = "text-blue-500";
      } else {
          performanceStatus = "DI BAWAH EKSPEKTASI";
          performanceColor = "text-orange-500";
      }
  }

  const getGreeting = () => {
      const hour = getWIBDate().getHours();
      if (hour < 11) return 'Selamat Pagi,';
      if (hour < 15) return 'Selamat Siang,';
      if (hour < 18) return 'Selamat Sore,';
      return 'Selamat Malam,';
  };
  const greeting = getGreeting();

  // Header UI Block
  const headerUI = !isAdmin ? (
<div className="bg-[#1281ff] rounded-[24px] md:rounded-[32px] p-4 md:p-8 text-white relative overflow-hidden mb-6">
            {/* Background pattern from the image */}
            <div className="absolute bottom-0 right-0 w-[60%] h-full pointer-events-none opacity-20">
                 <div className="absolute right-0 bottom-0 w-64 h-64" style={{ backgroundImage: 'radial-gradient(circle, white 2.5px, transparent 2.5px)', backgroundSize: '16px 16px' }}></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-start gap-4 w-full">
                <div className="flex items-center gap-3 md:gap-5 w-full md:pl-2">
                    <div className="flex-shrink-0">
                        <div className="w-[60px] h-[60px] md:w-[100px] md:h-[100px] rounded-full overflow-hidden bg-white flex items-center justify-center shadow-sm">
                            {profile?.avatar_url ? <img src={profile?.avatar_url} className="w-full h-full object-cover" /> : <User size={40} strokeWidth={1.5} className="text-slate-300 w-8 h-8 md:w-12 md:h-12" />}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0 overflow-hidden">
                        <p className="text-white/90 text-[9px] sm:text-[10px] md:text-[12px] mb-0 font-medium tracking-wide opacity-80">{greeting}</p>
                        <div className="w-full flex items-center">
                             <h1 className="font-bold mb-0.5 leading-tight whitespace-nowrap tracking-tight" style={{ fontSize: 'clamp(11px, 4vw, 24px)' }}>{profile?.full_name}</h1>
                        </div>
                        <p className="text-white/90 text-[10px] sm:text-[11px] md:text-[13px] mb-1.5 font-medium tracking-wide">{profile?.nip || 'NIP -'}</p>
                        <div className="flex flex-col items-start gap-1">
                            {profile?.mengajar_mapel && <span className="inline-flex items-start px-2 py-1 md:px-4 md:py-2 rounded-[24px] bg-white/20 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider max-w-full text-left leading-[1.3]"><BookOpen className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 mr-1 mt-[1px] shrink-0" strokeWidth={2.5}/> <span className="line-clamp-2 break-words">{profile.mengajar_mapel}</span></span>}
                            {profile?.wali_kelas && <span className="inline-flex items-center px-2 py-1 md:px-4 md:py-2 rounded-full bg-white/20 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider"><Users className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 mr-1" strokeWidth={2.5}/> Wali Kelas {profile.wali_kelas}</span>}
                        </div>
                    </div>
                </div>
                
                <div className="w-full mt-2 relative z-10">
                    <div className="flex items-center justify-center gap-2 md:gap-4 mb-3 md:mb-4 mt-1 md:mt-2">
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-white/60 to-transparent max-w-[80px] md:max-w-[100px]"></div>
                        <p className="text-[10px] sm:text-[11px] md:text-[13px] font-semibold text-white tracking-wide whitespace-nowrap">Kinerja Bulan {currentMonthName}</p>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/60 to-transparent max-w-[80px] md:max-w-[100px]"></div>
                    </div>
                    
                    <div className="bg-white rounded-[16px] md:rounded-[24px] p-2 sm:p-3 md:p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.1)] relative overflow-hidden">
                        <div className="flex-[1] flex flex-col items-center justify-center relative px-0.5 sm:px-1">
                            <div className="flex flex-row items-center gap-1 md:gap-3 mb-0.5 md:mb-1">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-full border border-blue-100 bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" strokeWidth={2} />
                                </div>
                                <span className="text-[20px] sm:text-[24px] md:text-[44px] font-medium text-blue-600 leading-none tracking-tight">{stats.totalMeetings}</span>
                            </div>
                            <span className="text-[7px] sm:text-[8px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 text-center">Pertemuan</span>
                            <div className="absolute right-0 top-[15%] bottom-[15%] w-[1px] bg-slate-100"></div>
                        </div>
                        
                        <div className="flex-[1] flex flex-col items-center justify-center relative px-0.5 sm:px-1">
                            <div className="flex flex-row items-center gap-1 md:gap-3 mb-0.5 md:mb-1">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" strokeWidth={2} />
                                </div>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-[20px] sm:text-[24px] md:text-[44px] font-medium text-emerald-600 leading-none tracking-tight">{stats.totalJp}</span>
                                    <span className="text-[10px] sm:text-[12px] md:text-[20px] font-medium text-slate-400">/{stats.targetJp}</span>
                                </div>
                            </div>
                            <span className="text-[7px] sm:text-[8px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 text-center">Total JP</span>
                            <div className="absolute right-0 top-[15%] bottom-[15%] w-[1px] bg-slate-100"></div>
                        </div>
                        
                        <div className="flex-[1] flex items-center justify-center gap-1 md:gap-3 pl-0.5 sm:pl-1">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-full border border-orange-100 bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                <Star className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6" strokeWidth={2} />
                            </div>
                            <span className={"text-[7px] sm:text-[8px] md:text-[11px] font-bold leading-[1.2] md:leading-[1.3] uppercase text-left tracking-wider max-w-[50px] sm:max-w-[65px] md:max-w-[90px] break-words " + performanceColor}>
                                {performanceStatus}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
  ) : null;

    const AppCard = ({ label, subLabel, icon: Icon, path, colorClass = "bg-blue-500" }: any) => {
    return (
    <button
      onClick={() => navigate(path)}
      className="bg-white dark:bg-slate-800 rounded-[20px] pt-7 pb-6 px-4 flex flex-col items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-50 dark:border-slate-700 hover:shadow-md transition-all duration-300 w-full relative overflow-hidden group text-center min-h-[135px]"
    >
      <div className={`w-[60px] h-[60px] shrink-0 flex items-center justify-center rounded-[16px] ${colorClass} transition-transform duration-500 group-hover:scale-105 mb-4`}>
         <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
      </div>
      
      <div className="relative z-10 w-full">
          <h3 className="text-[13px] md:text-[14px] font-bold text-slate-800 dark:text-white tracking-tight leading-tight mb-1.5">{label}</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed opacity-80">{subLabel?.replace(/\n/g, ' ')}</p>
      </div>
    </button>
  );
  };

  return (
    <Layout>
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
            
            {headerUI}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                {isAdmin ? (
                <>
                    <AppCard 
                        label="Import Master" 
                        subLabel="Database CSV"
                        icon={Database} 
                        path="/import-data" 
                        colorClass="bg-gradient-to-br from-rose-400 to-red-600" 
                    />
                    <AppCard 
                        label="Input Manual" 
                        subLabel="Input Massal CSV"
                        icon={Keyboard} 
                        path="/input-manual" 
                        colorClass="bg-gradient-to-br from-indigo-400 to-violet-600" 
                    />
                    <AppCard 
                        label="Jadwal Pelajaran" 
                        subLabel="Setup Jadwal"
                        icon={CalendarRange} 
                        path="/input-jadwal" 
                        colorClass="bg-gradient-to-br from-purple-400 to-fuchsia-600" 
                    />
                    <AppCard 
                        label="Manajemen User" 
                        subLabel="Akun Guru"
                        icon={UserCog} 
                        path="/users" 
                        colorClass="bg-gradient-to-br from-teal-400 to-emerald-600" 
                    />
                    <AppCard 
                        label="Data Murid" 
                        subLabel="Siswa & Mutasi"
                        icon={GraduationCap} 
                        path="/students" 
                        colorClass="bg-gradient-to-br from-blue-400 to-cyan-600" 
                    />
                    <AppCard 
                        label="Pengaturan" 
                        subLabel="Konfigurasi Umum"
                        icon={Settings} 
                        path="/settings" 
                        colorClass="bg-gradient-to-br from-slate-500 to-slate-700" 
                    />
                </>
                ) : (
<>
                    <AppCard 
                        label="Isi Jurnal" subLabel="INPUT KBM HARIAN" 
                        icon={BookOpen} 
                        path="/jurnal" 
                        colorClass="bg-blue-600" 
                    />
                    <AppCard 
                        label="Jadwalku" subLabel="JADWAL MENGAJAR" 
                        icon={Compass} 
                        path="/jadwal" 
                        colorClass="bg-indigo-500" 
                    />
                    {isDhuhaTeacher && (
                      <AppCard 
                          label="Presensi Dhuha" subLabel="REKAP KEHADIRAN" 
                          icon={Sun} 
                          path="/rekap-dhuha" 
                          colorClass="bg-purple-500" 
                      />
                    )}
                    <AppCard 
                        label="Kehadiran" subLabel="REKAP ABSENSI MAPEL" 
                        icon={UserCheck} 
                        path="/rekap-absensi" 
                        colorClass="bg-emerald-500" 
                    />
                    <AppCard 
                        label="Ketidakhadiran" subLabel="UNTUK RAPOR" 
                        icon={UserMinus} 
                        path="/absensi-rapor" 
                        colorClass="bg-rose-500" 
                    />
                    <AppCard 
                        label="Laporan" subLabel="CETAK JURNAL" 
                        icon={TrendingUp} 
                        path="/laporan" 
                        colorClass="bg-amber-500" 
                    />
                    <AppCard 
                        label="Pelanggaran" subLabel="TEMUAN DI LUAR KBM" 
                        icon={ShieldAlert} 
                        path="/kedisiplinan" 
                        colorClass="bg-red-500" 
                    />
                    <AppCard 
                        label="Presensi QR" subLabel="SCAN KEHADIRAN" 
                        icon={ScanLine} 
                        path="/qr" 
                        colorClass="bg-slate-600" 
                    />
                </>
                )}
            </div>
        </div>
    </Layout>
  );
};

export default AppsMenu;
