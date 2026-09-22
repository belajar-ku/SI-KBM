import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Printer, 
  Download, 
  Loader2, 
  TrendingUp, 
  CheckSquare, 
  Square, 
  Filter, 
  User, 
  Calendar,
  Layers,
  ArrowUpDown,
  FileCheck2
} from 'lucide-react';
import { formatDateIndo, formatDateSignature } from '../utils/dateUtils';
import { downloadPaginatedTablePdf, printCleanDocument } from '../utils/printAndPdf';
import { LOGO_SMPN1_BASE64 } from '../utils/logoData';

interface JournalReportItem {
  id: string;
  created_at: string;
  kelas: string;
  subject: string;
  hours: string;
  material: string;
  validation: string;
  notes?: string | null;
  attendance_logs: {
    student_name: string;
    status: string;
  }[];
}

interface TeacherProfile {
  id: string;
  full_name: string;
  nip?: string | null;
  mengajar_mapel?: string | null;
  role?: string;
}

const LaporanJurnal: React.FC = () => {
  const { profile, isAdmin, isOperator, academicYear, semester } = useAuth();
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState('');

  // App Settings
  const [settings, setSettings] = useState({
    academic_year: '',
    semester: '',
    headmaster: 'Agung Budiartati, M.Pd.',
    headmaster_nip: '197104092000122003'
  });

  // Teachers list (for Headmaster / Admin / Operator)
  const isHeadmaster = profile?.mengajar_mapel === 'Kepala Sekolah';
  const canSelectTeacher = isAdmin || isOperator || isHeadmaster;
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);

  // Raw & Filtered Journals
  const [allJournals, setAllJournals] = useState<JournalReportItem[]>([]);
  const [filteredJournals, setFilteredJournals] = useState<JournalReportItem[]>([]);

  // Filters
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // asc = kronologis

  const componentRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load: Fetch Settings & Teachers
  useEffect(() => {
    if (profile) {
      initData();
    }
  }, [profile]);

  const initData = async () => {
    try {
      // Fetch settings
      const { data: settingsData } = await supabase.from('app_settings').select('*');
      const newSettings: any = {};
      settingsData?.forEach(item => newSettings[item.key] = item.value);
      setSettings(prev => ({ ...prev, ...newSettings }));

      // Fetch teachers list
      const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, nip, mengajar_mapel, role')
        .order('full_name');
      
      const teacherList = teacherProfiles || [];
      setTeachers(teacherList);

      // Default selected teacher
      if (canSelectTeacher) {
        // If current profile is in list, select it, else first non-admin teacher
        const myTeacher = teacherList.find(t => t.id === profile?.id);
        if (myTeacher && !isHeadmaster) {
          setSelectedTeacherId(myTeacher.id);
          setSelectedTeacher(myTeacher);
        } else if (teacherList.length > 0) {
          // Select first teacher who has journals or first user
          const firstTeacher = teacherList.find(t => t.role === 'user' && t.mengajar_mapel !== 'Kepala Sekolah') || teacherList[0];
          setSelectedTeacherId(firstTeacher.id);
          setSelectedTeacher(firstTeacher);
        }
      } else if (profile) {
        setSelectedTeacherId(profile.id);
        setSelectedTeacher({
          id: profile.id,
          full_name: profile.full_name,
          nip: profile.nip,
          mengajar_mapel: profile.mengajar_mapel
        });
      }
    } catch (err) {
      console.error("Error in initData:", err);
    }
  };

  // 2. Fetch Journals when selected teacher changes
  useEffect(() => {
    if (selectedTeacherId) {
      fetchTeacherJournals(selectedTeacherId);
    }
  }, [selectedTeacherId, settings.academic_year, settings.semester]);

  const fetchTeacherJournals = async (teacherId: string) => {
    setLoading(true);
    try {
      const activeYear = settings.academic_year || academicYear || localStorage.getItem('app_academic_year') || '2026/2027';
      const activeSem = settings.semester || semester || localStorage.getItem('app_semester') || 'Ganjil';

      // Find teacher profile info
      const currentTeacher = teachers.find(t => t.id === teacherId) || (profile?.id === teacherId ? profile : null);
      if (currentTeacher) {
        setSelectedTeacher({
          id: currentTeacher.id,
          full_name: currentTeacher.full_name,
          nip: currentTeacher.nip,
          mengajar_mapel: currentTeacher.mengajar_mapel
        });
      }

      // Fetch ALL journals for this teacher in active year & semester (using batching)
      let allFetched: JournalReportItem[] = [];
      let page = 0;
      const pageSize = 500;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
          .from('journals')
          .select(`
            id,
            created_at,
            kelas,
            subject,
            hours,
            material,
            validation,
            notes,
            attendance_logs (
              student_name,
              status
            )
          `)
          .eq('teacher_id', teacherId)
          .eq('academic_year', activeYear)
          .eq('semester', activeSem)
          .order('created_at', { ascending: true })
          .range(from, to);

        if (error) {
          console.error("Error fetching teacher journals:", error);
          break;
        }

        if (data && data.length > 0) {
          allFetched = allFetched.concat(data as any);
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      setAllJournals(allFetched);

      // Collect available classes
      const classSet = new Set<string>();
      allFetched.forEach(j => {
        if (j.kelas) classSet.add(j.kelas);
      });
      setAvailableClasses(Array.from(classSet).sort());
      setFilterClass('all');
      setFilterMonth('all');

    } catch (err) {
      console.error("Error in fetchTeacherJournals:", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Apply Local Filters (Class, Month, Sort Order)
  useEffect(() => {
    let result = [...allJournals];

    // Filter by class
    if (filterClass !== 'all') {
      result = result.filter(j => j.kelas === filterClass);
    }

    // Filter by month
    if (filterMonth !== 'all') {
      result = result.filter(j => {
        const month = new Date(j.created_at).getMonth() + 1; // 1-12
        return month.toString() === filterMonth;
      });
    }

    // Sort order
    result.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    setFilteredJournals(result);
  }, [allJournals, filterClass, filterMonth, sortOrder]);

  // Clean Print Action
  const handlePrintClean = () => {
    if (!componentRef.current) return;
    const docTitle = `Laporan Jurnal - ${selectedTeacher?.full_name || 'Guru'} - ${settings.academic_year || '2026-2027'}`;
    printCleanDocument(componentRef.current, docTitle);
  };

  // Real PDF Download Action
  const handleDownloadPdf = async () => {
    if (!componentRef.current) return;
    setDownloadingPdf(true);
    const teacherName = (selectedTeacher?.full_name || 'Guru').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Laporan_Jurnal_${teacherName}_${(settings.semester || 'Ganjil')}_${(settings.academic_year || '2026-2027').replace('/', '-')}`;

    try {
      await downloadPaginatedTablePdf(componentRef.current, filename, {
        orientation: 'portrait',
        onProgress: (msg) => setPdfProgressText(msg),
      });
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Terjadi kesalahan saat membuat file PDF. Silakan gunakan opsi 'Cetak Dokumen' sebagai alternatif.");
    } finally {
      setDownloadingPdf(false);
      setPdfProgressText('');
    }
  };

  const currentDateStr = formatDateSignature(new Date());

  const renderAttendanceSummary = (logs: { student_name: string; status: string }[]) => {
    if (!logs || logs.length === 0) {
      return <span className="text-gray-500 italic text-[11px]">Nihil (Semua Hadir)</span>;
    }
    const absents = logs.filter(l => ['S', 'I', 'A', 'D'].includes(l.status));
    if (absents.length === 0) {
      return <span className="text-gray-500 italic text-[11px]">Nihil (Semua Hadir)</span>;
    }

    return (
      <div className="space-y-0.5">
        {absents.map((l, idx) => {
          const badgeColor = 
            l.status === 'S' ? 'text-blue-700 bg-blue-50' :
            l.status === 'I' ? 'text-amber-700 bg-amber-50' :
            l.status === 'A' ? 'text-red-700 bg-red-50 font-bold' : 'text-purple-700 bg-purple-50';
          return (
            <div key={idx} className="text-[11px] leading-tight flex items-center gap-1">
              <span className={`px-1 py-0.2 rounded text-[9px] font-bold border ${badgeColor}`}>
                {l.status}
              </span>
              <span>{l.student_name}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const activeYearDisplay = settings.academic_year || academicYear || '2026/2027';
  const activeSemDisplay = settings.semester || semester || 'Ganjil';

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-sm">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                  Laporan Jurnal Guru
                </h2>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  TA: {activeYearDisplay} ({activeSemDisplay})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Rekapitulasi lengkap agenda mengajar guru, kehadiran siswa, dan lembar pengesahan.
              </p>
            </div>
          </div>

          {/* Action Buttons: Download PDF & Cetak Dokumen */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={handleDownloadPdf}
              disabled={loading || downloadingPdf || filteredJournals.length === 0}
              className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <span>Unduh PDF (.pdf)</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrintClean}
              disabled={loading || downloadingPdf || filteredJournals.length === 0}
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cetak dokumen resmi tanpa elemen browser"
            >
              <Printer size={16} />
              <span>Cetak Dokumen</span>
            </button>
          </div>
        </div>

        {/* Filter Control Box */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Filter size={14} />
            <span>Pengaturan &amp; Filter Laporan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Teacher Selector (Active if Headmaster or Admin) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <User size={13} className="text-amber-500" /> Guru Pengajar
              </label>
              {canSelectTeacher ? (
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} {t.mengajar_mapel ? `(${t.mengajar_mapel})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                  {selectedTeacher?.full_name || profile?.full_name}
                </div>
              )}
            </div>

            {/* Class Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Layers size={13} className="text-blue-500" /> Filter Kelas
              </label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Kelas ({availableClasses.length} Rombel)</option>
                {availableClasses.map((c) => (
                  <option key={c} value={c}>
                    Kelas {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-emerald-500" /> Periode Bulan
              </label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Seluruh Semester ({activeSemDisplay})</option>
                <option value="7">Juli</option>
                <option value="8">Agustus</option>
                <option value="9">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
                <option value="1">Januari</option>
                <option value="2">Februari</option>
                <option value="3">Maret</option>
                <option value="4">April</option>
                <option value="5">Mei</option>
                <option value="6">Juni</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <ArrowUpDown size={13} className="text-purple-500" /> Urutan Tanggal
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="asc">Kronologis (Awal ke Akhir Semester)</option>
                <option value="desc">Terbaru Dahulu</option>
              </select>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
            <div className="text-slate-500 dark:text-slate-400 font-medium">
              Menampilkan <span className="font-bold text-slate-800 dark:text-white">{filteredJournals.length}</span> pertemuan kegiatan pembelajaran dari total {allJournals.length} entri jurnal guru.
            </div>
            {filteredJournals.length > 0 && (
              <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <FileCheck2 size={14} />
                <span>Dokumen Siap Cetak / Unduh PDF</span>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Loader2 className="animate-spin text-amber-500 mb-2" size={32} />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Sedang memuat seluruh arsip jurnal guru...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredJournals.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <p className="font-bold text-slate-700 dark:text-slate-200">
              Tidak ditemukan data jurnal untuk kriteria filter yang dipilih.
            </p>
            <p className="text-xs text-slate-500">
              Pastikan guru telah menginput jurnal pada tahun ajaran {activeYearDisplay} ({activeSemDisplay}) atau ubah pilihan kelas/bulan.
            </p>
          </div>
        )}

        {/* Official Document Container (This element is converted to PDF & sent to clean print) */}
        {!loading && filteredJournals.length > 0 && (
          <div className="bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-500 mb-2 flex items-center justify-between px-1">
              <span>PRATINJAU DOKUMEN RESMI (KONTEN CETAK/PDF):</span>
              <span>Kertas: A4 Standar</span>
            </div>

            <div
              ref={componentRef}
              className="bg-white text-black p-6 sm:p-10 shadow-md mx-auto max-w-[950px] rounded-lg border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {/* Header Dokumen (Kop Surat + Identitas Guru) */}
              <div data-doc-header="true" className="doc-header mb-4">
                {/* Kop Surat Resmi */}
                <div className="flex items-center gap-4 border-b-2 border-black pb-3 mb-3">
                  <img
                    src={LOGO_SMPN1_BASE64}
                    alt="Logo UPT SMP Negeri 1 Pasuruan"
                    className="h-16 sm:h-20 w-auto shrink-0"
                  />
                  <div className="flex-1">
                    <h1 className="text-base sm:text-lg font-bold uppercase tracking-wide leading-tight text-black m-0">
                      UPT SMP NEGERI 1 PASURUAN
                    </h1>
                    <h2 className="text-sm sm:text-base font-bold leading-tight text-black mt-0.5 m-0">
                      LAPORAN JURNAL KEGIATAN BELAJAR MENGAJAR (KBM)
                    </h2>
                    <p className="text-xs text-gray-700 mt-1 m-0">
                      Jalan Balaikota 7 Pasuruan | Website: smpn1pasuruan.sch.id
                    </p>
                  </div>
                </div>

                {/* Identitas Guru & Laporan */}
                <div className="text-xs leading-relaxed text-black border border-gray-400 p-2.5 bg-gray-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                    <div className="flex">
                      <span className="w-32 font-bold shrink-0">Nama Guru</span>
                      <span className="mr-2">:</span>
                      <span className="font-semibold">{selectedTeacher?.full_name || '-'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-bold shrink-0">Tahun Ajaran</span>
                      <span className="mr-2">:</span>
                      <span>{activeYearDisplay}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-bold shrink-0">NIP</span>
                      <span className="mr-2">:</span>
                      <span>{selectedTeacher?.nip || '-'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-bold shrink-0">Semester</span>
                      <span className="mr-2">:</span>
                      <span>{activeSemDisplay}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-bold shrink-0">Mata Pelajaran</span>
                      <span className="mr-2">:</span>
                      <span>{selectedTeacher?.mengajar_mapel || (filteredJournals[0]?.subject || '-')}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-bold shrink-0">Total Pertemuan</span>
                      <span className="mr-2">:</span>
                      <span className="font-bold">{filteredJournals.length} Pertemuan KBM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabel Seluruh Jurnal Guru */}
              <table data-doc-table="true" className="w-full border-collapse border border-black text-xs text-black">
                <thead>
                  <tr className="bg-gray-100 text-center">
                    <th className="border border-black p-1.5 w-8">No</th>
                    <th className="border border-black p-1.5 w-36 text-left">Hari, Tanggal<br />&amp; Jam Ke</th>
                    <th className="border border-black p-1.5 w-12 text-center">Kelas</th>
                    <th className="border border-black p-1.5 text-left">Mata Pelajaran &amp; Kegiatan Belajar (Materi)</th>
                    <th className="border border-black p-1.5 w-44 text-left">Ketidakhadiran Siswa</th>
                    <th className="border border-black p-1.5 w-20 text-center">KBM</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJournals.map((journal, index) => (
                    <tr key={journal.id} className="align-top" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <td className="border border-black p-1.5 text-center font-bold">{index + 1}</td>
                      <td className="border border-black p-1.5">
                        <div className="font-bold">{formatDateIndo(journal.created_at)}</div>
                        <div className="text-gray-600 text-[10px]">Jam ke-{journal.hours || '-'}</div>
                      </td>
                      <td className="border border-black p-1.5 text-center font-bold text-sm">
                        {journal.kelas}
                      </td>
                      <td className="border border-black p-1.5">
                        <div className="font-bold text-[11px] mb-0.5">{journal.subject}</div>
                        <div className="whitespace-pre-wrap leading-tight text-[11px]">{journal.material}</div>
                        {journal.notes && (
                          <div className="mt-1 text-[10px] text-gray-600 italic">
                            Catatan: {journal.notes}
                          </div>
                        )}
                      </td>
                      <td className="border border-black p-1.5">
                        {renderAttendanceSummary(journal.attendance_logs)}
                      </td>
                      <td className="border border-black p-1.5 text-center text-[10px]">
                        {journal.validation === 'hadir_kbm' ? (
                          <span className="font-bold text-green-700">Terlaksana</span>
                        ) : (
                          <span className="text-gray-600">Terlaksana</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Lembar Tanda Tangan Resmi */}
              <div
                data-doc-footer="true"
                className="mt-8 flex justify-between items-start text-xs text-black signature-section"
                style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
              >
                <div className="text-center w-64">
                  <p className="m-0 leading-tight">
                    Mengetahui,<br />
                    Kepala UPT SMP Negeri 1 Pasuruan
                  </p>
                  <div className="h-16" />
                  <p className="m-0 font-bold underline text-sm">
                    {settings.headmaster || 'Agung Budiartati, M.Pd.'}
                  </p>
                  <p className="m-0 text-[11px]">
                    NIP {settings.headmaster_nip || '197104092000122003'}
                  </p>
                </div>

                <div className="text-center w-64">
                  <p className="m-0 leading-tight">
                    Kota Pasuruan, {currentDateStr}<br />
                    Guru Mata Pelajaran
                  </p>
                  <div className="h-16" />
                  <p className="m-0 font-bold underline text-sm">
                    {selectedTeacher?.full_name || '-'}
                  </p>
                  <p className="m-0 text-[11px]">
                    NIP {selectedTeacher?.nip || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LaporanJurnal;
