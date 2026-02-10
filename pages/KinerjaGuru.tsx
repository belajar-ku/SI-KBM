
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { Activity, Calendar, Search, Loader2, X } from 'lucide-react';
import { Profile, Schedule } from '../types';

interface TeacherPerformanceData extends Profile {
    targetJp: number;
    actualJp: number;
    statusKinerja: string;
    statusColor: string;
}

const KinerjaGuru: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [teachersData, setTeachersData] = useState<TeacherPerformanceData[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<TeacherPerformanceData[]>([]);
  const [hmSearch, setHmSearch] = useState('');
  
  // Filter Month
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTeacherSchedule, setSelectedTeacherSchedule] = useState<{teacher: Profile, schedules: Schedule[] } | null>(null);

  const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayName = (num: number) => ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][num];

  useEffect(() => {
      fetchHeadmasterData();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
      if (hmSearch) {
          const lower = hmSearch.toLowerCase();
          setFilteredTeachers(teachersData.filter(t => t.full_name?.toLowerCase().includes(lower) || t.mengajar_mapel?.toLowerCase().includes(lower)));
      } else {
          setFilteredTeachers(teachersData);
      }
  }, [hmSearch, teachersData]);

  const fetchHeadmasterData = async () => {
      setLoading(true);
      try {
          const firstDayDate = new Date(selectedYear, selectedMonth, 1);
          const firstDayStr = firstDayDate.toISOString();
          
          const lastDayDate = new Date(selectedYear, selectedMonth + 1, 0); 
          const endDayStr = lastDayDate.toISOString();

          const today = new Date();
          let endCalculationDay = lastDayDate.getDate(); 
          
          if (selectedYear === today.getFullYear() && selectedMonth === today.getMonth()) {
              endCalculationDay = today.getDate(); 
          } else if (selectedYear > today.getFullYear() || (selectedYear === today.getFullYear() && selectedMonth > today.getMonth())) {
              endCalculationDay = lastDayDate.getDate(); 
          }

          const [profilesRes, schedulesRes, journalsRes] = await Promise.all([
              supabase.from('profiles').select('*').neq('role', 'operator').order('full_name'),
              supabase.from('schedules').select('*'),
              supabase.from('journals')
                .select('teacher_id, hours')
                .gte('created_at', firstDayStr)
                .lte('created_at', endDayStr)
          ]);

          const excludedNames = ['Guru Baru', 'Agung Budiartati, M.Pd.'];
          const allTeachers = (profilesRes.data || []).filter(t => !excludedNames.includes(t.full_name));
          const allSchedules = schedulesRes.data || [];
          const allJournals = journalsRes.data || [];

          const dayCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
          
          for (let d = 1; d <= endCalculationDay; d++) {
              const tempDate = new Date(selectedYear, selectedMonth, d);
              const jsDay = tempDate.getDay(); 
              const dbDay = jsDay === 0 ? 7 : jsDay;
              dayCounts[dbDay]++;
          }

          const processed: TeacherPerformanceData[] = allTeachers.map(t => {
              const mySchedules = allSchedules.filter(s => s.teacher_id === t.id);
              let target = 0;
              mySchedules.forEach(s => {
                  const jpCount = s.hour.split(',').filter((h: string) => h.trim()).length;
                  const occurrences = dayCounts[s.day_of_week] || 0;
                  target += (jpCount * occurrences);
              });

              const myJournals = allJournals.filter(j => j.teacher_id === t.id);
              let actual = 0;
              myJournals.forEach(j => {
                  const parts = j.hours.split(',').filter((h: string) => h.trim().length > 0);
                  actual += parts.length;
              });

              const percentage = target > 0 ? (actual / target) * 100 : 0;
              let status = "Di Bawah Ekspektasi";
              let color = "text-red-600 bg-red-50 border-red-100";
              
              if (target === 0 && actual === 0) {
                  status = "Tidak Ada Jadwal";
                  color = "text-gray-500 bg-gray-50 border-gray-100";
              } else if (percentage > 85) { 
                  status = "Di Atas Ekspektasi"; 
                  color = "text-emerald-600 bg-emerald-50 border-emerald-100"; 
              } else if (percentage >= 70) { 
                  status = "Sesuai Ekspektasi"; 
                  color = "text-blue-600 bg-blue-50 border-blue-100"; 
              }

              return {
                  ...t,
                  targetJp: target,
                  actualJp: actual,
                  statusKinerja: status,
                  statusColor: color
              };
          });

          setTeachersData(processed);
      } catch(e) {
          console.error("Headmaster Fetch Error", e);
      } finally {
          setLoading(false);
      }
  };

  const handleViewSchedule = async (teacher: Profile) => {
      setLoading(true);
      try {
          const { data } = await supabase.from('schedules').select('*').eq('teacher_id', teacher.id).order('day_of_week').order('hour');
          setSelectedTeacherSchedule({ teacher, schedules: data || [] });
          setShowScheduleModal(true);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
  };

  return (
    <Layout>
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-blue-600" /> Monitoring Kinerja Guru
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Analisis target vs realisasi jam mengajar bulan {monthNames[selectedMonth]} {selectedYear}
                    </p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    {/* Month Selector */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                        <select 
                            className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-white"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        >
                            {monthNames.map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Cari Guru / Mapel..."
                            value={hmSearch}
                            onChange={(e) => setHmSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table Guru */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Nama Guru</th>
                                <th className="px-6 py-4">Mata Pelajaran</th>
                                <th className="px-6 py-4 text-center">Wali Kelas</th>
                                <th className="px-6 py-4 text-center">Jadwal</th>
                                <th className="px-6 py-4 text-center">Realisasi JP</th>
                                <th className="px-6 py-4">Status Kinerja</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500"/></td></tr>
                            ) : filteredTeachers.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">Tidak ada data guru ditemukan.</td></tr>
                            ) : (
                                filteredTeachers.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 dark:text-white">{t.full_name}</div>
                                            <div className="text-xs text-slate-400 font-mono">{t.nip}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {t.mengajar_mapel ? t.mengajar_mapel.split(',').map((m,i) => (
                                                <span key={i} className="inline-block bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px] mr-1 mb-1">{m.trim()}</span>
                                            )) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {t.wali_kelas ? <span className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 px-2 py-1 rounded font-bold text-xs">{t.wali_kelas}</span> : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleViewSchedule(t)}
                                                className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                                title="Lihat Jadwal"
                                            >
                                                <Calendar size={16} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="font-bold text-slate-700 dark:text-slate-200">
                                                {t.actualJp} <span className="text-slate-400 font-normal">/ {t.targetJp}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${t.statusColor} uppercase tracking-wide`}>
                                                {t.statusKinerja}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL JADWAL GURU */}
            {showScheduleModal && selectedTeacherSchedule && (
                <div className="fixed inset-0 z-50 flex justify-end items-stretch p-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowScheduleModal(false)}>
                    <style>{`
                        @keyframes slideInRight {
                            from { transform: translateX(100%); }
                            to { transform: translateX(0); }
                        }
                        .animate-slide-in-right {
                            animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        }
                    `}</style>
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md h-full shadow-2xl overflow-hidden flex flex-col animate-slide-in-right border-l border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                        <div className="bg-white dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                            <div>
                                <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">Jadwal Mengajar</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{selectedTeacherSchedule.teacher.full_name}</p>
                            </div>
                            <button onClick={() => setShowScheduleModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"><X size={24}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-900">
                            {selectedTeacherSchedule.schedules.length === 0 ? (
                                <div className="text-center text-slate-400 py-10 italic">Belum ada jadwal untuk guru ini.</div>
                            ) : (
                                <div className="space-y-4">
                                    {[1,2,3,4,5,6].map(day => {
                                        const dayScheds = selectedTeacherSchedule.schedules.filter(s => s.day_of_week === day);
                                        if(dayScheds.length === 0) return null;
                                        return (
                                            <div key={day} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                                    <Calendar size={16} className="text-blue-500"/>
                                                    {dayName(day)}
                                                </h4>
                                                <div className="space-y-2">
                                                    {dayScheds.map(sch => (
                                                        <div key={sch.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-800">
                                                                    Jam {sch.hour}
                                                                </span>
                                                                <div>
                                                                    <div className="font-bold text-slate-800 dark:text-white text-sm">{sch.subject}</div>
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400">Kelas {sch.kelas}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </Layout>
  );
};

export default KinerjaGuru;
