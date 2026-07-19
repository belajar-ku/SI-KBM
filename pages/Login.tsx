
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, ArrowRight, AlertCircle, ShieldCheck, GraduationCap, MonitorPlay, Shield, ChevronLeft, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [viewMode, setViewMode] = useState<'selection' | 'form'>('selection');
  const [selectedRoleLabel, setSelectedRoleLabel] = useState('');
  
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, academicYear, semester } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'guru' | 'operator' | 'admin') => {
      if (role === 'operator') {
          navigate('/operator-dashboard');
      } else {
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F0F4F8] dark:bg-slate-900 transition-colors duration-300"> 
      <div className="text-center mb-8">
           <img 
             src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" 
             alt="Logo Sekolah" 
             className="h-24 w-auto mx-auto mb-4 drop-shadow-sm" 
           />
           <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight uppercase leading-tight">
             UPT SMP NEGERI 1 PASURUAN
           </h1>
           <p className="text-slate-600 dark:text-slate-400 font-medium text-sm mt-1">
             Sistem Informasi KBM
           </p>
      </div>

      {viewMode === 'selection' ? (
          <div className="w-full max-w-lg grid gap-4 animate-fade-in">
              
              <div className="flex justify-center mb-6">
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-6 py-2 rounded-full shadow-sm text-sm font-bold text-slate-700 dark:text-slate-300">
                      Tahun Ajaran: {academicYear} | Semester: {semester}
                  </div>
              </div>
              <p className="text-center text-slate-500 dark:text-slate-400 font-bold text-sm mb-2 uppercase tracking-widest">Masuk Sebagai</p>

              
              <button 
                onClick={() => handleRoleSelect('guru')}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md hover:bg-blue-50 dark:hover:bg-slate-700 border-2 border-white dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/50 p-5 rounded-2xl shadow-sm hover:shadow-md flex items-center gap-5 transition-all group"
              >
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <GraduationCap size={32} />
                  </div>
                  <div className="text-left">
                      <h3 className="text-lg font-extrabold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">Guru / Tenaga Pendidik</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Masuk untuk mengisi jurnal & absensi.</p>
                  </div>
                  <div className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-blue-400">
                      <ArrowRight size={24} />
                  </div>
              </button>

              <button 
                onClick={() => handleRoleSelect('operator')}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md hover:bg-orange-50 dark:hover:bg-slate-700 border-2 border-white dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-500/50 p-5 rounded-2xl shadow-sm hover:shadow-md flex items-center gap-5 transition-all group"
              >
                  <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <MonitorPlay size={32} />
                  </div>
                  <div className="text-left">
                      <h3 className="text-lg font-extrabold text-slate-800 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-400">Operator Monitor</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Dashboard monitoring jadwal real-time.</p>
                  </div>
                  <div className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-orange-400">
                      <ArrowRight size={24} />
                  </div>
              </button>

              <button 
                onClick={() => handleRoleSelect('admin')}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-white dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 p-5 rounded-2xl shadow-sm hover:shadow-md flex items-center gap-5 transition-all group"
              >
                  <div className="w-16 h-16 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Shield size={32} />
                  </div>
                  <div className="text-left">
                      <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Administrator</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pengaturan sistem dan data master.</p>
                  </div>
                  <div className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-slate-800 dark:group-hover:text-white">
                      <ArrowRight size={24} />
                  </div>
              </button>
          </div>
      ) : (
          <main className="w-full max-w-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden relative animate-fade-in transition-colors">
            
            <div className="p-8">
              <button 
                onClick={() => setViewMode('selection')}
                className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors"
                title="Kembali"
              >
                  <ChevronLeft size={24} />
              </button>

              <div className="flex flex-col items-center justify-center gap-1 mb-6 mt-2">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full mb-2">
                      <ShieldCheck size={28} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Login {selectedRoleLabel}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Silakan masukkan kredensial Anda.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">User ID (NIP)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="pl-12 block w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3.5 text-slate-800 dark:text-white text-sm font-bold transition-all placeholder:text-gray-300 dark:placeholder:text-slate-600 placeholder:font-normal"
                      placeholder="Contoh: 19870101..."
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 block w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3.5 text-slate-800 dark:text-white text-sm font-bold transition-all placeholder:text-gray-300 dark:placeholder:text-slate-600 placeholder:font-normal"
                      placeholder="Masukkan Password"
                      required
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer z-10"
                        tabIndex={-1}
                        title={showPassword ? "Sembunyikan" : "Lihat Password"}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#3B82F6] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-200 dark:shadow-none mt-4 active:translate-y-0.5"
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

      <div className="mt-8 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">
          &copy; Tim IT SMPN 1 Pasuruan
      </div>
    </div>
  );
};

export default Login;
