
import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Loader2, Save, Plus, Trash2, Check, ChevronDown, X, Filter, Search, Gavel, User, Calendar } from 'lucide-react';
import { Student } from '../types';
import { getWIBISOString } from '../utils/dateUtils';

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
        reporter: string;
    }[];
}

const Kedisiplinan: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState(() => {
      const d = new Date();
      d.setDate(1); // Awal bulan ini
      return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(getWIBISOString());

  // Data
  const [reportData, setReportData] = useState<DisciplineData[]>([]);

  // --- INPUT MODAL STATE ---
  const [showInputModal, setShowInputModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]); 
  const [disciplineTypes, setDisciplineTypes] = useState<string[]>([]);
  const [followUpTypes, setFollowUpTypes] = useState<string[]>([]);
  const [disciplineRows, setDisciplineRows] = useState<NoteItem[]>([]);
  const [inputClass, setInputClass] = useState(''); 

  useEffect(() => {
    fetchInitData();
  }, []);

  useEffect(() => {
      // Auto fetch on load if dates are set
      fetchReportData();
  }, [selectedClass, startDate, endDate]); // Trigger on filter change

  // Fetch Students for Input Modal when class changes
  useEffect(() => {
      if(inputClass) {
          const loadStudents = async () => {
              const { data } = await supabase.from('students').select('*').eq('kelas', inputClass).order('name');
              setStudents(data || []);
              if(disciplineRows.length === 0) addRow();
          }
          loadStudents();
      }
  }, [inputClass]);

  const fetchInitData = async () => {
    try {
        const [classesRes, settingsRes] = await Promise.all([
            supabase.from('students').select('kelas'),
            supabase.from('app_settings').select('*')
        ]);

        if (classesRes.data) {
            const unique = Array.from(new Set(classesRes.data.map((s:any) => s.kelas))).sort();
            setClasses(unique as string[]);
        }

        if (settingsRes.data) {
            settingsRes.data.forEach(item => {
                if (item.key === 'discipline_types') setDisciplineTypes(item.value ? JSON.parse(item.value) : []);
                if (item.key === 'follow_up_types') setFollowUpTypes(item.value ? JSON.parse(item.value) : []);
            });
        }
    } catch (e) { console.error(e); }
  };

  const fetchReportData = async () => {
      setLoading(true);
      try {
          const start = `${startDate}T00:00:00+07:00`;
          const end = `${endDate}T23:59:59+07:00`;

          let targetStudents: Student[] = [];
          let targetStudentIds: string[] = [];

          // STRATEGY:
          // Jika Kelas Dipilih -> Ambil semua siswa di kelas itu (agar yang 0 pelanggaran pun bisa terhitung jika perlu, atau difilter nanti)
          // Jika Semua Kelas -> Ambil LOGS dulu baru ambil Siswa (Hanya siswa yang bermasalah yang diambil untuk performa)

          if (selectedClass) {
              const { data } = await supabase.from('students').select('*').eq('kelas', selectedClass).order('name');
              if (data) {
                  targetStudents = data;
                  targetStudentIds = data.map(s => s.id);
              }
          } else {
              // ALL CLASSES: Scan Logs First to find relevant IDs
              const [hRes, tRes, vRes] = await Promise.all([
                  supabase.from('homeroom_attendance').select('student_id').gte('date', startDate).lte('date', endDate).in('status', ['A']), // Only care about Alpa for query optimization
                  supabase.from('attendance_logs').select('student_id').gte('created_at', start).lte('created_at', end).in('status', ['A']),
                  supabase.from('journal_notes').select('student_id').eq('type', 'kedisiplinan').gte('created_at', start).lte('created_at', end)
              ]);

              const ids = new Set<string>();
              hRes.data?.forEach(x => ids.add(x.student_id));
              tRes.data?.forEach(x => ids.add(x.student_id));
              vRes.data?.forEach(x => ids.add(x.student_id));

              targetStudentIds = Array.from(ids);

              if (targetStudentIds.length > 0) {
                  // Fetch only relevant students
                  const { data } = await supabase.from('students').select('*').in('id', targetStudentIds).order('kelas').order('name');
                  if (data) targetStudents = data;
              }
          }

          if (targetStudentIds.length === 0) {
              setReportData([]);
              setLoading(false);
              return;
          }

          // 2. DATA ALPA (Logic Rapor: Aggregasi Wali Kelas & Guru Mapel)
          // Fetch data only for target IDs to be efficient
          const [hLogsRes, tLogsRes, violationNotesRes] = await Promise.all([
              supabase.from('homeroom_attendance').select('student_id, date, status')
                .in('student_id', targetStudentIds).gte('date', startDate).lte('date', endDate),
              supabase.from('attendance_logs').select('student_id, created_at, status')
                .in('student_id', targetStudentIds).in('status', ['S', 'I', 'A']).gte('created_at', start).lte('created_at', end),
              supabase.from('journal_notes').select('id, student_id, category, note, created_at, journal_id')
                .in('student_id', targetStudentIds).eq('type', 'kedisiplinan').gte('created_at', start).lte('created_at', end)
          ]);

          const hLogs = hLogsRes.data || [];
          const tLogs = tLogsRes.data || [];
          const violationNotes = violationNotesRes.data || [];

          // Get unique journal IDs to fetch teacher names for violations
          const journalIds = Array.from(new Set(violationNotes.map(n => n.journal_id).filter(Boolean)));
          
          let journalMap: Record<string, string> = {};
          if (journalIds.length > 0) {
              const { data: journals } = await supabase
                .from('journals')
                .select('id, teacher_id, profiles:teacher_id (full_name)')
                .in('id', journalIds);
              
              journals?.forEach((j: any) => {
                  const teacherName = j.profiles?.full_name || 'Guru';
                  journalMap[j.id] = teacherName;
              });
          }

          // 4. Process Data
          const processed: DisciplineData[] = targetStudents.map(student => {
              // --- CALCULATE ALPA (DAYS) ---
              const studentHLogs = hLogs.filter(l => l.student_id === student.id);
              const studentTLogs = tLogs.filter(l => l.student_id === student.id);
              
              // Get all unique dates relevant to this student
              const hDates = studentHLogs.map(l => l.date);
              const tDates = studentTLogs.map(l => l.created_at.split('T')[0]);
              const uniqueDates = Array.from(new Set([...hDates, ...tDates])).sort();

              const alpaDatesList: string[] = [];

              uniqueDates.forEach(date => {
                  let finalStatus = '';
                  
                  // Priority 1: Homeroom Teacher Input
                  const hLog = studentHLogs.find(l => l.date === date);
                  if (hLog) {
                      finalStatus = hLog.status;
                  } else {
                      // Priority 2: Teacher Logs Aggregation (S > I > A)
                      const dailyLogs = studentTLogs.filter(l => l.created_at.startsWith(date));
                      if (dailyLogs.length > 0) {
                          const statuses = dailyLogs.map(l => l.status);
                          if (statuses.includes('S')) finalStatus = 'S';
                          else if (statuses.includes('I')) finalStatus = 'I';
                          else if (statuses.includes('A')) finalStatus = 'A';
                      }
                  }

                  if (finalStatus === 'A') {
                      const dateObj = new Date(date);
                      const dateStr = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(dateObj);
                      alpaDatesList.push(dateStr);
                  }
              });

              // --- PROCESS VIOLATIONS ---
              const myViolations = violationNotes.filter(n => n.student_id === student.id).map(n => {
                  const date = new Date(n.created_at);
                  const dateStr = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(date);
                  const reporter = journalMap[n.journal_id] || 'Admin/Guru';
                  return {
                      id: n.id,
                      date: dateStr,
                      category: n.category,
                      note: n.note,
                      reporter
                  };
              });

              return {
                  student,
                  alpaCount: alpaDatesList.length, // Total Days Alpha
                  alpaDates: alpaDatesList,
                  violations: myViolations
              };
          });

          // 5. Sort by Alpa Count Descending, then by Name. Filter out empty if needed.
          // Requirement: "Sajikan data ... yang memiliki Alpa dan catatan Pelanggaran"
          const sorted = processed.filter(p => p.alpaCount > 0 || p.violations.length > 0)
              .sort((a, b) => b.alpaCount - a.alpaCount || a.student.kelas.localeCompare(b.student.kelas) || a.student.name.localeCompare(b.student.name));

          setReportData(sorted);

      } catch (e) {
          console.error(e);
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

  const handleSaveInput = async () => {
      if (disciplineRows.length === 0 || !inputClass) return;
      if (!profile) return;

      try {
          const notesInserts: any[] = [];
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
                          note: row.note || `Laporan Manual oleh ${profile.full_name}`
                      });
                  });
              }
          });

          if (notesInserts.length > 0) {
              const { error } = await supabase.from('journal_notes').insert(notesInserts);
              if (error) throw error;
              alert("Data pelanggaran berhasil disimpan.");
              setShowInputModal(false);
              setDisciplineRows([]);
              setInputClass('');
              fetchReportData();
          }
      } catch (err: any) {
          alert("Gagal menyimpan: " + err.message);
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
              <button onClick={() => setIsOpen(!isOpen)} className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-left flex justify-between items-center text-xs">
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

  return (
    <Layout>
      <div className="space-y-6">
         {/* HEADER */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                    <ShieldAlert size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Data Kedisiplinan & Pelanggaran</h2>
                    <p className="text-gray-500 text-sm">Monitoring Alpa dan catatan perilaku siswa.</p>
                </div>
             </div>
             
             <button 
                onClick={() => setShowInputModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5"
             >
                <Plus size={18} /> Input Pelanggaran Baru
             </button>
         </div>

         {/* FILTER BAR */}
         <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1 w-full">
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
                         ) : reportData.length === 0 ? (
                             <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">Tidak ada data pelanggaran atau Alpa pada periode ini.</td></tr>
                         ) : (
                             reportData.map((item, idx) => (
                                 <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                     <td className="px-6 py-4 text-center font-medium text-slate-500">{idx + 1}</td>
                                     <td className="px-6 py-4 align-top">
                                         <div className="font-bold text-slate-800 text-base">{item.student.name}</div>
                                         <div className="text-xs text-slate-400 font-mono mt-0.5">{item.student.nisn}</div>
                                     </td>
                                     <td className="px-6 py-4 text-center align-top">
                                         <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-bold text-xs">{item.student.kelas}</span>
                                     </td>
                                     <td className="px-6 py-4 align-top space-y-2">
                                         {/* 1. ALPA */}
                                         {item.alpaCount > 0 && (
                                             <div className="flex flex-wrap items-start gap-1 text-sm leading-relaxed mb-2">
                                                 <span className="font-bold text-red-600 bg-red-50 px-1.5 rounded border border-red-100 whitespace-nowrap">
                                                     • Alpa ({item.alpaCount} Hari):
                                                 </span>
                                                 <span className="text-slate-600">
                                                     {item.alpaDates.join(', ')}
                                                 </span>
                                             </div>
                                         )}

                                         {/* 2. VIOLATIONS */}
                                         {item.violations.map((v) => (
                                             <div key={v.id} className="flex flex-col sm:flex-row sm:items-baseline gap-1 text-sm leading-tight text-slate-700">
                                                 <span className="font-bold text-slate-800">• {v.category}</span>
                                                 <span className="hidden sm:inline text-slate-300">-</span>
                                                 <span>{v.date}</span>
                                                 <span className="text-xs text-slate-400 italic">({v.reporter})</span>
                                                 {v.note && <span className="text-xs text-slate-500 bg-slate-50 px-1 rounded truncate max-w-xs block sm:inline mt-1 sm:mt-0">"{v.note}"</span>}
                                             </div>
                                         ))}
                                     </td>
                                 </tr>
                             ))
                         )}
                     </tbody>
                 </table>
             </div>
             <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-center">
                 Menampilkan {reportData.length} siswa dengan catatan kedisiplinan.
             </div>
         </div>
      </div>

      {/* INPUT MODAL (UNCHANGED FUNCTIONALITY) */}
      {showInputModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="bg-orange-600 p-4 flex justify-between items-center text-white">
                      <h3 className="font-bold flex items-center gap-2"><Gavel size={20}/> Input Pelanggaran</h3>
                      <button onClick={() => setShowInputModal(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Kelas</label>
                            <select className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-orange-500" value={inputClass} onChange={e => setInputClass(e.target.value)}>
                                <option value="">-- Pilih Kelas --</option>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {inputClass && (
                            <div className="space-y-4">
                                {disciplineRows.map((row, idx) => (
                                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative space-y-3">
                                        <div className="flex gap-3">
                                            <div className="w-1/2">
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Jenis Pelanggaran</label>
                                                <select className="w-full p-2 border rounded-lg text-xs" value={row.category} onChange={e => updateRow(idx, 'category', e.target.value)}>
                                                    <option value="">- Pilih -</option>
                                                    {disciplineTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div className="w-1/2">
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Tindak Lanjut</label>
                                                <select className="w-full p-2 border rounded-lg text-xs" value={row.followUp} onChange={e => updateRow(idx, 'followUp', e.target.value)}>
                                                    <option value="">- Pilih -</option>
                                                    {followUpTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Keterangan</label>
                                            <input type="text" className="w-full p-2 border rounded-lg text-xs" placeholder="Detail kejadian..." value={row.note} onChange={e => updateRow(idx, 'note', e.target.value)}/>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Murid Terlibat</label>
                                            <MultiSelectDropdown options={students} selectedIds={row.studentIds} onChange={(ids: string[]) => updateRow(idx, 'studentIds', ids)} placeholder="Pilih Murid" />
                                        </div>
                                        <button onClick={() => removeRow(idx)} className="absolute top-1 right-1 text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                                <button onClick={addRow} className="text-orange-600 text-xs font-bold flex items-center gap-1 hover:bg-orange-50 px-2 py-1 rounded transition-colors"><Plus size={14}/> Tambah Baris</button>
                            </div>
                        )}
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                      <button onClick={handleSaveInput} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 w-full shadow-lg shadow-orange-200 transition-all active:scale-95">
                          <Save size={18}/> Simpan Data
                      </button>
                  </div>
              </div>
          </div>
      )}
    </Layout>
  );
};

export default Kedisiplinan;
