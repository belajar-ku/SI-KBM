
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { 
  ChevronRight, BookOpenText, TrendingUp, UserCheck, ShieldAlert, ScanLine, Compass, Database, UserCog, CalendarRange, GraduationCap, Settings, UserMinus, Keyboard, Sun
} from 'lucide-react';

const AppsMenu: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, profile, academicYear, semester } = useAuth();

  // Logic to identify Dhuha Teacher
  const isDhuhaTeacher = profile?.mengajar_mapel?.toLowerCase().includes('dhuha');

  const AppCard = ({ label, subLabel, icon: Icon, path, gradientClass, shadowColor = '' }: any) => {
    
    const colorMap: Record<string, string> = {
        'from-rose-400': 'text-rose-500',
        'from-indigo-400': 'text-indigo-500',
        'from-purple-400': 'text-purple-500',
        'from-teal-400': 'text-teal-500',
        'from-blue-400': 'text-blue-500',
        'from-slate-500': 'text-slate-500',
        'from-blue-500': 'text-blue-500',
        'from-purple-500': 'text-purple-500',
        'from-emerald-400': 'text-emerald-500',
        'from-red-400': 'text-red-500',
        'from-amber-400': 'text-amber-500',
        'from-orange-500': 'text-orange-500',
        'from-slate-600': 'text-slate-600',
    };
    const fromClass = gradientClass ? (gradientClass.match(/from-([a-z]+-[0-9]+)/)?.[0] || '') : '';
    const textColorClass = colorMap[fromClass] || 'text-slate-700';

    return (
    <button
      onClick={() => navigate(path)}
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl md:rounded-[1.75rem] p-3 md:p-5 flex items-center gap-2.5 md:gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full relative overflow-hidden group text-left min-h-[90px] md:min-h-[120px]"
    >
        {/* Background Decor (Leaves pattern simulation) */}
        <div className="absolute -right-2 -top-2 md:-right-4 md:-top-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transition-transform duration-500 group-hover:scale-110 text-slate-900 dark:text-white">
             <svg className="w-20 h-20 md:w-[120px] md:h-[120px]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22c0-4.5 3.5-8 8-8-4.5 0-8-3.5-8-8 0 4.5-3.5 8-8 8 4.5 0 8 3.5 8 8z"/>
                <path d="M12 22c0-3 2.5-6 6-6-3.5 0-6-2.5-6-6 0 3-2.5 6-6 6 3.5 0 6 2.5 6 6z"/>
             </svg>
        </div>
        
        

      {/* OUTLINE ICON CONTAINER */}
      <div className="w-[42px] h-[42px] md:w-[56px] md:h-[56px] shrink-0 flex items-center justify-center relative z-10 transition-transform duration-500 group-hover:scale-110">
         <Icon className={`w-8 h-8 md:w-10 md:h-10 transition-colors ${textColorClass}`} strokeWidth={1.5} />
      </div>
      
      <div className="relative z-10 flex-1 py-0.5 pr-5 md:pr-6">
          <h3 className="text-[12px] md:text-[17px] font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-1 md:mb-1.5 line-clamp-1">{label}</h3>
          <p className="text-[7px] md:text-[9px] text-slate-500 font-extrabold uppercase tracking-widest leading-[1.3]">{subLabel?.split('\n').map((line:any, i:any) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}</p>
      </div>

      <div className="absolute bottom-2.5 right-2.5 md:bottom-4 md:right-4 w-6 h-6 md:w-8 md:h-8 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors z-10">
          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={3} />
      </div>
    </button>
  );
  };

  return (
    <Layout>
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
                {isAdmin ? (
                <>
                    <AppCard 
                        label="Import Master" 
                        subLabel="Database CSV"
                        icon={Database} 
                        path="/import-data" 
                        gradientClass="bg-gradient-to-br from-rose-400 to-red-600" 
                    />
                    <AppCard 
                        label="Input Manual" 
                        subLabel="Input Massal CSV"
                        icon={Keyboard} 
                        path="/input-manual" 
                        gradientClass="bg-gradient-to-br from-indigo-400 to-violet-600" 
                    />
                    <AppCard 
                        label="Jadwal Pelajaran" 
                        subLabel="Setup Jadwal"
                        icon={CalendarRange} 
                        path="/input-jadwal" 
                        gradientClass="bg-gradient-to-br from-purple-400 to-fuchsia-600" 
                    />
                    <AppCard 
                        label="Manajemen User" 
                        subLabel="Akun Guru"
                        icon={UserCog} 
                        path="/users" 
                        gradientClass="bg-gradient-to-br from-teal-400 to-emerald-600" 
                    />
                    <AppCard 
                        label="Data Murid" 
                        subLabel="Siswa & Mutasi"
                        icon={GraduationCap} 
                        path="/students" 
                        gradientClass="bg-gradient-to-br from-blue-400 to-cyan-600" 
                    />
                    <AppCard 
                        label="Pengaturan" 
                        subLabel="Konfigurasi Umum"
                        icon={Settings} 
                        path="/settings" 
                        gradientClass="bg-gradient-to-br from-slate-500 to-slate-700" 
                    />
                </>
                ) : (
                <>
                    <AppCard 
                        label="Isi Jurnal" subLabel="INPUT KBM\nHARIAN" shadowColor="shadow-[0_8px_16px_rgba(59,130,246,0.3)]"
                        icon={BookOpenText} 
                        path="/jurnal" 
                        gradientClass="bg-gradient-to-br from-blue-500 to-blue-700" 
                    />
                    <AppCard 
                        label="Jadwalku" subLabel="JADWAL\nMENGAJAR" shadowColor="shadow-[0_8px_16px_rgba(99,102,241,0.3)]"
                        icon={Compass} 
                        path="/jadwal" 
                        gradientClass="bg-gradient-to-br from-indigo-400 to-indigo-600" 
                    />
                    {isDhuhaTeacher && (
                      <AppCard 
                          label="Presensi Dhuha" subLabel="REKAP\nKEHADIRAN" shadowColor="shadow-[0_8px_16px_rgba(168,85,247,0.3)]"
                          icon={Sun} 
                          path="/rekap-dhuha" 
                          gradientClass="bg-gradient-to-br from-purple-500 to-purple-700" 
                      />
                    )}
                    <AppCard 
                        label="Kehadiran" subLabel="REKAP ABSENSI\nMAPEL" shadowColor="shadow-[0_8px_16px_rgba(16,185,129,0.3)]"
                        icon={UserCheck} 
                        path="/rekap-absensi" 
                        gradientClass="bg-gradient-to-br from-emerald-400 to-green-600" 
                    />
                     <AppCard 
                        label="Ketidakhadiran" subLabel="UNTUK\nRAPOR" shadowColor="shadow-[0_8px_16px_rgba(244,63,94,0.3)]"
                        icon={UserMinus} 
                        path="/absensi-rapor" 
                        gradientClass="bg-gradient-to-br from-red-400 to-rose-600" 
                    />
                    <AppCard 
                        label="Laporan" subLabel="CETAK\nJURNAL" shadowColor="shadow-[0_8px_16px_rgba(245,158,11,0.3)]"
                        icon={TrendingUp} 
                        path="/laporan" 
                        gradientClass="bg-gradient-to-br from-amber-400 to-orange-500" 
                    />
                    <AppCard 
                        label="Pelanggaran" subLabel="TEMUAN DI\nLUAR KBM" shadowColor="shadow-[0_8px_16px_rgba(239,68,68,0.3)]"
                        icon={ShieldAlert} 
                        path="/kedisiplinan" 
                        gradientClass="bg-gradient-to-br from-orange-500 to-red-600" 
                    />
                    <AppCard 
                        label="Presensi QR" subLabel="SCAN\nKARTU" shadowColor="shadow-[0_8px_16px_rgba(71,85,105,0.3)]"
                        icon={ScanLine} 
                        path="/qr" 
                        gradientClass="bg-gradient-to-br from-slate-600 to-slate-800" 
                    />
                </>
                )}
            </div>
        </div>
    </Layout>
  );
};

export default AppsMenu;
