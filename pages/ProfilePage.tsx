import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { User, Camera, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Master Data
  const [subjectsList, setSubjectsList] = useState<string[]>([]);

  // Form Data Profile
  const [formData, setFormData] = useState({
    mengajar_mapel: '',
    wali_kelas: ''
  });

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        mengajar_mapel: profile.mengajar_mapel || '',
        wali_kelas: profile.wali_kelas || ''
      });
      setAvatarUrl(profile.avatar_url || null);
      fetchSubjects();
    }
  }, [profile]);

  const fetchSubjects = async () => {
    try {
        const { data } = await supabase.from('app_settings').select('value').eq('key', 'subjects_list').single();
        if (data && data.value) {
            setSubjectsList(JSON.parse(data.value));
        }
    } catch (e) { console.error(e); }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (!profile) throw new Error("No user");

      const { error } = await supabase
        .from('profiles')
        .update({
          mengajar_mapel: formData.mengajar_mapel,
          wali_kelas: formData.wali_kelas
        })
        .eq('id', profile.id);

      if (error) throw error;
      setMsg({ type: 'success', text: 'Profil berhasil diperbarui!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileSizeLimit = 500 * 1024; // 500 KB

    if (file.size > fileSizeLimit) {
      alert("Ukuran file maksimal 500 KB");
      return;
    }

    try {
      setLoading(true);
      if (!profile) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // 3. Update Profile Table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setMsg({ type: 'success', text: 'Foto profil berhasil diupload!' });

    } catch (err: any) {
      alert('Gagal upload foto: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <User className="text-blue-600" /> Profil Pengguna
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* KOLOM KIRI: FOTO */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Kartu Foto */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-50 mb-4 bg-gray-100 flex items-center justify-center shadow-inner">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={64} className="text-gray-300" />
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                  title="Ganti Foto"
                >
                  <Camera size={16} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <h3 className="font-bold text-gray-800">{profile?.full_name}</h3>
              <p className="text-sm text-blue-500 font-mono">{profile?.role === 'admin' ? 'Administrator' : `NIP. ${profile?.nip}`}</p>
              <p className="text-xs text-gray-400 mt-2 font-bold">Maks. Ukuran Foto: 500 KB</p>
            </div>
          </div>

          {/* KOLOM KANAN: DATA DIRI */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                   <User size={20} className="text-blue-500" /> Data Akademik
                </h3>
                {msg && (
                  <div className={`text-xs flex items-center gap-1 font-bold px-3 py-1 rounded-full ${msg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {msg.type === 'success' ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                    {msg.text}
                  </div>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">NIP (User ID)</label>
                    <input 
                      type="text" 
                      value={profile?.nip || ''} 
                      disabled 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-500 font-mono font-bold cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={profile?.full_name || ''} 
                      disabled 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-500 font-bold cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mata Pelajaran Diampu</label>
                  <select 
                    value={formData.mengajar_mapel}
                    onChange={e => setFormData({...formData, mengajar_mapel: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-slate-700"
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {subjectsList.map((subj, idx) => (
                        <option key={idx} value={subj}>{subj}</option>
                    ))}
                    {/* Fallback if user has a subject not in the master list */}
                    {!subjectsList.includes(formData.mengajar_mapel) && formData.mengajar_mapel && (
                        <option value={formData.mengajar_mapel}>{formData.mengajar_mapel}</option>
                    )}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1 font-bold">* Data diambil dari pengaturan admin.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Wali Kelas</label>
                  <select 
                    value={formData.wali_kelas}
                    onChange={e => setFormData({...formData, wali_kelas: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-slate-700"
                  >
                    <option value="">-- Bukan Wali Kelas --</option>
                    {['7A','7B','7C','7D','7E','7F','7G','7H','8A','8B','8C','8D','8E','8F','8G','8H','9A','9B','9C','9D','9E','9F','9G','9H'].map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                   <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                   >
                     {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} Simpan Perubahan
                   </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;