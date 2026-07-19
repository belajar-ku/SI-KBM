
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpenText, TrendingUp, UserCheck, ShieldAlert, ScanLine, Compass, Database, UserCog, CalendarRange, GraduationCap, Settings, UserMinus, Keyboard, Sun
} from 'lucide-react';

const AppsMenu: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, profile, academicYear, semester } = useAuth();

  // Logic to identify Dhuha Teacher
  const isDhuhaTeacher = profile?.mengajar_mapel?.toLowerCase().includes('dhuha');

  const AppCard = ({ label, subLabel, icon: Icon, path, gradientClass }: any) => (
    <button
      onClick={() => navigate(path)}
      className="bg-white dark:bg-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-slate-600 hover:-translate-y-1 transition-all duration-300 w-full h-52 group relative overflow-hidden"
    >
      {/* 3D ICON CONTAINER */}
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-${gradientClass.split('-')[gradientClass.split('-').length-1]}/30 border-t border-white/40 relative z-10 transform transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 ${gradientClass}`}>
         <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/20 to-transparent opacity-50 pointer-events-none"></div>
         <Icon size={36} strokeWidth={1.8} className="drop-shadow-md" />
      </div>
      
      <div className="text-center relative z-10">
          <h3 className="text-lg font-extrabold text-slate-700 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight leading-tight">{label}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1.5 uppercase tracking-wide group-hover:text-slate-500 dark:group-hover:text-slate-400">{subLabel}</p>
      </div>
      
      {/* Background Decor */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-white/5 dark:to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    </button>
  );

  return (
    <Layout>
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
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
                        label="Isi Jurnal" 
                        subLabel="Input KBM Harian"
                        icon={BookOpenText} 
                        path="/jurnal" 
                        gradientClass="bg-gradient-to-br from-blue-500 to-blue-700" 
                    />
                    <AppCard 
                        label="Jadwalku" 
                        subLabel="Jadwal Mengajar"
                        icon={Compass} 
                        path="/jadwal" 
                        gradientClass="bg-gradient-to-br from-indigo-400 to-indigo-600" 
                    />
                    {isDhuhaTeacher && (
                      <AppCard 
                          label="Presensi Dhuha" 
                          subLabel="Rekap Kehadiran"
                          icon={Sun} 
                          path="/rekap-dhuha" 
                          gradientClass="bg-gradient-to-br from-purple-500 to-purple-700" 
                      />
                    )}
                    <AppCard 
                        label="Kehadiran" 
                        subLabel="Rekap Absensi Mapel"
                        icon={UserCheck} 
                        path="/rekap-absensi" 
                        gradientClass="bg-gradient-to-br from-emerald-400 to-green-600" 
                    />
                     <AppCard 
                        label="Ketidakhadiran" 
                        subLabel="Untuk Rapor"
                        icon={UserMinus} 
                        path="/absensi-rapor" 
                        gradientClass="bg-gradient-to-br from-red-400 to-rose-600" 
                    />
                    <AppCard 
                        label="Laporan" 
                        subLabel="Cetak Jurnal"
                        icon={TrendingUp} 
                        path="/laporan" 
                        gradientClass="bg-gradient-to-br from-amber-400 to-orange-500" 
                    />
                    <AppCard 
                        label="Pelanggaran" 
                        subLabel="Temuan di Luar KBM"
                        icon={ShieldAlert} 
                        path="/kedisiplinan" 
                        gradientClass="bg-gradient-to-br from-orange-500 to-red-600" 
                    />
                    <AppCard 
                        label="Presensi QR" 
                        subLabel="Scan Kartu"
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
