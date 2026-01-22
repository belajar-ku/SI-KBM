
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { PublicStats } from '../types';
import { LogIn, Loader2, BookOpen, AlertCircle, X, School, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { getWIBDate, getWIBISOString, formatDateIndo, formatTimeIndo } from '../utils/dateUtils';

const PublicDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(getWIBDate());
  
  // MODAL DATA
  const [rawAttendance, setRawAttendance] = useState<any[]>([]);
  const [studentClassMap, setStudentClassMap] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    type: 'class' | 'absence' | 'absence_detail';
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
            .subscribe();
        return () => { clearInterval(timer); supabase.removeChannel(channel); };
    }
    return () => clearInterval(timer);
  }, []);

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

    try {
        const [studentsRes, journalsRes, attendanceRes] = await Promise.all([
            supabase.from('students').select('id, kelas'),
            supabase.from('journals').select('hours').gte('created_at', startOfDay),
            supabase.from('attendance_logs').select('student_id, student_name, status, created_at').gte('created_at', startOfDay)
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

        setRawAttendance(attendanceRes.data || []);

        const studentStatusMap: Record<string, string[]> = {};
        if (attendanceRes.data) {
            attendanceRes.data.forEach((log: any) => {
                if (!studentStatusMap[log.student_id]) studentStatusMap[log.student_id] = [];
                studentStatusMap[log.student_id].push(log.status);
            });
        }

        let sCount = 0, iCount = 0, aCount = 0;
        const absencePerClass: Record<string, number> = {};
        Object.keys(classCounts).forEach(cls => absencePerClass[cls] = 0);

        Object.keys(studentStatusMap).forEach((studentId) => {
            const statuses = studentStatusMap[studentId];
            let finalStatus = '';
            if (statuses.includes('S')) { finalStatus = 'S'; sCount++; }
            else if (statuses.includes('I')) { finalStatus = 'I'; iCount++; }
            else if (statuses.includes('A')) { finalStatus = 'A'; aCount++; }
            
            if (finalStatus) {
                const cls = sClassMap[studentId];
                if (cls) absencePerClass[cls] = (absencePerClass[cls] || 0) + 1;
            }
        });

        setStats({
            count7: c7, count8: c8, count9: c9,
            classDetails: classCounts,
            totalJpRequired: 240, 
            completedJp: completedJp,
            absenceCount: sCount + iCount + aCount,
            absenceDetails: { S: sCount, I: iCount, A: aCount },
            absencePerClass: absencePerClass,
            unfilledKbm: []
        });
    } catch (err) { console.error(err); }
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
      setModalContent({ title: 'Rincian Ketidakhadiran', type: 'absence', data: stats.absenceDetails });
      setModalOpen(true);
  };

  const getAbsentStudentsForClass = (cls: string) => {
      const studentsInClass = rawAttendance.filter(log => studentClassMap[log.student_id] === cls);
      const uniqueStudentMap: Record<string, {name: string, status: string}> = {};
      
      studentsInClass.forEach(log => {
          if(!uniqueStudentMap[log.student_id]) {
              uniqueStudentMap[log.student_id] = { name: log.student_name, status: log.status };
          } else {
              const current = uniqueStudentMap[log.student_id].status;
              if (log.status === 'S' || (log.status === 'I' && current !== 'S') || (log.status === 'A' && current === 'D')) {
                  uniqueStudentMap[log.student_id] = { name: log.student_name, status: log.status };
              }
          }
      });
      return Object.values(uniqueStudentMap).filter(s => ['S','I','A'].includes(s.status));
  };

  // Reusable Components matching Screenshot
  const ClassCard = ({ label, count, colorClass, iconColorClass, onClick }: any) => (
      <button 
        onClick={onClick}
        className="app-card p-5 flex flex-col items-center justify-center text-center transition-transform active:scale-95 h-36"
      >
          <div className={`mb-2 text-3xl ${iconColorClass}`}>
              <School size={32} strokeWidth={1.5} />
          </div>
          <h2 className={`text-4xl font-extrabold ${colorClass} mb-1 tracking-tight`}>{count}</h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
      </button>
  );

  return (
    <div className="min-h-screen flex flex-col items-center p-4 font-sans">
      <main className="w-full max-w-md space-y-4">
        
        {/* HEADER CARD - Persis Screenshot */}
        <div className="app-card p-5 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="h-14 w-auto object-contain" />
                 <div>
                    <h1 className="text-md font-extrabold text-slate-800 leading-tight">UPT SMP NEGERI 1 <br/> PASURUAN</h1>
                    <p className="text-[10px] font-bold text-blue-600 mt-1">Sistem Informasi Kegiatan <br/> Belajar Mengajar (SI KBM)</p>
                 </div>
             </div>
             <div className="text-right">
                <p className="text-xs font-medium text-gray-500 mb-0.5">{formatDateIndo(time)}</p>
                <p className="text-2xl font-bold text-blue-500 font-mono tracking-tight leading-none">{formatTimeIndo(time)} <span className="text-xs font-bold">WIB</span></p>
             </div>
        </div>

        {loading ? (
            <div className="app-card p-10 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="animate-spin mb-3 text-blue-500" size={32} />
                <p className="text-xs font-bold">Memuat Data...</p>
            </div> 
        ) : stats ? (
          <>
            {/* ROW 1: STUDENT COUNTS (Grid 3) */}
            <div className="grid grid-cols-3 gap-3">
               <ClassCard 
                  label="Kelas 7" 
                  count={stats.count7} 
                  colorClass="text-blue-600" 
                  iconColorClass="text-blue-400"
                  onClick={() => handleClassClick('7')}
               />
               <ClassCard 
                  label="Kelas 8" 
                  count={stats.count8} 
                  colorClass="text-emerald-500" 
                  iconColorClass="text-emerald-400"
                  onClick={() => handleClassClick('8')}
               />
               <ClassCard 
                  label="Kelas 9" 
                  count={stats.count9} 
                  colorClass="text-red-500" 
                  iconColorClass="text-red-400"
                  onClick={() => handleClassClick('9')}
               />
            </div>

            {/* ROW 2: KBM & ABSENCE (Grid 2) */}
            <div className="grid grid-cols-2 gap-3">
                {/* KBM Card */}
                <div className="app-card p-6 flex flex-col items-center justify-center text-center h-44">
                     <div className="mb-3 text-purple-500">
                        <BookOpen size={40} strokeWidth={1.5} />
                     </div>
                     <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-4xl font-extrabold text-purple-600">{stats.completedJp}</span>
                        <span className="text-lg font-bold text-gray-400">/ {stats.totalJpRequired} JP</span>
                     </div>
                     <p className="text-xs font-bold text-gray-500 uppercase mt-1">KBM Terlaksana</p>
                </div>

                {/* Absence Card */}
                <button 
                    onClick={handleAbsenceClick}
                    className="app-card p-6 flex flex-col items-center justify-center text-center h-44 transition-transform active:scale-95"
                >
                     <div className="mb-3 text-orange-500">
                        <AlertCircle size={40} strokeWidth={1.5} />
                     </div>
                     <span className="text-4xl font-extrabold text-orange-500 mb-1">{stats.absenceCount}</span>
                     <p className="text-xs font-bold text-gray-500 uppercase mt-1 leading-tight">Ketidakhadiran <br/> Murid</p>
                </button>
            </div>

            {/* PROGRESS BAR CARD */}
            <div className="app-card p-6">
                <h3 className="font-bold text-gray-600 text-xs uppercase mb-3 text-center">Progress KBM Hari Ini</h3>
                <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden shadow-inner">
                    <div 
                      className="bg-blue-500 h-4 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.min((stats.completedJp / stats.totalJpRequired) * 100, 100)}%` }}
                    ></div>
                </div>
                <div className="text-left">
                    <span className="text-sm font-bold text-gray-700">
                        {((stats.completedJp / stats.totalJpRequired) * 100).toFixed(1)}% Terlaksana
                    </span>
                </div>
            </div>

            {/* LOGIN BUTTON */}
            <div className="pt-2">
                <button 
                    onClick={() => navigate('/login')} 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:translate-y-0.5 transition-all"
                >
                    <LogIn size={24} /> Login Guru
                </button>
            </div>
          </>
        ) : <p className="text-center text-gray-400 text-sm mt-10">Gagal memuat data.</p>}
      </main>

      {/* MODAL - Standard Clean Style */}
      {modalOpen && modalContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setModalOpen(false)}>
              <div className="app-card w-full max-w-sm flex flex-col max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                  
                  {/* Modal Header */}
                  <div className="flex justify-between items-center p-5 border-b border-gray-100">
                      <h3 className="font-bold text-slate-800 text-lg">{modalContent.title}</h3>
                      <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                          <X size={24} />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gray-50/50">
                      {modalContent.type === 'class' ? (
                          <div className="grid grid-cols-3 gap-3">
                              {modalContent.data.map(([cls, count]: any) => (
                                  <div key={cls} className="bg-white p-3 rounded-xl text-center border border-gray-100 shadow-sm">
                                      <div className="font-bold text-slate-700 text-xl">{cls}</div>
                                      <div className="text-[10px] text-gray-400 font-bold uppercase">{count} Siswa</div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-yellow-100 shadow-sm">
                                    <span className="text-yellow-600 font-bold text-[10px] uppercase mb-1">Sakit</span>
                                    <span className="text-2xl font-bold text-yellow-500">{modalContent.data.S}</span>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                                    <span className="text-blue-600 font-bold text-[10px] uppercase mb-1">Izin</span>
                                    <span className="text-2xl font-bold text-blue-500">{modalContent.data.I}</span>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-red-100 shadow-sm">
                                    <span className="text-red-600 font-bold text-[10px] uppercase mb-1">Alpa</span>
                                    <span className="text-2xl font-bold text-red-500">{modalContent.data.A}</span>
                                </div>
                            </div>

                            {stats && stats.absencePerClass && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Detail Per Kelas</h4>
                                    {Object.keys(stats.classDetails).sort().map(cls => {
                                        const absent = stats.absencePerClass[cls] || 0;
                                        if (absent === 0) return null;
                                        
                                        const isExpanded = expandedClass === cls;
                                        return (
                                            <div key={cls} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                                <button 
                                                    onClick={() => setExpandedClass(isExpanded ? null : cls)} 
                                                    className="w-full flex justify-between items-center p-3 hover:bg-gray-50 transition-colors"
                                                >
                                                    <span className="font-bold text-slate-700 text-sm bg-gray-100 px-2.5 py-1 rounded-md">{cls}</span>
                                                    <div className="flex items-center gap-2 text-xs font-bold">
                                                        <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded">{absent} Siswa</span>
                                                        {isExpanded ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronRight size={16} className="text-gray-400"/>}
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="bg-gray-50 p-3 border-t border-gray-100 space-y-2">
                                                        {getAbsentStudentsForClass(cls).map((s: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-100 text-xs shadow-sm">
                                                                <span className="font-bold text-slate-700">{s.name}</span>
                                                                <span className={`w-6 h-6 flex items-center justify-center rounded font-bold text-white ${s.status === 'S' ? 'bg-yellow-400' : s.status === 'I' ? 'bg-blue-400' : 'bg-red-500'}`}>
                                                                    {s.status}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {stats.absenceCount === 0 && <p className="text-center text-xs text-gray-400 italic py-2">Nihil (Semua hadir)</p>}
                                </div>
                            )}
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PublicDashboard;
