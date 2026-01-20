
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileEdit, Printer, UserCheck, ShieldAlert, QrCode, CalendarDays, 
  Database, Users, CalendarPlus, GraduationCap, Settings
} from 'lucide-react';

const AppsMenu: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const MenuButton = ({ label, icon: Icon, path, bg, color = "text-white" }: any) => (
    <button
      onClick={() => navigate(path)}
      className="flex flex-col items-center gap-2 group active:scale-90 transition-all duration-300"
    >
      <div 
        className={`w-[4.5rem] h-[4.5rem] rounded-[1.4rem] flex items-center justify-center shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] border border-white/20 relative overflow-hidden ${bg}`}
      >
         {/* Glossy effect */}
         <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent"></div>
         
         <Icon size={32} strokeWidth={2} className={`${color} relative z-10 drop-shadow-md`} />
      </div>
      <span className="text-[11px] font-medium text-gray-600 text-center leading-tight tracking-tight max-w-[70px] group-hover:text-gray-900">
        {label}
      </span>
    </button>
  );

  return (
    <Layout>
        <div className="pb-20 pt-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-1 px-2">Menu Aplikasi</h2>
            <p className="text-gray-500 text-sm mb-8 px-2">Pilih menu untuk memulai.</p>

            <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-sm border border-white">
                <div className="grid grid-cols-4 gap-y-8 gap-x-2 place-items-center">
                    {isAdmin ? (
                    <>
                        <MenuButton label="Import" icon={Database} bg="bg-gradient-to-br from-red-400 to-red-600" path="/import-data" />
                        <MenuButton label="Jadwal" icon={CalendarPlus} bg="bg-gradient-to-br from-purple-400 to-purple-600" path="/input-jadwal" />
                        <MenuButton label="Users" icon={Users} bg="bg-gradient-to-br from-teal-400 to-teal-600" path="/users" />
                        <MenuButton label="Murid" icon={GraduationCap} bg="bg-gradient-to-br from-blue-400 to-blue-600" path="/students" />
                        <MenuButton label="Setting" icon={Settings} bg="bg-slate-700" path="/settings" />
                    </>
                    ) : (
                    <>
                        <MenuButton label="Jurnal" icon={FileEdit} bg="bg-gradient-to-br from-blue-400 to-blue-600" path="/jurnal" />
                        <MenuButton label="Jadwal" icon={CalendarDays} bg="bg-gradient-to-br from-purple-400 to-purple-600" path="/jadwal" />
                        <MenuButton label="Absensi" icon={UserCheck} bg="bg-gradient-to-br from-green-400 to-green-600" path="/rekap-absensi" />
                        <MenuButton label="Laporan" icon={Printer} bg="bg-gradient-to-br from-yellow-400 to-yellow-600" path="/laporan" />
                        <MenuButton label="Disiplin" icon={ShieldAlert} bg="bg-gradient-to-br from-orange-400 to-orange-600" path="/kedisiplinan" />
                        <MenuButton label="Scan QR" icon={QrCode} bg="bg-slate-700" path="/qr" />
                    </>
                    )}
                </div>
            </div>
        </div>
    </Layout>
  );
};

export default AppsMenu;
