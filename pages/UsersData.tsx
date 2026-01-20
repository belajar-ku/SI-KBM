
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { Search, UserCog, Database, GraduationCap, Shield, Edit, Save, X, Loader2, BookOpen, Check } from 'lucide-react';

const UsersData: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Master Data from Settings
  const [subjectsList, setSubjectsList] = useState<string[]>([]);

  // State untuk Edit Modal
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editFormData, setEditFormData] = useState({
    mengajar_mapel: '',
    wali_kelas: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [profilesRes, settingsRes] = await Promise.all([
          supabase.from('profiles').select('*').order('full_name', { ascending: true }),
          supabase.from('app_settings').select('value').eq('key', 'subjects_list').single()
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      
      if (settingsRes.data?.value) {
          try {
              setSubjectsList(JSON.parse(settingsRes.data.value));
          } catch(e) { console.error("Parse subjects error", e); }
      }
    } catch (err: any) {
      alert('Gagal mengambil data user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: Profile) => {
    setEditingUser(user);
    setEditFormData({
      mengajar_mapel: user.mengajar_mapel || '',
      wali_kelas: user.wali_kelas || ''
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);

    try {
      // 1. Update ke tabel PROFILES
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          mengajar_mapel: editFormData.mengajar_mapel,
          wali_kelas: editFormData.wali_kelas
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // 2. Sinkronisasi ke TABEL_GURU
      if (editingUser.nip) {
         const { error: guruError } = await supabase
           .from('tabel_guru')
           .update({
             mapel: editFormData.mengajar_mapel,
             wali_kelas: editFormData.wali_kelas
           })
           .eq('nip', editingUser.nip);
         if (guruError) console.warn("Sync tabel_guru warning:", guruError.message);
      }

      setProfiles(prev => prev.map(p => 
        p.id === editingUser.id 
          ? { ...p, mengajar_mapel: editFormData.mengajar_mapel, wali_kelas: editFormData.wali_kelas } 
          : p
      ));

      setEditingUser(null);
    } catch (err: any) {
      alert('Gagal menyimpan data: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredProfiles = profiles.filter(t => 
    t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nip?.includes(searchTerm)
  );

  return (
    <Layout>
      <div className="space-y-6 relative">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <UserCog className="text-blue-600" /> Data User (Profiles)
            </h2>
            <p className="text-gray-500 text-sm">Kelola data akademik pengguna (Mapel & Wali Kelas).</p>
          </div>
          
          <div className="relative w-full md:w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
             </div>
             <input
               type="text"
               placeholder="Cari User / NIP..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-9 w-full border border-gray-300 rounded-xl p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
             />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                 <tr>
                   <th className="px-6 py-4">User Info</th>
                   <th className="px-6 py-4">Role</th>
                   <th className="px-6 py-4">Mapel (Profil)</th>
                   <th className="px-6 py-4">Wali Kelas</th>
                   <th className="px-6 py-4 text-center">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {loading ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat data profiles...</td>
                   </tr>
                 ) : filteredProfiles.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Tidak ada data user ditemukan.</td>
                   </tr>
                 ) : (
                   filteredProfiles.map((p) => (
                     <tr key={p.id} className="hover:bg-blue-50/50 transition-colors group">
                       <td className="px-6 py-3">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                {p.avatar_url ? (
                                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                                        {p.full_name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-gray-800">{p.full_name}</div>
                                <div className="text-xs text-gray-500 font-mono">{p.nip}</div>
                            </div>
                         </div>
                       </td>
                       <td className="px-6 py-3">
                          {p.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-bold">
                                <Shield size={12} /> Admin
                              </span>
                          ) : (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                                User
                              </span>
                          )}
                       </td>
                       <td className="px-6 py-3 text-gray-600 max-w-xs truncate" title={p.mengajar_mapel}>
                         {p.mengajar_mapel ? (
                             <span className="flex items-center gap-1"><BookOpen size={14} className="text-blue-400"/> {p.mengajar_mapel}</span>
                         ) : <span className="text-gray-300 italic">Belum diisi</span>}
                       </td>
                       <td className="px-6 py-3">
                         {p.wali_kelas ? (
                           <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs font-bold">
                             <GraduationCap size={12} /> {p.wali_kelas}
                           </span>
                         ) : (
                           <span className="text-gray-300">-</span>
                         )}
                       </td>
                       <td className="px-6 py-3 text-center">
                           <button 
                             onClick={() => handleEditClick(p)}
                             className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                             title="Edit Data Akademik"
                           >
                               <Edit size={16} />
                           </button>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
           
           {!loading && (
             <div className="p-4 bg-gray-50 text-xs text-gray-500 border-t border-gray-100 flex justify-between">
                <span>Total: {filteredProfiles.length} User Aktif</span>
                <span>Data diambil dari tabel <strong>public.profiles</strong></span>
             </div>
           )}
        </div>

        {/* MODAL EDIT */}
        {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                    <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2">
                            <UserCog size={20} /> Edit Data Akademik
                        </h3>
                        <button onClick={() => setEditingUser(null)} className="hover:bg-white/20 p-1 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                            <p className="text-xs text-blue-600 font-bold uppercase">Mengedit User:</p>
                            <p className="font-bold text-gray-800">{editingUser.full_name}</p>
                            <p className="text-xs text-gray-500 font-mono">{editingUser.nip}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Mata Pelajaran</label>
                            {subjectsList.length > 0 ? (
                                <select 
                                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={editFormData.mengajar_mapel}
                                    onChange={e => setEditFormData({...editFormData, mengajar_mapel: e.target.value})}
                                >
                                    <option value="">-- Pilih Mata Pelajaran --</option>
                                    {subjectsList.map((subj, idx) => (
                                        <option key={idx} value={subj}>{subj}</option>
                                    ))}
                                </select>
                            ) : (
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Input Manual (Belum ada master mapel)"
                                    value={editFormData.mengajar_mapel}
                                    onChange={e => setEditFormData({...editFormData, mengajar_mapel: e.target.value})}
                                />
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">Data Mapel diambil dari Menu Setting.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Wali Kelas</label>
                            <select 
                                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                value={editFormData.wali_kelas}
                                onChange={e => setEditFormData({...editFormData, wali_kelas: e.target.value})}
                            >
                                <option value="">-- Bukan Wali Kelas --</option>
                                {['7A','7B','7C','7D','7E','7F','7G','7H',
                                  '8A','8B','8C','8D','8E','8F','8G','8H',
                                  '9A','9B','9C','9D','9E','9F','9G','9H'].map(k => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button 
                                onClick={() => setEditingUser(null)}
                                className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} Simpan
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

export default UsersData;
