
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext'; // Import Theme Context
import { supabase } from '../services/supabase';
import { LogOut, LayoutDashboard, Grid, User, ChevronRight, MonitorPlay, Moon, Sun, Siren, Activity, Sunset, ArrowUp, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// CHANGED: Default collapsed is now true for all pages
export const Layout: React.FC<{ children: React.ReactNode; showNav?: boolean; collapsed?: boolean }> = ({ children, showNav = true, collapsed = true }) => {
  const { signOut, profile, isOperator, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme(); // Use Theme
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [semester, setSemester] = useState('...');
  const [academicYear, setAcademicYear] = useState('...');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // NEW: State for Scroll-to-Top Button
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Logic to identify Headmaster
  const isHeadmaster = profile?.mengajar_mapel === 'Kepala Sekolah';
  // Logic to identify Dhuha Teacher
  const isDhuhaTeacher = profile?.mengajar_mapel?.toLowerCase().includes('dhuha');

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

  // NEW: Scroll Event Listener
  useEffect(() => {
    const handleScroll = () => {
        // Show button if scrolled down more than 300px
        if (window.scrollY > 300) {
            setShowScrollTop(true);
        } else {
            setShowScrollTop(false);
        }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // NEW: Scroll to Top Function
  const scrollToTop = () => {
      window.scrollTo({
          top: 0,
          behavior: 'smooth'
      });
  };

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
                : 'text-gray-600 hover:bg-slate-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`}
            title={label} 
          >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {!collapsed && <span className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>{label}</span>}
          </button>
      );
  };

  // --- NEW: ANIMATED BOTTOM NAV ITEM ---
  const BottomNavItem = ({ path, label, icon: Icon }: any) => {
      const isActive = location.pathname === path;
      return (
          <button 
            onClick={() => navigate(path)}
            className={`relative flex items-center justify-center h-12 rounded-full transition-all duration-500 ease-out overflow-hidden ${
                isActive 
                ? 'w-32 bg-slate-900 dark:bg-blue-600 text-white shadow-lg shadow-slate-200 dark:shadow-blue-900/50' 
                : 'w-12 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-500'
            }`}
          >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={`flex-shrink-0 transition-transform duration-300 ${isActive ? '-ml-2' : ''}`} />
              
              <span className={`ml-2 text-xs font-bold whitespace-nowrap transition-all duration-500 ${
                  isActive ? 'opacity-100 max-w-[100px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-4 absolute'
              }`}>
                  {label}
              </span>
          </button>
      );
  };

  const formattedDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(currentTime);
  const formattedTime = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(currentTime).replace(/\./g, ':');

  return (
    <div className="min-h-screen flex bg-[#F0F4F8] dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* --- DESKTOP SIDEBAR (Compact Mode Default) --- */}
      {showNav && (
        <aside className={`hidden md:flex flex-col h-screen sticky top-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-20 transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}>
            {/* Logo Area */}
            <div className={`p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 ${collapsed ? 'justify-center' : ''} h-20`}>
                 <img 
                    src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" 
                    alt="Logo" 
                    className="h-10 w-10 object-contain" 
                  />
                 {!collapsed && (
                     <div className="animate-fade-in">
                        <h2 className="text-sm font-extrabold text-slate-800 dark:text-white leading-none">UPT SMPN 1</h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">SI KBM Online</p>
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
                        {isHeadmaster && <NavItem path="/kinerja" label="Kinerja" icon={Activity} />}
                        {!isHeadmaster && <NavItem path="/apps" label="KBM" icon={Grid} />}
                        {isHeadmaster && <NavItem path="/kedisiplinan" label="Kedisiplinan" icon={Siren} />}
                        {isDhuhaTeacher && <NavItem path="/rekap-dhuha" label="Rekap Dhuha" icon={Sunset} />}
                        <NavItem path="/profile" label="Profil Saya" icon={User} />
                    </>
                )}
            </div>

            {/* Theme & Logout Area */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <div className={`flex flex-col gap-4 ${collapsed ? 'items-center' : ''}`}>
                    
                    {/* Theme Toggle */}
                    <button 
                        onClick={toggleTheme}
                        className={`flex items-center gap-3 p-2 rounded-xl transition-all ${collapsed ? 'justify-center' : ''} 
                        ${theme === 'dark' ? 'bg-slate-700 text-yellow-400' : 'bg-white text-slate-500 border border-gray-200'} hover:scale-105`}
                        title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        {!collapsed && <span className="text-xs font-bold">{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>}
                    </button>

                    {/* User Profile Mini */}
                    <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'justify-center' : 'justify-between'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-600 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-slate-600 shadow-sm cursor-pointer" title={profile?.full_name}>
                                {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover"/> : <User size={20} className="m-2.5 text-gray-400 dark:text-gray-300"/>}
                            </div>
                            {!collapsed && (
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[100px]">{profile?.full_name?.split(' ')[0]}</p>
                                    <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                                    </p>
                                </div>
                            )}
                        </div>
                        {!collapsed && (
                            <button 
                                onClick={handleLogoutClick}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Keluar"
                            >
                                <LogOut size={18} />
                            </button>
                        )}
                    </div>
                    {/* Collapsed Logout */}
                    {collapsed && (
                         <button 
                            onClick={handleLogoutClick}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Keluar"
                        >
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar relative bg-[#F0F4F8] dark:bg-slate-900 transition-colors duration-300">
          {/* Mobile Header */}
          <div className="md:hidden sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-30 shadow-sm pt-[calc(env(safe-area-inset-top)+1.5rem)]">
             <div className="px-4 py-3 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                     <img 
                       src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" 
                       className="h-10 w-auto object-contain" 
                       alt="Logo"
                     />
                     <div>
                         <h1 className="text-[10px] font-extrabold text-slate-900 dark:text-white leading-tight">SISTEM INFORMASI<br/>KEGIATAN BELAJAR MENGAJAR</h1>
                         <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-0.5 tracking-wide">
                            SEMESTER {semester} | T.A {academicYear}
                         </p>
                     </div>
                 </div>
                 <div className="flex items-center gap-2">
                     <button onClick={toggleTheme} className="w-9 h-9 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-500 dark:text-yellow-400 border border-slate-200 dark:border-slate-600">
                         {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                     </button>
                     <button onClick={handleLogoutClick} className="w-9 h-9 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-300 active:bg-gray-100 border border-slate-200 dark:border-slate-600 flex-shrink-0">
                         <LogOut size={18}/>
                     </button>
                 </div>
             </div>
             {/* Running Date & Time Bar */}
             <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-1.5 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                 <span>{formattedDate}</span>
                 <span className="font-mono text-blue-600 dark:text-blue-400">{formattedTime} WIB</span>
             </div>
          </div>

          {/* PAGE CONTENT */}
          <div className="p-4 md:p-8 max-w-[1920px] w-full mx-auto pb-28 md:pb-10 page-enter text-slate-800 dark:text-slate-100">
            {children}
          </div>

          {/* SCROLL TO TOP BUTTON (FLOATING) */}
          {showScrollTop && (
              <button 
                  onClick={scrollToTop}
                  className="fixed bottom-24 md:bottom-10 right-6 z-40 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all animate-fade-in hover:scale-110"
                  title="Kembali ke Atas"
              >
                  <ArrowUp size={24} />
              </button>
          )}
      </main>

      {/* --- MOBILE BOTTOM NAV (FLUTTER STYLE ANIMATED) --- */}
      {showNav && !isOperator && (
        <div className="md:hidden fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
            <nav className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center p-2 pointer-events-auto gap-2 max-w-[95vw]">
                <BottomNavItem path="/dashboard" label="Beranda" icon={LayoutDashboard} />

                {!isHeadmaster && (
                    <BottomNavItem path="/apps" label="KBM" icon={Grid} />
                )}

                {isHeadmaster && (
                    <BottomNavItem path="/kinerja" label="Kinerja" icon={Activity} />
                )}

                <BottomNavItem path="/profile" label="Profil" icon={User} />
            </nav>
        </div>
      )}

      {/* Mobile Nav for Operator */}
      {showNav && isOperator && (
           <div className="md:hidden fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
                <nav className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center p-2 pointer-events-auto gap-2">
                    <BottomNavItem path="/operator-dashboard" label="Monitor" icon={MonitorPlay} />
                    <BottomNavItem path="/profile" label="Profil" icon={User} />
                </nav>
           </div>
      )}

      {/* LOGOUT MODAL - TOP POSITIONED (MODERN) */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-start pt-16 md:pt-10 p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in w-screen h-[100dvh]" onClick={() => setShowLogoutModal(false)}>
           <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-5 transform scale-100 transition-all border border-slate-100 dark:border-slate-600 relative overflow-hidden group" onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
              
              <div className="flex gap-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <LogOut size={24} className="translate-x-0.5"/>
                  </div>
                  <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Konfirmasi Keluar</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Yakin ingin mengakhiri sesi ini?</p>
                  </div>
              </div>

              <div className="flex gap-3 mt-6 pl-16">
                  <button 
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 py-2 rounded-lg font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={confirmLogout}
                    className="flex-1 py-2 rounded-lg font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-colors"
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
