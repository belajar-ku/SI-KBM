
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { 
  User, Bell, Activity, CheckSquare, BookOpen, Clock
} from 'lucide-react';
import { getWIBDate, getWIBISOString, formatDateIndo } from '../utils/dateUtils';

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

        // 1. Fetch Journals for this month
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

        setStats({
            totalJp: jp,
            totalMeetings: meetings,
            classProgress: classMap
        });

        // 2. Fetch Wali Kelas Data
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

  const currentDate = getWIBDate();

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        
        {/* 1. IDENTITY CARD (Clean White) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100 flex-shrink-0">
                {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : (
                    <User size={36}/>
                )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
                <h1 className="text-xl font-extrabold text-slate-800 leading-tight">
                    {profile?.full_name}
                </h1>
                <p className="text-sm text-gray-500 font-bold font-mono mb-3 bg-gray-50 px-2 py-0.5 rounded inline-block mt-1">
                    {isAdmin ? 'Administrator' : (profile?.nip || 'NIP Belum Diset')}
                </p>
                
                {!isAdmin && (
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            {profile?.mengajar_mapel && (
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-md border border-blue-100 uppercase">
                                    {profile.mengajar_mapel}
                                </span>
                            )}
                            {profile?.wali_kelas && (
                                <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-md border border-orange-100 uppercase">
                                    Wali Kelas {profile.wali_kelas}
                                </span>
                            )}
                    </div>
                )}
            </div>
            <div className="hidden md:block text-right border-l border-gray-100 pl-6">
                <div className="text-lg font-bold text-gray-700 mb-1">{formatDateIndo(currentDate)}</div>
                <div className="text-xs text-green-700 font-bold bg-green-50 px-3 py-1 rounded-full inline-block border border-green-100">
                    Status: Aktif
                </div>
            </div>
        </div>

        {/* 2. NOTIFIKASI WALI KELAS */}
        {!isAdmin && profile?.wali_kelas && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-orange-50/50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
                    <h3 className="font-bold text-orange-800 text-sm flex items-center gap-2">
                        <Bell size={18} className="text-orange-600"/> 
                        Laporan Absensi Kelas {profile.wali_kelas}
                    </h3>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-orange-200 font-bold text-orange-700">Hari Ini</span>
                </div>
                <div className="p-6">
                    {homeroomAbsences.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                            <CheckSquare size={32} className="mb-2 opacity-50"/>
                            <p className="text-sm font-bold">Semua siswa hadir (Nihil).</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {homeroomAbsences.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-xs ${item.status === 'S' ? 'bg-yellow-400' : item.status === 'I' ? 'bg-blue-400' : 'bg-red-400'}`}>
                                        {item.status}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{item.student_name}</p>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                                            <span>{item.subject}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* 3. WIDGETS */}
        {!isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Activity Widget */}
                <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden flex flex-col justify-between h-64">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-blue-100">
                            <Activity size={20} />
                            <span className="text-xs font-bold uppercase tracking-wide">Aktivitas Mengajar</span>
                        </div>
                        <h2 className="text-7xl font-extrabold tracking-tight mt-1">{stats.totalMeetings}</h2>
                        <p className="text-sm text-blue-100 font-medium mt-1">Kali pertemuan bulan ini</p>
                    </div>
                    
                    <div className="relative z-10 pt-4 border-t border-blue-500 mt-2 flex items-center gap-3">
                         <div className="bg-blue-500/50 p-2.5 rounded-xl">
                            <Clock size={24} className="text-white"/>
                         </div>
                         <div>
                             <span className="text-3xl font-bold block leading-none mb-0.5">{stats.totalJp}</span>
                             <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Total Jam (JP)</span>
                         </div>
                    </div>
                    
                    <div className="absolute -right-5 -bottom-5 text-white opacity-10">
                        <Clock size={160} />
                    </div>
                </div>

                {/* Class Progress List */}
                <div className="bg-white rounded-3xl p-6 h-64 flex flex-col shadow-sm border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2 tracking-wide">
                        <BookOpen size={16} className="text-blue-500"/> Distribusi Kelas
                    </h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {Object.keys(stats.classProgress).length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm text-gray-400 font-medium italic">Belum ada data.</div>
                        ) : (
                            Object.entries(stats.classProgress).sort().map(([kelas, count]) => (
                                <div key={kelas} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-sm font-bold text-slate-700 border border-gray-100">
                                        {kelas}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xs font-bold text-slate-600">{count} Pertemuan</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-green-500 rounded-full" 
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
