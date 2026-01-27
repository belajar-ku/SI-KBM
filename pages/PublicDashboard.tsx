
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { PublicStats } from '../types';
import { LogIn, Loader2, BookOpen, AlertCircle, X, School, ChevronDown, ChevronRight, Bookmark } from 'lucide-react';
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
        // Initialize all classes with 0 absence
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
      // We pass the whole stats object to data for flexibility
      setModalContent({ title: 'Rincian Ketidakhadiran Hari Ini', type: 'absence', data: stats });
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
              // Priority: S > I > A > D (Keep the most relevant absence)
              // Actually logic: If current is Present/Dispen, overwrite with S/I/A. 
              // Simplification: just capture S/I/A
              if (['S','I','A'].includes(log.status)) {
                 uniqueStudentMap[log.student_id] = { name: log.student_name, status: log.status };
              }
          }
      });
      return Object.values(uniqueStudentMap).filter(s => ['S','I','A'].includes(s.status));
  };

  // Reusable Components
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
    // Changed justify-center to justify-start and added pt-[calc(env(safe-area-inset-top)+2rem)]
    <div className="min-h-screen flex flex-col items-center justify-start p-4 pt-[calc(env(safe-area-inset-top)+2rem)] font-sans bg-[#F0F4F8]">
      <main className="w-full max-w-md space-y-4">
        
        {/* HEADER CARD */}
        <div className="app-card p-5 flex items-center justify-between bg-white">
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
            <div className="app-card p-10 flex flex-col items-center justify-center text-gray-400 bg-white">
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
                <div className="app-card p-6 flex flex-col items-center justify-center text-center h-44 bg-white">
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
                    className="app-card p-6 flex flex-col items-center justify-center text-center h-44 transition-transform active:scale-95 bg-white group"
                >
                     <div className="mb-3 text-orange-500 group-hover:scale-110 transition-transform">
                        <AlertCircle size={40} strokeWidth={1.5} />
                     </div>
                     <span className="text-4xl font-extrabold text-orange-500 mb-1">{stats.absenceCount}</span>
                     <p className="text-xs font-bold text-gray-500 uppercase mt-1 leading-tight">Ketidakhadiran <br/> Murid</p>
                </button>
            </div>

            {/* PROGRESS BAR CARD */}
            <div className="app-card p-6 bg-white">
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
                    <LogIn size={24} /> Login Sebagai
                </button>
            </div>
          </>
        ) : <p className="text-center text-gray-400 text-sm mt-10">Gagal memuat data.</p>}
      </main>

      {/* MODAL */}
      {modalOpen && modalContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setModalOpen(false)}>
              <div className="app-card w-full max-w-sm flex flex-col max-h-[85vh] overflow-hidden bg-white rounded-3xl" onClick={e => e.stopPropagation()}>
                  
                  {/* Modal Header */}
                  <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                      <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{modalContent.title}</h3>
                      <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
                      
                      {/* TYPE CLASS (Simple Grid) */}
                      {modalContent.type === 'class' ? (
                          <div className="grid grid-cols-3 gap-3">
                              {modalContent.data.map(([cls, count]: any) => (
                                  <div key={cls} className="bg-white p-3 rounded-2xl text-center border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                                      <div className="font-extrabold text-slate-700 text-xl">{cls}</div>
                                      <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">{count} Murid</div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          
                        /* TYPE ABSENCE (Redesigned matching Screenshot) */
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center justify-center p-3 bg-yellow-50 rounded-2xl border border-yellow-100">
                                    <span className="text-yellow-700 font-bold text-[10px] uppercase mb-1">Sakit</span>
                                    <span className="text-3xl font-extrabold text-yellow-600">{modalContent.data.absenceDetails.S}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-2xl border border-blue-100">
                                    <span className="text-blue-700 font-bold text-[10px] uppercase mb-1">Izin</span>
                                    <span className="text-3xl font-extrabold text-blue-600">{modalContent.data.absenceDetails.I}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-3 bg-red-50 rounded-2xl border border-red-100">
                                    <span className="text-red-700 font-bold text-[10px] uppercase mb-1">Alpa</span>
                                    <span className="text-3xl font-extrabold text-red-600">{modalContent.data.absenceDetails.A}</span>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Class List (Accordion) */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Bookmark size={16} className="text-orange-500 fill-orange-500"/>
                                    <h4 className="font-bold text-slate-700 text-sm">Rincian Per Kelas</h4>
                                </div>
                                
                                <div className="space-y-3">
                                    {Object.keys(modalContent.data.classDetails).sort().map(cls => {
                                        const totalStudents = modalContent.data.classDetails[cls] || 0;
                                        const absentCount = modalContent.data.absencePerClass[cls] || 0;
                                        const presentCount = totalStudents - absentCount;
                                        const isExpanded = expandedClass === cls;

                                        return (
                                            <div key={cls} className="border border-gray-100 rounded-2xl overflow-hidden transition-all hover:shadow-sm">
                                                <button 
                                                    onClick={() => setExpandedClass(isExpanded ? null : cls)} 
                                                    className="w-full flex items-center p-3 bg-white"
                                                >
                                                    <div className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-xl font-bold text-slate-700 text-sm shadow-sm">
                                                        {cls}
                                                    </div>
                                                    <div className="flex-1 px-4 text-left">
                                                        <div className="flex items-center gap-2 text-xs font-bold">
                                                            <span className="text-green-600">{presentCount} Hadir</span>
                                                            <span className="text-gray-300">|</span>
                                                            <span className={absentCount > 0 ? "text-red-500" : "text-gray-400"}>
                                                                {absentCount} Tidak Hadir
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-gray-300">
                                                        {isExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                                                    </div>
                                                </button>

                                                {isExpanded && absentCount > 0 && (
                                                    <div className="bg-gray-50 p-3 border-t border-gray-100 space-y-2 animate-fade-in">
                                                        {getAbsentStudentsForClass(cls).map((s: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 text-xs shadow-sm">
                                                                <span className="font-bold text-slate-700">{s.name}</span>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.status === 'S' ? 'bg-yellow-100 text-yellow-700' : s.status === 'I' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {s.status === 'S' ? 'Sakit' : s.status === 'I' ? 'Izin' : 'Alpa'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {isExpanded && absentCount === 0 && (
                                                    <div className="bg-green-50 p-3 text-center text-xs text-green-700 font-bold border-t border-green-100">
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
    </div>
  );
};

export default PublicDashboard;
