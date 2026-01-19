
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { Student } from '../types';
import { Search, GraduationCap, Edit, Plus, Trash2, Save, X, Loader2, Filter } from 'lucide-react';

const StudentsData: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nisn: '',
    nis: '',
    name: '',
    kelas: '',
    gender: 'L',
    jenjang: '7'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [filterClass]); // Re-fetch when class filter changes

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
      alert('Gagal mengambil data siswa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
      setEditingId(null);
      setFormData({ nisn: '', nis: '', name: '', kelas: filterClass || '7A', gender: 'L', jenjang: '7' });
      setIsModalOpen(true);
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
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Yakin ingin menghapus siswa ini?")) return;
      try {
          const { error } = await supabase.from('students').delete().eq('id', id);
          if (error) throw error;
          setStudents(prev => prev.filter(s => s.id !== id));
      } catch (err: any) {
          alert("Gagal hapus: " + err.message);
      }
  };

  const handleSave = async () => {
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
            <p className="text-gray-500 text-sm">Kelola data siswa per kelas.</p>
          </div>
          
          <button 
             onClick={handleAddNew}
             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-500/30 transition-all"
          >
             <Plus size={18} /> Tambah Murid
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
                   <th className="px-6 py-4">Nama Siswa</th>
                   <th className="px-6 py-4">NISN / NIS</th>
                   <th className="px-6 py-4 text-center">L/P</th>
                   <th className="px-6 py-4 text-center">Kelas</th>
                   <th className="px-6 py-4 text-center">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {loading ? (
                   <tr><td colSpan={5} className="px-6 py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500"/></td></tr>
                 ) : filteredStudents.length === 0 ? (
                   <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Tidak ada data siswa ditemukan.</td></tr>
                 ) : (
                   filteredStudents.map((s) => (
                     <tr key={s.id} className="hover:bg-blue-50/50 transition-colors">
                       <td className="px-6 py-3 font-bold text-gray-700">{s.name}</td>
                       <td className="px-6 py-3 text-gray-500 font-mono">
                           {s.nisn} <span className="text-xs text-gray-400">{s.nis ? `/ ${s.nis}` : ''}</span>
                       </td>
                       <td className="px-6 py-3 text-center">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${s.gender === 'P' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                               {s.gender || 'L'}
                           </span>
                       </td>
                       <td className="px-6 py-3 text-center">
                           <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold">{s.kelas}</span>
                       </td>
                       <td className="px-6 py-3 text-center flex justify-center gap-2">
                           <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"><Edit size={16}/></button>
                           <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 size={16}/></button>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
           <div className="p-3 bg-gray-50 text-xs text-gray-500 border-t flex justify-between">
               <span>Total: {filteredStudents.length} Siswa</span>
               <span>Menampilkan data dari database</span>
           </div>
        </div>

        {/* Modal Form */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2"><GraduationCap size={20}/> {editingId ? 'Edit Siswa' : 'Tambah Siswa Baru'}</h3>
                        <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Nama Lengkap</label>
                            <input className="w-full border rounded-lg p-2.5" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama Siswa" />
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
                        
                        <button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 shadow-lg disabled:opacity-50">
                            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />} Simpan Data
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </Layout>
  );
};

export default StudentsData;
