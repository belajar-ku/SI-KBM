import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Loader2, Save, Plus, Trash2, Check, ChevronDown, X, Filter, Search, Gavel, Calendar, ChevronUp } from 'lucide-react';
import { Student } from '../types';
import { getWIBISOString } from '../utils/dateUtils';
import { showAlert } from '../utils/alert';

interface NoteItem {
    category: string;
    studentIds: string[];
    followUp?: string;
    note?: string;
}

interface DisciplineData {
    student: Student;
    alpaCount: number;
    alpaDates: string[];
    violations: {
        id: string;
        date: string;
        category: string;
        note: string;
        followUp?: string;
        reporter: string;
    }[];
}

async function fetchAllRows<T = any>(
    queryFn: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>
): Promise<T[]> {
    let all: T[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
        const { data, error } = await queryFn(page * pageSize, (page + 1) * pageSize - 1);
        if (error) {
            console.error("fetchAllRows error:", error);
            break;
        }
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < pageSize) break;
        page++;
    }
    return all;
}

const Kedisiplinan: React.FC = () => {
  const { profile, academicYear, semester, semesterStart, semesterEnd } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const isHeadmaster = profile?.mengajar_mapel === 'Kepala Sekolah' || profile?.role === 'admin';

  // Settings from app_settings
  const [settings, setSettings] = useState({
      academic_year: '',
      semester: '',
      semester_start: '',
      semester_end: ''
  });

  const activeAcademicYear = (settings.academic_year && settings.academic_year !== '...') 
      ? settings.academic_year 
      : (academicYear || localStorage.getItem('app_academic_year') || '2026/2027');
  const activeSemester = (settings.semester && settings.semester !== '...') 
      ? settings.semester 
      : (semester || localStorage.getItem('app_semester') || 'Ganjil');

  // Filters
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStartDateInitialized, setIsStartDateInitialized] = useState(false);
  const [startDate, setStartDate] = useState(() => {
      const d = new Date();
      d.setDate(1); // Awal bulan ini
      return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(getWIBISOString());

  // Data
  const [reportData, setReportData] = useState<DisciplineData[]>([]);

  // --- INPUT FORM STATE (ACCORDION) ---
  const [showInputForm, setShowInputForm] = useState(false);
  const [inputMode, setInputMode] = useState<'single' | 'mass'>('single');
  
  // Single Mode State
  const [students, setStudents] = useState<Student[]>([]); 
  const [disciplineTypes, setDisciplineTypes] = useState<string[]>([]);
  const [followUpTypes, setFollowUpTypes] = useState<string[]>([]);
  const [disciplineRows, setDisciplineRows] = useState<NoteItem[]>([]);
  const [inputClass, setInputClass] = useState(''); 

  // Mass Mode State
  const [massCommonData, setMassCommonData] = useState({ category: '', followUp: '', note: '' });
  const [massRows, setMassRows] = useState<{ class: string; studentIds: string[] }[]>([{ class: '', studentIds: [] }]);
  const [studentsCache, setStudentsCache] = useState<Record<string, Student[]>>({});

  useEffect(() => {
    fetchInitData();
  }, [academicYear, semester]);

  useEffect(() => {
    const sStart = settings.semester_start || semesterStart;
    if (sStart && !isStartDateInitialized) {
        setStartDate(sStart);
        setIsStartDateInitialized(true);
    }
  }, [settings.semester_start, semesterStart, isStartDateInitialized]);

  useEffect(() => {
      fetchReportData();
  }, [selectedClass, startDate, endDate, activeAcademicYear, activeSemester]);

  // Fetch Students for Input Modal when class changes (Single Mode)
  useEffect(() => {
      if(inputClass && inputMode === 'single') {
          const loadStudents = async () => {
              let { data, error: errSt } = await supabase
                .from('students')
                .select('*')
                .eq('academic_year', activeAcademicYear)
                .eq('kelas', inputClass)
                .order('name');
              
              if (errSt && (errSt.code === '42703' || errSt.message?.includes('academic_year'))) {
                  const res = await supabase.from('students').select('*').eq('kelas', inputClass).order('name');
                  data = res.data;
              }
              setStudents(data || []);
              if(disciplineRows.length === 0) addRow();
          };
          loadStudents();
      }
  }, [inputClass, inputMode, activeAcademicYear]);

  const fetchInitData = async () => {
    try {
        const { data: settingsData } = await supabase.from('app_settings').select('*');
        const newSettings: any = {};
        if (settingsData) {
            settingsData.forEach(item => {
                newSettings[item.key] = item.value;
                if (item.key === 'discipline_types' && item.value) {
                    try { setDisciplineTypes(JSON.parse(item.value)); } catch (_) {}
                }
                if (item.key === 'follow_up_types' && item.value) {
                    try { setFollowUpTypes(JSON.parse(item.value)); } catch (_) {}
                }
            });
            setSettings(prev => ({ ...prev, ...newSettings }));
        }

        const currentActiveYear = newSettings.academic_year || academicYear || localStorage.getItem('app_academic_year') || '2026/2027';

        if (newSettings.semester_start && !isStartDateInitialized) {
            setStartDate(newSettings.semester_start);
            setIsStartDateInitialized(true);
        }

        const classesRes = await supabase.from('students').select('kelas').eq('academic_year', currentActiveYear);
        if (classesRes.data && classesRes.data.length > 0) {
            const unique = Array.from(new Set(classesRes.data.map((s:any) => s.kelas))).sort();
            setClasses(unique as string[]);
        } else {
            // Fallback if no records found
            const fallbackClasses = await supabase.from('students').select('kelas');
            if (fallbackClasses.data) {
                const unique = Array.from(new Set(fallbackClasses.data.map((s:any) => s.kelas))).sort();
                setClasses(unique as string[]);
            }
        }
    } catch (e) { 
        console.error("fetchInitData error:", e); 
    }
  };

  const fetchReportData = async () => {
      setLoading(true);
      try {
          const currentActiveYear = activeAcademicYear;
          const currentActiveSem = activeSemester;
          const currentSemesterStart = settings.semester_start || semesterStart;
          const currentSemesterEnd = settings.semester_end || semesterEnd;

          const start = `${startDate}T00:00:00+07:00`;
          const end = `${endDate}T23:59:59+07:00`;

          // 1. Fetch Students according to active academic year and optional class filter
          let studentsQuery = supabase
            .from('students')
            .select('*')
            .eq('academic_year', currentActiveYear)
            .order('kelas')
            .order('name');
          
          if (selectedClass) {
              studentsQuery = studentsQuery.eq('kelas', selectedClass);
          }

          let { data: targetStudents, error: errSt } = await studentsQuery;
          if (errSt && (errSt.code === '42703' || errSt.message?.includes('academic_year'))) {
              let fbQuery = supabase.from('students').select('*').order('kelas').order('name');
              if (selectedClass) fbQuery = fbQuery.eq('kelas', selectedClass);
              const fbRes = await fbQuery;
              targetStudents = fbRes.data;
          }

          if (!targetStudents || targetStudents.length === 0) {
              setReportData([]);
              setLoading(false);
              return;
          }

          const targetStudentIds = targetStudents.map(s => s.id);
          const studentIdsSet = new Set(targetStudentIds);

          // 2. DATA ALPA & VIOLATIONS (Using fetchAllRows to prevent PostgREST 1000 row truncation)
          const [hLogs, tLogs, violationNotes] = await Promise.all([
              fetchAllRows((from, to) =>
                  supabase.from('homeroom_attendance')
                    .select('student_id, date, status')
                    .eq('academic_year', currentActiveYear)
                    .eq('semester', currentActiveSem)
                    .gte('date', currentSemesterStart ? `${currentSemesterStart}` : '2000-01-01')
                    .lte('date', currentSemesterEnd ? `${currentSemesterEnd}` : '2100-01-01')
                    .gte('date', startDate)
                    .lte('date', endDate)
                    .range(from, to)
              ),
              fetchAllRows((from, to) =>
                  supabase.from('attendance_logs')
                    .select('student_id, created_at, status')
                    .eq('academic_year', currentActiveYear)
                    .eq('semester', currentActiveSem)
                    .gte('created_at', currentSemesterStart ? `${currentSemesterStart}T00:00:00+07:00` : '2000-01-01T00:00:00+07:00')
                    .lte('created_at', currentSemesterEnd ? `${currentSemesterEnd}T23:59:59+07:00` : '2100-01-01T23:59:59+07:00')
                    .in('status', ['S', 'I', 'A'])
                    .gte('created_at', start)
                    .lte('created_at', end)
                    .range(from, to)
              ),
              fetchAllRows((from, to) =>
                  supabase.from('journal_notes')
                    .select('id, student_id, category, note, follow_up, created_at, journal_id')
                    .eq('academic_year', currentActiveYear)
                    .eq('semester', currentActiveSem)
                    .eq('type', 'kedisiplinan')
                    .gte('created_at', start)
                    .lte('created_at', end)
                    .range(from, to)
              )
          ]);

          // Filter to target students (when class is filtered)
          const filteredHLogs = selectedClass ? hLogs.filter(l => studentIdsSet.has(l.student_id)) : hLogs;
          const filteredTLogs = selectedClass ? tLogs.filter(l => studentIdsSet.has(l.student_id)) : tLogs;
          const filteredVNotes = selectedClass ? violationNotes.filter(n => studentIdsSet.has(n.student_id)) : violationNotes;

          // Fetch journal details (Teacher Name & Subject) for all unique journal IDs in batches
          const journalIds = Array.from(new Set(filteredVNotes.map(n => n.journal_id).filter(Boolean)));
          const journalMap: Record<string, { teacher: string; subject: string }> = {};

          if (journalIds.length > 0) {
              for (let i = 0; i < journalIds.length; i += 100) {
                  const chunk = journalIds.slice(i, i + 100);
                  const { data: journals } = await supabase
                    .from('journals')
                    .select('id, subject, teacher_id, profiles:teacher_id (full_name)')
                    .in('id', chunk);

                  journals?.forEach((j: any) => {
                      const teacherName = j.profiles?.full_name || 'Guru';
                      const subject = j.subject || '';
                      journalMap[j.id] = { teacher: teacherName, subject };
                  });
              }
          }

          // Build index Maps for fast O(1) processing
          const hMap = new Map<string, any[]>();
          filteredHLogs.forEach(l => {
              if (!hMap.has(l.student_id)) hMap.set(l.student_id, []);
              hMap.get(l.student_id)!.push(l);
          });

          const tMap = new Map<string, any[]>();
          filteredTLogs.forEach(l => {
              if (!tMap.has(l.student_id)) tMap.set(l.student_id, []);
              tMap.get(l.student_id)!.push(l);
          });

          const vMap = new Map<string, any[]>();
          filteredVNotes.forEach(n => {
              if (!vMap.has(n.student_id)) vMap.set(n.student_id, []);
              vMap.get(n.student_id)!.push(n);
          });

          // 3. Process Data strictly conforming to Absensi Rapor calculation
          const processed: DisciplineData[] = [];

          targetStudents.forEach(student => {
              const studentHLogs = hMap.get(student.id) || [];
              const studentTLogs = tMap.get(student.id) || [];
              const studentVNotes = vMap.get(student.id) || [];

              if (studentHLogs.length === 0 && studentTLogs.length === 0 && studentVNotes.length === 0) {
                  return;
              }

              // Get union of unique dates for this student
              const hDates = studentHLogs.map(l => l.date);
              const tDates = studentTLogs.map(l => l.created_at.split('T')[0]);
              const uniqueDates = Array.from(new Set([...hDates, ...tDates])).sort();

              const alpaDatesList: string[] = [];

              uniqueDates.forEach(date => {
                  let finalStatus = '';

                  // Priority 1: Wali Kelas (Homeroom teacher)
                  const hLog = studentHLogs.find(l => l.date === date);
                  if (hLog) {
                      finalStatus = hLog.status;
                  } else {
                      // Priority 2: Guru Mapel aggregation with priority: S > I > A > D
                      const dayLogs = studentTLogs.filter(l => l.created_at.startsWith(date));
                      if (dayLogs.length > 0) {
                          const statuses = dayLogs.map(l => l.status);
                          if (statuses.includes('S')) finalStatus = 'S';
                          else if (statuses.includes('I')) finalStatus = 'I';
                          else if (statuses.includes('A')) finalStatus = 'A';
                          else if (statuses.includes('D')) finalStatus = 'D';
                      }
                  }

                  // Count as 1 Alpa Day if final status is 'A'
                  if (finalStatus === 'A') {
                      const dateObj = new Date(date);
                      const dateStr = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(dateObj);
                      alpaDatesList.push(dateStr);
                  }
              });

              // Process Teacher Discipline Notes
              const myViolations = studentVNotes.map(n => {
                  const dateObj = new Date(n.created_at);
                  const dateStr = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(dateObj);
                  const jInfo = n.journal_id ? journalMap[n.journal_id] : null;
                  const reporter = jInfo
                      ? `${jInfo.teacher}${jInfo.subject ? ` (${jInfo.subject})` : ''}`
                      : (n.note?.includes('oleh ') ? n.note.replace(/^.*oleh\s+/i, '') : 'Guru / Admin');

                  return {
                      id: n.id,
                      date: dateStr,
                      category: n.category,
                      note: n.note || '',
                      followUp: n.follow_up || '',
                      reporter
                  };
              });

              if (alpaDatesList.length > 0 || myViolations.length > 0) {
                  processed.push({
                      student,
                      alpaCount: alpaDatesList.length,
                      alpaDates: alpaDatesList,
                      violations: myViolations
                  });
              }
          });

          // SORTING: ALPA TERBANYAK DI URUTAN TERATAS
          // Jika Alpa sama, urutkan berdasarkan jumlah catatan kedisiplinan guru terbanyak, lalu kelas, lalu nama murid
          processed.sort((a, b) =>
              b.alpaCount - a.alpaCount ||
              b.violations.length - a.violations.length ||
              a.student.kelas.localeCompare(b.student.kelas) ||
              a.student.name.localeCompare(b.student.name)
          );

          setReportData(processed);

      } catch (e) {
          console.error("fetchReportData error:", e);
      } finally {
          setLoading(false);
      }
  };

  // --- INPUT FORM LOGIC ---
  const addRow = () => setDisciplineRows(prev => [...prev, { category: '', studentIds: [], followUp: '', note: '' }]);
  const removeRow = (index: number) => setDisciplineRows(prev => prev.filter((_, i) => i !== index));
  const updateRow = (index: number, field: keyof NoteItem, value: any) => {
      setDisciplineRows(prev => {
          const list = [...prev];
          list[index] = { ...list[index], [field]: value };
          return list;
      });
  };

  // --- MASS INPUT LOGIC ---
  const getStudentsForClass = async (className: string) => {
      if (studentsCache[className]) return;
      let { data, error: errSt } = await supabase
        .from('students')
        .select('*')
        .eq('academic_year', activeAcademicYear)
        .eq('kelas', className)
        .order('name');

      if (errSt && (errSt.code === '42703' || errSt.message?.includes('academic_year'))) {
          const res = await supabase.from('students').select('*').eq('kelas', className).order('name');
          data = res.data;
      }
      setStudentsCache(prev => ({ ...prev, [className]: data || [] }));
  };

  const addMassRow = () => setMassRows(prev => [...prev, { class: '', studentIds: [] }]);
  const removeMassRow = (index: number) => setMassRows(prev => prev.filter((_, i) => i !== index));
  const updateMassRow = async (index: number, field: 'class' | 'studentIds', value: any) => {
      if (field === 'class') {
          await getStudentsForClass(value);
          setMassRows(prev => {
              const list = [...prev];
              list[index] = { ...list[index], class: value, studentIds: [] };
              return list;
          });
      } else {
          setMassRows(prev => {
              const list = [...prev];
              list[index] = { ...list[index], studentIds: value };
              return list;
          });
      }
  };

  const handleSaveInput = async () => {
      if (!profile) return;

      try {
          const notesInserts: any[] = [];

          if (inputMode === 'single') {
              if (disciplineRows.length === 0 || !inputClass) return;
              disciplineRows.forEach(row => {
                  if (row.category && row.studentIds.length > 0) {
                      row.studentIds.forEach(sid => {
                          const sName = students.find(s => s.id === sid)?.name || 'Unknown';
                          notesInserts.push({
                              student_id: sid,
                              student_name: sName,
                              type: 'kedisiplinan',
                              category: row.category,
                              follow_up: row.followUp || '',
                              note: row.note || `Laporan Manual oleh ${profile.full_name}`,
                              academic_year: activeAcademicYear,
                              semester: activeSemester,
                          });
                      });
                  }
              });
          } else {
              // Mass Mode
              if (!massCommonData.category || massRows.length === 0) {
                  showAlert("Mohon lengkapi Jenis Pelanggaran dan Data Murid.");
                  return;
              }
              
              massRows.forEach(row => {
                  if (row.class && row.studentIds.length > 0) {
                      const classStudents = studentsCache[row.class] || [];
                      row.studentIds.forEach(sid => {
                          const sName = classStudents.find(s => s.id === sid)?.name || 'Unknown';
                          notesInserts.push({
                              student_id: sid,
                              student_name: sName,
                              type: 'kedisiplinan',
                              category: massCommonData.category,
                              follow_up: massCommonData.followUp || '',
                              note: massCommonData.note || `Laporan Massal oleh ${profile.full_name}`,
                              academic_year: activeAcademicYear,
                              semester: activeSemester,
                          });
                      });
                  }
              });
          }

          if (notesInserts.length > 0) {
              let { error } = await supabase.from('journal_notes').insert(notesInserts);
              if (error && (error.code === '42703' || error.message?.includes('academic_year') || error.message?.includes('semester'))) {
                  const fallbackNotes = notesInserts.map(n => {
                      const { academic_year, semester, ...rest } = n as any;
                      return rest;
                  });
                  const fb = await supabase.from('journal_notes').insert(fallbackNotes);
                  error = fb.error;
              }
              if (error) throw error;
              showAlert("Data pelanggaran berhasil disimpan.");
              setShowInputForm(false);
              
              // Reset States
              setDisciplineRows([]);
              setInputClass('');
              setMassCommonData({ category: '', followUp: '', note: '' });
              setMassRows([{ class: '', studentIds: [] }]);
              
              fetchReportData();
          } else {
              showAlert("Tidak ada data valid untuk disimpan.");
          }
      } catch (err: any) {
          showAlert("Gagal menyimpan: " + err.message);
      }
  };

  // --- MULTI SELECT COMPONENT ---
  const MultiSelectDropdown = ({ options, selectedIds, onChange, placeholder }: any) => {
      const [isOpen, setIsOpen] = useState(false);
      const wrapperRef = useRef<HTMLDivElement>(null);
      useEffect(() => {
          const handleClickOutside = (event: MouseEvent) => {
              if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
          };
          document.addEventListener('mousedown', handleClickOutside);
          return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);
      const toggleSelection = (id: string) => {
          const newSelection = selectedIds.includes(id) ? selectedIds.filter((sid: string) => sid !== id) : [...selectedIds, id];
          onChange(newSelection);
      };

      return (
          <div className="relative" ref={wrapperRef}>
              <button onClick={() => setIsOpen(!isOpen)} type="button" className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-left flex justify-between items-center text-xs">
                  <span className={`truncate ${selectedIds.length === 0 ? 'text-gray-400' : 'text-slate-700 font-bold'}`}>{selectedIds.length === 0 ? placeholder : `${selectedIds.length} Murid`}</span>
                  <ChevronDown size={14} className="text-gray-400" />
              </button>
              {isOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto p-1 custom-scrollbar">
                      {options.map((opt: any) => (
                          <div key={opt.id} onClick={() => toggleSelection(opt.id)} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs ${selectedIds.includes(opt.id) ? 'bg-orange-50 font-bold text-orange-700' : 'hover:bg-gray-50'}`}>
                              {selectedIds.includes(opt.id) && <Check size={12} />} {opt.name}
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  };

  // Filtered by Search Query
  const filteredReportData = reportData.filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return item.student.name.toLowerCase().includes(q) || 
             (item.student.nisn && item.student.nisn.toLowerCase().includes(q)) ||
             item.student.kelas.toLowerCase().includes(q);
  });

  return (
    <Layout>
      <div className="space-y-6">
         {/* HEADER */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shadow-sm">
                    <ShieldAlert size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Laporan Kedisiplinan</h2>
                        <span className="bg-orange-100 text-orange-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                            TA: {activeAcademicYear} ({activeSemester})
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Rekapitulasi ketidakhadiran Alpa (sinkron dengan Absensi Rapor) dan catatan pelanggaran dari guru.</p>
                </div>
            </div>
             
             {!isHeadmaster && (
                 <button 
                    onClick={() => setShowInputForm(!showInputForm)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all hover:-translate-y-0.5 ${showInputForm ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200'}`}
                 >
                    {showInputForm ? <ChevronUp size={18} /> : <Plus size={18} />} 
                    {showInputForm ? 'Tutup Form Input' : 'Input Pelanggaran Baru'}
                 </button>
             )}
         </div>

         {/* ACCORDION INPUT FORM */}
         {showInputForm && (
             <div className="bg-white rounded-3xl p-6 shadow-lg border border-orange-200 animate-fade-in transition-all">
                  <div className="flex items-center justify-between gap-2 text-orange-600 font-bold mb-4 pb-2 border-b border-orange-100">
                      <div className="flex items-center gap-2">
                        <Gavel size={20}/>
                        <h3>Form Input Pelanggaran</h3>
                      </div>
                      
                      {/* MODE SWITCHER */}
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                          <button 
                            onClick={() => setInputMode('single')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${inputMode === 'single' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            Per Kelas
                          </button>
                          <button 
                            onClick={() => setInputMode('mass')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${inputMode === 'mass' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            Input Massal
                          </button>
                      </div>
                  </div>

                  {/* SINGLE MODE FORM */}
                  {inputMode === 'single' && (
                    <>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Kelas</label>
                            <select className="w-full md:w-1/3 border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 font-bold text-slate-700" value={inputClass} onChange={e => setInputClass(e.target.value)}>
                                <option value="">-- Pilih Kelas --</option>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {inputClass && (
                            <div className="space-y-4">
                                {disciplineRows.map((row, index) => (
                                    <div key={index} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row gap-3 items-start md:items-center">
                                        <div className="w-full md:w-1/4">
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1">JENIS PELANGGARAN</label>
                                            <select className="w-full border p-2 rounded-xl text-xs bg-white" value={row.category} onChange={e => updateRow(index, 'category', e.target.value)}>
                                                <option value="">Pilih Jenis</option>
                                                {disciplineTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>

                                        <div className="w-full md:w-1/3">
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1">PILIH MURID</label>
                                            <MultiSelectDropdown options={students} selectedIds={row.studentIds} onChange={(ids: string[]) => updateRow(index, 'studentIds', ids)} placeholder="Pilih Murid..." />
                                        </div>

                                        <div className="w-full md:w-1/4">
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1">TINDAK LANJUT</label>
                                            <select className="w-full border p-2 rounded-xl text-xs bg-white" value={row.followUp} onChange={e => updateRow(index, 'followUp', e.target.value)}>
                                                <option value="">Pilih Tindak Lanjut</option>
                                                {followUpTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>

                                        <div className="w-full md:w-1/4">
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1">CATATAN</label>
                                            <input type="text" className="w-full border p-2 rounded-xl text-xs bg-white" placeholder="Keterangan..." value={row.note || ''} onChange={e => updateRow(index, 'note', e.target.value)} />
                                        </div>

                                        <button onClick={() => removeRow(index)} className="text-red-500 hover:text-red-700 p-2 mt-4 md:mt-0"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                <button onClick={addRow} className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline"><Plus size={14} /> Tambah Baris Pelanggaran</button>
                            </div>
                        )}
                    </>
                  )}

                  {/* MASS MODE FORM */}
                  {inputMode === 'mass' && (
                      <div className="space-y-6">
                          {/* Common Metadata */}
                          <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Pelanggaran (Sama untuk semua murid)</label>
                                  <select 
                                      className="w-full border p-2.5 rounded-xl text-xs bg-white focus:ring-2 focus:ring-orange-500 font-bold text-slate-800"
                                      value={massCommonData.category}
                                      onChange={e => setMassCommonData(prev => ({ ...prev, category: e.target.value }))}
                                  >
                                      <option value="">-- Pilih Jenis Pelanggaran --</option>
                                      {disciplineTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1">Tindak Lanjut</label>
                                  <select 
                                      className="w-full border p-2.5 rounded-xl text-xs bg-white focus:ring-2 focus:ring-orange-500"
                                      value={massCommonData.followUp}
                                      onChange={e => setMassCommonData(prev => ({ ...prev, followUp: e.target.value }))}
                                  >
                                      <option value="">-- Pilih Tindak Lanjut --</option>
                                      {followUpTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                              </div>
                              <div className="md:col-span-2">
                                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                                  <input 
                                      type="text" 
                                      className="w-full border p-2.5 rounded-xl text-xs bg-white focus:ring-2 focus:ring-orange-500"
                                      placeholder="Contoh: Terjaring razia seragam di gerbang depan..."
                                      value={massCommonData.note}
                                      onChange={e => setMassCommonData(prev => ({ ...prev, note: e.target.value }))}
                                  />
                              </div>
                          </div>

                          {/* Dynamic Rows: Class + Students */}
                          <div className="space-y-3">
                              <label className="block text-xs font-bold text-slate-500">Daftar Murid Pelanggar:</label>
                              {massRows.map((row, index) => (
                                  <div key={index} className="flex flex-col md:flex-row gap-3 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                      <div className="w-full md:w-1/3">
                                          <select 
                                              className="w-full border p-2.5 rounded-xl text-xs bg-white font-bold text-slate-700"
                                              value={row.class}
                                              onChange={e => updateMassRow(index, 'class', e.target.value)}
                                          >
                                              <option value="">Pilih Kelas</option>
                                              {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                          </select>
                                      </div>

                                      <div className="w-full md:w-2/3">
                                          <MultiSelectDropdown 
                                              options={studentsCache[row.class] || []}
                                              selectedIds={row.studentIds}
                                              onChange={(ids: string[]) => updateMassRow(index, 'studentIds', ids)}
                                              placeholder={row.class ? "Pilih murid yang melanggar..." : "Pilih kelas terlebih dahulu"}
                                          />
                                      </div>

                                      <button 
                                          onClick={() => removeMassRow(index)} 
                                          className="text-red-500 hover:text-red-700 p-2"
                                          title="Hapus Baris"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              ))}

                              <button 
                                  onClick={addMassRow} 
                                  className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline mt-2"
                              >
                                  <Plus size={14} /> Tambah Kelas Lain
                              </button>
                          </div>
                      </div>
                  )}

                  {/* SAVE BUTTON (SHARED) */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                      <button onClick={handleSaveInput} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transition-all active:scale-95 text-sm">
                          <Save size={16}/> Simpan Data Pelanggaran
                      </button>
                  </div>
             </div>
         )}

         {/* FILTER & SEARCH BAR */}
         <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 w-full">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Mulai Tanggal</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-slate-400" size={14}/>
                        <input type="date" className="w-full pl-9 border border-slate-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-orange-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Sampai Tanggal</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-slate-400" size={14}/>
                        <input type="date" className="w-full pl-9 border border-slate-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-orange-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Pilih Kelas</label>
                    <div className="relative">
                        <Filter className="absolute left-3 top-2.5 text-slate-400" size={14}/>
                        <select className="w-full pl-9 border border-slate-200 rounded-xl p-2 text-sm bg-white focus:ring-2 focus:ring-orange-500 font-bold text-slate-700" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            <option value="">-- Semua Kelas --</option>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Cari Murid / NISN</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={14}/>
                        <input 
                            type="text" 
                            className="w-full pl-9 border border-slate-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-orange-500" 
                            placeholder="Ketik nama atau NISN..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <button 
                onClick={fetchReportData} 
                disabled={loading}
                className="w-full md:w-auto bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
                {loading ? <Loader2 className="animate-spin" size={16}/> : <Search size={16} />} 
                Tampilkan
            </button>
         </div>

         {/* TABLE DATA */}
         <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                         <tr>
                             <th className="px-6 py-4 w-16 text-center">No</th>
                             <th className="px-6 py-4 w-64">Nama Murid</th>
                             <th className="px-6 py-4 w-24 text-center">Kelas</th>
                             <th className="px-6 py-4">Detail Kedisiplinan</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {loading ? (
                             <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" /></td></tr>
                         ) : filteredReportData.length === 0 ? (
                             <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">Tidak ada data pelanggaran atau Alpa pada periode ini.</td></tr>
                         ) : (
                             filteredReportData.map((item, idx) => (
                                 <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                     <td className="px-6 py-4 text-center font-bold text-slate-500">{idx + 1}</td>
                                     <td className="px-6 py-4 align-top">
                                         <div className="font-bold text-slate-800 text-base">{item.student.name}</div>
                                         <div className="text-xs text-slate-400 font-mono mt-0.5">{item.student.nisn || '-'}</div>
                                     </td>
                                     <td className="px-6 py-4 text-center align-top">
                                         <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold text-xs border border-slate-200">{item.student.kelas}</span>
                                     </td>
                                     <td className="px-6 py-4 align-top space-y-2.5">
                                         {/* 1. ALPA (Sinkron dengan Absensi Rapor) */}
                                         {item.alpaCount > 0 && (
                                             <div className="p-2.5 rounded-xl bg-red-50/80 border border-red-200/70 text-xs">
                                                 <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                     <span className="font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                                                         Alpa: {item.alpaCount} Hari
                                                     </span>
                                                     <span className="text-[11px] text-red-600 font-medium">(Berdasarkan Absensi Rapor)</span>
                                                 </div>
                                                 <div className="text-slate-600 leading-relaxed">
                                                     <span className="font-semibold text-slate-700">Tanggal: </span>
                                                     {item.alpaDates.join(', ')}
                                                 </div>
                                             </div>
                                         )}

                                         {/* 2. CATATAN KEDISIPLINAN DARI IBU/BAPAK GURU */}
                                         {item.violations.length > 0 && (
                                             <div className="space-y-2">
                                                 {item.violations.map((v) => (
                                                     <div key={v.id} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/70 text-xs space-y-1.5">
                                                         <div className="flex flex-wrap items-center justify-between gap-1">
                                                             <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[13px]">
                                                                 <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                                                                 <span>{v.category}</span>
                                                             </div>
                                                             <span className="text-slate-400 font-medium text-[11px]">{v.date}</span>
                                                         </div>

                                                         <div className="flex flex-wrap items-center gap-2 text-slate-600">
                                                             <span className="text-[11px] text-slate-500">
                                                                 Guru Pelapor: <strong className="text-slate-700">{v.reporter}</strong>
                                                             </span>
                                                             {v.followUp && (
                                                                 <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-md text-[10px] border border-amber-300">
                                                                     Tindak Lanjut: {v.followUp}
                                                                 </span>
                                                             )}
                                                         </div>

                                                         {v.note && !v.note.startsWith('Laporan Manual oleh') && !v.note.startsWith('Laporan Massal oleh') && (
                                                             <p className="text-slate-700 italic bg-white p-2 rounded-lg border border-amber-100 mt-1">
                                                                 "{v.note}"
                                                             </p>
                                                         )}
                                                     </div>
                                                 ))}
                                             </div>
                                         )}
                                     </td>
                                 </tr>
                             ))
                         )}
                     </tbody>
                 </table>
             </div>
             <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
                 <span>
                     Menampilkan {filteredReportData.length} siswa dengan catatan kedisiplinan / Alpa.
                 </span>
                 <span className="text-slate-400 italic">
                     Urutan teratas: Murid dengan akumulasi Alpa terbanyak.
                 </span>
             </div>
         </div>
      </div>
    </Layout>
  );
};

export default Kedisiplinan;
