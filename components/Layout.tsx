import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode; showNav?: boolean }> = ({ children, showNav = true }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if(window.confirm('Apakah Anda yakin ingin keluar?')) {
      await signOut();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-poppins">
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
                 <h2 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                   {profile?.full_name || 'Guru'}
                 </h2>
                 <p className="text-xs text-blue-500 font-medium">
                   {profile?.role === 'admin' ? 'Administrator' : `NIP. ${profile?.nip || '-'}`}
                 </p>
               </div>
            </div>
            
            <button 
              onClick={handleLogout}
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
    </div>
  );
};