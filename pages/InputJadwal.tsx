import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { CalendarPlus, Save, CheckCircle, AlertCircle, Loader2, User, Plus, Trash2, BookOpen, Clock, Edit, X, Database } from 'lucide-react';
import { Profile, Schedule } from '../types';

interface ScheduleQueueItem {
    id: string; // ID unik sementara untuk list
    hari: string;
    kelas: string;
    jam: string[];
    mapel: string;
}

const InputJadwal: React.FC = () => {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Profile | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  // Queue State (Daftar Penampungan Sementara - Data Baru)
  const [scheduleQueue, setScheduleQueue] = useState<ScheduleQueueItem[]>([]);
  
  // DB State (Data yang sudah ada di Database)
  const [dbSchedules, setDbSchedules] = useState<Schedule[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<Schedule | null>(null);
  const [editFormData, setEditFormData] = useState({
      hari: '',
      kelas: '',
      jam: [] as string[],
      mapel: ''
  });

  // Form State (Untuk input baris baru)
  const [formData, setFormData] = useState({
    hari: 'Senin',
    jam: [] as string[],
    kelas: '',
    mapel: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('nip', null)
        .order('full_name');
      
      if (error) throw error;
      if (data) setTeachers(data); 
    } catch (err) {
      console.error("Gagal load guru", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherSchedules = async (teacherId: string) => {
      setLoadingDb(true);
      try {
          const { data, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('teacher_id', teacherId)
            .order('day_of_week')
            .order('hour'); // Note: sorting string hour is basic, but sufficient
          
          if (error) throw error;
          setDbSchedules(data || []);
      } catch (err) {
          console.error("Gagal load jadwal database", err);
      } finally {
          setLoadingDb(false);
      }
  };

  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nip = e.target.value;
    const teacher = teachers.find(t => t.nip === nip) || null;
    setSelectedTeacher(teacher);
    setScheduleQueue([]); // Reset antrian draft jika ganti guru
    setStatus(null);

    if (teacher) {
        fetchTeacherSchedules(teacher.id);
        
        let subjects: string[] = [];
        if (teacher.mengajar_mapel) {
            subjects = teacher.mengajar_mapel.split(/[;,]+/).map(s => s.trim()).filter(Boolean);
        }
        setAvailableSubjects(subjects);
        setFormData(prev => ({
            ...prev,
            mapel: subjects.length === 1 ? subjects[0] : ''
        }));
    } else {
        setDbSchedules([]);
    }
  };

  // --- LOGIC FORM UTAMA (NEW) ---

  const toggleJam = (j: number) => {
    const val = String(j);
    setFormData(prev => {
      const exists = prev.jam.includes(val);
      if (exists) return { ...prev, jam: prev.jam.filter(x => x !== val) };
      return { ...prev, jam: [...prev.jam, val] };
    });
  };

  const handleAddToQueue = () => {
    setStatus(null);
    if (!selectedTeacher) {
        setStatus({ type: 'error', msg: 'Pilih Guru terlebih dahulu.' });
        return;
    }
    if (formData.jam.length === 0) {
        setStatus({ type: 'error', msg: 'Pilih minimal satu Jam Ke.' });
        return;
    }
    if (!formData.kelas || !formData.mapel) {
        setStatus({ type: 'error', msg: 'Kelas dan Mata Pelajaran harus diisi.' });
        return;
    }

    const newItem: ScheduleQueueItem = {
        id: Math.random().toString(36).substr(2, 9),
        hari: formData.hari,
        kelas: formData.kelas,
        jam: [...formData.jam].sort((a,b) => Number(a) - Number(b)),
        mapel: formData.mapel
    };

    setScheduleQueue([...scheduleQueue, newItem]);
    
    // Reset Form Parsial
    setFormData(prev => ({
        ...prev,
        jam: [],
        kelas: ''
    }));
  };

  const handleRemoveFromQueue = (id: string) => {
      setScheduleQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveAll = async () => {
    if (scheduleQueue.length === 0) return;
    if (!selectedTeacher) return;

    setSubmitting(true);
    setStatus(null);

    try {
        const daysMap: Record<string, number> = { 
            'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7 
        };

        const payloads = scheduleQueue.map(item => ({
            day_of_week: daysMap[item.hari],
            hour: item.jam.join(', '),
            kelas: item.kelas,
            subject: item.mapel,
            teacher_nip: selectedTeacher.nip,
            teacher_id: selectedTeacher.id
        }));

        const { error } = await supabase.from('schedules').insert(payloads);
        if (error) throw error;

        setStatus({ type: 'success', msg: `Berhasil menyimpan ${scheduleQueue.length} jadwal baru!` });
        setScheduleQueue([]); // Clear queue
        fetchTeacherSchedules(selectedTeacher.id); // Refresh DB List

    } catch (err: any) {
        setStatus({ type: 'error', msg: err.message || 'Gagal menyimpan data.' });
    } finally {
        setSubmitting(false);
    }
  };

  // --- LOGIC EDIT & DELETE EXISTING ---

  const handleDeleteDbSchedule = async (id: string) => {
      if(!confirm("Yakin ingin menghapus jadwal ini?")) return;
      
      try {
          const { error } = await supabase.from('schedules').delete().eq('id', id);
          if (error) throw error;
          // Refresh list
          if (selectedTeacher) fetchTeacherSchedules(selectedTeacher.id);
      } catch (err: any) {
          alert("Gagal menghapus: " + err.message);
      }
  };

  const openEditModal = (item: Schedule) => {
      // Convert day number to name
      const days = ['','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
      const dayName = days[item.day_of_week] || 'Senin';
      
      // Convert hour string "1, 2" to array ["1", "2"]
      const hourArray = item.hour.split(',').map(h => h.trim());

      setEditFormData({
          hari: dayName,
          kelas: item.kelas,
          jam: hourArray,
          mapel: item.subject
      });
      setEditingItem(item);
  };

  const handleUpdateSchedule = async () => {
      if (!editingItem) return;
      setSubmitting(true);
      
      try {
        const daysMap: Record<string, number> = { 
            'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7 
        };
        
        const payload = {
            day_of_week: daysMap[editFormData.hari],
            hour: editFormData.jam.sort((a,b) => Number(a) - Number(b)).join(', '),
            kelas: editFormData.kelas,
            subject: editFormData.mapel
        };

        const { error } = await supabase
            .from('schedules')
            .update(payload)
            .eq('id', editingItem.id);

        if (error) throw error;

        setEditingItem(null); // Close modal
        if (selectedTeacher) fetchTeacherSchedules(selectedTeacher.id); // Refresh
      } catch (err: any) {
          alert("Gagal update: " + err.message);
      } finally {
          setSubmitting(false);
      }
  };

  const toggleEditJam = (j: number) => {
    const val = String(j);
    setEditFormData(prev => {
      const exists = prev.jam.includes(val);
      if (exists) return { ...prev, jam: prev.jam.filter(x => x !== val) };
      return { ...prev, jam: [...prev.jam, val] };
    });
  };

  // Helper untuk render nama hari
  const getDayName = (num: number) => {
     const days = ['','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
     return days[num] || '-';
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 relative">
        <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                <CalendarPlus size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Input Jadwal Pelajaran</h2>
                <p className="text-gray-500 text-sm">Kelola jadwal mengajar guru secara efisien.</p>
            </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
            
            {/* KOLOM KIRI: INPUT FORM */}
            <div className="md:col-span-1 space-y-4">
                {/* 1. Pilih Guru (Paling Atas) */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 sticky top-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Guru Pengajar</label>
                    <select 
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 bg-gray-50 font-medium"
                        value={selectedTeacher?.nip || ''}
                        onChange={handleTeacherChange}
                        disabled={loading || scheduleQueue.length > 0} // Kunci guru jika antrian masih ada isinya
                    >
                        <option value="">-- Cari Nama Guru --</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.nip}>{t.full_name}</option>
                        ))}
                    </select>
                    {scheduleQueue.length > 0 && <p className="text-[10px] text-orange-500 mt-1">* Simpan dulu antrian sebelum ganti guru.</p>}
                </div>

                {/* Tampilan Detail Guru (Kop Sekolah & Nama) */}
                {selectedTeacher && (
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg text-center relative overflow-hidden animate-fade-in">
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-purple-200 mb-1">UPT SMP NEGERI 1 PASURUAN</h3>
                            <h2 className="text-lg font-bold leading-tight">{selectedTeacher.full_name}</h2>
                        </div>
                        <User className="absolute -bottom-4 -right-4 text-white opacity-10" size={80} />
                    </div>
                )}

                {/* Form Input Detail */}
                <div className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4 transition-all ${!selectedTeacher ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <h3 className="font-bold text-gray-700 text-sm border-b pb-2">Tambah Jadwal Baru</h3>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Hari</label>
                        <select 
                            className="w-full border rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-purple-500"
                            value={formData.hari}
                            onChange={e => setFormData({...formData, hari: e.target.value})}
                        >
                            {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'].map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Kelas</label>
                        <select 
                            className="w-full border rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-purple-500"
                            value={formData.kelas}
                            onChange={e => setFormData({...formData, kelas: e.target.value})}
                        >
                            <option value="">-- Pilih Kelas --</option>
                            {['7', '8', '9'].map(level => (
                                ['A','B','C','D','E','F','G','H'].map(paralel => (
                                    <option key={`${level}${paralel}`} value={`${level}${paralel}`}>{level}{paralel}</option>
                                ))
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Jam Ke-</label>
                        <div className="flex flex-wrap gap-1.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(j => (
                                <button
                                    key={j}
                                    type="button"
                                    onClick={() => toggleJam(j)}
                                    className={`w-8 h-8 rounded text-xs font-bold transition-all border ${
                                        formData.jam.includes(String(j)) 
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'
                                    }`}
                                >
                                    {j}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mata Pelajaran</label>
                        <select
                            className="w-full border rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-purple-500"
                            value={formData.mapel}
                            onChange={e => setFormData({...formData, mapel: e.target.value})}
                        >
                            <option value="">-- Pilih Mapel --</option>
                            {availableSubjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <button 
                        onClick={handleAddToQueue}
                        className="w-full bg-purple-50 text-purple-700 hover:bg-purple-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-purple-200 transition-all mt-2"
                    >
                        <Plus size={18} /> Tambah ke Antrian
                    </button>

                </div>
            </div>

            {/* KOLOM KANAN: LIST ANTRIAN & DATABASE */}
            <div className="md:col-span-2 space-y-6">
                
                {/* 1. SECTION DRAFT / ANTRIAN */}
                {scheduleQueue.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-orange-100 bg-orange-50 flex justify-between items-center">
                            <h3 className="font-bold text-orange-800 flex items-center gap-2">
                                <Clock size={18} />
                                Draft / Antrian ({scheduleQueue.length})
                            </h3>
                            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-lg">Belum Disimpan</span>
                        </div>
                        
                        <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                            {scheduleQueue.map((item, idx) => (
                                <div key={item.id} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800 text-sm">{item.mapel}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <span className="bg-gray-100 px-1.5 rounded">{item.hari}</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="font-mono text-purple-600 font-bold">Kls {item.kelas}</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="flex items-center gap-1">Jam {item.jam.join(', ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveFromQueue(item.id)}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-orange-50 border-t border-orange-100">
                             {status && (
                                <div className={`mb-3 p-3 rounded-xl flex items-start gap-2 text-xs font-bold ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                    {status.msg}
                                </div>
                            )}
                            <button 
                                onClick={handleSaveAll}
                                disabled={submitting}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : <Save size={20} />} 
                                Simpan Semua ke Database
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. SECTION DATABASE / EXISTING */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col min-h-[400px]">
                     <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center rounded-t-2xl">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <Database size={18} className="text-blue-500"/>
                            Jadwal Aktif di Database
                        </h3>
                        {selectedTeacher && <span className="text-xs text-gray-400">Total: {dbSchedules.length} JP</span>}
                    </div>

                    <div className="flex-1 p-4">
                        {!selectedTeacher ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 text-center py-10">
                                <User size={48} className="mb-2 opacity-50"/>
                                <p className="text-sm">Pilih Guru di panel kiri untuk melihat jadwal.</p>
                            </div>
                        ) : loadingDb ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-purple-500"/></div>
                        ) : dbSchedules.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                Belum ada jadwal tersimpan untuk guru ini.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dbSchedules.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex flex-col items-center justify-center font-bold text-xs leading-none border border-blue-100">
                                                <span>{item.kelas}</span>
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">{item.subject}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                    <span className="bg-gray-100 px-1.5 rounded font-semibold text-gray-600">{getDayName(item.day_of_week)}</span>
                                                    <span className="text-gray-300">|</span>
                                                    <span className="flex items-center gap-1 text-purple-600 font-medium"><Clock size={10}/> Jam {item.hour}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => openEditModal(item)}
                                                className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Jadwal"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteDbSchedule(item.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Hapus Permanen"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* MODAL EDIT */}
        {editingItem && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                    <div className="bg-purple-600 p-4 flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2">
                            <Edit size={18} /> Edit Jadwal
                        </h3>
                        <button onClick={() => setEditingItem(null)} className="hover:bg-white/20 p-1 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Hari</label>
                                <select 
                                    className="w-full border rounded-lg p-2.5 text-sm bg-white"
                                    value={editFormData.hari}
                                    onChange={e => setEditFormData({...editFormData, hari: e.target.value})}
                                >
                                    {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Kelas</label>
                                <select 
                                    className="w-full border rounded-lg p-2.5 text-sm bg-white"
                                    value={editFormData.kelas}
                                    onChange={e => setEditFormData({...editFormData, kelas: e.target.value})}
                                >
                                    {['7', '8', '9'].map(level => (
                                        ['A','B','C','D','E','F','G','H'].map(paralel => (
                                            <option key={`${level}${paralel}`} value={`${level}${paralel}`}>{level}{paralel}</option>
                                        ))
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Jam Ke-</label>
                            <div className="flex flex-wrap gap-1.5">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(j => (
                                    <button
                                        key={j}
                                        type="button"
                                        onClick={() => toggleEditJam(j)}
                                        className={`w-8 h-8 rounded text-xs font-bold transition-all border ${
                                            editFormData.jam.includes(String(j)) 
                                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'
                                        }`}
                                    >
                                        {j}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Mata Pelajaran</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg p-2.5 text-sm"
                                value={editFormData.mapel}
                                onChange={e => setEditFormData({...editFormData, mapel: e.target.value})}
                            />
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button 
                                onClick={() => setEditingItem(null)}
                                className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleUpdateSchedule}
                                disabled={submitting}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} Update
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </Layout>
  );
};

export default InputJadwal;