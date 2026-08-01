const fs = require('fs');
let code = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');

// replace imports to include necessary hooks and icons
code = code.replace(/import \{.*?\} from 'lucide-react';/s, `import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { getWIBDate, getWIBISOString } from '../utils/dateUtils';
import {   ChevronRight, BookOpenText, TrendingUp, UserCheck, ShieldAlert, ScanLine, Compass, Database, UserCog, CalendarRange, GraduationCap, Settings, UserMinus, Keyboard, Sun, BookOpen, Users, FileText, Star, Clock, Check} from 'lucide-react';`);

const hookInjection = `  const [stats, setStats] = useState({ totalJp: 0, targetJp: 0, totalMeetings: 0 });
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
                const parts = j.hours.split(',').filter((h) => h.trim().length > 0);
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
                const jpCount = s.hour.split(',').filter((h) => h.trim()).length;
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

  const getGreeting = () => {
      const hour = getWIBDate().getHours();
      if (hour < 11) return 'Selamat Pagi';
      if (hour < 15) return 'Selamat Siang';
      if (hour < 18) return 'Selamat Sore';
      return 'Selamat Malam';
  };
  const greeting = getGreeting();
  
  const currentMonthName = getWIBDate().toLocaleDateString('id-ID', { month: 'long' });

  let performanceStatus = "TIDAK ADA DATA";
  let performanceColor = "text-slate-400";
  
  if (stats.targetJp > 0) {
      const percentage = (stats.totalJp / stats.targetJp) * 100;
      if (percentage >= 90) {
          performanceStatus = "SANGAT BAIK";
          performanceColor = "text-emerald-500";
      } else if (percentage >= 70) {
          performanceStatus = "BAIK";
          performanceColor = "text-blue-500";
      } else {
          performanceStatus = "DI BAWAH EKSPEKTASI";
          performanceColor = "text-orange-500";
      }
  }

  // Header UI Block
  const headerUI = !isAdmin ? (
      <div className="bg-gradient-to-br from-[#1281ff] via-[#1070e0] to-[#0a5abf] dark:from-blue-900 dark:to-blue-950 rounded-[1.75rem] p-5 md:p-8 text-white shadow-[0_8px_30px_rgba(18,129,255,0.3)] dark:shadow-none relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 bottom-0 w-1/2 overflow-hidden pointer-events-none">
                 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
                 <div className="absolute bottom-10 right-0 w-32 h-32 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)', backgroundSize: '10px 10px' }}></div>
                 <Clock size={220} strokeWidth={1} className="absolute top-6 -right-12 opacity-15 text-white" />
                 <svg className="absolute bottom-0 right-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                     <path d="M0,100 C30,80 70,80 100,100 L100,100 Z" fill="white" />
                     <path d="M20,100 C50,60 90,60 100,80 L100,100 Z" fill="white" />
                 </svg>
            </div>
            
            <div className="relative z-10 flex flex-col items-start gap-4 w-full">
                <div className="flex items-center gap-4 w-full">
                    <div className="flex-shrink-0">
                        <div className="w-[88px] h-[88px] rounded-full border-4 border-white shadow-sm overflow-hidden bg-white flex items-center justify-center">
                            {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <UserCog size={40} className="text-slate-300" />}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        <p className="text-white text-[13px] mb-0.5 tracking-wide">{greeting},</p>
                        <h1 className="text-[22px] md:text-2xl font-bold mb-1 leading-tight tracking-tight">{profile?.full_name}</h1>
                        <p className="text-white/80 text-[13px] mb-2 font-mono tracking-wide">{profile?.nip || 'NIP -'}</p>
                        <div className="flex flex-wrap gap-2">
                            {profile?.mengajar_mapel && <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider"><BookOpen size={12} className="mr-1.5 opacity-90" strokeWidth={2.5}/> {profile.mengajar_mapel}</span>}
                        </div>
                    </div>
                </div>
                
                <div className="w-full mt-2 relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-4 mt-2">
                        <div className="h-[1px] w-12 bg-gradient-to-l from-white/60 to-transparent"></div>
                        <p className="text-[12px] font-semibold text-white/95">Kinerja Bulan {currentMonthName}</p>
                        <div className="h-[1px] w-12 bg-gradient-to-r from-white/60 to-transparent"></div>
                    </div>
                    
                    <div className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.1)] relative overflow-hidden group">
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            <div className="flex flex-row items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-full border border-blue-100 bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                                    <Users size={20} strokeWidth={2} />
                                </div>
                                <span className="text-[36px] font-medium text-blue-600 leading-none tracking-tight">{stats.totalMeetings}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Pertemuan</span>
                            <div className="absolute right-0 top-[10%] bottom-[10%] w-[1px] bg-slate-100"></div>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            <div className="flex flex-row items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                                    <FileText size={20} strokeWidth={2} />
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[36px] font-medium text-emerald-600 leading-none tracking-tight">{stats.totalJp}</span>
                                    <span className="text-[16px] font-medium text-slate-400">/{stats.targetJp}</span>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total JP</span>
                            <div className="absolute right-0 top-[10%] bottom-[10%] w-[1px] bg-slate-100"></div>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-10 h-10 mb-2 rounded-full border border-orange-100 bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm">
                                <Star size={20} strokeWidth={2} />
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <span className={"text-[10px] font-bold leading-[1.3] uppercase text-center tracking-wide " + performanceColor}>
                                    {performanceStatus.split(' ').map((word, i) => <span key={i}>{word}<br/></span>)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
  ) : null;`;

code = code.replace(/const isDhuhaTeacher = profile\?.mengajar_mapel\?.toLowerCase\(\)\.includes\('dhuha'\);/, `const isDhuhaTeacher = profile?.mengajar_mapel?.toLowerCase().includes('dhuha');\n${hookInjection}`);

// AppCard redesign
const appCardRegex = /const AppCard = \(\{ label, subLabel, icon: Icon, path, gradientClass, shadowColor = '' \}: any\) => \{(.|\n)*?return \((.|\n)*?\n\s+ \};\n/m;
const newAppCard = `  const AppCard = ({ label, subLabel, icon: Icon, path, colorClass }: any) => {
    return (
    <button
      onClick={() => navigate(path)}
      className="bg-white dark:bg-slate-800 rounded-[24px] pt-7 pb-6 px-4 flex flex-col items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 w-full relative overflow-hidden group text-center min-h-[140px]"
    >
      <div className={\`w-16 h-16 shrink-0 flex items-center justify-center rounded-[18px] \${colorClass} transition-transform duration-500 group-hover:scale-105 mb-4\`}>
         <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
      </div>
      
      <div className="relative z-10 w-full">
          <h3 className="text-[13px] md:text-[14px] font-bold text-slate-800 dark:text-white tracking-tight leading-tight mb-1.5">{label}</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed opacity-80">{subLabel?.replace(/\\n/g, ' ')}</p>
      </div>
    </button>
  );
  };
`;
code = code.replace(appCardRegex, newAppCard);

const nonAdminGridRegex = /<AppCard\s*label="Isi Jurnal"(.*?)\/>\s*<AppCard\s*label="Jadwalku"(.*?)\/>\s*(\{isDhuhaTeacher(.|\n)*?\})\s*<AppCard\s*label="Kehadiran"(.*?)\/>\s*<AppCard\s*label="Ketidakhadiran"(.*?)\/>\s*<AppCard\s*label="Laporan"(.*?)\/>\s*<AppCard\s*label="Pelanggaran"(.*?)\/>\s*<AppCard\s*label="Presensi QR"(.*?)\/>/m;

const newNonAdminGrid = `<AppCard 
                        label="Isi Jurnal" subLabel="INPUT KBM HARIAN" 
                        icon={BookOpenText} 
                        path="/jurnal" 
                        colorClass="bg-[#2563eb]" 
                    />
                    <AppCard 
                        label="Jadwalku" subLabel="JADWAL MENGAJAR" 
                        icon={Compass} 
                        path="/jadwal" 
                        colorClass="bg-[#6366f1]" 
                    />
                    <AppCard 
                        label="Kehadiran" subLabel="REKAP ABSENSI MAPEL" 
                        icon={UserCheck} 
                        path="/rekap-absensi" 
                        colorClass="bg-[#10b981]" 
                    />
                    <AppCard 
                        label="Ketidakhadiran" subLabel="UNTUK RAPOR" 
                        icon={UserMinus} 
                        path="/absensi-rapor" 
                        colorClass="bg-[#f43f5e]" 
                    />
                    <AppCard 
                        label="Laporan" subLabel="CETAK JURNAL" 
                        icon={TrendingUp} 
                        path="/laporan" 
                        colorClass="bg-[#f59e0b]" 
                    />
                    <AppCard 
                        label="Pelanggaran" subLabel="TEMUAN DI LUAR KBM" 
                        icon={ShieldAlert} 
                        path="/kedisiplinan" 
                        colorClass="bg-[#ef4444]" 
                    />
                    <AppCard 
                        label="Presensi QR" subLabel="SCAN KEHADIRAN" 
                        icon={ScanLine} 
                        path="/qr" 
                        colorClass="bg-[#475569]" 
                    />`;

code = code.replace(nonAdminGridRegex, newNonAdminGrid);

// Update grid cols to 3 columns and inject headerUI
const gridContainerRegex = /<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">/;
code = code.replace(gridContainerRegex, `{headerUI}\n            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 pt-2">`);

fs.writeFileSync('pages/AppsMenu.tsx', code);
