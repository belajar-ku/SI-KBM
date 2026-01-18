import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';

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
        // Deteksi error koneksi spesifik
        if (error.message === 'Failed to fetch') {
           setError('Gagal terhubung ke Database. Periksa koneksi internet.');
        } else if (error.message.includes('Invalid login')) {
           setError('User ID atau Password salah. Pastikan akun sudah dibuat di Supabase Auth.');
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="mx-auto h-32 w-auto mb-4 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-[#2c3e50]">UPT SMP NEGERI 1 PASURUAN</h1>
          <p className="text-[#34495e] mt-1">Sistem Informasi KBM</p>
        </div>

        <div className="glassmorphism rounded-2xl p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <ShieldCheck className="text-[#3498db]" />
            <h2 className="text-xl font-bold text-[#3498db]">
              Login Sistem
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#2c3e50] mb-1">User ID (NIP / Admin ID)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#3498db]" />
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-lg focus:ring-[#3498db] focus:border-[#3498db] p-2.5 bg-white/80 text-[#3498db] font-bold placeholder-gray-400"
                  placeholder="Contoh: 198701012020021003"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2c3e50] mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#3498db]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-lg focus:ring-[#3498db] focus:border-[#3498db] p-2.5 bg-white/80 text-[#3498db] font-bold placeholder-gray-400"
                  placeholder="Masukkan Password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#3498db] hover:bg-[#2980b9] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {isSubmitting ? 'Memproses...' : (
                <>
                  <LogIn size={20} /> Masuk Aplikasi
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Pastikan NIP dan Password sudah benar
          </p>
        </div>
      </main>
      <footer className="mt-8 text-sm text-gray-500">© Tim IT SMPN 1 Pasuruan</footer>
    </div>
  );
};

export default Login;