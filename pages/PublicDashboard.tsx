
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { PublicStats } from '../types';
import { LogIn, Loader2, Award, BookOpen, School, XCircle, AlertCircle, RefreshCw, User, ChevronRight, ChevronDown } from 'lucide-react';
import { getWIBDate, getWIBISOString, formatDateIndo, formatTimeIndo } from '../utils/dateUtils';

const PublicDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(getWIBDate());
  
  // RAW DATA STORAGE FOR MODAL DETAILS
  const [rawAttendance, setRawAttendance] = useState<any[]>([]);
  const [studentClassMap, setStudentClassMap] = useState<Record<string, string>>({});

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    type: 'class' | 'absence' | 'absence_detail';
    data: any;
  } | null>(null);

  // Accordion State for Absence List
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

        // Process Attendance
        setRawAttendance(attendanceRes.data || []); // Store raw for modal details

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
      setModalContent({ title: 'Rincian Ketidakhadiran Hari Ini', type: 'absence', data: stats.absenceDetails });
      setModalOpen(true);
  };

  // Helper to get specific students for accordion
  const getAbsentStudentsForClass = (cls: string) => {
      const studentsInClass = rawAttendance.filter(log => studentClassMap[log.student_id] === cls);
      const uniqueStudentMap: Record<string, {name: string, status: string}> = {};
      
      studentsInClass.forEach(log => {
          if(!uniqueStudentMap[log.student_id]) {
              uniqueStudentMap[log.student_id] = { name: log.student_name, status: log.status };
          } else {
              // Priority Update
              const current = uniqueStudentMap[log.student_id].status;
              if (log.status === 'S' || (log.status === 'I' && current !== 'S') || (log.status === 'A' && current === 'D')) {
                  uniqueStudentMap[log.student_id] = { name: log.student_name, status: log.status };
              }
          }
      });
      // Hanya tampilkan yang S, I, A (D tidak dihitung absen)
      return Object.values(uniqueStudentMap).filter(s => ['S','I','A'].includes(s.status));
  };

  const StatCard = ({ title, value, colorClass, icon: Icon, onClick }: any) => (
    <div onClick={onClick} className={`glassmorphism rounded-2xl p-4 text-center transform hover:-translate-y-1 transition duration-300 ${colorClass} cursor-pointer hover:shadow-lg active:scale-95`}>
      <div className="flex justify-center mb-2 opacity-80"><Icon size={24} /></div>
      <p className="text-3xl font-bold">{value}</p>
      <h3 className="font-semibold text-gray-500 text-sm mt-1">{title}</h3>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-12 relative">
      <main className="w-full max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="glassmorphism rounded-2xl p-4 flex justify-between items-center relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
             <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="h-16 w-auto" />
             <div>
                <h1 className="text-lg md:text-xl font-bold text-[#2c3e50] leading-tight">UPT SMP NEGERI 1 PASURUAN</h1>
                <p className="text-[10px] md:text-xs font-bold text-blue-600 mt-1">Sistem Informasi Kegiatan Belajar Mengajar (SI KBM)</p>
             </div>
          </div>
          <div className="text-right relative z-10">
            <p className="text-sm text-gray-600 font-medium">{formatDateIndo(time)}</p>
            <p className="text-xl font-ramping text-[#3498db] font-bold">{formatTimeIndo(time)} WIB</p>
          </div>
        </div>

        {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div> : stats ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <StatCard title="Kelas 7" value={stats.count7} colorClass="text-[#2980b9]" icon={School} onClick={() => handleClassClick('7')} />
              <StatCard title="Kelas 8" value={stats.count8} colorClass="text-[#27ae60]" icon={School} onClick={() => handleClassClick('8')} />
              <StatCard title="Kelas 9" value={stats.count9} colorClass="text-[#c0392b]" icon={School} onClick={() => handleClassClick('9')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="glassmorphism rounded-2xl p-4 text-center flex flex-col justify-center">
                  <BookOpen className="mx-auto text-[#8e44ad] mb-2" size={28} />
                  <p className="text-4xl font-bold text-[#8e44ad] mt-2 leading-none">
                    {stats.completedJp} <span className="text-2xl font-semibold text-gray-400">/ {stats.totalJpRequired} JP</span>
                  </p>
                  <h3 className="font-semibold text-gray-500 text-sm mt-1">KBM Terlaksana</h3>
               </div>
               
               <div onClick={handleAbsenceClick} className="glassmorphism rounded-2xl p-4 text-center flex flex-col justify-center cursor-pointer hover:bg-white/80 transition-colors group relative">
                  <AlertCircle className="mx-auto text-orange-500 mb-2 group-hover:scale-110 transition-transform" size={28} />
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.absenceCount}</p>
                  <h3 className="font-semibold text-gray-500 text-sm mt-1">Ketidakhadiran Murid</h3>
               </div>
            </div>
            
            {/* Progress Bar restored */}
            <div className="glassmorphism rounded-2xl p-4">
                <h3 className="font-semibold text-gray-500 text-sm text-center mb-2">Progress KBM Hari Ini</h3>
                <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ width: `${Math.min((stats.completedJp / stats.totalJpRequired) * 100, 100)}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-sm font-semibold mt-2 text-gray-600">
                    <span>{((stats.completedJp / stats.totalJpRequired) * 100).toFixed(1)}% Terlaksana</span>
                </div>
            </div>
          </>
        ) : <p>Error</p>}

        <div className="pt-4"><button onClick={() => navigate('/login')} className="w-full bg-[#3498db] hover:bg-[#2980b9] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><LogIn size={20} /> Login Guru</button></div>
      </main>

      {/* POPUP MODAL */}
      {modalOpen && modalContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setModalOpen(false)}>
              <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm transform scale-100 transition-all border border-white/20 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                      <h3 className="font-bold text-gray-800 text-lg">{modalContent.title}</h3>
                      <button onClick={() => setModalOpen(false)} className="bg-gray-100 p-1.5 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"><XCircle size={22} /></button>
                  </div>

                  <div className="overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                      {modalContent.type === 'class' ? (
                          <div className="grid grid-cols-3 gap-3">
                              {modalContent.data.map(([cls, count]: any) => (
                                  <div key={cls} className="bg-blue-50 p-3 rounded-2xl text-center border border-blue-100">
                                      <div className="font-bold text-blue-800 text-xl mb-1">{cls}</div>
                                      <div className="text-xs text-gray-600 font-medium bg-white rounded-full py-0.5 px-2 inline-block border border-blue-100">{count} Murid</div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          // Absence Summary with Accordion
                          <>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-2xl border border-yellow-100"><div className="text-xs font-bold text-yellow-700 uppercase mb-1">Sakit</div><div className="font-bold text-2xl text-yellow-600">{modalContent.data.S}</div></div>
                                <div className="flex flex-col items-center p-3 bg-blue-50 rounded-2xl border border-blue-100"><div className="text-xs font-bold text-blue-700 uppercase mb-1">Izin</div><div className="font-bold text-2xl text-blue-600">{modalContent.data.I}</div></div>
                                <div className="flex flex-col items-center p-3 bg-red-50 rounded-2xl border border-red-100"><div className="text-xs font-bold text-red-700 uppercase mb-1">Alpa</div><div className="font-bold text-2xl text-red-600">{modalContent.data.A}</div></div>
                            </div>

                            {stats && stats.absencePerClass && (
                                <div className="mt-2 pt-3 border-t border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Award size={16} className="text-orange-500"/> Rincian Per Kelas</h4>
                                    <div className="space-y-2">
                                        {Object.keys(stats.classDetails).sort().map(cls => {
                                            const total = stats.classDetails[cls];
                                            const absent = stats.absencePerClass[cls] || 0;
                                            const present = total - absent;
                                            const isExpanded = expandedClass === cls;
                                            
                                            return (
                                                <div key={cls} className="border border-gray-100 rounded-xl overflow-hidden">
                                                    <div 
                                                        onClick={() => setExpandedClass(isExpanded ? null : cls)} 
                                                        className={`flex justify-between items-center p-3 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-bold bg-white text-gray-800 px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm text-sm">{cls}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs font-medium">
                                                            <span className="text-green-600 font-bold">{present} Hadir</span>
                                                            <span className="text-gray-300">|</span>
                                                            <span className={absent > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}>{absent} Tidak Hadir</span>
                                                            {isExpanded ? <ChevronDown size={14} className="text-gray-400"/> : <ChevronRight size={14} className="text-gray-400"/>}
                                                        </div>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className="bg-white p-2 border-t border-gray-100 animate-fade-in">
                                                            {absent === 0 ? (
                                                                <p className="text-center text-gray-400 text-xs py-2">Semua hadir (Nihil).</p>
                                                            ) : (
                                                                <div className="space-y-1.5">
                                                                    {getAbsentStudentsForClass(cls).map((s: any, idx: number) => (
                                                                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
                                                                            <span className="font-bold text-gray-700">{s.name}</span>
                                                                            <span className={`px-1.5 py-0.5 rounded font-bold ${s.status === 'S' ? 'bg-yellow-100 text-yellow-700' : s.status === 'I' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                                                {s.status}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
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
