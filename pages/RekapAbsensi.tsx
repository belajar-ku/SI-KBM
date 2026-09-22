import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Student } from '../types';
import { Printer, Download, Loader2, Search, UserCheck } from 'lucide-react';
import { formatDateSignature } from '../utils/dateUtils';
import { downloadPaginatedTablePdf, printCleanDocument } from '../utils/printAndPdf';
import { LOGO_SMPN1_BASE64 } from '../utils/logoData';

interface AttendanceSummary {
  student: Student;
  s: number;
  i: number;
  a: number;
  d: number;
  present: number; // Hadir (bukan S/I/A)
  percentage: string;
}

const RekapAbsensi: React.FC = () => {
  const { profile, academicYear, semester, semesterStart, semesterEnd } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Dropdown Data
  const [classes, setClasses] = useState<string[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<Record<string, string>>({}); 
  
  // Selection
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Report Data
  const [reportData, setReportData] = useState<AttendanceSummary[]>([]);
  const [totalMeetings, setTotalMeetings] = useState(0);
  
  // Settings Data (Kop Surat)
  const [settings, setSettings] = useState({
    academic_year: '',
    semester: '',
    headmaster: 'Agung Budiartati, M.Pd.',
    headmaster_nip: ''
  });

  const componentRef = useRef<HTMLDivElement>(null);

  const activeAcademicYear = (settings.academic_year && settings.academic_year !== '...')
    ? settings.academic_year
    : (academicYear || localStorage.getItem('app_academic_year') || '2026/2027');
  const activeSemester = (settings.semester && settings.semester !== '...')
    ? settings.semester
    : (semester || localStorage.getItem('app_semester') || 'Ganjil');

  useEffect(() => {
    if (profile) {
      fetchInitialData();
    }
  }, [profile, academicYear, semester]);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchReportData();
    } else {
      setReportData([]);
      setTotalMeetings(0);
    }
  }, [selectedClass, selectedSubject, activeAcademicYear, activeSemester]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Settings from app_settings
      const { data: settingsData } = await supabase.from('app_settings').select('*');
      const newSettings: any = {};
      settingsData?.forEach(item => newSettings[item.key] = item.value);
      setSettings(prev => ({ ...prev, ...newSettings }));

      const currentActiveYear = newSettings.academic_year || academicYear || localStorage.getItem('app_academic_year') || '2026/2027';
      const currentActiveSem = newSettings.semester || semester || localStorage.getItem('app_semester') || 'Ganjil';

      // 2. Fetch Guru Schedules for Active Academic Year
      if (!profile) return;
      
      let { data: schedules } = await supabase
        .from('schedules')
        .select('kelas, subject, academic_year, semester')
        .eq('teacher_id', profile.id)
        .eq('academic_year', currentActiveYear)
        .eq('semester', currentActiveSem);

      // Also check journals entered by teacher in this academic year
      const { data: teacherJournals } = await supabase
        .from('journals')
        .select('kelas, subject')
        .eq('teacher_id', profile.id)
        .eq('academic_year', currentActiveYear)
        .eq('semester', currentActiveSem);

      const classSet = new Set<string>();
      const map: Record<string, string> = {};

      schedules?.forEach(s => {
        if (s.kelas && !s.subject?.toLowerCase().includes('dhuha')) {
          classSet.add(s.kelas);
          if (!map[s.kelas]) map[s.kelas] = s.subject;
        }
      });

      teacherJournals?.forEach(j => {
        if (j.kelas && !j.subject?.toLowerCase().includes('dhuha')) {
          classSet.add(j.kelas);
          if (!map[j.kelas]) map[j.kelas] = j.subject;
        }
      });

      const uniqueClasses = Array.from(classSet).sort();
      setClasses(uniqueClasses);
      setSubjectsMap(map);
    } catch (err) {
      console.error("fetchInitialData error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const cls = e.target.value;
      setSelectedClass(cls);
      if (cls && subjectsMap[cls]) {
          setSelectedSubject(subjectsMap[cls]);
      } else {
          setSelectedSubject('');
      }
  };

  const fetchReportData = async () => {
    if (!profile || !selectedClass) return;
    setLoading(true);
    
    try {
        // Resolve active academic year and semester directly from settings / context
        let currentYear = settings.academic_year;
        let currentSem = settings.semester;
        if (!currentYear || currentYear === '...') {
            const { data: sData } = await supabase.from('app_settings').select('key, value').in('key', ['academic_year', 'semester']);
            sData?.forEach(item => {
                if (item.key === 'academic_year') currentYear = item.value;
                if (item.key === 'semester') currentSem = item.value;
            });
        }
        if (!currentYear || currentYear === '...') {
            currentYear = academicYear || localStorage.getItem('app_academic_year') || '2026/2027';
        }
        if (!currentSem || currentSem === '...') {
            currentSem = semester || localStorage.getItem('app_semester') || 'Ganjil';
        }

        // STRICTLY load students belonging ONLY to the active academic year
        const { data: students, error: errStudents } = await supabase
            .from('students')
            .select('*')
            .eq('kelas', selectedClass)
            .eq('academic_year', currentYear)
            .order('name');
        
        if (errStudents) {
            console.error("Error fetching students for class and academic year:", errStudents);
        }

        if (!students || students.length === 0) {
            setReportData([]);
            setTotalMeetings(0);
            setLoading(false);
            return;
        }

        // Fetch journals for this teacher, class, subject, and active academic year
        const { data: journals } = await supabase
            .from('journals')
            .select('id')
            .eq('teacher_id', profile.id)
            .eq('kelas', selectedClass)
            .eq('subject', selectedSubject)
            .eq('academic_year', currentYear)
            .eq('semester', currentSem)
            .gte('created_at', semesterStart ? `${semesterStart}T00:00:00+07:00` : '2000-01-01T00:00:00+07:00')
            .lte('created_at', semesterEnd ? `${semesterEnd}T23:59:59+07:00` : '2100-01-01T23:59:59+07:00');
        
        const journalIds = journals?.map(j => j.id) || [];
        const meetingsCount = journalIds.length;
        setTotalMeetings(meetingsCount);

        let attendanceLogs: any[] = [];
        if (meetingsCount > 0) {
            // In case of large numbers of journals, batch by 100
            for (let i = 0; i < journalIds.length; i += 100) {
                const chunk = journalIds.slice(i, i + 100);
                const { data: logs } = await supabase
                    .from('attendance_logs')
                    .select('student_id, status')
                    .in('journal_id', chunk);
                if (logs) attendanceLogs = attendanceLogs.concat(logs);
            }
        }

        const summary: AttendanceSummary[] = students.map(student => {
            const studentLogs = attendanceLogs.filter(l => l.student_id === student.id);
            const s = studentLogs.filter(l => l.status === 'S').length;
            const i = studentLogs.filter(l => l.status === 'I').length;
            const a = studentLogs.filter(l => l.status === 'A').length;
            const d = studentLogs.filter(l => l.status === 'D').length;
            
            // Perhitungan persentase: Alpa ('A') mengurangi kehadiran
            const nonPresentCount = a; 
            const presentCount = Math.max(0, meetingsCount - nonPresentCount);
            const percentage = meetingsCount > 0 ? Math.round((presentCount / meetingsCount) * 100) : 100;

            return {
                student, s, i, a, d, present: presentCount, percentage: `${percentage}%`
            };
        });

        setReportData(summary);
    } catch (err) {
        console.error("fetchReportData error:", err);
    } finally {
        setLoading(false);
    }
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState('');

  const handlePrintClean = () => {
    if (!componentRef.current) return;
    const docTitle = `Rekap Kehadiran - Kelas ${selectedClass} - ${activeAcademicYear}`;
    printCleanDocument(componentRef.current, docTitle);
  };

  const handleDownloadPdf = async () => {
    if (!componentRef.current) return;
    setDownloadingPdf(true);
    const filename = `Rekap_Kehadiran_Kelas_${selectedClass}_${activeAcademicYear.replace('/', '-')}_${activeSemester}`;
    try {
      await downloadPaginatedTablePdf(componentRef.current, filename, {
        orientation: 'portrait',
        onProgress: (msg) => setPdfProgressText(msg),
      });
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Gagal membuat berkas PDF. Anda dapat menggunakan opsi 'Cetak Dokumen' sebagai alternatif.");
    } finally {
      setDownloadingPdf(false);
      setPdfProgressText('');
    }
  };

  const currentDateStr = formatDateSignature(new Date());

  return (
    <Layout>
      <div className="print:hidden space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 text-white flex items-center justify-center shadow-sm">
                    <UserCheck size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Rekap Kehadiran</h2>
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            TA: {activeAcademicYear} ({activeSemester})
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Laporan kehadiran murid per mapel sesuai tahun ajaran aktif.</p>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="grid md:grid-cols-3 gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Kelas</label>
                    <select 
                        className="w-full border rounded-xl p-3 bg-gray-50 font-bold text-gray-700 focus:ring-2 focus:ring-blue-500"
                        value={selectedClass}
                        onChange={handleClassChange}
                    >
                        <option value="">-- Pilih Kelas --</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Mata Pelajaran</label>
                    <input 
                        type="text"
                        className="w-full border rounded-xl p-3 bg-gray-50 text-gray-700"
                        value={selectedSubject}
                        readOnly
                        placeholder="Otomatis sesuai kelas..."
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleDownloadPdf}
                        disabled={!selectedClass || loading || downloadingPdf || reportData.length === 0}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 transition-all"
                        title="Unduh file dokumen PDF (.pdf) resmi"
                    >
                        {downloadingPdf ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>{pdfProgressText || 'Membuat PDF...'}</span>
                            </>
                        ) : (
                            <>
                                <Download size={16} />
                                <span>Unduh PDF</span>
                            </>
                        )}
                    </button>
                    <button 
                        onClick={handlePrintClean}
                        disabled={!selectedClass || loading || downloadingPdf || reportData.length === 0}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 transition-all"
                        title="Cetak dokumen bersih tanpa elemen browser"
                    >
                        <Printer size={16} />
                        <span>Cetak Dokumen</span>
                    </button>
                </div>
            </div>
            
            {loading && <div className="mt-4 flex items-center gap-2 text-blue-600 text-sm"><Loader2 className="animate-spin" size={16}/> Sedang memuat data absensi...</div>}
            {!loading && selectedClass && reportData.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm border border-yellow-200 flex items-center gap-2">
                   <Search size={16}/> Belum ada data murid atau jurnal absensi untuk kelas dan tahun ajaran aktif ini ({activeAcademicYear}).
                </div>
            )}
        </div>
      </div>

      {selectedClass && reportData.length > 0 && (
        <div
          className="mt-8 bg-white p-4 md:p-8 shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full animate-fade-in rounded-2xl"
          ref={componentRef}
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
            <div data-doc-header="true" className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
                <div className="flex items-center gap-4">
                     <img src={LOGO_SMPN1_BASE64} alt="Logo UPT SMP Negeri 1 Pasuruan" className="h-14 md:h-20 w-auto" />
                     <div>
                         <h1 className="text-md md:text-xl font-bold uppercase tracking-wide text-black leading-tight">UPT SMP NEGERI 1 PASURUAN</h1>
                         <h2 className="text-sm md:text-lg font-bold text-black leading-tight">Rekap Absensi Mata Pelajaran : {selectedSubject}</h2>
                         <p className="text-xs md:text-sm text-gray-700">Semester {settings.semester || activeSemester} | Tahun Ajaran {settings.academic_year || activeAcademicYear}</p>
                         <p className="text-[11px] text-gray-600 mt-0.5">Jalan Balaikota 7 Pasuruan | Website: smpn1pasuruan.sch.id</p>
                     </div>
                </div>
                <div className="border-4 border-black p-2 min-w-[50px] md:min-w-[60px] text-center">
                    <span className="text-lg md:text-2xl font-bold text-black block">{selectedClass}</span>
                </div>
            </div>

            {/* Print Friendly Table: No scrollbar, full visible */}
            <div className="overflow-x-auto print:overflow-visible">
                <table data-doc-table="true" className="w-full border-collapse border border-gray-400 text-sm text-black min-w-[600px]">
                    <thead>
                        <tr className="bg-gray-200 text-center">
                            <th className="border border-gray-400 p-2 w-10" rowSpan={2}>No</th>
                            <th className="border border-gray-400 p-2 w-24" rowSpan={2}>NISN</th>
                            <th className="border border-gray-400 p-2" rowSpan={2}>Nama Murid</th>
                            <th className="border border-gray-400 p-1" colSpan={4}>Ketidakhadiran</th>
                            <th className="border border-gray-400 p-2 w-32" rowSpan={2}>% Kehadiran</th>
                        </tr>
                        <tr className="bg-gray-100 text-center text-xs font-bold">
                            <th className="border border-gray-400 p-1 w-8">S</th>
                            <th className="border border-gray-400 p-1 w-8">I</th>
                            <th className="border border-gray-400 p-1 w-8">A</th>
                            <th className="border border-gray-400 p-1 w-8">D</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((item, index) => (
                            <tr key={item.student.id} className="text-center hover:bg-gray-50 print:hover:bg-transparent" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                <td className="border border-gray-400 p-1.5">{index + 1}</td>
                                <td className="border border-gray-400 p-1.5 font-mono text-xs">{item.student.nisn || '-'}</td>
                                <td className="border border-gray-400 p-1.5 text-left pl-3">{item.student.name}</td>
                                <td className="border border-gray-400 p-1.5">{item.s}</td>
                                <td className="border border-gray-400 p-1.5">{item.i}</td>
                                <td className="border border-gray-400 p-1.5 font-bold text-red-600">{item.a}</td>
                                <td className="border border-gray-400 p-1.5">{item.d}</td>
                                <td className="border border-gray-400 p-1.5 font-bold">{item.percentage}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div data-doc-footer="true" className="mt-10 flex flex-col md:flex-row justify-between text-black break-inside-avoid gap-8 md:gap-0 signature-section" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div className="text-center md:text-left md:ml-4">
                    <p className="mb-16">Mengetahui<br/>Kepala Sekolah,</p>
                    <p className="font-bold underline">{settings.headmaster || 'Agung Budiartati, M.Pd.'}</p>
                    <p className="text-sm">NIP {settings.headmaster_nip || '197104092000122003'}</p> 
                </div>

                <div className="text-center md:text-left md:mr-10">
                    <p className="mb-16">Kota Pasuruan, {currentDateStr}<br/>Guru Mata Pelajaran,</p>
                    <p className="font-bold underline">{profile?.full_name}</p>
                    <p className="text-sm">NIP {profile?.nip || '-'}</p>
                </div>
            </div>
        </div>
      )}
    </Layout>
  );
};

export default RekapAbsensi;
