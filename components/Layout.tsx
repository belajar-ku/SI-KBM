
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { LogOut, LayoutDashboard, User, Grid } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode; showNav?: boolean }> = ({ children, showNav = true }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State untuk mengontrol visibilitas Modal Logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [semester, setSemester] = useState('...');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('app_settings').select('value').eq('key', 'semester').single();
        if (data) setSemester(data.value);
      } catch (e) {
        console.error("Failed to load semester", e);
      }
    };
    fetchSettings();
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await signOut();
    setShowLogoutModal(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-poppins relative">
      {showNav && (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="relative">
                    <img 
                      src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" 
                      alt="Logo Sekolah" 
                      className="h-10 w-10 object-contain" 
                    />
               </div>
               <div className="leading-tight">
                 <h2 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">
                   UPT SMP NEGERI 1 PASURUAN
                 </h2>
                 <p className="text-sm font-bold text-gray-800">
                   SI KBM | Semester {semester}
                 </p>
               </div>
            </div>
            
            <button 
              onClick={handleLogoutClick}
              className="p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>
      )}
      
      <main className="flex-grow p-4 md:p-6 animate-fade-in">
        <div className="max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      {showNav && (
        <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200 flex justify-between items-end px-10 py-2 z-50 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] h-20">
            {/* Tab 1: Beranda */}
            <button 
              onClick={() => navigate('/dashboard')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 pb-2 ${location.pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutDashboard size={26} strokeWidth={location.pathname === '/dashboard' ? 2.5 : 2} />
              <span className="text-[10px] font-bold">Beranda</span>
            </button>

            {/* Tab 2: Menu (Tengah - Floating Style) */}
            <button 
               onClick={() => navigate('/apps')}
               className="group relative -top-6"
            >
               <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${location.pathname === '/apps' ? 'bg-blue-600 text-white scale-110 shadow-blue-500/40' : 'bg-white text-blue-600 border border-blue-50'}`}>
                 <Grid size={26} strokeWidth={2.5} />
               </div>
               <span className={`absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] font-bold transition-colors ${location.pathname === '/apps' ? 'text-blue-600' : 'text-gray-400'}`}>
                   Menu
               </span>
            </button>

            {/* Tab 3: Profil */}
            <button 
               onClick={() => navigate('/profile')}
               className={`flex flex-col items-center gap-1.5 transition-all duration-300 pb-2 ${location.pathname === '/profile' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <User size={26} strokeWidth={location.pathname === '/profile' ? 2.5 : 2} />
              <span className="text-[10px] font-bold">Profil</span>
            </button>
        </nav>
      )}
      
      <div className="h-24 md:h-0"></div> {/* Spacer for bottom nav */}

      {/* MODERN LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 border border-white/20">
              <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 shadow-sm">
                      <LogOut size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Konfirmasi Keluar</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Apakah Anda yakin keluar dari Aplikasi ini?
                  </p>
                  
                  <div className="flex w-full gap-3">
                      <button 
                        onClick={() => setShowLogoutModal(false)}
                        className="flex-1 py-3.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={confirmLogout}
                        className="flex-1 py-3.5 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors"
                      >
                        Ya, Keluar
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
