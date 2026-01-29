
import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Loader2, Save, Plus, Trash2, Check, ChevronDown, X, CheckCircle2, XCircle, Gavel } from 'lucide-react';
import { Student } from '../types';

interface NoteItem {
    category: string;
    studentIds: string[];
    followUp?: string; // Dropdown
    note?: string; // Manual Input
}

const Kedisiplinan: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Data
  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Master Data
  const [disciplineTypes, setDisciplineTypes] = useState<string[]>([]);
  const [followUpTypes, setFollowUpTypes] = useState<string[]>([]); // New State for Dropdown

  // Selection
  const [selectedClass, setSelectedClass] = useState('');
  const [disciplineRows, setDisciplineRows] = useState<NoteItem[]>([]);

  // Alert State
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    fetchInitData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
        fetchStudents();
    } else {
        setStudents([]);
        setDisciplineRows([]);
    }
  }, [selectedClass]);

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

  const fetchStudents = async () => {
      setLoading(true);
      const { data } = await supabase.from('students').select('*').eq('kelas', selectedClass).order('name');
      if (data) setStudents(data);
      setLoading(false);
      // Initialize with one empty row if none
      if (disciplineRows.length === 0) addRow();
  };

  const addRow = () => {
      setDisciplineRows(prev => [...prev, { category: '', studentIds: [], followUp: '', note: '' }]);
  };

  const removeRow = (index: number) => {
      setDisciplineRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof NoteItem, value: any) => {
      setDisciplineRows(prev => {
          const list = [...prev];
          list[index] = { ...list[index], [field]: value };
          return list;
      });
  };

  const handleSave = async () => {
      if (disciplineRows.length === 0 || !selectedClass) return;
      if (!profile) {
          setAlertState({ isOpen: true, type: 'error', title: 'Sesi Habis', message: 'Silakan login ulang aplikasi.' });
          return;
      }

      setLoading(true);
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
                          follow_up: row.followUp || '', // Save Dropdown Value
                          note: row.note || `Diinput via menu Kedisiplinan oleh ${profile.full_name || 'Guru'}` // Save Manual Note
                      });
                  });
              }
          });

          if (notesInserts.length > 0) {
              const { error } = await supabase.from('journal_notes').insert(notesInserts);
              if (error) throw error;
              setAlertState({
                  isOpen: true,
                  type: 'success',
                  title: 'Berhasil Disimpan',
                  message: `${notesInserts.length} data pelanggaran telah dicatat.`
              });
              setDisciplineRows([]); // Reset
              setSelectedClass('');
          } else {
              setAlertState({
                  isOpen: true,
                  type: 'error',
                  title: 'Data Kosong',
                  message: 'Harap lengkapi data pelanggaran dan pilih murid.'
              });
          }

      } catch (err: any) {
          console.error("Save Error:", err);
          setAlertState({ isOpen: true, type: 'error', title: 'Gagal Menyimpan', message: err.message || 'Terjadi kesalahan sistem.' });
      } finally {
          setLoading(false);
      }
  };

  // --- REUSED MULTI-SELECT DROPDOWN ---
  const MultiSelectDropdown = ({ options, selectedIds, onChange, placeholder }: any) => {
      const [isOpen, setIsOpen] = useState(false);
      const wrapperRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
          const handleClickOutside = (event: MouseEvent) => {
              if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                  setIsOpen(false);
              }
          };
          document.addEventListener('mousedown', handleClickOutside);
          return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

      const toggleSelection = (id: string) => {
          const newSelection = selectedIds.includes(id) 
            ? selectedIds.filter((sid: string) => sid !== id)
            : [...selectedIds, id];
          onChange(newSelection);
      };

      const selectedNames = options.filter((o: any) => selectedIds.includes(o.id)).map((o: any) => o.name);

      return (
          <div className="relative" ref={wrapperRef}>
              <button 
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-white text-left flex justify-between items-center focus:ring-2 focus:ring-orange-500"
              >
                  <span className={`truncate text-sm ${selectedIds.length === 0 ? 'text-gray-400' : 'text-slate-700 font-bold'}`}>
                      {selectedIds.length === 0 ? placeholder : `${selectedIds.length} Murid Dipilih`}
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-1 custom-scrollbar">
                      {options.map((opt: any) => {
                          const isSelected = selectedIds.includes(opt.id);
                          return (
                              <div 
                                  key={opt.id}
                                  onClick={() => toggleSelection(opt.id)}
                                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                              >
                                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                      isSelected 
                                      ? 'bg-orange-600 border-orange-600' 
                                      : 'bg-white border-slate-300'
                                  }`}>
                                      {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                                  </div>
                                  <span className={`text-sm ${isSelected ? 'text-orange-700 font-bold' : 'text-slate-700'}`}>
                                      {opt.name}
                                  </span>
                              </div>
                          );
                      })}
                      {options.length === 0 && <div className="p-3 text-center text-xs text-gray-400">Tidak ada murid tersedia.</div>}
                  </div>
              )}
              {selectedIds.length > 0 && (
                 <div className="mt-2 flex flex-wrap gap-1">
                     {selectedNames.map((name: string, idx: number) => {
                         const studentId = options.find((o:any) => o.name === name)?.id;
                         return (
                             <span key={idx} className="text-[10px] bg-orange-50 text-orange-700 px-2 py-1 rounded-md border border-orange-100 flex items-center gap-1 font-medium">
                                 {name}
                                 {studentId && (
                                     <button onClick={() => toggleSelection(studentId)} className="hover:bg-orange-100 rounded-full p-0.5">
                                         <X size={10} />
                                     </button>
                                 )}
                             </span>
                         )
                     })}
                 </div>
              )}
          </div>
      );
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                <ShieldAlert size={28} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Input Pelanggaran</h2>
                <p className="text-gray-500 text-sm">Catat pelanggaran tata tertib siswa di luar jam KBM.</p>
            </div>
        </div>

        {/* 1. Select Class */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-1">Pilih Kelas</label>
            <select 
                className="w-full border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-orange-500 bg-white font-bold text-slate-700"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
            >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>

        {/* 2. Input Form (Only if class selected) */}
        {selectedClass && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-fade-in">
                <h3 className="font-extrabold text-lg text-slate-800 mb-4">Catatan Pelanggaran Tata Tertib</h3>
                
                <div className="space-y-4">
                    {disciplineRows.map((row, idx) => (
                        <div key={idx} className="flex flex-col gap-3 p-4 border border-slate-200 rounded-2xl bg-slate-50 relative">
                            {/* Row Controls: Category & Follow Up */}
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="w-full md:w-1/2">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Jenis Pelanggaran</label>
                                    <select 
                                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-orange-500"
                                        value={row.category}
                                        onChange={e => updateRow(idx, 'category', e.target.value)}
                                    >
                                        <option value="">-- Pilih Jenis --</option>
                                        {disciplineTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="w-full md:w-1/2">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1"><Gavel size={10}/> Tindak Lanjut</label>
                                    <select 
                                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-orange-500"
                                        value={row.followUp || ''}
                                        onChange={e => updateRow(idx, 'followUp', e.target.value)}
                                    >
                                        <option value="">-- Pilih Tindakan --</option>
                                        {followUpTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* NOTE INPUT (MANUAL) */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Keterangan / Catatan Kejadian</label>
                                <input 
                                    type="text"
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-orange-500"
                                    placeholder="Contoh: Siswa tidur di kelas saat jam kosong..."
                                    value={row.note || ''}
                                    onChange={e => updateRow(idx, 'note', e.target.value)}
                                />
                            </div>
                            
                            {/* Student Select */}
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Murid Terlibat</label>
                                <MultiSelectDropdown 
                                    options={students} 
                                    selectedIds={row.studentIds}
                                    onChange={(ids: string[]) => updateRow(idx, 'studentIds', ids)}
                                    placeholder="Pilih Murid"
                                />
                            </div>

                            <button onClick={() => removeRow(idx)} className="absolute top-2 right-2 md:top-auto md:bottom-3 md:right-3 p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    ))}
                    
                    <button onClick={addRow} className="text-orange-600 text-xs font-bold flex items-center gap-1 hover:underline px-2">
                        <Plus size={14}/> Tambah Catatan Pelanggaran
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-50 transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Simpan Pelanggaran
                    </button>
                </div>
            </div>
        )}

        {/* STATUS ALERT */}
        {alertState.isOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center transform scale-100">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ${alertState.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {alertState.type === 'success' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800 mb-2">{alertState.title}</h3>
                    <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">{alertState.message}</p>
                    <button onClick={() => setAlertState(prev => ({...prev, isOpen: false}))} className="w-full py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">OK, Lanjutkan</button>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default Kedisiplinan;
