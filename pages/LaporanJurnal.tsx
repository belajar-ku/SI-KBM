
import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Printer, Loader2, FileText, Search, BookOpen, CheckSquare, Square } from 'lucide-react';
import { formatDateIndo, getWIBDate } from '../utils/dateUtils';

interface JournalReportItem {
    id: string;
    created_at: string;
    kelas: string;
    subject: string;
    hours: string;
    material: string;
    validation: string;
    attendance_logs: {
        student_name: string;
        status: string;
    }[];
}

const LaporanJurnal: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [journals, setJournals] = useState<JournalReportItem[]>([]);
  
  // Filter settings
  const [settings, setSettings] = useState({
      academic_year: '...',
      semester: '...',
      headmaster: '...',
      headmaster_nip: ''
  });

  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
        // 1. Fetch App Settings
        const { data: settingsData } = await supabase.from('app_settings').select('*');
        const newSettings: any = {};
        settingsData?.forEach(item => newSettings[item.key] = item.value);
        setSettings(prev => ({ ...prev, ...newSettings }));

        // 2. Fetch Journals with Attendance
        // Note: Supabase JS doesn't always support deep nested sorting easily in one go for reports,
        // but we order journals by date descending.
        const { data: journalData, error } = await supabase
            .from('journals')
            .select(`
                id,
                created_at,
                kelas,
                subject,
                hours,
                material,
                validation,
                attendance_logs (
                    student_name,
                    status
                )
            `)
            .eq('teacher_id', profile?.id)
            .order('created_at', { ascending: false }); // Urutkan terbaru dulu

        if (error) throw error;
        setJournals((journalData as any[]) || []);

    } catch (err) {
        console.error("Error fetching report data", err);
    } finally {
        setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentDateStr = formatDateIndo(getWIBDate());

  // Render list murid tidak hadir
  const renderAttendanceList = (logs: any[]) => {
      const absents = logs.filter(l => ['S', 'I', 'A'].includes(l.status));
      if (absents.length === 0) return "NIHIL";
      
      return (
          <ul className="list-none m-0 p-0">
              {absents.map((l, idx) => (
                  <li key={idx} className="mb-0.5">
                      {l.student_name} | <strong>{l.status}</strong>
                  </li>
              ))}
          </ul>
      );
  };

  return (
    <Layout>
      {/* --- NAVIGASI (HIDDEN SAAT PRINT) --- */}
      <div className="print:hidden space-y-6 mb-8">
         <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                <BookOpen size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Laporan Jurnal Guru</h2>
                <p className="text-gray-500 text-sm">Rekapitulasi agenda kegiatan belajar mengajar.</p>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
             <div>
                 <h3 className="font-bold text-gray-700">Filter Laporan</h3>
                 <p className="text-xs text-gray-500">Menampilkan semua jurnal semester ini.</p>
             </div>
             <button 
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
             >
                <Printer size={20} /> Cetak Laporan
             </button>
         </div>
      </div>

      {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
      ) : (
          <div className="bg-white p-8 shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full animate-fade-in" ref={componentRef}>
              
              {/* KOP SURAT */}
               <div className="flex items-center gap-4 mb-6 border-b-2 border-black pb-4">
                     <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="h-20 w-auto" />
                     <div>
                         <h1 className="text-xl font-bold uppercase tracking-wide text-black">UPT SMP NEGERI 1 PASURUAN</h1>
                         <h2 className="text-lg font-bold text-black">Jurnal Guru: {profile?.full_name}</h2>
                         <p className="text-sm text-gray-600">Rekapitulasi | Semester {settings.semester} - Th. Ajaran {settings.academic_year}</p>
                     </div>
               </div>

               {/* TABEL JURNAL */}
               <table className="w-full border-collapse border border-gray-400 text-sm text-black">
                   <thead>
                       <tr className="bg-gray-100">
                           <th className="border border-gray-400 p-2 w-10">No</th>
                           <th className="border border-gray-400 p-2 w-48 text-left">Hari, Tanggal<br/>Jam ke</th>
                           <th className="border border-gray-400 p-2 w-16 text-center">Kelas</th>
                           <th className="border border-gray-400 p-2 text-left">Mata Pelajaran<br/>Kegiatan Pembelajaran</th>
                           <th className="border border-gray-400 p-2 w-64 text-left">Ketidakhadiran Murid</th>
                       </tr>
                   </thead>
                   <tbody>
                       {journals.map((journal, index) => (
                           <tr key={journal.id} className="align-top">
                               <td className="border border-gray-400 p-2 text-center">{journals.length - index}</td>
                               <td className="border border-gray-400 p-2">
                                   <div className="font-bold">{formatDateIndo(journal.created_at)}</div>
                                   <div className="text-gray-600">Jam ke {journal.hours}</div>
                               </td>
                               <td className="border border-gray-400 p-2 text-center font-bold text-lg">{journal.kelas}</td>
                               <td className="border border-gray-400 p-2">
                                   <div className="font-bold mb-1">{journal.subject}</div>
                                   <div className="mb-2">{journal.material}</div>
                                   
                                   {/* Simulasi Checkbox Validasi (Visual Only sesuai request) */}
                                   <div className="flex gap-4 text-xs text-gray-600 mt-2">
                                        <div className="flex items-center gap-1">
                                            {journal.validation === 'hadir_kbm' ? <CheckSquare size={14}/> : <Square size={14}/>}
                                            <span>KBM Terlaksana</span>
                                        </div>
                                   </div>
                               </td>
                               <td className="border border-gray-400 p-2 text-xs">
                                   {renderAttendanceList(journal.attendance_logs)}
                               </td>
                           </tr>
                       ))}
                       {journals.length === 0 && (
                           <tr>
                               <td colSpan={5} className="border border-gray-400 p-8 text-center text-gray-500 italic">
                                   Belum ada data jurnal untuk semester ini.
                               </td>
                           </tr>
                       )}
                   </tbody>
               </table>

                {/* TANDA TANGAN */}
                <div className="mt-10 flex justify-between text-black break-inside-avoid">
                    <div className="text-center">
                        <p className="mb-16">Mengetahui<br/>Kepala Sekolah,</p>
                        <p className="font-bold underline">{settings.headmaster}</p>
                        <p className="text-sm">NIP {settings.headmaster_nip || '........................'}</p> 
                    </div>

                    <div className="text-center mr-10">
                        <p className="mb-16">Kota Pasuruan, {currentDateStr}<br/>Guru Mata Pelajaran,</p>
                        <p className="font-bold underline">{profile?.full_name}</p>
                        <p className="text-sm">NIP {profile?.nip}</p>
                    </div>
                </div>

          </div>
      )}
    </Layout>
  );
};

export default LaporanJurnal;
