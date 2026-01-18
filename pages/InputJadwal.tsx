import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { CalendarPlus, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Profile } from '../types';

const InputJadwal: React.FC = () => {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    hari: 'Senin',
    jam: [] as string[],
    kelas: '',
    mapel: '',
    teacher_nip: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      // Ambil data dari tabel profiles (User Aktif)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('nip', null) // Hanya yang punya NIP
        .order('full_name');
      
      if (error) throw error;
      if (data) setTeachers(data); 
    } catch (err) {
      console.error("Gagal load guru dari profiles", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nip = e.target.value;
    const selectedTeacher = teachers.find(t => t.nip === nip);
    
    let subjects: string[] = [];
    
    if (selectedTeacher && selectedTeacher.mengajar_mapel) {
        // Pisahkan berdasarkan titik koma (;) atau koma (,)
        subjects = selectedTeacher.mengajar_mapel.split(/[;,]+/).map(s => s.trim()).filter(Boolean);
    }

    setAvailableSubjects(subjects);
    
    // Reset mapel saat guru ganti, atau auto-select jika cuma ada 1 mapel
    setFormData(prev => ({
        ...prev,
        teacher_nip: nip,
        mapel: subjects.length === 1 ? subjects[0] : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (formData.jam.length === 0) {
      setStatus({ type: 'error', msg: 'Harap pilih minimal satu Jam Ke.' });
      return;
    }
    if (!formData.kelas || !formData.mapel || !formData.teacher_nip) {
      setStatus({ type: 'error', msg: 'Harap lengkapi semua form.' });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Convert Hari ke Angka
      const daysMap: Record<string, number> = { 
        'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7 
      };
      
      // 2. Format Jam (array to string "1, 2")
      const hourString = formData.jam.sort().join(', ');

      // 3. Cari Teacher ID
      const selectedTeacher = teachers.find(t => t.nip === formData.teacher_nip);
      const teacherId = selectedTeacher ? selectedTeacher.id : null;

      // 4. Insert
      const { error } = await supabase.from('schedules').insert({
        day_of_week: daysMap[formData.hari],
        hour: hourString,
        kelas: formData.kelas,
        subject: formData.mapel,
        teacher_nip: formData.teacher_nip,
        teacher_id: teacherId
      });

      if (error) throw error;

      setStatus({ type: 'success', msg: 'Jadwal berhasil disimpan!' });
      
      // Reset form parsial
      setFormData(prev => ({
        ...prev,
        jam: [],
        // mapel: '', // Biarkan mapel terpilih agar input berulang mudah
        // teacher_nip: '' 
      }));

    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Gagal menyimpan jadwal.' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleJam = (j: number) => {
    const val = String(j);
    setFormData(prev => {
      const exists = prev.jam.includes(val);
      if (exists) return { ...prev, jam: prev.jam.filter(x => x !== val) };
      return { ...prev, jam: [...prev.jam, val] };
    });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                <CalendarPlus size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Input Jadwal Pelajaran</h2>
                <p className="text-gray-500 text-sm">Tambahkan jadwal KBM secara manual ke database.</p>
            </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Baris 1: Hari & Kelas */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Hari</label>
                        <select 
                            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                            value={formData.hari}
                            onChange={e => setFormData({...formData, hari: e.target.value})}
                        >
                            {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'].map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Kelas</label>
                        <select 
                            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                            value={formData.kelas}
                            onChange={e => setFormData({...formData, kelas: e.target.value})}
                        >
                            <option value="">-- Pilih --</option>
                            {/* Generate Kelas 7A-9H secara manual */}
                            {['7', '8', '9'].map(level => (
                                ['A','B','C','D','E','F','G','H'].map(paralel => (
                                    <option key={`${level}${paralel}`} value={`${level}${paralel}`}>{level}{paralel}</option>
                                ))
                            ))}
                        </select>
                    </div>
                </div>

                {/* Jam Ke (Checkbox Group) */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Jam Ke-</label>
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(j => (
                            <button
                                key={j}
                                type="button"
                                onClick={() => toggleJam(j)}
                                className={`w-10 h-10 rounded-lg font-bold text-sm transition-all border ${
                                    formData.jam.includes(String(j)) 
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-105' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                                }`}
                            >
                                {j}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">* Klik untuk memilih jam (bisa lebih dari satu).</p>
                </div>

                {/* Guru */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Guru Pengajar</label>
                    <select 
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                        value={formData.teacher_nip}
                        onChange={handleTeacherChange}
                        disabled={loading}
                    >
                        <option value="">-- Pilih Guru --</option>
                        {loading ? <option>Memuat data profiles...</option> : teachers.map(t => (
                            <option key={t.id} value={t.nip}>{t.full_name}</option>
                        ))}
                    </select>
                    {formData.teacher_nip && availableSubjects.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">Guru ini belum memiliki data 'Mengajar Mapel' di Profil.</p>
                    )}
                </div>

                {/* Mapel (Dropdown Dinamis) */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Mata Pelajaran</label>
                    <select
                        className={`w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white ${!formData.teacher_nip ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        value={formData.mapel}
                        onChange={e => setFormData({...formData, mapel: e.target.value})}
                        disabled={!formData.teacher_nip}
                    >
                        <option value="">-- Pilih Mata Pelajaran --</option>
                        {availableSubjects.map((subject, idx) => (
                            <option key={idx} value={subject}>{subject}</option>
                        ))}
                    </select>
                    {!formData.teacher_nip && (
                        <p className="text-xs text-gray-400 mt-1">Pilih Guru terlebih dahulu untuk memunculkan mapel.</p>
                    )}
                </div>

                {/* Alert Status */}
                {status && (
                    <div className={`p-4 rounded-xl flex items-start gap-3 text-sm font-medium animate-fade-in ${status.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        {status.type === 'success' ? <CheckCircle size={20} className="mt-0.5" /> : <AlertCircle size={20} className="mt-0.5" />}
                        <span className="leading-relaxed">{status.msg}</span>
                    </div>
                )}

                <div className="pt-2">
                    <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : <Save size={20} />} 
                        Simpan Jadwal
                    </button>
                </div>

            </form>
        </div>
      </div>
    </Layout>
  );
};

export default InputJadwal;