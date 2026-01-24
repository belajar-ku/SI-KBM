
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

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
      <div className="text-center mb-6">
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

      {/* Main Card */}
      <main className="w-full max-w-sm bg-[#F8FDF9] rounded-[2rem] shadow-xl border border-white/50 overflow-hidden relative">
        
        <div className="p-8">
          <div className="flex items-center justify-center gap-2 mb-6 text-blue-500">
              <ShieldCheck size={24} />
              <h2 className="text-lg font-bold text-blue-500">Login Sistem</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">User ID (NIP / Admin ID)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="pl-12 block w-full bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3.5 text-slate-800 text-sm font-bold transition-all placeholder:text-gray-300 placeholder:font-normal"
                  placeholder="Contoh: 198701012020021003"
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
          
          <div className="mt-8 text-center">
              <p className="text-xs text-gray-400 font-medium">Pastikan NIP dan Password sudah benar</p>
          </div>
        </div>
      </main>

      <div className="mt-8 text-center text-slate-500 text-xs font-medium">
          &copy; Tim IT SMPN 1 Pasuruan
      </div>
    </div>
  );
};

export default Login;
