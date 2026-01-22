
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <main className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-white p-8 text-center border-b border-gray-100">
            <div className="mx-auto w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">SI KBM Online</h1>
            <p className="text-gray-500 text-xs font-bold mt-1 uppercase tracking-wide">UPT SMPN 1 Pasuruan</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">NIP Guru</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="pl-12 block w-full bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white p-3.5 text-slate-800 text-sm font-bold transition-all"
                  placeholder="Masukkan NIP"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 block w-full bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white p-3.5 text-slate-800 text-sm font-bold transition-all"
                  placeholder="••••••••"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-200 mt-2 active:translate-y-0.5"
            >
              {isSubmitting ? 'Memproses...' : (
                <>
                  Masuk Aplikasi <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Versi 1.0 &copy; 2025</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
