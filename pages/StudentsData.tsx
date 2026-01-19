
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { Student } from '../types';
import { Search, GraduationCap, Edit, UserPlus, UserMinus, Trash2, Save, X, Loader2, Filter, ArrowRight } from 'lucide-react';

const StudentsData: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'selection' | 'masuk' | 'keluar'>('selection');
  const [editingId, setEditingId] = useState<string | null>(null); // Jika null, berarti mode tambah/mutasi baru
  
  // Form Data untuk Mutasi Masuk / Edit
  const [formData, setFormData] = useState({
    nisn: '',
    nis: '',
    name: '',
    kelas: '',
    gender: 'L',
    jenjang: '7'
  });

  // State untuk Mutasi Keluar
  const [mutasiKeluarData, setMutasiKeluarData] = useState({
      kelas: '',
      studentId: '',
      status: 'aktif' as 'aktif' | 'tidak_aktif'
  });
  const [studentsForDropdown, setStudentsForDropdown] = useState<Student[]>([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [filterClass]); 

  // Fetch students for dropdown in Mutasi Keluar when class changes
  useEffect(() => {
    if (modalType === 'keluar' && mutasiKeluarData.kelas) {
        const fetchClassStudents = async () => {
             const { data } = await supabase.from('students').select('*').eq('kelas', mutasiKeluarData.kelas).order('name');
             setStudentsForDropdown(data || []);
        };
        fetchClassStudents();
    }
  }, [modalType, mutasiKeluarData.kelas]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase.from('students').select('*');
      
      if (filterClass) {
          query = query.eq('kelas', filterClass);
      }
      
      const { data, error } = await query.order('kelas', { ascending: true }).order('name', { ascending: true });
      
      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      alert('Gagal mengambil data murid: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openMutasiModal = () => {
      setModalType('selection');
      setIsModalOpen(true);
  };

  const handleMutasiSelection = (type: 'masuk' | 'keluar') => {
      setModalType(type);
      // Reset form states
      setEditingId(null);
      setFormData({ nisn: '', nis: '', name: '', kelas: filterClass || '7A', gender: 'L', jenjang: '7' });
      setMutasiKeluarData({ kelas: '', studentId: '', status: 'aktif' });
  };

  const handleEdit = (s: Student) => {
      setEditingId(s.id);
      setFormData({
          nisn: s.nisn,
          nis: s.nis || '',
          name: s.name,
          kelas: s.kelas,
          gender: (s.gender as any) || 'L',
          jenjang: s.jenjang || '7'
      });
      setModalType('masuk'); // Edit pakai form yang sama dengan mutasi masuk
      setIsModalOpen(true);
  };

  const handleSaveMasuk = async () => {
      if (!formData.nisn || !formData.name || !formData.kelas) {
          alert("NISN, Nama, dan Kelas wajib diisi!");
          return;
      }
      setSaving(true);
      try {
          const payload = {
              nisn: formData.nisn,
              nis: formData.nis,
              name: formData.name,
              kelas: formData.kelas,
              gender: formData.gender,
              jenjang: formData.jenjang
          };

          if (editingId) {
              const { error } = await supabase.from('students').update(payload).eq('id', editingId);
              if (error) throw error;
              setStudents(prev => prev.map(s => s.id === editingId ? { ...s, ...payload } as Student : s));
          } else {
              const { data, error } = await supabase.from('students').insert(payload).select().single();
              if (error) throw error;
              if (data) setStudents(prev => [...prev, data].sort((a,b) => a.kelas.localeCompare(b.kelas) || a.name.localeCompare(b.name)));
          }
          setIsModalOpen(false);
      } catch (err: any) {
          alert("Gagal menyimpan: " + err.message);
      } finally {
          setSaving(false);
      }
  };

  const handleSaveKeluar = async () => {
      if (!mutasiKeluarData.kelas || !mutasiKeluarData.studentId) {
          alert("Pilih Kelas dan Murid terlebih dahulu.");
          return;
      }
      
      setSaving(true);
      try {
          if (mutasiKeluarData.status === 'tidak_aktif') {
              // HAPUS DARI DATABASE
              const { error } = await supabase.from('students').delete().eq('id', mutasiKeluarData.studentId);
              if (error) throw error;
              
              // Remove locally
              setStudents(prev => prev.filter(s => s.id !== mutasiKeluarData.studentId));
              alert("Data murid berhasil dihapus (Mutasi Keluar/Tidak Aktif).");
          } else {
              // Jika status masih aktif, tidak ada perubahan database, hanya tutup modal
              alert("Tidak ada perubahan disimpan karena status dipilih 'Aktif'.");
          }
          setIsModalOpen(false);
      } catch (err: any) {
          alert("Gagal memproses mutasi keluar: " + err.message);
      } finally {
          setSaving(false);
      }
  };

  const filteredStudents = students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.nisn.includes(searchTerm)
  );

  const availableClasses = ['7A','7B','7C','7D','7E','7F','7G','7H',
                            '8A','8B','8C','8D','8E','8F','8G','8H',
                            '9A','9B','9C','9D','9E','9F','9G','9H'];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <GraduationCap className="text-blue-600" /> Data Murid
            </h2>
            <p className="text-gray-500 text-sm">Kelola data murid, mutasi masuk dan keluar.</p>
          </div>
          
          <button 
             onClick={openMutasiModal}
             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-500/30 transition-all"
          >
             <UserPlus size={18} /> Mutasi Murid
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Cari Nama / NISN..." 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="w-full md:w-64 relative">
                 <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
                 <select 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                    value={filterClass}
                    onChange={e => setFilterClass(e.target.value)}
                 >
                    <option value="">Semua Kelas</option>
                    {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
            </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                 <tr>
                   <th className="px-6 py-4">Nama Murid</th>
                   <th className="px-6 py-4">NISN / NIS</th>
                   <th className="px-6 py-4 text-center">Kelas</th>
                   <th className="px-6 py-4 text-center">L/P</th>
                   <th className="px-6 py-4 text-center">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {loading ? (
                   <tr><td colSpan={5} className="px-6 py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500"/></td></tr>
                 ) : filteredStudents.length === 0 ? (
                   <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Tidak ada data murid ditemukan.</td></tr>
                 ) : (
                   filteredStudents.map((s) => (
                     <tr key={s.id} className="hover:bg-blue-50/50 transition-colors">
                       <td className="px-6 py-3 font-bold text-gray-700">{s.name}</td>
                       <td className="px-6 py-3 text-gray-500 font-mono">
                           {s.nisn} <span className="text-xs text-gray-400">{s.nis ? `/ ${s.nis}` : ''}</span>
                       </td>
                        <td className="px-6 py-3 text-center">
                           <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold border border-gray-200">{s.kelas}</span>
                       </td>
                       <td className="px-6 py-3 text-center">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${s.gender === 'P' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                               {s.gender || 'L'}
                           </span>
                       </td>
                       <td className="px-6 py-3 text-center flex justify-center gap-2">
                           <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"><Edit size={16}/></button>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
           <div className="p-3 bg-gray-50 text-xs text-gray-500 border-t flex justify-between">
               <span>Total: {filteredStudents.length} Murid</span>
               <span>Menampilkan data dari database</span>
           </div>
        </div>

        {/* Dynamic Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                    
                    {/* Header */}
                    <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2">
                            <GraduationCap size={20}/> 
                            {modalType === 'selection' ? 'Pilih Jenis Mutasi' : 
                             modalType === 'masuk' ? (editingId ? 'Edit Data Murid' : 'Mutasi Masuk (Tambah)') : 
                             'Mutasi Keluar (Hapus)'}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
                    </div>
                    
                    <div className="p-6">
                        {modalType === 'selection' && (
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => handleMutasiSelection('masuk')}
                                    className="flex flex-col items-center justify-center gap-2 p-6 bg-green-50 border border-green-200 rounded-2xl hover:bg-green-100 transition-colors group"
                                >
                                    <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-green-700 group-hover:scale-110 transition-transform">
                                        <UserPlus size={24} />
                                    </div>
                                    <span className="font-bold text-green-800">Mutasi Masuk</span>
                                    <span className="text-xs text-green-600 text-center">Tambah murid baru ke database</span>
                                </button>

                                <button 
                                    onClick={() => handleMutasiSelection('keluar')}
                                    className="flex flex-col items-center justify-center gap-2 p-6 bg-red-50 border border-red-200 rounded-2xl hover:bg-red-100 transition-colors group"
                                >
                                    <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center text-red-700 group-hover:scale-110 transition-transform">
                                        <UserMinus size={24} />
                                    </div>
                                    <span className="font-bold text-red-800">Mutasi Keluar</span>
                                    <span className="text-xs text-red-600 text-center">Keluarkan/hapus murid dari database</span>
                                </button>
                            </div>
                        )}

                        {modalType === 'masuk' && (
                             <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nama Lengkap</label>
                                    <input className="w-full border rounded-lg p-2.5" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama Murid" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">NISN</label>
                                        <input className="w-full border rounded-lg p-2.5" value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} placeholder="001xxxx" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">NIS (Opsional)</label>
                                        <input className="w-full border rounded-lg p-2.5" value={formData.nis} onChange={e => setFormData({...formData, nis: e.target.value})} placeholder="1234" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Kelas</label>
                                        <select className="w-full border rounded-lg p-2.5 bg-white" value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})}>
                                            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Jenis Kelamin</label>
                                        <div className="flex gap-2 mt-1">
                                            <label className={`flex-1 text-center py-2 rounded-lg cursor-pointer border ${formData.gender === 'L' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-200'}`}>
                                                <input type="radio" className="hidden" name="gender" value="L" checked={formData.gender === 'L'} onChange={() => setFormData({...formData, gender: 'L'})} /> L
                                            </label>
                                            <label className={`flex-1 text-center py-2 rounded-lg cursor-pointer border ${formData.gender === 'P' ? 'bg-pink-100 border-pink-300 text-pink-700' : 'border-gray-200'}`}>
                                                <input type="radio" className="hidden" name="gender" value="P" checked={formData.gender === 'P'} onChange={() => setFormData({...formData, gender: 'P'})} /> P
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                
                                <button onClick={handleSaveMasuk} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 shadow-lg disabled:opacity-50">
                                    {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />} Simpan Data
                                </button>
                            </div>
                        )}

                        {modalType === 'keluar' && (
                             <div className="space-y-4">
                                 <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Pilih Kelas</label>
                                    <select 
                                        className="w-full border rounded-lg p-2.5 bg-white" 
                                        value={mutasiKeluarData.kelas} 
                                        onChange={e => setMutasiKeluarData({...mutasiKeluarData, kelas: e.target.value, studentId: ''})}
                                    >
                                        <option value="">-- Pilih Kelas --</option>
                                        {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Pilih Murid</label>
                                    <select 
                                        className="w-full border rounded-lg p-2.5 bg-white disabled:bg-gray-100" 
                                        value={mutasiKeluarData.studentId}
                                        disabled={!mutasiKeluarData.kelas} 
                                        onChange={e => setMutasiKeluarData({...mutasiKeluarData, studentId: e.target.value})}
                                    >
                                        <option value="">-- Pilih Nama Murid --</option>
                                        {studentsForDropdown.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.nisn})</option>
                                        ))}
                                    </select>
                                </div>

                                {mutasiKeluarData.studentId && (
                                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mt-2">
                                        <label className="block text-xs font-bold text-gray-700 mb-2">Status Murid</label>
                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="status" 
                                                    value="aktif" 
                                                    checked={mutasiKeluarData.status === 'aktif'}
                                                    onChange={() => setMutasiKeluarData({...mutasiKeluarData, status: 'aktif'})}
                                                />
                                                <span className="text-sm">Aktif (Batal Mutasi)</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="status" 
                                                    value="tidak_aktif" 
                                                    checked={mutasiKeluarData.status === 'tidak_aktif'}
                                                    onChange={() => setMutasiKeluarData({...mutasiKeluarData, status: 'tidak_aktif'})}
                                                />
                                                <span className="text-sm font-bold text-red-600">Tidak Aktif (Hapus Data Permanen)</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={handleSaveKeluar} 
                                    disabled={saving || !mutasiKeluarData.studentId} 
                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 shadow-lg disabled:opacity-50 transition-colors ${
                                        mutasiKeluarData.status === 'tidak_aktif' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : (mutasiKeluarData.status === 'tidak_aktif' ? 'Proses Mutasi Keluar' : 'Simpan Status')} 
                                </button>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        )}

      </div>
    </Layout>
  );
};

export default StudentsData;