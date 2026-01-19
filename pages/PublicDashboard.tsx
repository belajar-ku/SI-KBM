
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { PublicStats } from '../types';
import { LogIn, Loader2, Award, BookOpen, School, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const PublicDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    type: 'class' | 'absence';
    data: any;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Initial Fetch
    fetchData();

    // SETUP REALTIME SUBSCRIPTION
    // Agar dashboard update otomatis saat ada guru isi jurnal/absen
    if (isSupabaseConfigured) {
        const channel = supabase
            .channel('public-dashboard-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => {
                fetchStatsClientSide();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'journals' }, () => {
                fetchStatsClientSide();
            })
            .subscribe();

        return () => {
            clearInterval(timer);
            supabase.removeChannel(channel);
        };
    }

    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      useMockData();
      setLoading(false);
      return;
    }
    
    await fetchStatsClientSide();
    setLoading(false);
  };

  const useMockData = () => {
      setStats({
          count7: 324, 
          count8: 310, 
          count9: 298,
          classDetails: { '7A': 32, '7B': 30, '8A': 31, '9A': 29 },
          totalJpRequired: 240, 
          completedJp: 156,
          absenceCount: 5,
          absenceDetails: { S: 2, I: 2, A: 1 },
          absencePerClass: { '7A': 1, '8A': 2, '9A': 2 },
          unfilledKbm: []
      });
  };

  // Helper untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD sesuai zona waktu Jakarta (WIB)
  const getJakartaDateStr = () => {
    // Menggunakan Intl.DateTimeFormat untuk memastikan zona waktu benar (Asia/Jakarta)
    // Format en-CA menghasilkan YYYY-MM-DD
    const formatter = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Jakarta', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });
    return formatter.format(new Date());
  };

  const fetchStatsClientSide = async () => {
    const todayStr = getJakartaDateStr();
    
    // Gunakan filter range waktu hari ini (00:00:00 s/d 23:59:59 WIB) yang dikonversi otomatis oleh Supabase
    // Kita gunakan string sederhana YYYY-MM-DD yang akan dicocokkan dengan created_at (UTC) oleh Supabase logic
    // Agar lebih aman, kita ambil data >= hari ini jam 00:00 WIB
    const startOfDay = `${todayStr}T00:00:00+07:00`;

    try {
        const [studentsRes, journalsRes, attendanceRes] = await Promise.all([
            supabase.from('students').select('id, kelas'),
            supabase.from('journals').select('hours').gte('created_at', startOfDay),
            supabase.from('attendance_logs').select('student_id, status').gte('created_at', startOfDay)
        ]);

        // --- 1. PROSES JUMLAH MURID & MAP KELAS ---
        const classCounts: Record<string, number> = {};
        const studentClassMap: Record<string, string> = {}; 
        let c7 = 0, c8 = 0, c9 = 0;
        
        if (studentsRes.data) {
            studentsRes.data.forEach((s: any) => {
                const rawKelas = s.kelas ? s.kelas.toUpperCase().trim() : '';
                studentClassMap[s.id] = rawKelas;

                if (rawKelas) {
                    classCounts[rawKelas] = (classCounts[rawKelas] || 0) + 1;
                    if (rawKelas.startsWith('7')) c7++;
                    else if (rawKelas.startsWith('8')) c8++;
                    else if (rawKelas.startsWith('9')) c9++;
                }
            });
        }

        // --- 2. PROSES KBM (JP) ---
        let completedJp = 0;
        if (journalsRes.data) {
            journalsRes.data.forEach((j: any) => {
                if (typeof j.hours === 'string') {
                    const parts = j.hours.split(',').filter((h: string) => h.trim().length > 0);
                    completedJp += parts.length;
                }
            });
        }

        // --- 3. PROSES ABSENSI (LOGIKA PRIORITAS & PER KELAS) ---
        const studentStatusMap: Record<string, string[]> = {};
        if (attendanceRes.data) {
            attendanceRes.data.forEach((log: any) => {
                if (!studentStatusMap[log.student_id]) {
                    studentStatusMap[log.student_id] = [];
                }
                studentStatusMap[log.student_id].push(log.status);
            });
        }

        let sCount = 0, iCount = 0, aCount = 0;
        const absencePerClass: Record<string, number> = {};
        Object.keys(classCounts).forEach(cls => absencePerClass[cls] = 0);

        Object.keys(studentStatusMap).forEach((studentId) => {
            const statuses = studentStatusMap[studentId];
            let finalStatus = '';

            // LOGIKA PRIORITAS: S > I > A
            if (statuses.includes('S')) {
                finalStatus = 'S';
                sCount++;
            } else if (statuses.includes('I')) {
                finalStatus = 'I';
                iCount++;
            } else if (statuses.includes('A')) {
                finalStatus = 'A';
                aCount++;
            }
            
            if (finalStatus) {
                const cls = studentClassMap[studentId];
                if (cls) {
                    absencePerClass[cls] = (absencePerClass[cls] || 0) + 1;
                }
            }
        });

        setStats({
            count7: c7,
            count8: c8,
            count9: c9,
            classDetails: classCounts,
            totalJpRequired: 240, 
            completedJp: completedJp,
            absenceCount: sCount + iCount + aCount,
            absenceDetails: { S: sCount, I: iCount, A: aCount },
            absencePerClass: absencePerClass,
            unfilledKbm: []
        });

    } catch (err) {
        console.error("Error fetching public stats:", err);
        useMockData();
    }
  };

  const handleClassClick = (grade: string) => {
      if (!stats) return;
      
      const details = Object.entries(stats.classDetails)
        .filter(([cls]) => cls.startsWith(grade))
        .sort((a, b) => a[0].localeCompare(b[0])); 

      setModalContent({
          title: `Rincian Murid Kelas ${grade}`,
          type: 'class',
          data: details
      });
      setModalOpen(true);
  };

  const handleAbsenceClick = () => {
      if (!stats) return;
      setModalContent({
          title: 'Rincian Ketidakhadiran Hari Ini',
          type: 'absence',
          data: stats.absenceDetails
      });
      setModalOpen(true);
  };

  const StatCard = ({ title, value, colorClass, icon: Icon, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`glassmorphism rounded-2xl p-4 text-center transform hover:-translate-y-1 transition duration-300 ${colorClass} cursor-pointer hover:shadow-lg active:scale-95`}
    >
      <div className="flex justify-center mb-2 opacity-80">
        <Icon size={24} />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <h3 className="font-semibold text-gray-500 text-sm mt-1">{title}</h3>
      <p className="text-[10px] text-gray-400 mt-1 opacity-0 hover:opacity-100 transition-opacity">Klik untuk detail</p>
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
                <h1 className="text-xl font-bold text-[#2c3e50] leading-none">SI KBM</h1>
                <p className="text-xs font-bold text-blue-600 tracking-widest mt-1">REALTIME DASHBOARD</p>
             </div>
          </div>
          <div className="text-right relative z-10">
            <p className="text-sm text-gray-600 font-medium">
              {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xl font-ramping text-[#3498db] font-bold">
              {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
          </div>
        ) : stats ? (
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
               
               {/* Absence Card */}
               <div 
                 onClick={handleAbsenceClick}
                 className="glassmorphism rounded-2xl p-4 text-center flex flex-col justify-center cursor-pointer hover:bg-white/80 transition-colors group relative"
                >
                  <div className="absolute top-2 right-2">
                     <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                     </span>
                  </div>
                  <AlertCircle className="mx-auto text-orange-500 mb-2 group-hover:scale-110 transition-transform" size={28} />
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.absenceCount}</p>
                  <h3 className="font-semibold text-gray-500 text-sm mt-1">Ketidakhadiran Murid</h3>
                  <p className="text-[10px] text-gray-400 mt-1 opacity-60">Sakit, Izin, Alpa</p>
               </div>
            </div>

            {/* Progress Bar */}
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
        ) : (
          <div className="text-center text-red-500 bg-red-50 p-4 rounded-xl">
              <p>Gagal memuat data statistik.</p>
              <button onClick={() => fetchData()} className="mt-2 text-sm text-red-700 underline flex items-center justify-center gap-1 mx-auto">
                  <RefreshCw size={14} /> Coba Lagi
              </button>
          </div>
        )}

        <div className="pt-4">
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-[#3498db] hover:bg-[#2980b9] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform transform hover:-translate-y-1 shadow-lg"
          >
            <LogIn size={20} />
            Login Guru
          </button>
        </div>
      </main>

      {/* POPUP MODAL */}
      {modalOpen && modalContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setModalOpen(false)}>
              <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm transform scale-100 transition-all border border-white/20 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                      <h3 className="font-bold text-gray-800 text-lg">{modalContent.title}</h3>
                      <button onClick={() => setModalOpen(false)} className="bg-gray-100 p-1.5 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                          <XCircle size={22} />
                      </button>
                  </div>

                  <div className="overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                      {modalContent.type === 'class' ? (
                          <div className="grid grid-cols-3 gap-3">
                              {modalContent.data.map(([cls, count]: any) => (
                                  <div key={cls} className="bg-blue-50 p-3 rounded-2xl text-center border border-blue-100 hover:bg-blue-100 transition-colors">
                                      <div className="font-bold text-blue-800 text-xl mb-1">{cls}</div>
                                      <div className="text-xs text-gray-600 font-medium bg-white rounded-full py-0.5 px-2 inline-block border border-blue-100">{count} Murid</div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          // Absence Detail
                          <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-2xl border border-yellow-100">
                                    <div className="text-xs font-bold text-yellow-700 uppercase mb-1">Sakit</div>
                                    <div className="font-bold text-2xl text-yellow-600">{modalContent.data.S}</div>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-blue-50 rounded-2xl border border-blue-100">
                                    <div className="text-xs font-bold text-blue-700 uppercase mb-1">Izin</div>
                                    <div className="font-bold text-2xl text-blue-600">{modalContent.data.I}</div>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-red-50 rounded-2xl border border-red-100">
                                    <div className="text-xs font-bold text-red-700 uppercase mb-1">Alpa</div>
                                    <div className="font-bold text-2xl text-red-600">{modalContent.data.A}</div>
                                </div>
                            </div>

                            {/* Detailed List Per Class */}
                            {stats && stats.absencePerClass && (
                                <div className="mt-2 pt-3 border-t border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <Award size={16} className="text-orange-500"/>
                                        Rincian Per Kelas
                                    </h4>
                                    <div className="space-y-2">
                                        {Object.keys(stats.classDetails).sort().map(cls => {
                                            const total = stats.classDetails[cls];
                                            const absent = stats.absencePerClass[cls] || 0;
                                            const present = total - absent;
                                            
                                            // Tampilkan semua kelas agar transparan
                                            return (
                                                <div key={cls} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold bg-white text-gray-800 px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm text-sm">{cls}</span>
                                                    </div>
                                                    <div className="flex gap-2 font-medium">
                                                        <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded-md">{present} Hadir</span>
                                                        <span className={`${absent > 0 ? 'text-red-700 bg-red-100 font-bold' : 'text-gray-400 bg-gray-100'} px-2 py-0.5 rounded-md`}>
                                                            {absent} Tidak Hadir
                                                        </span>
                                                    </div>
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