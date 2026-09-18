import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { 
  Activity, Calendar, Search, Loader2, Download, Printer, 
  CheckCircle2, AlertTriangle, XCircle, Info, ChevronRight, 
  X, Filter, Eye, ArrowUpDown, BookOpen, Clock, CalendarDays, RefreshCw
} from 'lucide-react';
import { Profile, Schedule } from '../types';
import { 
  fetchNonEffectiveData, 
  getMonthEfficiencyStats, 
  calculateTeacherTargetJp, 
  NonEffectiveDay, 
  SchoolActivityItem,
  MonthEfficiencyStats
} from '../utils/performanceUtils';
import { formatDateIndo, formatDateSignature, getWIBDate } from '../utils/dateUtils';

interface TeacherRecapRow {
  id: string;
  nip: string;
  fullName: string;
  subject: string;
  waliKelas?: string;
  targetJp: number;
  actualJp: number;
  differenceJp: number;
  percentage: number;
  status: 'Di Atas Ekspektasi' | 'Sesuai Ekspektasi' | 'Di Bawah Ekspektasi' | 'Tidak Ada Jadwal';
  statusBadgeColor: string;
  deductedJp: number;
  deductedBreakdown: Array<{ date: string; reason: string; deductedHours: number }>;
  schedules: Schedule[];
}

export const RekapKinerjaBulanan: React.FC = () => {
  const { academicYear, semester, activeScheduleVersion, semesterStart, semesterEnd } = useAuth();

  const currentDate = getWIBDate();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [calculationMode, setCalculationMode] = useState<'sampaisekarang' | 'sebulanpenuh'>('sampaisekarang');
  const [selectedVersion, setSelectedVersion] = useState<string>(activeScheduleVersion || 'Utama');
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [recapData, setRecapData] = useState<TeacherRecapRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'percentage' | 'target' | 'actual'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Efficiency stats of the chosen month
  const [monthStats, setMonthStats] = useState<MonthEfficiencyStats | null>(null);
  const [headmaster, setHeadmaster] = useState<{ name: string; nip: string }>({ name: '', nip: '' });

  // Detail Modal State
  const [detailTeacher, setDetailTeacher] = useState<TeacherRecapRow | null>(null);
  const [teacherJournals, setTeacherJournals] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Fetch Available Schedule Versions & Headmaster info
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [settingsRes, schedRes] = await Promise.all([
          supabase.from('app_settings').select('*'),
          supabase.from('schedules').select('schedule_version').eq('academic_year', academicYear || '2026/2027').eq('semester', semester || 'Ganjil')
        ]);

        let hmName = 'Agung Budiartati, M.Pd.';
        let hmNip = '197104092000122003';
        let activeVer = activeScheduleVersion || 'Utama';

        if (settingsRes.data) {
          settingsRes.data.forEach(item => {
            if (item.key === 'headmaster') hmName = item.value || hmName;
            if (item.key === 'headmaster_nip') hmNip = item.value || hmNip;
            if (item.key === 'active_schedule_version' && item.value) activeVer = item.value;
          });
        }
        setHeadmaster({ name: hmName, nip: hmNip });

        const vSet = new Set<string>();
        if (schedRes.data) {
          schedRes.data.forEach(s => { if (s.schedule_version) vSet.add(s.schedule_version); });
        }
        if (activeVer) vSet.add(activeVer);
        if (vSet.size === 0) vSet.add('Utama');
        const vList = Array.from(vSet);
        setAvailableVersions(vList);
        setSelectedVersion(activeVer);
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    };
    fetchMetadata();
  }, [academicYear, semester, activeScheduleVersion]);

  // Load Main Recap Data
  useEffect(() => {
    fetchRecapData();
  }, [selectedMonth, selectedYear, calculationMode, selectedVersion, academicYear, semester]);

  const fetchRecapData = async () => {
    setLoading(true);
    try {
      // 1. Fetch non-effective data
      const { nonEffectiveDays, schoolActivities } = await fetchNonEffectiveData();

      // 2. Determine end calculation day
      const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth();
      const isPastMonth = selectedYear < currentDate.getFullYear() || (selectedYear === currentDate.getFullYear() && selectedMonth < currentDate.getMonth());

      let endDay = lastDayOfMonth;
      if (calculationMode === 'sampaisekarang' && isCurrentMonth) {
        endDay = currentDate.getDate();
      } else if (!isCurrentMonth && !isPastMonth) {
        // Future month
        endDay = lastDayOfMonth;
      }

      // 3. Calculate efficiency stats for this month
      const efficiency = getMonthEfficiencyStats(selectedYear, selectedMonth, endDay, nonEffectiveDays, schoolActivities);
      setMonthStats(efficiency);

      // 4. Date ranges for Supabase query
      const firstDayDate = new Date(selectedYear, selectedMonth, 1);
      const firstDayStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01T00:00:00+07:00`;
      const endDayStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}T23:59:59+07:00`;

      // 5. Fetch teachers, schedules, journals
      const [profilesRes, schedulesRes, journalsRes] = await Promise.all([
        supabase.from('profiles').select('*').neq('role', 'operator').order('full_name'),
        supabase.from('schedules')
          .select('*')
          .eq('academic_year', academicYear || '2026/2027')
          .eq('semester', semester || 'Ganjil')
          .eq('schedule_version', selectedVersion || 'Utama'),
        supabase.from('journals')
          .select('id, teacher_id, hours, created_at, material, kelas, subject')
          .eq('academic_year', academicYear || '2026/2027')
          .eq('semester', semester || 'Ganjil')
          .gte('created_at', firstDayStr)
          .lte('created_at', endDayStr)
      ]);

      const excludedNames = ['Guru Baru', 'Agung Budiartati, M.Pd.', 'Dra.Laily Asriyah, M.Pd.I.'];
      const allTeachers = (profilesRes.data || []).filter(t => !excludedNames.includes(t.full_name));
      const allSchedules: Schedule[] = schedulesRes.data || [];
      const allJournals = journalsRes.data || [];

      // 6. Process each teacher
      const rows: TeacherRecapRow[] = allTeachers.map(t => {
        const myScheds = allSchedules.filter(s => s.teacher_id === t.id);

        // Accurate target calculation strictly excluding non-effective days and school activities
        const { targetJp, deductedJp, deductedBreakdown } = calculateTeacherTargetJp(
          myScheds,
          selectedYear,
          selectedMonth,
          endDay,
          nonEffectiveDays,
          schoolActivities
        );

        // Actual JP from journals
        const myJournals = allJournals.filter(j => j.teacher_id === t.id);
        let actualJp = 0;
        myJournals.forEach(j => {
          const parts = (j.hours || '').split(',').filter((h: string) => h.trim().length > 0);
          actualJp += parts.length;
        });

        const differenceJp = actualJp - targetJp;
        const percentage = targetJp > 0 ? Math.round((actualJp / targetJp) * 100) : 0;

        let status: TeacherRecapRow['status'] = 'Di Bawah Ekspektasi';
        let statusBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200';

        if (targetJp === 0 && actualJp === 0) {
          status = 'Tidak Ada Jadwal';
          statusBadgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
        } else if (percentage >= 85) {
          status = 'Di Atas Ekspektasi';
          statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        } else if (percentage >= 70) {
          status = 'Sesuai Ekspektasi';
          statusBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
        }

        return {
          id: t.id,
          nip: t.nip || '-',
          fullName: t.full_name,
          subject: t.mengajar_mapel || 'Guru Mapel',
          waliKelas: t.wali_kelas,
          targetJp,
          actualJp,
          differenceJp,
          percentage,
          status,
          statusBadgeColor,
          deductedJp,
          deductedBreakdown,
          schedules: myScheds
        };
      });

      setRecapData(rows);
    } catch (err) {
      console.error('Error fetching recap data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and Sort
  const filteredAndSorted = useMemo(() => {
    let result = [...recapData];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.fullName.toLowerCase().includes(q) || 
        r.nip.toLowerCase().includes(q) || 
        r.subject.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.fullName.localeCompare(b.fullName);
      } else if (sortField === 'percentage') {
        comparison = a.percentage - b.percentage;
      } else if (sortField === 'target') {
        comparison = a.targetJp - b.targetJp;
      } else if (sortField === 'actual') {
        comparison = a.actualJp - b.actualJp;
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [recapData, searchTerm, statusFilter, sortField, sortAsc]);

  // Overall statistics summary
  const summaryStats = useMemo(() => {
    const totalTeachers = recapData.length;
    const teachersWithSchedule = recapData.filter(r => r.targetJp > 0);
    const totalTarget = recapData.reduce((acc, r) => acc + r.targetJp, 0);
    const totalActual = recapData.reduce((acc, r) => acc + r.actualJp, 0);
    const avgPercentage = teachersWithSchedule.length > 0 
      ? Math.round(teachersWithSchedule.reduce((acc, r) => acc + r.percentage, 0) / teachersWithSchedule.length) 
      : 0;

    const aboveExpectation = recapData.filter(r => r.status === 'Di Atas Ekspektasi').length;
    const meetExpectation = recapData.filter(r => r.status === 'Sesuai Ekspektasi').length;
    const belowExpectation = recapData.filter(r => r.status === 'Di Bawah Ekspektasi').length;

    return {
      totalTeachers,
      totalTarget,
      totalActual,
      avgPercentage,
      aboveExpectation,
      meetExpectation,
      belowExpectation
    };
  }, [recapData]);

  // Open Detail Modal for Teacher
  const handleOpenDetail = async (teacher: TeacherRecapRow) => {
    setDetailTeacher(teacher);
    setLoadingDetail(true);
    try {
      const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const firstDayStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01T00:00:00+07:00`;
      const endDayStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}T23:59:59+07:00`;

      const { data } = await supabase.from('journals')
        .select('*')
        .eq('teacher_id', teacher.id)
        .gte('created_at', firstDayStr)
        .lte('created_at', endDayStr)
        .order('created_at', { ascending: false });

      setTeacherJournals(data || []);
    } catch (err) {
      console.error('Error fetching teacher journals:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'No', 'Nama Guru', 'NIP', 'Mata Pelajaran', 'Wali Kelas',
      'Target JP (Efektif)', 'Realisasi JP', 'Selisih JP', 'Ketercapaian (%)', 'Status Kinerja'
    ];

    const rows = filteredAndSorted.map((r, i) => [
      i + 1,
      `"${r.fullName}"`,
      `"${r.nip}"`,
      `"${r.subject}"`,
      `"${r.waliKelas || '-'}"`,
      r.targetJp,
      r.actualJp,
      r.differenceJp,
      `${r.percentage}%`,
      `"${r.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Kinerja_Guru_${monthNames[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="space-y-6 pb-20 animate-fade-in max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm print:hidden">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Activity size={22} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                  Rekap Kinerja Guru Bulanan
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Rekapitulasi target jam pelajaran (JP) tersinkronisasi dengan hari non-efektif.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                T.A: {academicYear || '2026/2027'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                Semester: {semester || 'Ganjil'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                Jadwal: {selectedVersion}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            <button
              onClick={fetchRecapData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
              title="Perbarui Data"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={loading || filteredAndSorted.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Download size={14} />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={loading || filteredAndSorted.length === 0}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Printer size={14} />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Bulan */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Pilih Bulan
              </label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="w-full text-xs font-bold py-2 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx}>{name}</option>
                ))}
              </select>
            </div>

            {/* Tahun */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Tahun
              </label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="w-full text-xs font-bold py-2 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Versi Jadwal */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Versi Jadwal
              </label>
              <select
                value={selectedVersion}
                onChange={e => setSelectedVersion(e.target.value)}
                className="w-full text-xs font-bold py-2 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {availableVersions.map(v => (
                  <option key={v} value={v}>
                    {v} {v === (activeScheduleVersion || 'Utama Versi 1') ? '★ (Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Perhitungan */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Target Hitungan
              </label>
              <select
                value={calculationMode}
                onChange={e => setCalculationMode(e.target.value as any)}
                className="w-full text-xs font-bold py-2 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="sampaisekarang">Hingga Hari Ini (Realtime)</option>
                <option value="sebulanpenuh">1 Bulan Penuh</option>
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Status Kinerja
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full text-xs font-bold py-2 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Predikat</option>
                <option value="Di Atas Ekspektasi">Di Atas Ekspektasi (&gt;85%)</option>
                <option value="Sesuai Ekspektasi">Sesuai Ekspektasi (70-85%)</option>
                <option value="Di Bawah Ekspektasi">Di Bawah Ekspektasi (&lt;70%)</option>
                <option value="Tidak Ada Jadwal">Tidak Ada Jadwal</option>
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative pt-1">
            <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama guru, NIP, atau mata pelajaran..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sync Non-Effective Days Notice Banner */}
        {monthStats && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 shadow-sm">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Sinkronisasi Hari Non-Efektif Aktif
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full">
                      Tersinkron
                    </span>
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Target Jam Pelajaran (JP) guru pada bulan <strong>{monthNames[selectedMonth]} {selectedYear}</strong> telah secara otomatis dikurangi hari non-efektif dan kegiatan sekolah sesuai data admin, sehingga target mencerminkan hari KBM efektif yang sebenarnya.
                  </p>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="bg-white dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-center shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">KBM Efektif</span>
                  <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                    {monthStats.effectiveDaysCount} Hari
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-center shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Non-Efektif</span>
                  <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                    {monthStats.nonEffectiveCount} Hari
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-center shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Minggu</span>
                  <span className="text-sm font-extrabold text-slate-600 dark:text-slate-300">
                    {monthStats.sundayCount} Hari
                  </span>
                </div>
              </div>
            </div>

            {/* List of Non Effective Days in this Month */}
            {monthStats.nonEffectiveList.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  <CalendarDays size={14} className="text-rose-500" />
                  <span>Daftar Hari Non-Efektif Terdaftar di Bulan Ini:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {monthStats.nonEffectiveList.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <strong>{formatDateIndo(item.date)}</strong>: {item.reason} ({item.hours})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Guru Terjadwal
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800 dark:text-white">
                {summaryStats.totalTeachers}
              </span>
              <span className="text-xs text-slate-500 font-medium">Orang</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Guru Mapel terdaftar</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Rata-Rata Ketercapaian
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {summaryStats.avgPercentage}%
              </span>
              <span className="text-xs text-slate-500 font-medium">dari Target JP</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Target dipotong hari libur</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Target vs Realisasi
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-slate-800 dark:text-white">
                {summaryStats.totalActual}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ {summaryStats.totalTarget} JP</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total jam se-sekolah</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Sebaran Predikat Kinerja
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded" title="Di Atas Ekspektasi">
                🟢 {summaryStats.aboveExpectation}
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded" title="Sesuai Ekspektasi">
                🔵 {summaryStats.meetExpectation}
              </span>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded" title="Di Bawah Ekspektasi">
                🔴 {summaryStats.belowExpectation}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Evaluasi pemenuhan JP</p>
          </div>
        </div>

        {/* Printable & Screen Table */}
        <div ref={printAreaRef} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Official Printable Header (Visible during Print only) */}
          <div className="hidden print:block p-6 border-b-2 border-black">
            <div className="text-center space-y-1">
              <h2 className="text-base font-bold uppercase tracking-wider text-black">
                PEMERINTAH KABUPATEN JOMBANG
              </h2>
              <h3 className="text-lg font-black uppercase text-black">
                DINAS PENDIDIKAN DAN KEBUDAYAAN
              </h3>
              <h4 className="text-base font-extrabold uppercase text-black">
                UPT SMP NEGERI 1 MOJOAGUNG
              </h4>
              <p className="text-xs text-black italic">
                Jl. Raya Gambiran No. 59 Mojoagung Jombang Jawa Timur Telp. (0321) 495143
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black text-center">
              <h4 className="text-sm font-bold uppercase underline">
                LAPORAN REKAPITULASI KINERJA GURU (PEMENUHAN JAM MENGAJAR)
              </h4>
              <p className="text-xs text-black mt-1">
                Bulan: <strong>{monthNames[selectedMonth]} {selectedYear}</strong> | Tahun Ajaran: <strong>{academicYear}</strong> Semester: <strong>{semester}</strong>
              </p>
              <p className="text-[10px] text-black mt-0.5">
                (Perhitungan Target JP telah memperhitungkan hari non-efektif sekolah: {monthStats?.effectiveDaysCount || 0} Hari KBM Efektif)
              </p>
            </div>
          </div>

          {/* Table Toolbar on Screen */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                Menampilkan <strong>{filteredAndSorted.length}</strong> dari {recapData.length} Guru
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
              <span>Klik nama kolom untuk mengurutkan:</span>
              <button 
                onClick={() => { setSortField('name'); setSortAsc(!sortAsc); }}
                className={`font-bold flex items-center gap-1 ${sortField === 'name' ? 'text-blue-600 dark:text-blue-400' : 'hover:text-slate-600'}`}
              >
                Nama <ArrowUpDown size={12} />
              </button>
              <button 
                onClick={() => { setSortField('percentage'); setSortAsc(!sortAsc); }}
                className={`font-bold flex items-center gap-1 ${sortField === 'percentage' ? 'text-blue-600 dark:text-blue-400' : 'hover:text-slate-600'}`}
              >
                Capaian % <ArrowUpDown size={12} />
              </button>
            </div>
          </div>

          {/* Main Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 size={32} className="animate-spin text-blue-600" />
                <span className="text-sm font-bold">Menghitung rekap kinerja guru...</span>
              </div>
            ) : filteredAndSorted.length === 0 ? (
              <div className="py-20 text-center text-slate-400 italic text-sm">
                Tidak ada data guru yang cocok dengan filter pencarian.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-4">Nama Guru &amp; NIP</th>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-3 text-center">Target JP (Efektif)</th>
                    <th className="py-3 px-3 text-center">Realisasi JP</th>
                    <th className="py-3 px-3 text-center">Selisih</th>
                    <th className="py-3 px-4 text-center">Ketercapaian</th>
                    <th className="py-3 px-3 text-center">Predikat Kinerja</th>
                    <th className="py-3 px-3 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredAndSorted.map((row, idx) => (
                    <tr 
                      key={row.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 dark:text-white leading-tight">
                          {row.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          NIP. {row.nip}
                        </div>
                        {row.waliKelas && (
                          <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                            Wali Kelas {row.waliKelas}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300 leading-snug">
                          {row.subject}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-black text-slate-800 dark:text-white text-sm">
                          {row.targetJp}
                        </span>
                        {row.deductedJp > 0 && (
                          <span 
                            className="block text-[9px] text-rose-500 font-bold"
                            title={`Dipotong ${row.deductedJp} JP karena libur/non-efektif`}
                          >
                            (-{row.deductedJp} Libur)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-black text-sm ${row.actualJp >= row.targetJp && row.targetJp > 0 ? 'text-emerald-600' : 'text-slate-800 dark:text-white'}`}>
                          {row.actualJp}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-bold text-xs ${row.differenceJp >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {row.differenceJp > 0 ? `+${row.differenceJp}` : row.differenceJp}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-extrabold text-slate-800 dark:text-white">
                            {row.targetJp > 0 ? `${row.percentage}%` : '-'}
                          </span>
                          {row.targetJp > 0 && (
                            <div className="w-16 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${row.percentage >= 85 ? 'bg-emerald-500' : row.percentage >= 70 ? 'bg-blue-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min(row.percentage, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${row.statusBadgeColor}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center print:hidden">
                        <button
                          onClick={() => handleOpenDetail(row)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors inline-flex items-center gap-1"
                          title="Lihat Rincian Jurnal & Jadwal"
                        >
                          <Eye size={13} />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Official Printable Signature Footer */}
          <div className="hidden print:flex justify-between items-end p-8 pt-10 text-xs text-black">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold">Pengawas Pembina</p>
              <div className="h-20"></div>
              <p className="font-bold underline">....................................................</p>
              <p>NIP. ............................................</p>
            </div>
            <div className="text-right">
              <p>Mojoagung, {formatDateSignature(currentDate)}</p>
              <p className="font-bold">Kepala UPT SMP Negeri 1 Mojoagung</p>
              <div className="h-20"></div>
              <p className="font-bold underline uppercase">{headmaster.name}</p>
              <p>NIP. {headmaster.nip}</p>
            </div>
          </div>
        </div>

        {/* Teacher Detail Modal */}
        {detailTeacher && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    Rincian Kinerja: {detailTeacher.fullName}
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    NIP. {detailTeacher.nip} • {detailTeacher.subject}
                  </p>
                </div>
                <button
                  onClick={() => setDetailTeacher(null)}
                  className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
                {/* Stats cards */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-50 dark:bg-slate-700 p-2.5 rounded-xl border border-slate-200 dark:border-slate-600">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Target JP</span>
                    <span className="text-lg font-black text-slate-800 dark:text-white">{detailTeacher.targetJp}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 p-2.5 rounded-xl border border-slate-200 dark:border-slate-600">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Realisasi</span>
                    <span className="text-lg font-black text-emerald-600">{detailTeacher.actualJp}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 p-2.5 rounded-xl border border-slate-200 dark:border-slate-600">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Capaian</span>
                    <span className="text-lg font-black text-blue-600">{detailTeacher.percentage}%</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 p-2.5 rounded-xl border border-slate-200 dark:border-slate-600">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Dipotong Libur</span>
                    <span className="text-lg font-black text-rose-600">-{detailTeacher.deductedJp} JP</span>
                  </div>
                </div>

                {/* Deductions breakdown */}
                {detailTeacher.deductedBreakdown.length > 0 && (
                  <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3">
                    <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle size={14} />
                      <span>Pemotongan Hari Non-Efektif untuk Guru Ini:</span>
                    </h4>
                    <div className="space-y-1">
                      {detailTeacher.deductedBreakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-rose-700 dark:text-rose-300">
                          <span>{formatDateIndo(item.date)} - {item.reason}</span>
                          <span className="font-bold">-{item.deductedHours} JP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weekly Schedules */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-500" />
                    <span>Jadwal Mengajar Mingguan (Versi: {selectedVersion})</span>
                  </h4>
                  {detailTeacher.schedules.length === 0 ? (
                    <div className="p-3 text-center bg-slate-50 rounded-xl text-xs text-slate-400 italic">
                      Tidak ada jadwal mengajar pada versi ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {detailTeacher.schedules.map(sched => (
                        <div key={sched.id} className="bg-slate-50 dark:bg-slate-700 p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-blue-600 dark:text-blue-400 block">Kelas {sched.kelas}</span>
                            <span className="text-slate-600 dark:text-slate-300">{sched.subject}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">
                              {['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][sched.day_of_week]}
                            </span>
                            <span className="text-[11px] text-slate-400">Jam ke-{sched.hour}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Journal entries in this month */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-emerald-500" />
                    <span>Riwayat Jurnal Terisi di Bulan {monthNames[selectedMonth]} ({teacherJournals.length} Jurnal)</span>
                  </h4>
                  {loadingDetail ? (
                    <div className="py-6 flex justify-center"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
                  ) : teacherJournals.length === 0 ? (
                    <div className="p-4 text-center bg-slate-50 rounded-xl text-xs text-slate-400 italic">
                      Belum ada jurnal yang diinput pada bulan ini.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                      {teacherJournals.map(j => (
                        <div key={j.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-2xs text-xs">
                          <div className="flex justify-between items-start">
                            <div className="font-bold text-slate-800 dark:text-white">
                              {j.kelas} • {j.subject}
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded text-[10px]">
                              {j.hours} JP
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 line-clamp-2">
                            {j.material || '-'}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {formatDateIndo(j.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-600 flex justify-end">
                <button
                  onClick={() => setDetailTeacher(null)}
                  className="px-4 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-white font-bold rounded-xl text-xs hover:bg-slate-300 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RekapKinerjaBulanan;
