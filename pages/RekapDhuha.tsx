
import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Student } from '../types';
import { Printer, Loader2, Sunset, CalendarDays, Search, Eye, X } from 'lucide-react';
import { formatDateSignature, getWIBISOString, formatDateIndo } from '../utils/dateUtils';

interface DhuhaDetail {
    date: string;
    status: 'A' | 'D';
}

interface DhuhaSummary {
  student: Student;
  absence_count: number; // Jumlah 'A' (Tidak Hadir Dhuha)
  dispen_count: number; // Jumlah 'D'
  details: DhuhaDetail[];
}

const RekapDhuha: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Dropdown Data
  const [classes, setClasses] = useState<string[]>([]);
  
  // Selection
  const [selectedClass, setSelectedClass] = useState('');
  
  // Date Range
  const [startDate, setStartDate] = useState(() => {
      const d = new Date();
      d.setDate(1); // 1st of current month
      return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(getWIBISOString());

  // Report Data
  const [reportData, setReportData] = useState<DhuhaSummary[]>([]);
  const [totalMeetings, setTotalMeetings] = useState(0);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedStudentSummary, setSelectedStudentSummary] = useState<DhuhaSummary | null>(null);

  // Settings Data (Kop Surat)
  const [settings, setSettings] = useState({
    academic_year: '...',
    semester: '...',
    headmaster: '...',
    headmaster_nip: ''
  });

  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchReportData();
    } else {
      setReportData([]);
      setTotalMeetings(0);
    }
  }, [selectedClass, startDate, endDate]);

  const fetchInitData = async () => {
    try {
      // 1. Fetch Settings
      const { data: settingsData } = await supabase.from('app_settings').select('*');
      const newSettings: any = {};
      settingsData?.forEach(item => newSettings[item.key] = item.value);
      setSettings(prev => ({ ...prev, ...newSettings }));

      // 2. Fetch All Classes
      const { data: studentsData } = await supabase.from('students').select('kelas');
      if (studentsData) {
        const uniqueClasses = Array.from(new Set(studentsData.map((s:any) => s.kelas))).sort();
        setClasses(uniqueClasses as string[]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
        // 1. Get Students in Class
        const { data: students } = await supabase
            .from('students')
            .select('*')
            .eq('kelas', selectedClass)
            .order('name');
        
        if (!students) throw new Error("Tidak ada siswa");

        const start = `${startDate}T00:00:00+07:00`;
        const end = `${endDate}T23:59:59+07:00`;

        // 2. Get Journals for Dhuha in this range
        const { data: journals } = await supabase
            .from('journals')
            .select('id')
            .eq('kelas', selectedClass)
            .ilike('subject', '%dhuha%')
            .gte('created_at', start)
            .lte('created_at', end);
        
        const journalIds = journals?.map(j => j.id) || [];
        setTotalMeetings(journalIds.length);

        // 3. Get Attendance Logs (Including Created At for Dates)
        let attendanceLogs: any[] = [];
        if (journalIds.length > 0) {
            const { data: logs } = await supabase
                .from('attendance_logs')
                .select('student_id, status, created_at')
                .in('journal_id', journalIds);
            attendanceLogs = logs || [];
        }

        // 4. Aggregate
        const summary: DhuhaSummary[] = students.map(student => {
            const studentLogs = attendanceLogs.filter(l => l.student_id === student.id);
            
            // Collect Details
            const details: DhuhaDetail[] = studentLogs
                .filter(l => ['A', 'D'].includes(l.status))
                .map(l => ({
                    date: l.created_at,
                    status: l.status
                }))
                .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            const a = details.filter(d => d.status === 'A').length;
            const d = details.filter(d => d.status === 'D').length;
            
            return {
                student,
                absence_count: a,
                dispen_count: d,
                details
            };
        });
        setReportData(summary);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleOpenModal = (summary: DhuhaSummary) => {
      setSelectedStudentSummary(summary);
      setShowModal(true);
  };

  const handlePrint = () => window.print();
  const currentDateStr = formatDateSignature(new Date());

  return (
    <Layout>
      <div className="print:hidden space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                    <Sunset size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Rekap Salat Dhuha</h2>
                    <p className="text-gray-500 text-sm">Laporan ketidakhadiran kegiatan Salat Dhuha.</p>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="grid md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Kelas</label>
                    <select 
                        className="w-full border rounded-xl p-3 bg-gray-50 font-bold text-gray-700 focus:ring-2 focus:ring-purple-500"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
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
                        disabled={!selectedClass || loading || reportData.length === 0}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
                    >
                        <Printer size={20} /> Cetak
                    </button>
                </div>
            </div>
            
            {loading && <div className="mt-4 flex items-center gap-2 text-purple-600 text-sm"><Loader2 className="animate-spin" size={16}/> Memuat data...</div>}
            {!loading && selectedClass && reportData.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm border border-yellow-200 flex items-center gap-2">
                   <Search size={16}/> Belum ada data Salat Dhuha pada rentang tanggal ini.
                </div>
            )}
        </div>
      </div>

      {selectedClass && reportData.length > 0 && (
        <div className="mt-8 bg-white p-4 md:p-8 shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full animate-fade-in rounded-2xl" ref={componentRef}>
            <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
                <div className="flex items-center gap-4">
                     <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="h-12 md:h-20 w-auto" />
                     <div>
                         <h1 className="text-md md:text-xl font-bold uppercase tracking-wide text-black leading-tight">UPT SMP NEGERI 1 PASURUAN</h1>
                         <h2 className="text-sm md:text-lg font-bold text-black leading-tight">Rekap Kehadiran Salat Dhuha</h2>
                         <p className="text-xs md:text-sm text-gray-600">Semester {settings.semester} | Tahun Ajaran {settings.academic_year}</p>
                     </div>
                </div>
                <div className="border-4 border-black p-2 min-w-[50px] md:min-w-[60px] text-center">
                    <span className="text-lg md:text-2xl font-bold text-black block">{selectedClass}</span>
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm text-black"><strong>Total Kegiatan:</strong> {totalMeetings} Pertemuan</p>
            </div>

            {/* Print Friendly Table */}
            <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full border-collapse border border-gray-400 text-sm text-black min-w-[600px]">
                    <thead>
                        <tr className="bg-gray-200 text-center text-xs font-bold uppercase">
                            <th className="border border-gray-400 p-2 w-10">No</th>
                            <th className="border border-gray-400 p-2 w-28">NISN</th>
                            <th className="border border-gray-400 p-2 text-left">Nama Murid</th>
                            <th className="border border-gray-400 p-2 w-24 bg-red-100">Tidak Hadir</th>
                            <th className="border border-gray-400 p-2 w-24 bg-purple-100">Dispensasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((item, index) => (
                            <tr key={item.student.id} className="text-center hover:bg-gray-50 print:hover:bg-transparent">
                                <td className="border border-gray-400 p-1.5">{index + 1}</td>
                                <td className="border border-gray-400 p-1.5 font-mono text-xs">{item.student.nisn}</td>
                                <td className="border border-gray-400 p-1.5 text-left pl-3">
                                    <button 
                                        onClick={() => handleOpenModal(item)}
                                        className="font-bold text-black hover:text-blue-600 hover:underline print:no-underline print:text-black text-left w-full"
                                    >
                                        {item.student.name}
                                    </button>
                                </td>
                                <td className={`border border-gray-400 p-1.5 font-bold ${item.absence_count > 0 ? 'text-red-600' : ''}`}>{item.absence_count}</td>
                                <td className="border border-gray-400 p-1.5">{item.dispen_count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-10 flex flex-col md:flex-row justify-between text-black break-inside-avoid gap-8 md:gap-0">
                <div className="text-center md:text-left md:ml-4">
                    <p className="mb-16">Mengetahui<br/>Kepala Sekolah,</p>
                    <p className="font-bold underline">{settings.headmaster}</p>
                    <p className="text-sm">NIP {settings.headmaster_nip || '........................'}</p> 
                </div>

                <div className="text-center md:text-left md:mr-10">
                    <p className="mb-16">Kota Pasuruan, {currentDateStr}<br/>Koordinator Keagamaan,</p>
                    <p className="font-bold underline">{profile?.full_name}</p>
                    <p className="text-sm">NIP {profile?.nip}</p>
                </div>
            </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showModal && selectedStudentSummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:hidden" onClick={() => setShowModal(false)}>
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                  <div className="bg-purple-600 px-6 py-5 border-b border-purple-500 flex justify-between items-center text-white">
                      <div>
                          <h3 className="font-extrabold text-lg">{selectedStudentSummary.student.name}</h3>
                          <p className="text-xs text-purple-200 mt-0.5">Rincian Ketidakhadiran Dhuha</p>
                      </div>
                      <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
                      {selectedStudentSummary.details.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 italic">
                              Murid ini hadir lengkap (Tidak ada catatan absen/dispen).
                          </div>
                      ) : (
                          <div className="space-y-3">
                              {selectedStudentSummary.details.map((detail, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                      <div className="flex items-center gap-3">
                                          <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                                              <CalendarDays size={18} />
                                          </div>
                                          <div>
                                              <p className="font-bold text-slate-700 text-sm">
                                                  {formatDateIndo(detail.date)}
                                              </p>
                                          </div>
                                      </div>
                                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                          detail.status === 'A' 
                                          ? 'bg-red-100 text-red-600 border border-red-200' 
                                          : 'bg-purple-100 text-purple-600 border border-purple-200'
                                      }`}>
                                          {detail.status === 'A' ? 'Tidak Hadir' : 'Dispensasi'}
                                      </span>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="p-4 border-t border-slate-200 bg-white text-right">
                      <button 
                          onClick={() => setShowModal(false)}
                          className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-sm transition-colors"
                      >
                          Tutup
                      </button>
                  </div>
              </div>
          </div>
      )}
    </Layout>
  );
};

export default RekapDhuha;
