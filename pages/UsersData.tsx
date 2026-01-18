import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { Search, UserCog, Database, GraduationCap, Shield } from 'lucide-react';

const UsersData: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      // Ambil data dari tabel profiles (User Aktif)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      if (data) setProfiles(data);
    } catch (err: any) {
      alert('Gagal mengambil data user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(t => 
    t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nip?.includes(searchTerm)
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <UserCog className="text-blue-600" /> Data User (Profiles)
            </h2>
            <p className="text-gray-500 text-sm">Daftar pengguna yang memiliki akun login aktif di sistem.</p>
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
                   <th className="px-6 py-4">User</th>
                   <th className="px-6 py-4">NIP</th>
                   <th className="px-6 py-4">Role</th>
                   <th className="px-6 py-4">Mapel (Profil)</th>
                   <th className="px-6 py-4">Wali Kelas</th>
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
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                {p.avatar_url ? (
                                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">IMG</div>
                                )}
                            </div>
                            <span className="font-medium text-gray-800">{p.full_name}</span>
                         </div>
                       </td>
                       <td className="px-6 py-3 font-mono text-xs text-gray-500">
                         {p.nip}
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
                         {p.mengajar_mapel || '-'}
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
      </div>
    </Layout>
  );
};

export default UsersData;