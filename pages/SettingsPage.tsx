
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { Settings, Save, Plus, Trash2, Calendar, Loader2, Info, Clock, CheckSquare, Square, User, BookOpen } from 'lucide-react';
import { AppSetting, NonEffectiveDay, Profile } from '../types';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    academic_year: '',
    semester: 'Ganjil',
    headmaster: '',
    headmaster_nip: ''
  });
  const [nonEffectiveDays, setNonEffectiveDays] = useState<NonEffectiveDay[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]); // List Guru for Dropdown
  const [subjectsList, setSubjectsList] = useState<string[]>([]); // Master Mapel
  const [newSubject, setNewSubject] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Day Input State
  const [newDay, setNewDay] = useState({ date: '', reason: '' });
  
  // Hours Selection State
  const [isFullDay, setIsFullDay] = useState(true);
  const [selectedHours, setSelectedHours] = useState<string[]>([]);

  useEffect(() => {
    const initData = async () => {
        setLoading(true);
        await Promise.all([fetchSettings(), fetchTeachers()]);
        setLoading(false);
    };
    initData();
  }, []);

  const fetchTeachers = async () => {
      try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .neq('nip', null)
            .order('full_name');
          if (data) setTeachers(data);
      } catch (err) {
          console.error("Gagal load data guru", err);
      }
  };

  const fetchSettings = async () => {
    try {
        const { data, error } = await supabase.from('app_settings').select('*');
        if (error) throw error;
        
        const settingsMap: Record<string, string> = {};
        let days: NonEffectiveDay[] = [];
        let subs: string[] = [];

        if (data) {
            data.forEach(item => {
                if (item.key === 'non_effective_days') {
                    try {
                        days = item.value ? JSON.parse(item.value) : [];
                    } catch (e) {
                        days = [];
                    }
                } else if (item.key === 'subjects_list') {
                     try {
                        subs = item.value ? JSON.parse(item.value) : [];
                    } catch (e) {
                        subs = [];
                    }
                } else {
                    settingsMap[item.key] = item.value || '';
                }
            });
        }

        // Merge with existing state
        setSettings(prev => ({ ...prev, ...settingsMap }));
        setNonEffectiveDays(days);
        setSubjectsList(subs);
    } catch (err: any) {
        console.error("Error fetching settings:", err.message);
    }
  };

  const handleHeadmasterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedNip = e.target.value;
      const selectedTeacher = teachers.find(t => t.nip === selectedNip);
      
      if (selectedTeacher) {
          setSettings(prev => ({
              ...prev,
              headmaster: selectedTeacher.full_name,
              headmaster_nip: selectedTeacher.nip
          }));
      } else {
          setSettings(prev => ({ ...prev, headmaster: '', headmaster_nip: '' }));
      }
  };

  // SUBJECT MANAGEMENT
  const handleAddSubject = () => {
      if(newSubject.trim() && !subjectsList.includes(newSubject.trim())) {
          const updated = [...subjectsList, newSubject.trim()].sort();
          setSubjectsList(updated);
          setNewSubject('');
      }
  };

  const handleRemoveSubject = (sub: string) => {
      if(confirm(`Hapus mapel ${sub}?`)) {
          setSubjectsList(prev => prev.filter(s => s !== sub));
      }
  };

  const handleSaveGeneral = async () => {
      setSaving(true);
      try {
          // Upsert general settings
          const updates = Object.entries(settings).map(([key, value]) => ({
              key, value
          }));

          // Add Subjects List
          updates.push({ key: 'subjects_list', value: JSON.stringify(subjectsList) });

          const { error } = await supabase.from('app_settings').upsert(updates);
          if (error) throw error;
          
          alert("Pengaturan umum & daftar mapel berhasil disimpan!");
      } catch (err: any) {
          alert("Gagal menyimpan: " + (err.message || err));
      } finally {
          setSaving(false);
      }
  };

  // HOLIDAY MANAGEMENT
  const toggleHour = (h: number) => {
      const val = String(h);
      setSelectedHours(prev => 
          prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
      );
  };

  const handleAddDay = () => {
      if (!newDay.date || !newDay.reason) {
          alert("Tanggal dan Keterangan wajib diisi.");
          return;
      }
      if (!isFullDay && selectedHours.length === 0) {
          alert("Pilih minimal satu jam jika bukan Full Day.");
          return;
      }
      const hoursString = isFullDay 
        ? "Full Day" 
        : selectedHours.sort((a,b) => Number(a) - Number(b)).join(', ');

      const dayToAdd: NonEffectiveDay = {
          date: newDay.date,
          reason: newDay.reason,
          hours: hoursString
      };

      const updatedDays = [...nonEffectiveDays, dayToAdd];
      setNonEffectiveDays(updatedDays);
      setNewDay({ date: '', reason: '' });
      setIsFullDay(true);
      setSelectedHours([]);
      saveDays(updatedDays);
  };

  const handleDeleteDay = (idx: number) => {
      const updatedDays = nonEffectiveDays.filter((_, i) => i !== idx);
      setNonEffectiveDays(updatedDays);
      saveDays(updatedDays);
  };

  const saveDays = async (days: NonEffectiveDay[]) => {
      try {
          const { error } = await supabase.from('app_settings').upsert({
              key: 'non_effective_days',
              value: JSON.stringify(days)
          });
          if (error) throw error;
      } catch (err: any) {
          alert("Gagal menyimpan hari libur: " + (err.message || "Unknown error"));
      }
  };

  if (loading) return <Layout><div className="flex justify-center p-10"><Loader2 className="animate-spin"/></div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-gray-800 p-3 rounded-2xl text-white">
                <Settings size={28} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Pengaturan Aplikasi</h2>
                <p className="text-gray-500 text-sm">Konfigurasi tahun ajaran, kepala sekolah, dan data master.</p>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            {/* KOLOM KIRI: UMUM & MAPEL */}
            <div className="space-y-6">
                {/* SETTING UMUM */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Info size={18} className="text-blue-500"/> Informasi Sekolah
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Tahun Ajaran</label>
                            <input 
                                className="w-full border rounded-lg p-3 font-medium" 
                                value={settings['academic_year'] || ''}
                                onChange={e => setSettings({...settings, academic_year: e.target.value})}
                                placeholder="Contoh: 2024/2025"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Semester</label>
                            <select 
                                className="w-full border rounded-lg p-3 bg-white"
                                value={settings['semester'] || 'Ganjil'}
                                onChange={e => setSettings({...settings, semester: e.target.value})}
                            >
                                <option value="Ganjil">Ganjil</option>
                                <option value="Genap">Genap</option>
                            </select>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <label className="block text-xs font-bold text-blue-800 mb-1">Kepala Sekolah</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-blue-400" size={16}/>
                                <select 
                                    className="w-full border border-blue-200 rounded-lg p-3 pl-9 font-medium bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={settings['headmaster_nip'] || ''}
                                    onChange={handleHeadmasterChange}
                                >
                                    <option value="">-- Pilih Kepala Sekolah --</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.nip}>{t.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-1 rounded border">NIP</span>
                                <input 
                                    type="text" 
                                    readOnly
                                    className="flex-1 bg-transparent border-none text-xs text-gray-600 font-mono focus:ring-0 p-0"
                                    value={settings['headmaster_nip'] || '-'}
                                    placeholder="NIP otomatis..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* MASTER MAPEL */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                     <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <BookOpen size={18} className="text-purple-500"/> Input Mata Pelajaran
                    </h3>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                             <input 
                                className="flex-1 border rounded-lg p-2.5 text-sm" 
                                value={newSubject}
                                onChange={e => setNewSubject(e.target.value)}
                                placeholder="Tambah Mapel Baru..."
                                onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                             />
                             <button 
                                onClick={handleAddSubject}
                                className="bg-purple-600 text-white px-3 rounded-lg hover:bg-purple-700"
                             >
                                 <Plus size={18} />
                             </button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-1">
                            {subjectsList.length === 0 ? <p className="text-gray-400 text-xs italic">Belum ada mapel diinput.</p> :
                             subjectsList.map((sub, idx) => (
                                <div key={idx} className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs font-bold border border-purple-100 flex items-center gap-1 group">
                                    {sub}
                                    <button onClick={() => handleRemoveSubject(sub)} className="text-purple-400 hover:text-red-500"><Trash2 size={12}/></button>
                                </div>
                             ))
                            }
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSaveGeneral}
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Simpan Semua Pengaturan
                </button>
            </div>

            {/* KOLOM KANAN: HARI NON EFEKTIF */}
            <div className="space-y-6">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-red-500"/> Hari Non-Efektif
                    </h3>
                    
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">Tanggal</label>
                                <input 
                                    type="date" 
                                    className="w-full border rounded-lg p-2 text-sm"
                                    value={newDay.date}
                                    onChange={e => setNewDay({...newDay, date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">Keterangan</label>
                                <input 
                                    type="text" 
                                    className="w-full border rounded-lg p-2 text-sm"
                                    placeholder="Contoh: Rapat Dinas"
                                    value={newDay.reason}
                                    onChange={e => setNewDay({...newDay, reason: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                             <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => setIsFullDay(!isFullDay)}>
                                 {isFullDay ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18} className="text-gray-400"/>}
                                 <label className="text-sm font-bold text-gray-700 cursor-pointer select-none">Libur Seharian (Full Day)</label>
                             </div>
                             {!isFullDay && (
                                 <div className="animate-fade-in p-3 bg-gray-100 rounded-xl border border-gray-200">
                                     <label className="block text-[10px] font-bold text-gray-500 mb-2">Pilih Jam yang Diliburkan:</label>
                                     <div className="flex flex-wrap gap-2">
                                         {[1,2,3,4,5,6,7,8,9,10].map(h => (
                                             <button
                                                 key={h}
                                                 onClick={() => toggleHour(h)}
                                                 className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                                                     selectedHours.includes(String(h))
                                                     ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                                     : 'bg-white text-gray-600 border-gray-300 hover:border-red-300'
                                                 }`}
                                             >
                                                 {h}
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             )}
                        </div>

                        <button 
                           onClick={handleAddDay}
                           className="w-full bg-green-600 text-white p-2.5 rounded-xl hover:bg-green-700 font-bold flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> Tambah Hari Libur
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {nonEffectiveDays.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-4">Tidak ada hari libur diinput.</p>
                        ) : (
                            nonEffectiveDays.map((day, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                    <div>
                                        <div className="font-bold text-gray-800 text-sm">{day.reason}</div>
                                        <div className="text-xs text-gray-500 flex gap-2 items-center mt-1">
                                            <Calendar size={12}/>
                                            <span>{new Date(day.date).toLocaleDateString('id-ID')}</span>
                                            <span className="text-red-500 font-bold bg-red-50 px-1.5 rounded flex items-center gap-1">
                                                <Clock size={10}/>
                                                {day.hours === "Full Day" ? "Full Day" : `Jam ke: ${day.hours}`}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteDay(idx)}
                                        className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
