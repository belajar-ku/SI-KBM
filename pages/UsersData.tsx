
import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { createClient } from '@supabase/supabase-js'; // Import createClient for Admin actions
import { Profile } from '../types';
import { Search, UserCog, GraduationCap, Shield, Edit, Save, X, Loader2, BookOpen, ChevronDown, Check, UserPlus, KeyRound, Eye, EyeOff, Lock, User, RefreshCw } from 'lucide-react';

// Helper Component for Password Cell
const PasswordCell = ({ password }: { password?: string }) => {
  const [show, setShow] = useState(false);
  
  if (!password) return <span className="text-gray-400 italic text-[10px] bg-gray-50 px-2 py-1 rounded border border-gray-100">Terenkripsi</span>;
  
  return (
    <div className="flex items-center gap-2 bg-yellow-50 px-2 py-1.5 rounded-lg border border-yellow-200 w-fit">
      <span className="font-mono text-xs font-bold text-slate-700 min-w-[70px]">
          {show ? password : '••••••••'}
      </span>
      <button 
        onClick={() => setShow(!show)} 
        className="text-yellow-600 hover:text-yellow-800 transition-colors p-0.5"
        title={show ? "Sembunyikan" : "Lihat Password"}
      >
        {show ? <EyeOff size={14}/> : <Eye size={14}/>}
      </button>
    </div>
  );
};

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
  
  // State untuk Add User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
      nip: '',
      fullName: '',
      password: 'Spansa@1', // Default
      role: 'user',
      mapel: '',
      waliKelas: ''
  });

  // State untuk Reset Password Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetData, setResetData] = useState({
      userId: '',
      userName: '',
      newPassword: ''
  });

  const [serviceKey, setServiceKey] = useState('');
  const [showServiceKey, setShowServiceKey] = useState(false);

  const [saving, setSaving] = useState(false);

  // State untuk Dropdown Multi-Select (Shared logic)
  const [isMapelDropdownOpen, setIsMapelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();

    // Close dropdown click outside
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsMapelDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    setIsMapelDropdownOpen(false);
  };

  const handleOpenReset = (user: Profile) => {
      setResetData({
          userId: user.id,
          userName: user.full_name,
          newPassword: ''
      });
      setResetModalOpen(true);
  };

  const handleSaveEdit = async () => {
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

  const handleCreateUser = async () => {
      if (!newUser.nip || !newUser.fullName || !newUser.password) {
          alert("NIP, Nama Lengkap, dan Password wajib diisi.");
          return;
      }
      if (!serviceKey) {
          alert("Service Role Key wajib diisi untuk membuat akun Login.");
          return;
      }

      setSaving(true);
      try {
          // 1. Setup Admin Client
          const SUPABASE_URL = 'https://aobgqejpjomgwxiosgin.supabase.co'; 
          const adminClient = createClient(SUPABASE_URL, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
          });

          // 2. Create Auth User
          const email = `${newUser.nip}@sekolah.id`;
          const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
              email: email,
              password: newUser.password,
              email_confirm: true,
              user_metadata: { full_name: newUser.fullName }
          });

          if (authError) throw new Error("Gagal membuat Auth User: " + authError.message);
          
          const userId = authData.user.id;

          // 3. Insert Profile (Termasuk Password Info)
          const { error: profileError } = await supabase.from('profiles').insert({
              id: userId,
              nip: newUser.nip,
              full_name: newUser.fullName,
              role: newUser.role,
              mengajar_mapel: newUser.mapel,
              wali_kelas: newUser.waliKelas,
              password_info: newUser.password // Save Password
          });
          if (profileError) throw new Error("Gagal membuat Profile: " + profileError.message);

          // 4. Insert Tabel Guru (Master Data)
          await supabase.from('tabel_guru').upsert({
              nip: newUser.nip,
              nama_lengkap: newUser.fullName,
              mapel: newUser.mapel,
              wali_kelas: newUser.waliKelas
          });

          alert("User berhasil ditambahkan!");
          setIsAddModalOpen(false);
          setNewUser({ nip: '', fullName: '', password: 'Spansa@1', role: 'user', mapel: '', waliKelas: '' });
          fetchData(); // Refresh list

      } catch (err: any) {
          alert(err.message);
      } finally {
          setSaving(false);
      }
  };

  const handleResetPasswordAction = async () => {
      if(!resetData.newPassword || !serviceKey) {
          alert("Password baru dan Service Key wajib diisi.");
          return;
      }
      setSaving(true);
      try {
          // 1. Setup Admin Client
          const SUPABASE_URL = 'https://aobgqejpjomgwxiosgin.supabase.co'; 
          const adminClient = createClient(SUPABASE_URL, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          });

          // 2. Update Auth Password
          const { error: authError } = await adminClient.auth.admin.updateUserById(
              resetData.userId, 
              { password: resetData.newPassword }
          );
          if (authError) throw new Error("Gagal update Auth: " + authError.message);

          // 3. Update Profile Table (Save Password Info)
          const { error: profileError } = await supabase.from('profiles')
            .update({ password_info: resetData.newPassword })
            .eq('id', resetData.userId);
          
          if (profileError) throw new Error("Gagal update Profile: " + profileError.message);

          alert("Password berhasil direset!");
          
          // Update Local State
          setProfiles(prev => prev.map(p => 
              p.id === resetData.userId ? { ...p, password_info: resetData.newPassword } : p
          ));
          setResetModalOpen(false);
          setResetData({ userId: '', userName: '', newPassword: '' });

      } catch(e: any) {
          alert(e.message);
      } finally {
          setSaving(false);
      }
  };

  // Helper for Multi-Select (Used in Add & Edit)
  const toggleMapelSelection = (subject: string, isEditMode: boolean) => {
      let currentString = isEditMode ? editFormData.mengajar_mapel : newUser.mapel;
      let currentSelection = currentString ? currentString.split(',').map(s => s.trim()) : [];
      
      if (currentSelection.includes(subject)) {
          currentSelection = currentSelection.filter(s => s !== subject);
      } else {
          currentSelection.push(subject);
      }
      
      const newString = currentSelection.filter(Boolean).join(', ');
      
      if (isEditMode) {
          setEditFormData({ ...editFormData, mengajar_mapel: newString });
      } else {
          setNewUser({ ...newUser, mapel: newString });
      }
  };

  const filteredProfiles = profiles.filter(t => 
    t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nip?.includes(searchTerm)
  );

  const availableClasses = ['7A','7B','7C','7D','7E','7F','7G','7H',
                            '8A','8B','8C','8D','8E','8F','8G','8H',
                            '9A','9B','9C','9D','9E','9F','9G','9H'];

  return (
    <Layout>
      <div className="space-y-6 relative">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <UserCog className="text-blue-600" /> Data User (Profiles)
            </h2>
            <p className="text-gray-500 text-sm">Kelola data login, password, dan akademik pengguna.</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                type="text"
                placeholder="Cari User / NIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all flex-shrink-0"
              >
                  <UserPlus size={18} /> Tambah User
              </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                 <tr>
                   <th className="px-6 py-4">User Info</th>
                   <th className="px-6 py-4">Password Info</th>
                   <th className="px-6 py-4">Role</th>
                   <th className="px-6 py-4">Mapel (Profil)</th>
                   <th className="px-6 py-4">Wali Kelas</th>
                   <th className="px-6 py-4 text-center">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {loading ? (
                   <tr>
                     <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Memuat data profiles...</td>
                   </tr>
                 ) : filteredProfiles.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Tidak ada data user ditemukan.</td>
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
                           <PasswordCell password={p.password_info} />
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
                             <div className="flex flex-wrap gap-1">
                                {p.mengajar_mapel.split(',').map((m, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                                        {m.trim()}
                                    </span>
                                ))}
                             </div>
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
                           <div className="flex justify-center gap-2">
                               <button 
                                 onClick={() => handleOpenReset(p)}
                                 className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-100"
                                 title="Reset Password"
                               >
                                   <KeyRound size={16} />
                               </button>
                               <button 
                                 onClick={() => handleEditClick(p)}
                                 className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                                 title="Edit Data Akademik"
                               >
                                   <Edit size={16} />
                               </button>
                           </div>
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

        {/* MODAL RESET PASSWORD */}
        {resetModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                    <div className="bg-yellow-500 p-4 flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2">
                            <KeyRound size={20} /> Reset Password
                        </h3>
                        <button onClick={() => setResetModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="text-center mb-2">
                            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <RefreshCw size={24} />
                            </div>
                            <p className="text-sm text-gray-500">Anda akan mereset password untuk:</p>
                            <p className="font-bold text-lg text-slate-800">{resetData.userName}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Password Baru</label>
                            <input 
                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-yellow-500" 
                                placeholder="Masukkan password baru..."
                                value={resetData.newPassword}
                                onChange={e => setResetData({...resetData, newPassword: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Service Role Key (Wajib)</label>
                            <div className="relative">
                                <input 
                                    type={showServiceKey ? "text" : "password"}
                                    className="w-full border border-orange-300 rounded-lg p-2 pr-10 text-xs font-mono focus:ring-2 focus:ring-orange-500 bg-white"
                                    placeholder="Paste Service Role Key..."
                                    value={serviceKey}
                                    onChange={e => setServiceKey(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowServiceKey(!showServiceKey)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showServiceKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p className="text-[10px] text-orange-600 mt-1">* Diperlukan untuk update di sistem Auth.</p>
                        </div>

                        <button 
                            onClick={handleResetPasswordAction}
                            disabled={saving}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} Simpan Password Baru
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL EDIT AKADEMIK (Existing) */}
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
                    
                    <div className="p-6 space-y-5">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                            <p className="text-xs text-blue-600 font-bold uppercase">Mengedit User:</p>
                            <p className="font-bold text-gray-800">{editingUser.full_name}</p>
                            <p className="text-xs text-gray-500 font-mono">{editingUser.nip}</p>
                        </div>

                        {/* MULTI SELECT DROPDOWN */}
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Mata Pelajaran (Multi-Select)</label>
                            
                            <button 
                                onClick={() => setIsMapelDropdownOpen(!isMapelDropdownOpen)}
                                className="w-full text-left border border-gray-300 rounded-xl p-3 bg-white focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
                            >
                                <span className={`truncate ${!editFormData.mengajar_mapel ? 'text-gray-400' : 'text-gray-800'}`}>
                                    {editFormData.mengajar_mapel || "-- Pilih Mata Pelajaran --"}
                                </span>
                                <ChevronDown size={16} className="text-gray-400" />
                            </button>
                            
                            {isMapelDropdownOpen && (
                                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1 custom-scrollbar">
                                    {subjectsList.length === 0 ? (
                                        <div className="p-3 text-center text-gray-400 text-xs">Belum ada data Master Mapel.</div>
                                    ) : (
                                        subjectsList.map((subj, idx) => {
                                            const isSelected = editFormData.mengajar_mapel.includes(subj);
                                            return (
                                                <div 
                                                    key={idx}
                                                    onClick={() => toggleMapelSelection(subj, true)}
                                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer text-sm mb-1 transition-colors ${isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                                                >
                                                    <span>{subj}</span>
                                                    {isSelected && <Check size={16} className="text-blue-600"/>}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Wali Kelas</label>
                            <select 
                                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                value={editFormData.wali_kelas}
                                onChange={e => setEditFormData({...editFormData, wali_kelas: e.target.value})}
                            >
                                <option value="">-- Bukan Wali Kelas --</option>
                                {availableClasses.map(k => (
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
                                onClick={handleSaveEdit}
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

        {/* MODAL ADD USER (NEW) */}
        {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
                    <div className="bg-green-600 p-4 flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2">
                            <UserPlus size={20} /> Tambah User Manual
                        </h3>
                        <button onClick={() => setIsAddModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                        
                        {/* 1. CREDENTIALS */}
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 space-y-3">
                            <div className="flex items-center gap-2 text-green-800 font-bold border-b border-green-200 pb-2 mb-2">
                                <KeyRound size={16}/> Akun Login
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">NIP (User ID)</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input 
                                            className="w-full pl-9 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500" 
                                            placeholder="199xxx"
                                            value={newUser.nip}
                                            onChange={e => setNewUser({...newUser, nip: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input 
                                            className="w-full pl-9 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500" 
                                            value={newUser.password}
                                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Service Role Key (Wajib)</label>
                                <div className="relative">
                                    <input 
                                        type={showServiceKey ? "text" : "password"}
                                        className="w-full border border-orange-300 rounded-lg p-2 pr-10 text-xs font-mono focus:ring-2 focus:ring-orange-500 bg-white"
                                        placeholder="Paste Supabase Service Role Key..."
                                        value={serviceKey}
                                        onChange={e => setServiceKey(e.target.value)}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowServiceKey(!showServiceKey)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showServiceKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-orange-600 mt-1">* Diperlukan untuk membuat user di Supabase Auth.</p>
                            </div>
                        </div>

                        {/* 2. PROFILE DATA */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                                <input 
                                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500" 
                                    placeholder="Contoh: Budi Santoso, S.Pd"
                                    value={newUser.fullName}
                                    onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Role Aplikasi</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-xl p-3 bg-white"
                                    value={newUser.role}
                                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                                >
                                    <option value="user">User (Guru/Staf)</option>
                                    <option value="admin">Administrator</option>
                                    <option value="operator">Operator</option>
                                </select>
                            </div>

                            {/* MULTI SELECT MAPEL (REUSED LOGIC) */}
                            <div className="relative" ref={dropdownRef}>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Mata Pelajaran</label>
                                <button 
                                    onClick={() => setIsMapelDropdownOpen(!isMapelDropdownOpen)}
                                    className="w-full text-left border border-gray-300 rounded-xl p-3 bg-white focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
                                >
                                    <span className={`truncate ${!newUser.mapel ? 'text-gray-400' : 'text-gray-800'}`}>
                                        {newUser.mapel || "-- Pilih Mapel --"}
                                    </span>
                                    <ChevronDown size={16} className="text-gray-400" />
                                </button>
                                
                                {isMapelDropdownOpen && (
                                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-40 overflow-y-auto p-1 custom-scrollbar">
                                        {subjectsList.map((subj, idx) => {
                                            const isSelected = newUser.mapel.includes(subj);
                                            return (
                                                <div 
                                                    key={idx}
                                                    onClick={() => toggleMapelSelection(subj, false)}
                                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm mb-1 transition-colors ${isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                                                >
                                                    <span>{subj}</span>
                                                    {isSelected && <Check size={16} className="text-blue-600"/>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Wali Kelas</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-xl p-3 bg-white"
                                    value={newUser.waliKelas}
                                    onChange={e => setNewUser({...newUser, waliKelas: e.target.value})}
                                >
                                    <option value="">-- Bukan Wali Kelas --</option>
                                    {availableClasses.map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3 border-t border-gray-100">
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleCreateUser}
                                disabled={saving}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} Buat User
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
