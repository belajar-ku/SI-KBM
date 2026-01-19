import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { PublicStats } from '../types';
import { LogIn, Loader2, Award, BookOpen, School, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

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
    fetchData();
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      useMockData();
      setLoading(false);
      return;
    }
    
    // Kita gunakan Client Side Fetching agar bisa mendapatkan detail breakdown
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

  const fetchStatsClientSide = async () => {
    const todayStr = new Date().toISOString().split('T')[0];

    try {
        // Parallel requests
        // 1. Ambil SEMUA data siswa (id dan kelas)
        // 2. Ambil Jurnal hari ini (untuk hitung JP)
        // 3. Ambil Log Absensi hari ini
        const [studentsRes, journalsRes, attendanceRes] = await Promise.all([
            supabase.from('students').select('id, kelas'),
            supabase.from('journals').select('hours').gte('created_at', `${todayStr} 00:00:00`),
            supabase.from('attendance_logs').select('student_id, status').gte('created_at', `${todayStr} 00:00:00`)
        ]);

        // --- 1. PROSES JUMLAH MURID & MAP KELAS ---
        const classCounts: Record<string, number> = {};
        const studentClassMap: Record<string, string> = {}; // Map ID -> Kelas
        let c7 = 0, c8 = 0, c9 = 0;
        
        if (studentsRes.data) {
            studentsRes.data.forEach((s: any) => {
                // Normalisasi nama kelas jadi Uppercase biar 7a dan 7A dianggap sama
                const rawKelas = s.kelas ? s.kelas.toUpperCase().trim() : '';
                
                // Simpan mapping ID siswa ke Kelas (Penting untuk hitung absensi per kelas nanti)
                studentClassMap[s.id] = rawKelas;

                // Hitung per detail kelas (7A, 7B, dst)
                if (rawKelas) {
                    classCounts[rawKelas] = (classCounts[rawKelas] || 0) + 1;

                    // Hitung per jenjang
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
                    // Split jam "1, 2, 3" menjadi array dan hitung panjangnya
                    const parts = j.hours.split(',').filter((h: string) => h.trim().length > 0);
                    completedJp += parts.length;
                }
            });
        }

        // --- 3. PROSES ABSENSI (LOGIKA PRIORITAS & PER KELAS) ---
        // Grouping log berdasarkan ID Siswa
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

        // Inisialisasi absencePerClass dengan 0 untuk semua kelas yang ada
        Object.keys(classCounts).forEach(cls => absencePerClass[cls] = 0);

        // Iterasi setiap siswa yang punya log hari ini
        Object.keys(studentStatusMap).forEach((studentId) => {
            const statuses = studentStatusMap[studentId];
            let finalStatus = '';

            // Logika Prioritas: S > I > A
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
            
            // Jika siswa dinyatakan S/I/A, tambahkan ke counter kelas
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
            totalJpRequired: 240, // Bisa dibuat dinamis nanti
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
      
      // Filter details for that grade
      const details = Object.entries(stats.classDetails)
        .filter(([cls]) => cls.startsWith(grade))
        .sort((a, b) => a[0].localeCompare(b[0])); // Sort 7A, 7B...

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
          title: 'Rincian Ketidakhadiran',
          type: 'absence',
          data: stats.absenceDetails // Kita akses absencePerClass langsung di render
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
        <div className="glassmorphism rounded-2xl p-4 flex justify-between items-center">
          <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="h-16 w-auto" />
          <div className="text-right">
            <h1 className="text-xl font-bold text-[#2c3e50]">SI KBM</h1>
            <p className="text-sm text-gray-600">
              {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm font-ramping text-[#3498db] font-semibold">
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
                  <h3 className="font-semibold text-gray-500 text-sm mt-1">KBM Hari Ini</h3>
               </div>
               
               {/* Absence Card */}
               <div 
                 onClick={handleAbsenceClick}
                 className="glassmorphism rounded-2xl p-4 text-center flex flex-col justify-center cursor-pointer hover:bg-white/80 transition-colors group"
                >
                  <AlertCircle className="mx-auto text-orange-500 mb-2 group-hover:scale-110 transition-transform" size={28} />
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.absenceCount}</p>
                  <h3 className="font-semibold text-gray-500 text-sm mt-1">Ketidakhadiran Murid</h3>
                  <p className="text-[10px] text-gray-400 mt-1 opacity-60">Sakit, Izin, Alpa</p>
               </div>
            </div>

            {/* Progress Bar */}
            <div className="glassmorphism rounded-2xl p-4">
                <h3 className="font-semibold text-gray-500 text-sm text-center mb-2">Keterlaksanaan KBM</h3>
                <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                    <div 
                      className="bg-green-400 h-4 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min((stats.completedJp / stats.totalJpRequired) * 100, 100)}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-sm font-semibold mt-2 text-gray-600">
                    <span>{((stats.completedJp / stats.totalJpRequired) * 100).toFixed(1)}%</span>
                </div>
            </div>

            {/* Unfilled KBM Carousel simulation */}
            <div className="glassmorphism rounded-2xl p-4 text-center">
               <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Pantauan KBM:</h3>
               <div className="min-h-[60px] flex items-center justify-center">
                 {stats.unfilledKbm.length > 0 ? (
                   <div className="animate-pulse">
                     <p className="text-lg font-bold text-red-600">{stats.unfilledKbm[0].guru}</p>
                     <p className="text-sm font-bold text-gray-600">Kelas {stats.unfilledKbm[0].kelas}</p>
                   </div>
                 ) : (
                   <p className="text-green-600 font-semibold">✅ Data KBM terpantau lancar.</p>
                 )}
               </div>
            </div>
          </>
        ) : (
          <div className="text-center text-red-500">Gagal memuat data statistik.</div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setModalOpen(false)}>
              <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm transform scale-100 transition-all border border-white/20 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                      <h3 className="font-bold text-gray-800 text-lg">{modalContent.title}</h3>
                      <button onClick={() => setModalOpen(false)} className="bg-gray-100 p-1 rounded-full text-gray-500 hover:bg-gray-200">
                          <XCircle size={20} />
                      </button>
                  </div>

                  <div className="overflow-y-auto pr-2 space-y-4">
                      {modalContent.type === 'class' ? (
                          <div className="grid grid-cols-3 gap-2">
                              {modalContent.data.map(([cls, count]: any) => (
                                  <div key={cls} className="bg-blue-50 p-2 rounded-xl text-center border border-blue-100">
                                      <div className="font-bold text-blue-800 text-lg">{cls}</div>
                                      <div className="text-xs text-gray-500 font-medium">{count} Siswa</div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          // Absence Detail
                          <>
                            {/* Summary Cards */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-yellow-200 text-yellow-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">S</div>
                                        <span className="font-bold text-gray-700">Sakit</span>
                                    </div>
                                    <span className="font-bold text-xl text-yellow-600">{modalContent.data.S}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-200 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">I</div>
                                        <span className="font-bold text-gray-700">Izin</span>
                                    </div>
                                    <span className="font-bold text-xl text-blue-600">{modalContent.data.I}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-red-200 text-red-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">A</div>
                                        <span className="font-bold text-gray-700">Alpa / Tanpa Ket.</span>
                                    </div>
                                    <span className="font-bold text-xl text-red-600">{modalContent.data.A}</span>
                                </div>
                            </div>

                            {/* Detailed List Per Class */}
                            {stats && stats.absencePerClass && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <Award size={16} className="text-blue-500"/>
                                        Rincian Per Kelas
                                    </h4>
                                    <div className="space-y-2">
                                        {Object.keys(stats.classDetails).sort().map(cls => {
                                            const total = stats.classDetails[cls];
                                            const absent = stats.absencePerClass[cls] || 0;
                                            const present = total - absent;
                                            
                                            // Hanya tampilkan jika ada absensi atau opsional tampilkan semua
                                            // Untuk UI yang lebih padat, kita tampilkan semua agar terlihat statusnya
                                            return (
                                                <div key={cls} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs">
                                                    <span className="font-bold bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">{cls}</span>
                                                    <div className="flex gap-2">
                                                        <span className="text-green-600 font-semibold">{present} Hadir</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className={`${absent > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
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