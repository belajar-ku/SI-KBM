
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { 
  User, Bell, Activity, CheckSquare, BookOpen, Clock
} from 'lucide-react';
import { getWIBDate, getWIBISOString } from '../utils/dateUtils';

interface MonthlyStats {
    totalJp: number;
    totalMeetings: number;
    classProgress: Record<string, number>;
}

interface WaliKelasAbsence {
    student_name: string;
    kelas: string;
    status: string;
    subject: string;
    teacher: string;
}

const Dashboard: React.FC = () => {
  const { isAdmin, profile } = useAuth();
  
  const [stats, setStats] = useState<MonthlyStats>({ totalJp: 0, totalMeetings: 0, classProgress: {} });
  const [homeroomAbsences, setHomeroomAbsences] = useState<WaliKelasAbsence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && !isAdmin) {
        fetchDashboardData();
    } else {
        setLoading(false);
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
        const date = getWIBDate();
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const todayStr = getWIBISOString();
        const startOfToday = `${todayStr}T00:00:00+07:00`;

        // 1. Fetch Journals for this month (Teacher)
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
                // Hitung JP
                const parts = j.hours.split(',').filter(h => h.trim().length > 0);
                jp += parts.length;
                
                // Hitung per Kelas
                classMap[j.kelas] = (classMap[j.kelas] || 0) + 1;
            });
        }

        setStats({
            totalJp: jp,
            totalMeetings: meetings,
            classProgress: classMap
        });

        // 2. Fetch Wali Kelas Data (If applicable)
        if (profile?.wali_kelas) {
            const { data: students } = await supabase
                .from('students')
                .select('id')
                .eq('kelas', profile.wali_kelas);
            
            if (students && students.length > 0) {
                const studentIds = students.map(s => s.id);
                
                const { data: absences } = await supabase
                    .from('attendance_logs')
                    .select('student_name, status, subject, teacher_name')
                    .in('student_id', studentIds)
                    .gte('created_at', startOfToday)
                    .neq('status', 'D')
                    .order('created_at', { ascending: false });

                if (absences) {
                    const formatted = absences.map((a: any) => ({
                        student_name: a.student_name,
                        kelas: profile.wali_kelas!,
                        status: a.status,
                        subject: a.subject || '-',
                        teacher: a.teacher_name || '-'
                    }));
                    setHomeroomAbsences(formatted);
                }
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        
        {/* 1. IDENTITAS (iOS Card Style) */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative overflow-hidden">
             <div className="flex items-center gap-5 relative z-10">
                <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-blue-400 to-indigo-500 shadow-lg shadow-blue-200">
                    <div className="w-full h-full rounded-full bg-white p-[2px] overflow-hidden">
                         {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
                         ) : (
                            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                                <User size={36}/>
                            </div>
                         )}
                    </div>
                </div>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-800 leading-tight mb-1">
                        {profile?.full_name}
                    </h1>
                    <p className="text-sm text-gray-400 font-medium mb-3">
                        {isAdmin ? 'Administrator' : (profile?.nip || 'User ID')}
                    </p>
                    
                    {!isAdmin && (
                        <div className="flex flex-col gap-1.5">
                             {profile?.mengajar_mapel && (
                                 <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full w-fit">
                                     <BookOpen size={12} className="text-blue-500"/> 
                                     <span>{profile.mengajar_mapel}</span>
                                 </div>
                             )}
                             {profile?.wali_kelas && (
                                 <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full w-fit">
                                     <User size={12} className="text-orange-500"/> 
                                     <span>Wali Kelas {profile.wali_kelas}</span>
                                 </div>
                             )}
                        </div>
                    )}
                </div>
             </div>
             {/* Decor */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-[4rem]"></div>
        </div>

        {/* 2. NOTIFIKASI WALI KELAS (Dynamic Island Style) */}
        {!isAdmin && profile?.wali_kelas && (
            <div className="bg-white/90 backdrop-blur-xl rounded-[1.8rem] shadow-sm border border-orange-100 overflow-hidden">
                <div className="bg-orange-50/80 p-4 border-b border-orange-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <Bell size={16} className="text-orange-500 fill-orange-500"/> 
                        Laporan Kelas {profile.wali_kelas}
                    </h3>
                    <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-orange-100 shadow-sm">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                         <span className="text-[10px] text-gray-500 font-bold">Live</span>
                    </div>
                </div>
                <div className="p-2">
                    {homeroomAbsences.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-xs">
                            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                <CheckSquare size={18} className="opacity-50"/>
                            </div>
                            Belum ada laporan ketidakhadiran hari ini.
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar p-1">
                            {homeroomAbsences.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm ${item.status === 'S' ? 'bg-yellow-400' : item.status === 'I' ? 'bg-blue-400' : 'bg-red-400'}`}>
                                        {item.status}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate">{item.student_name}</p>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                                            <span className="bg-gray-100 px-1.5 rounded">{item.subject}</span>
                                            <span>•</span>
                                            <span className="truncate">{item.teacher}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* 3. STATISTIK & PROGRES (iOS Widgets) */}
        {!isAdmin && (
            <div className="grid grid-cols-1 gap-5">
                {/* Large Activity Widget - School Colors */}
                <div className="bg-gradient-to-br from-blue-900 to-blue-600 rounded-[2rem] p-7 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden min-h-[160px] flex flex-col justify-between group">
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                             <div className="flex items-center gap-2 mb-1 opacity-80">
                                <Activity size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Aktivitas Bulan Ini</span>
                            </div>
                            <h2 className="text-5xl font-bold tracking-tighter">{stats.totalMeetings}</h2>
                            <p className="text-sm font-medium opacity-90 mt-1">Pertemuan KBM</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                             <Clock size={24} className="text-white"/>
                        </div>
                    </div>
                    
                    <div className="relative z-10 bg-black/20 backdrop-blur-sm rounded-xl p-3 mt-4 flex items-center justify-between border border-white/10">
                        <span className="text-xs font-medium">Total Durasi</span>
                        <span className="text-sm font-bold">{stats.totalJp} Jam Pelajaran (JP)</span>
                    </div>

                    {/* Background Decor */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute -left-10 bottom-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl"></div>
                </div>

                {/* Class Breakdown List */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                        Rincian Progres Kelas
                    </h3>
                    <div className="space-y-4">
                        {Object.keys(stats.classProgress).length === 0 ? (
                            <p className="text-xs text-gray-400 italic text-center py-4">Belum ada data KBM bulan ini.</p>
                        ) : (
                            Object.entries(stats.classProgress).sort().map(([kelas, count]) => (
                                <div key={kelas} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200 shadow-sm">
                                        {kelas}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-xs font-bold text-gray-500">Pertemuan</span>
                                            <span className="text-sm font-bold text-gray-800">{count}x</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" 
                                                style={{width: `${Math.min((count as number) * 5, 100)}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

      </div>
    </Layout>
  );
};

export default Dashboard;
