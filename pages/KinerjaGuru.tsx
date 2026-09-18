
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Activity, Calendar, Search, Loader2, X, Table, CheckCircle2, AlertCircle } from 'lucide-react';
import { Profile, Schedule } from '../types';
import { useNavigate } from 'react-router-dom';
import { fetchNonEffectiveData, calculateTeacherTargetJp, getMonthEfficiencyStats } from '../utils/performanceUtils';

interface TeacherPerformanceData extends Profile {
    targetJp: number;
    actualJp: number;
    deductedJp: number;
    statusKinerja: string;
    statusColor: string;
}

const KinerjaGuru: React.FC = () => {
  const { academicYear, semester, activeScheduleVersion, semesterStart, semesterEnd } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teachersData, setTeachersData] = useState<TeacherPerformanceData[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<TeacherPerformanceData[]>([]);
  const [hmSearch, setHmSearch] = useState('');
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); 
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [nonEffectiveCount, setNonEffectiveCount] = useState(0);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTeacherSchedule, setSelectedTeacherSchedule] = useState<{teacher: Profile, schedules: Schedule[] } | null>(null);

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dayName = (num: number) => ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][num];

  useEffect(() => { fetchHeadmasterData(); }, [selectedMonth, selectedYear, academicYear, semester, activeScheduleVersion]);

  useEffect(() => {
      if (hmSearch) {
          const lower = hmSearch.toLowerCase();
          setFilteredTeachers(teachersData.filter(t => t.full_name?.toLowerCase().includes(lower) || t.mengajar_mapel?.toLowerCase().includes(lower)));
      } else { setFilteredTeachers(teachersData); }
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
          if (selectedYear === today.getFullYear() && selectedMonth === today.getMonth()) endCalculationDay = today.getDate(); 
          else if (selectedYear > today.getFullYear() || (selectedYear === today.getFullYear() && selectedMonth > today.getMonth())) endCalculationDay = lastDayDate.getDate(); 

          // Fetch Non-effective days and school activities from DB
          const { nonEffectiveDays, schoolActivities } = await fetchNonEffectiveData();
          const efficiency = getMonthEfficiencyStats(selectedYear, selectedMonth, endCalculationDay, nonEffectiveDays, schoolActivities);
          setNonEffectiveCount(efficiency.nonEffectiveCount);

          const [profilesRes, schedulesRes, journalsRes] = await Promise.all([
              supabase.from('profiles').select('*').neq('role', 'operator').order('full_name'),
              supabase.from('schedules').select('*').eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').eq('schedule_version', activeScheduleVersion || 'Utama').then(async (res) => {
                  if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year'))) {
                      const fallback = await supabase.from('schedules').select('*');
                      if (fallback.data && fallback.data.length > 0 && fallback.data[0].academic_year !== undefined) {
                          fallback.data = fallback.data.filter(s => s.academic_year === (academicYear || '2025/2026') && s.semester === (semester || 'Ganjil'));
                      }
                      return fallback;
                  }
                  return res;
              }),
              supabase.from('journals').select('teacher_id, hours').eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').gte('created_at', semesterStart ? `${semesterStart}T00:00:00+07:00` : '2000-01-01T00:00:00+07:00').lte('created_at', semesterEnd ? `${semesterEnd}T23:59:59+07:00` : '2100-01-01T23:59:59+07:00').gte('created_at', firstDayStr).lte('created_at', endDayStr)
          ]);

          const excludedNames = ['Guru Baru', 'Agung Budiartati, M.Pd.', 'Dra.Laily Asriyah, M.Pd.I.'];
          const allTeachers = (profilesRes.data || []).filter(t => !excludedNames.includes(t.full_name));
          const allSchedules = schedulesRes.data || [];
          const allJournals = journalsRes.data || [];

          const processed: TeacherPerformanceData[] = allTeachers.map(t => {
              const mySchedules = allSchedules.filter(s => s.teacher_id === t.id);

              // Target calculation synchronously excluding non-effective days and activities
              const { targetJp, deductedJp } = calculateTeacherTargetJp(
                  mySchedules,
                  selectedYear,
                  selectedMonth,
                  endCalculationDay,
                  nonEffectiveDays,
                  schoolActivities
              );

              const myJournals = allJournals.filter(j => j.teacher_id === t.id);
              let actual = 0;
              myJournals.forEach(j => {
                  const parts = j.hours.split(',').filter((h: string) => h.trim().length > 0);
                  actual += parts.length;
              });
              const percentage = targetJp > 0 ? (actual / targetJp) * 100 : 0;
              let status = "Di Bawah Ekspektasi"; let color = "text-red-600 bg-red-50 border-red-100";
              if (targetJp === 0 && actual === 0) { status = "Tidak Ada Jadwal"; color = "text-gray-500 bg-gray-50 border-gray-100"; } 
              else if (percentage > 85) { status = "Di Atas Ekspektasi"; color = "text-emerald-600 bg-emerald-50 border-emerald-100"; } 
              else if (percentage >= 70) { status = "Sesuai Ekspektasi"; color = "text-blue-600 bg-blue-50 border-blue-100"; }
              return { ...t, targetJp, actualJp: actual, deductedJp, statusKinerja: status, statusColor: color };
          });
          setTeachersData(processed);
      } catch(e) { console.error("Headmaster Fetch Error", e); } finally { setLoading(false); }
  };

  const handleViewSchedule = async (teacher: Profile) => {
      setLoading(true);
      try {
          let { data, error } = await supabase.from('schedules').select('*').eq('teacher_id', teacher.id).eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').eq('schedule_version', activeScheduleVersion || 'Utama').order('day_of_week').order('hour');
          if (error && (error.code === '42703' || error.message?.includes('academic_year'))) {
              const res = await supabase.from('schedules').select('*').eq('teacher_id', teacher.id).order('day_of_week').order('hour');
              if (res.data && res.data.length > 0 && res.data[0].academic_year !== undefined) {
                  data = res.data.filter(s => s.academic_year === (academicYear || '2025/2026') && s.semester === (semester || 'Ganjil'));
              } else {
                  data = res.data;
              }
          }
          setSelectedTeacherSchedule({ teacher, schedules: data || [] });
          setShowScheduleModal(true);
      } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <Layout>
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-blue-600" /> Monitoring Kinerja Guru
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Evaluasi pemenuhan jam mengajar (JP) guru.</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        onClick={() => navigate('/rekap-kinerja')}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                    >
                        <Table size={15} />
                        <span>Tabel Rekap Bulanan</span>
                    </button>
                    <div className="flex items-center bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                            <input type="text" placeholder="Cari Guru..." className="pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 w-36 bg-transparent" value={hmSearch} onChange={(e) => setHmSearch(e.target.value)}/>
                        </div>
                        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <select className="py-1.5 px-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-transparent font-bold text-slate-700 dark:text-slate-200" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                            {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <select className="py-1.5 px-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-transparent font-bold text-slate-700 dark:text-slate-200" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Non Effective Day Banner */}
            <div className="bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>
                        Target JP dihitung otomatis dengan <strong>mengecualikan {nonEffectiveCount} hari non-efektif</strong> yang telah diatur oleh admin pada bulan {monthNames[selectedMonth]} {selectedYear}.
                    </span>
                </div>
                <button
                    onClick={() => navigate('/rekap-kinerja')}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-xs shrink-0 ml-3"
                >
                    Lihat Rincian Rekap &rarr;
                </button>
            </div>

            {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40}/></div> : filteredTeachers.length === 0 ? <div className="text-center py-20 text-slate-400 italic">Tidak ada data guru ditemukan.</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTeachers.map((teacher) => (
                        <div key={teacher.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3"><div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">{teacher.full_name?.charAt(0)}</div><div className="flex-1 min-w-0"><h3 className="font-bold text-slate-800 truncate" title={teacher.full_name}>{teacher.full_name}</h3><p className="text-xs text-slate-500 truncate">{teacher.mengajar_mapel || 'Guru Mapel'}</p></div><div className={`text-[10px] font-bold px-2 py-1 rounded border ${teacher.statusColor}`}>{teacher.statusKinerja}</div></div>
                            <div className="grid grid-cols-2 gap-3 text-center"><div className="bg-slate-50 p-2 rounded-xl border border-slate-100"><span className="text-xs text-slate-400 font-bold uppercase block">Target JP</span><span className="text-xl font-extrabold text-slate-700">{teacher.targetJp}</span></div><div className="bg-slate-50 p-2 rounded-xl border border-slate-100"><span className="text-xs text-slate-400 font-bold uppercase block">Realisasi</span><span className={`text-xl font-extrabold ${teacher.actualJp >= teacher.targetJp ? 'text-green-600' : 'text-orange-500'}`}>{teacher.actualJp}</span></div></div>
                            <button onClick={() => handleViewSchedule(teacher)} className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors mt-auto">Lihat Jadwal</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Schedule Modal - TOP ALIGNED */}
            {showScheduleModal && selectedTeacherSchedule && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[calc(env(safe-area-inset-top)+1rem)] sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white dark:bg-slate-800 w-full md:w-auto md:max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 relative animate-fade-in flex flex-col max-h-[85vh]">
                        <div className="bg-blue-600 p-4 flex justify-between items-center text-white flex-shrink-0">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Calendar size={20}/> Jadwal Mengajar: {selectedTeacherSchedule.teacher.full_name}</h3>
                            <button onClick={() => setShowScheduleModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-800 flex-1">
                            {selectedTeacherSchedule.schedules.length === 0 ? <div className="text-center py-10 text-slate-400">Belum ada jadwal yang diinput.</div> : (
                                <div className="space-y-3">
                                    {selectedTeacherSchedule.schedules.map((s) => (
                                        <div key={s.id} className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm flex justify-between items-center">
                                            <div className="flex items-center gap-4"><div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold">{s.kelas}</div><div><p className="font-bold text-slate-800 dark:text-white">{s.subject}</p><p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{dayName(s.day_of_week)} • Jam {s.hour}</p></div></div>
                                        </div>
                                    ))}
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
