
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, ArrowRight, AlertCircle, ShieldCheck, GraduationCap, MonitorPlay, Shield, ChevronLeft } from 'lucide-react';

const Login: React.FC = () => {
  const [viewMode, setViewMode] = useState<'selection' | 'form'>('selection');
  const [selectedRoleLabel, setSelectedRoleLabel] = useState('');
  
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'guru' | 'operator' | 'admin') => {
      if (role === 'operator') {
          // Direct navigation for Operator (Kiosk Mode)
          navigate('/operator-dashboard');
      } else {
          // Show Form for Guru or Admin
          setSelectedRoleLabel(role === 'admin' ? 'Administrator' : 'Guru / Staf');
          setViewMode('form');
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { error } = await signIn(userId, password);
      
      if (error) {
        if (error.message === 'Failed to fetch') {
           setError('Gagal terhubung ke Database.');
        } else if (error.message.includes('Invalid login')) {
           setError('NIP atau Password salah.');
        } else {
           setError(error.message);
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#E3F2E5]"> 
      {/* Background is specific light green from screenshot */}
      
      {/* Top Section: Logo & Title */}
      <div className="text-center mb-8">
           <img 
             src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" 
             alt="Logo Sekolah" 
             className="h-24 w-auto mx-auto mb-4 drop-shadow-sm" 
           />
           <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight uppercase leading-tight">
             UPT SMP NEGERI 1 PASURUAN
           </h1>
           <p className="text-slate-600 font-medium text-sm mt-1">
             Sistem Informasi KBM
           </p>
      </div>

      {viewMode === 'selection' ? (
          /* --- TAMPILAN PILIHAN PERAN --- */
          <div className="w-full max-w-lg grid gap-4 animate-fade-in">
              <p className="text-center text-slate-500 font-bold text-sm mb-2 uppercase tracking-widest">Masuk Sebagai</p>
              
              <button 
                onClick={() => handleRoleSelect('guru')}
                className="bg-white hover:bg-blue-50 border-2 border-white hover:border-blue-200 p-5 rounded-2xl shadow-sm hover:shadow-md flex items-center gap-5 transition-all group"
              >
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <GraduationCap size={32} />
                  </div>
                  <div className="text-left">
                      <h3 className="text-lg font-extrabold text-slate-800 group-hover:text-blue-700">Guru / Tenaga Pendidik</h3>
                      <p className="text-xs text-slate-500 font-medium">Masuk untuk mengisi jurnal & absensi.</p>
                  </div>
                  <div className="ml-auto text-slate-300 group-hover:text-blue-400">
                      <ArrowRight size={24} />
                  </div>
              </button>

              <button 
                onClick={() => handleRoleSelect('operator')}
                className="bg-white hover:bg-orange-50 border-2 border-white hover:border-orange-200 p-5 rounded-2xl shadow-sm hover:shadow-md flex items-center gap-5 transition-all group"
              >
                  <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <MonitorPlay size={32} />
                  </div>
                  <div className="text-left">
                      <h3 className="text-lg font-extrabold text-slate-800 group-hover:text-orange-700">Operator Monitor</h3>
                      <p className="text-xs text-slate-500 font-medium">Dashboard monitoring jadwal real-time.</p>
                  </div>
                  <div className="ml-auto text-slate-300 group-hover:text-orange-400">
                      <ArrowRight size={24} />
                  </div>
              </button>

              <button 
                onClick={() => handleRoleSelect('admin')}
                className="bg-white hover:bg-slate-50 border-2 border-white hover:border-slate-300 p-5 rounded-2xl shadow-sm hover:shadow-md flex items-center gap-5 transition-all group"
              >
                  <div className="w-16 h-16 rounded-full bg-slate-800 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Shield size={32} />
                  </div>
                  <div className="text-left">
                      <h3 className="text-lg font-extrabold text-slate-800">Administrator</h3>
                      <p className="text-xs text-slate-500 font-medium">Pengaturan sistem dan data master.</p>
                  </div>
                  <div className="ml-auto text-slate-300 group-hover:text-slate-800">
                      <ArrowRight size={24} />
                  </div>
              </button>
          </div>
      ) : (
          /* --- TAMPILAN FORM LOGIN --- */
          <main className="w-full max-w-sm bg-[#F8FDF9] rounded-[2rem] shadow-xl border border-white/50 overflow-hidden relative animate-fade-in">
            
            <div className="p-8">
              <button 
                onClick={() => setViewMode('selection')}
                className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                title="Kembali"
              >
                  <ChevronLeft size={24} />
              </button>

              <div className="flex flex-col items-center justify-center gap-1 mb-6 mt-2">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-2">
                      <ShieldCheck size={28} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">Login {selectedRoleLabel}</h2>
                  <p className="text-xs text-slate-500">Silakan masukkan kredensial Anda.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">User ID (NIP)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="pl-12 block w-full bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3.5 text-slate-800 text-sm font-bold transition-all placeholder:text-gray-300 placeholder:font-normal"
                      placeholder="Contoh: 19870101..."
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 block w-full bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3.5 text-slate-800 text-sm font-bold transition-all placeholder:text-gray-300 placeholder:font-normal"
                      placeholder="Masukkan Password"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 text-red-600 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#3B82F6] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-200 mt-4 active:translate-y-0.5"
                >
                  {isSubmitting ? 'Memproses...' : (
                    <>
                      Masuk Aplikasi <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </main>
      )}

      <div className="mt-8 text-center text-slate-500 text-xs font-medium">
          &copy; Tim IT SMPN 1 Pasuruan
      </div>
    </div>
  );
};

export default Login;
