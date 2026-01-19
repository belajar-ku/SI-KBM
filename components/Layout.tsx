import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, User, AlertTriangle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode; showNav?: boolean }> = ({ children, showNav = true }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State untuk mengontrol visibilitas Modal Logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => navigate('/profile')}
            >
               <div className="relative">
                 {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="h-10 w-10 rounded-full object-cover border border-gray-200 transition-transform group-hover:scale-110" 
                    />
                 ) : (
                    <img 
                      src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" 
                      alt="Logo" 
                      className="h-10 w-10 object-contain transition-transform group-hover:scale-110" 
                    />
                 )}
                 <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
               </div>
               <div className="leading-tight">
                 <h2 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">
                   UPT SMP NEGERI 1 PASURUAN
                 </h2>
                 <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                   {profile?.full_name || 'Guru'}
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
        <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around py-3 z-40 pb-safe">
            <button 
              onClick={() => navigate('/dashboard')}
              className={`flex flex-col items-center gap-1 ${location.pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <LayoutDashboard size={22} />
              <span className="text-[10px] font-medium">Beranda</span>
            </button>
            <button 
               onClick={() => navigate('/profile')}
               className={`flex flex-col items-center gap-1 ${location.pathname === '/profile' ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <User size={22} />
              <span className="text-[10px] font-medium">Profil</span>
            </button>
        </nav>
      )}
      
      <div className="h-16 md:h-0"></div> {/* Spacer for bottom nav */}

      {/* MODERN LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 border border-white/20">
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
                        className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={confirmLogout}
                        className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors"
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