
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { LogOut, LayoutDashboard, Grid, User, ChevronRight, MonitorPlay } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// CHANGED: Default collapsed is now true for all pages
export const Layout: React.FC<{ children: React.ReactNode; showNav?: boolean; collapsed?: boolean }> = ({ children, showNav = true, collapsed = true }) => {
  const { signOut, profile, isOperator, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [semester, setSemester] = useState('...');
  const [academicYear, setAcademicYear] = useState('...');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('app_settings').select('*').in('key', ['semester', 'academic_year']);
        if (data) {
            const sem = data.find(item => item.key === 'semester')?.value;
            const year = data.find(item => item.key === 'academic_year')?.value;
            if (sem) setSemester(sem);
            if (year) setAcademicYear(year);
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    fetchSettings();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await signOut();
    setShowLogoutModal(false);
    navigate('/');
  };

  const NavItem = ({ path, label, icon: Icon }: any) => {
      const isActive = location.pathname === path;
      return (
          <button 
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
            } ${collapsed ? 'justify-center' : ''}`}
            title={label} 
          >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {!collapsed && <span className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-700'}`}>{label}</span>}
          </button>
      );
  };

  const formattedDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(currentTime);
  const formattedTime = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(currentTime).replace(/\./g, ':');

  return (
    <div className="min-h-screen flex bg-[#F0F4F8] font-sans text-slate-800">
      
      {/* --- DESKTOP SIDEBAR (Compact Mode Default) --- */}
      {showNav && (
        <aside className={`hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-gray-200 z-20 transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}>
            {/* Logo Area */}
            <div className={`p-4 flex items-center gap-3 border-b border-gray-100 ${collapsed ? 'justify-center' : ''} h-20`}>
                 <img 
                    src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" 
                    alt="Logo" 
                    className="h-10 w-10 object-contain" 
                  />
                 {!collapsed && (
                     <div className="animate-fade-in">
                        <h2 className="text-sm font-extrabold text-slate-800 leading-none">UPT SMPN 1</h2>
                        <p className="text-xs text-gray-500 mt-1 font-medium">SI KBM Online</p>
                     </div>
                 )}
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 space-y-1 p-3 overflow-y-auto">
                {!collapsed && <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Menu Utama</div>}
                
                {isOperator ? (
                    <>
                        <NavItem path="/operator-dashboard" label="Dashboard KBM" icon={MonitorPlay} />
                        <NavItem path="/profile" label="Profil Saya" icon={User} />
                    </>
                ) : (
                    <>
                        <NavItem path="/dashboard" label="Beranda" icon={LayoutDashboard} />
                        <NavItem path="/apps" label="KBM" icon={Grid} />
                        <NavItem path="/profile" label="Profil Saya" icon={User} />
                    </>
                )}
            </div>

            {/* User Profile Mini */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className={`flex items-center ${collapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
                    <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'justify-center' : ''}`}>
                        <div className="w-10 h-10 rounded-full bg-white flex-shrink-0 overflow-hidden border border-gray-200 shadow-sm cursor-pointer" title={profile?.full_name}>
                            {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover"/> : <User size={20} className="m-2.5 text-gray-400"/>}
                        </div>
                        {!collapsed && (
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate max-w-[120px]">{profile?.full_name?.split(' ')[0]}</p>
                                <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                                </p>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={handleLogoutClick}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Keluar"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar relative">
          {/* Mobile Header (Updated for Safe Area & Logo Aspect Ratio - Increased Padding) */}
          <div className="md:hidden sticky top-0 bg-white border-b border-gray-200 z-30 shadow-sm pt-[calc(env(safe-area-inset-top)+1.5rem)]">
             <div className="px-4 py-3 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                     <img 
                       src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" 
                       className="h-10 w-auto object-contain" 
                       alt="Logo"
                     />
                     <div>
                         <h1 className="text-[10px] font-extrabold text-slate-900 leading-tight">SISTEM INFORMASI<br/>KEGIATAN BELAJAR MENGAJAR</h1>
                         <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 tracking-wide">
                            SEMESTER {semester} | T.A {academicYear}
                         </p>
                     </div>
                 </div>
                 <button onClick={handleLogoutClick} className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 active:bg-gray-100 border border-gray-200 flex-shrink-0">
                     <LogOut size={18}/>
                 </button>
             </div>
             {/* Running Date & Time Bar */}
             <div className="bg-slate-50 px-4 py-1.5 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-slate-600">
                 <span>{formattedDate}</span>
                 <span className="font-mono text-blue-600">{formattedTime} WIB</span>
             </div>
          </div>

          <div className="p-4 md:p-8 max-w-[1920px] w-full mx-auto pb-28 md:pb-10">
            {children}
          </div>
      </main>

      {/* --- MOBILE BOTTOM NAV (Floating Figma Style) --- */}
      {showNav && !isOperator && (
        <div className="md:hidden fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
            <nav className="bg-white/90 backdrop-blur-md border border-white/50 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center p-1.5 pointer-events-auto gap-1">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 ${
                      location.pathname === '/dashboard' 
                      ? 'bg-slate-800 text-white shadow-md' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard size={20} strokeWidth={2.5} />
                  {location.pathname === '/dashboard' && <span className="text-xs font-bold animate-fade-in">Beranda</span>}
                </button>

                <button 
                   onClick={() => navigate('/apps')}
                   className={`flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 ${
                       location.pathname === '/apps' 
                       ? 'bg-slate-800 text-white shadow-md' 
                       : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                   }`}
                >
                   <Grid size={20} strokeWidth={2.5} />
                   {location.pathname === '/apps' && <span className="text-xs font-bold animate-fade-in">KBM</span>}
                </button>

                <button 
                   onClick={() => navigate('/profile')}
                   className={`flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 ${
                       location.pathname === '/profile' 
                       ? 'bg-slate-800 text-white shadow-md' 
                       : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                   }`}
                >
                  <User size={20} strokeWidth={2.5} />
                  {location.pathname === '/profile' && <span className="text-xs font-bold animate-fade-in">Profil</span>}
                </button>
            </nav>
        </div>
      )}

      {/* Mobile Nav for Operator */}
      {showNav && isOperator && (
           <div className="md:hidden fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
                <nav className="bg-white/90 backdrop-blur-md border border-white/50 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center p-1.5 pointer-events-auto gap-1">
                    <button 
                    onClick={() => navigate('/operator-dashboard')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 ${
                        location.pathname === '/operator-dashboard' 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                    >
                    <MonitorPlay size={20} strokeWidth={2.5} />
                    {location.pathname === '/operator-dashboard' && <span className="text-xs font-bold animate-fade-in">Monitor</span>}
                    </button>

                    <button 
                    onClick={() => navigate('/profile')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 ${
                        location.pathname === '/profile' 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                    >
                    <User size={20} strokeWidth={2.5} />
                    {location.pathname === '/profile' && <span className="text-xs font-bold animate-fade-in">Profil</span>}
                    </button>
                </nav>
           </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fade-in">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 transform scale-100 transition-all">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Konfirmasi Keluar</h3>
              <p className="text-gray-600 text-sm mb-6">
                Apakah Anda yakin ingin mengakhiri sesi ini?
              </p>
              
              <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowLogoutModal(false)}
                    className="px-4 py-2 rounded-lg text-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={confirmLogout}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold text-sm shadow-sm hover:bg-red-700 transition-colors"
                  >
                    Ya, Keluar
                  </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
