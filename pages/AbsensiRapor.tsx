
import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Student } from '../types';
import { Printer, Loader2, BookX, Search, CalendarDays } from 'lucide-react';
import { formatDateSignature, getWIBISOString } from '../utils/dateUtils';

interface ReportStudent extends Student {
    s_count: number;
    i_count: number;
    a_count: number;
    d_count: number;
}

const AbsensiRapor: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportStudent[]>([]);
  
  // Filters
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  
  // Date Range (Defaults to current month)
  const [startDate, setStartDate] = useState(() => {
      const d = new Date();
      d.setDate(1); // 1st of current month
      return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(getWIBISOString());

  // Settings for Print Header
  const [settings, setSettings] = useState({
      academic_year: '...',
      semester: '...',
      headmaster: '...',
      headmaster_nip: ''
  });

  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitData();
  }, [profile]);

  useEffect(() => {
      if(selectedClass && startDate && endDate) {
          generateReport();
      } else {
          setReportData([]);
      }
  }, [selectedClass, startDate, endDate]);

  const fetchInitData = async () => {
    if(!profile) return;
    try {
        // 1. Get Settings
        const { data: settingsData } = await supabase.from('app_settings').select('*');
        const newSettings: any = {};
        settingsData?.forEach(item => newSettings[item.key] = item.value);
        setSettings(prev => ({ ...prev, ...newSettings }));

        // 2. Determine Class List (Fetch ALL Classes)
        const { data } = await supabase.from('students').select('kelas');
        if(data) {
            const unique = Array.from(new Set(data.map((s:any) => s.kelas))).sort();
            setClasses(unique);

             // 3. Set Default Selection
            if (profile.wali_kelas) {
                // Jika Wali Kelas, otomatis terpilih kelasnya TAPI TIDAK DIKUNCI
                setSelectedClass(profile.wali_kelas);
            }
        }
    } catch(e) { console.error(e); }
  };

  const generateReport = async () => {
      setLoading(true);
      try {
          const start = `${startDate}T00:00:00+07:00`;
          const end = `${endDate}T23:59:59+07:00`;

          // 1. Get Students
          const { data: students } = await supabase
            .from('students')
            .select('*')
            .eq('kelas', selectedClass)
            .order('name');
          
          if(!students || students.length === 0) {
              setReportData([]); setLoading(false); return;
          }

          const studentIds = students.map(s => s.id);

          // 2. Get Homeroom Attendance (Mutlak)
          const { data: hLogs } = await supabase
            .from('homeroom_attendance')
            .select('student_id, date, status')
            .in('student_id', studentIds)
            .gte('date', startDate)
            .lte('date', endDate);
        
          // 3. Get Teacher Logs
          const { data: tLogs } = await supabase
            .from('attendance_logs')
            .select('student_id, created_at, status')
            .in('student_id', studentIds)
            .gte('created_at', start)
            .lte('created_at', end)
            .neq('status', 'D'); // Only S, I, A matter for calculation usually, but D also exists

          // LOGIC AGGREGATION
          const processedStudents: ReportStudent[] = students.map(student => {
              let s_total = 0, i_total = 0, a_total = 0, d_total = 0;

              // Collect all unique dates relevant to this student
              const hDates = hLogs?.filter(l => l.student_id === student.id).map(l => l.date) || [];
              const tDates = tLogs?.filter(l => l.student_id === student.id).map(l => l.created_at.split('T')[0]) || [];
              const uniqueDates = Array.from(new Set([...hDates, ...tDates]));

              uniqueDates.forEach(date => {
                  // A. Cek Wali Kelas (Prioritas Utama)
                  const hLog = hLogs?.find(l => l.student_id === student.id && l.date === date);
                  if (hLog) {
                      if (hLog.status === 'S') s_total++;
                      else if (hLog.status === 'I') i_total++;
                      else if (hLog.status === 'A') a_total++;
                      else if (hLog.status === 'D') d_total++;
                      return; // Done for this date
                  }

                  // B. Cek Guru Mapel (Agregasi)
                  const dayLogs = tLogs?.filter(l => l.student_id === student.id && l.created_at.startsWith(date)) || [];
                  if (dayLogs.length > 0) {
                      const statuses = dayLogs.map(l => l.status);
                      
                      // Hierarchy: S > I > D > A
                      if (statuses.includes('S')) s_total++;
                      else if (statuses.includes('I')) i_total++;
                      else if (statuses.includes('D')) d_total++; // Usually D is handled same as I, but keeping separate
                      else if (statuses.includes('A')) a_total++;
                      
                      // If no S/I/D/A found (only present), count as present (do nothing to counters)
                  }
              });

              return {
                  ...student,
                  s_count: s_total,
                  i_count: i_total,
                  a_count: a_total,
                  d_count: d_total
              };
          });

          setReportData(processedStudents);

      } catch(e) { console.error(e); }
      finally { setLoading(false); }
  };

  const handlePrint = () => window.print();
  const currentDateStr = formatDateSignature(new Date());

  return (
    <Layout>
      <div className="print:hidden space-y-6">
        <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-xl text-red-600">
                <BookX size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Ketidakhadiran (Rapor)</h2>
                <p className="text-gray-500 text-sm">Rekapitulasi gabungan S/I/A/D untuk Rapor.</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="grid md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Kelas</label>
                    <select 
                        className="w-full border rounded-xl p-3 bg-gray-50 font-bold text-gray-700 focus:ring-2 focus:ring-red-500"
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                        // REMOVED DISABLED PROP TO ALLOW SELECTION CHANGE
                    >
                        <option value="">-- Pilih Kelas --</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><CalendarDays size={12}/> Tanggal Awal</label>
                    <input 
                        type="date"
                        className="w-full border rounded-xl p-3 bg-white text-gray-700"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><CalendarDays size={12}/> Tanggal Akhir</label>
                    <input 
                        type="date"
                        className="w-full border rounded-xl p-3 bg-white text-gray-700"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                    />
                </div>
                <div>
                    <button 
                        onClick={handlePrint}
                        disabled={loading || reportData.length === 0}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
                    >
                        <Printer size={20} /> Cetak / PDF
                    </button>
                </div>
            </div>
             {loading && <div className="mt-4 flex items-center gap-2 text-red-600 text-sm"><Loader2 className="animate-spin" size={16}/> Mengkalkulasi data kehadiran...</div>}
        </div>
      </div>

      {reportData.length > 0 && (
          <div className="mt-8 bg-white p-4 md:p-8 shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full animate-fade-in rounded-2xl" ref={componentRef}>
             {/* Header Kop Surat */}
            <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
                <div className="flex items-center gap-4">
                     <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="h-12 md:h-20 w-auto" />
                     <div>
                         <h1 className="text-md md:text-xl font-bold uppercase tracking-wide text-black leading-tight">UPT SMP NEGERI 1 PASURUAN</h1>
                         <h2 className="text-sm md:text-lg font-bold text-black leading-tight">Rekap Ketidakhadiran (Rapor)</h2>
                         <p className="text-xs md:text-sm text-gray-600">Semester {settings.semester} | Tahun Ajaran {settings.academic_year}</p>
                     </div>
                </div>
                <div className="border-4 border-black p-2 min-w-[50px] md:min-w-[80px] text-center">
                    <span className="text-lg md:text-2xl font-bold text-black block">{selectedClass}</span>
                </div>
            </div>

            {/* Content Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-400 text-sm text-black min-w-[600px]">
                    <thead>
                        <tr className="bg-gray-100 text-center text-xs font-bold uppercase">
                            <th className="border border-gray-400 p-2 w-10">No</th>
                            <th className="border border-gray-400 p-2 w-28">NISN</th>
                            <th className="border border-gray-400 p-2 text-left">Nama Murid</th>
                            <th className="border border-gray-400 p-2 w-12 bg-yellow-50">Sakit</th>
                            <th className="border border-gray-400 p-2 w-12 bg-blue-50">Izin</th>
                            <th className="border border-gray-400 p-2 w-12 bg-red-50">Alpa</th>
                            <th className="border border-gray-400 p-2 w-16">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((s, idx) => {
                            const total = s.s_count + s.i_count + s.a_count; // Exclude Dispensasi from Total Absen usually for Rapor, or include? Usually Rapor only shows S/I/A.
                            return (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="border border-gray-400 p-1.5 text-center">{idx + 1}</td>
                                    <td className="border border-gray-400 p-1.5 text-center font-mono">{s.nisn}</td>
                                    <td className="border border-gray-400 p-1.5 font-bold pl-3">{s.name}</td>
                                    <td className="border border-gray-400 p-1.5 text-center">{s.s_count || '-'}</td>
                                    <td className="border border-gray-400 p-1.5 text-center">{s.i_count || '-'}</td>
                                    <td className="border border-gray-400 p-1.5 text-center">{s.a_count || '-'}</td>
                                    <td className="border border-gray-400 p-1.5 text-center font-bold">{total || '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Signature Area */}
            <div className="mt-10 flex flex-col md:flex-row justify-between text-black break-inside-avoid gap-8 md:gap-0">
                <div className="text-center md:text-left md:ml-4">
                    <p className="mb-16">Mengetahui<br/>Kepala Sekolah,</p>
                    <p className="font-bold underline">{settings.headmaster}</p>
                    <p className="text-sm">NIP {settings.headmaster_nip || '........................'}</p> 
                </div>

                <div className="text-center md:text-left md:mr-10">
                    <p className="mb-16">Kota Pasuruan, {currentDateStr}<br/>Wali Kelas {selectedClass},</p>
                    <p className="font-bold underline">{profile?.full_name}</p>
                    <p className="text-sm">NIP {profile?.nip}</p>
                </div>
            </div>

          </div>
      )}
    </Layout>
  );
};

export default AbsensiRapor;
