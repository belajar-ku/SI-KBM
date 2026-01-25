
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { 
  NotebookPen, FileText, ClipboardList, Siren, QrCode, CalendarClock, 
  Database, UserCog, CalendarRange, GraduationCap, Settings, BookX,
  Keyboard
} from 'lucide-react';

const AppsMenu: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const AppCard = ({ label, subLabel, icon: Icon, path, colorClass, iconColor }: any) => (
    <button
      onClick={() => navigate(path)}
      className="bg-white rounded-3xl p-6 flex flex-col items-center justify-center gap-4 shadow-sm border border-slate-100 hover:shadow-lg hover:shadow-blue-100/50 hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 w-full h-48 group"
    >
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110 ${colorClass}`}>
         <Icon size={32} strokeWidth={1.5} />
      </div>
      <div className="text-center">
          <h3 className="text-base font-extrabold text-slate-700 group-hover:text-blue-600 transition-colors">{label}</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">{subLabel}</p>
      </div>
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
                        colorClass="bg-rose-500" 
                    />
                    <AppCard 
                        label="Input Manual" 
                        subLabel="Input Massal CSV"
                        icon={Keyboard} 
                        path="/input-manual" 
                        colorClass="bg-indigo-600" 
                    />
                    <AppCard 
                        label="Jadwal Pelajaran" 
                        subLabel="Setup Jadwal"
                        icon={CalendarRange} 
                        path="/input-jadwal" 
                        colorClass="bg-purple-500" 
                    />
                    <AppCard 
                        label="Manajemen User" 
                        subLabel="Akun Guru"
                        icon={UserCog} 
                        path="/users" 
                        colorClass="bg-teal-500" 
                    />
                    <AppCard 
                        label="Data Murid" 
                        subLabel="Siswa & Mutasi"
                        icon={GraduationCap} 
                        path="/students" 
                        colorClass="bg-blue-500" 
                    />
                    <AppCard 
                        label="Pengaturan" 
                        subLabel="Konfigurasi Umum"
                        icon={Settings} 
                        path="/settings" 
                        colorClass="bg-slate-700" 
                    />
                </>
                ) : (
                <>
                    <AppCard 
                        label="Isi Jurnal" 
                        subLabel="Input KBM Harian"
                        icon={NotebookPen} 
                        path="/jurnal" 
                        colorClass="bg-blue-600" 
                    />
                    <AppCard 
                        label="Jadwalku" 
                        subLabel="Jadwal Mengajar"
                        icon={CalendarClock} 
                        path="/jadwal" 
                        colorClass="bg-indigo-500" 
                    />
                    <AppCard 
                        label="Kehadiran" 
                        subLabel="Rekap Absensi Mapel"
                        icon={ClipboardList} 
                        path="/rekap-absensi" 
                        colorClass="bg-emerald-500" 
                    />
                     <AppCard 
                        label="Ketidakhadiran" 
                        subLabel="Untuk Rapor"
                        icon={BookX} 
                        path="/absensi-rapor" 
                        colorClass="bg-red-500" 
                    />
                    <AppCard 
                        label="Laporan" 
                        subLabel="Cetak Jurnal"
                        icon={FileText} 
                        path="/laporan" 
                        colorClass="bg-amber-500" 
                    />
                    <AppCard 
                        label="Pelanggaran" 
                        subLabel="Temuan di Luar KBM"
                        icon={Siren} 
                        path="/kedisiplinan" 
                        colorClass="bg-orange-600" 
                    />
                    <AppCard 
                        label="Presensi QR" 
                        subLabel="Scan Kartu"
                        icon={QrCode} 
                        path="/qr" 
                        colorClass="bg-slate-700" 
                    />
                </>
                )}
            </div>
        </div>
    </Layout>
  );
};

export default AppsMenu;
