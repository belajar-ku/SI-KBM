import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { FileEdit, Printer, UserCheck, ShieldAlert, QrCode, CalendarDays, Database, Users, CalendarPlus, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, profile } = useAuth();
  
  // State untuk jam digital
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const MenuButton = ({ label, icon: Icon, color, path, desc }: any) => (
    <button
      onClick={() => navigate(path)}
      className="group relative bg-white p-5 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 border border-gray-100 hover:border-blue-100 hover:-translate-y-1 active:scale-95"
    >
      <div 
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110 group-hover:rotate-3"
        style={{ backgroundColor: color }}
      >
        <Icon size={28} strokeWidth={2} />
      </div>
      <div className="text-center">
        <span className="block font-bold text-gray-700 text-sm md:text-base group-hover:text-blue-600 transition-colors">{label}</span>
        {desc && <span className="text-[10px] text-gray-400 hidden md:block mt-1">{desc}</span>}
      </div>
    </button>
  );

  return (
    <Layout>
      <div className="bg-gradient-to-r from-[#3498db] to-[#2980b9] rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
            <FileEdit size={150} />
        </div>
        
        {/* Menggunakan Flexbox untuk memisahkan Sapaan (Kiri) dan Waktu (Kanan) */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Sapaan (Kiri) */}
            <div>
                <h1 className="text-2xl font-bold mb-1">
                  {isAdmin ? 'Halo, Admin! 👋' : `Halo, ${profile?.full_name?.split(' ')[0]}! 👋`}
                </h1>
                <p className="text-blue-100 text-sm opacity-90">
                  {isAdmin ? 'Kelola data sekolah dengan mudah dan aman.' : 'Selamat beraktivitas, pantau KBM hari ini dengan mudah.'}
                </p>
            </div>

            {/* Real-time Date & Clock (Kanan) */}
            <div className="flex flex-col items-end text-right">
                <div className="flex items-center gap-2 text-blue-100 text-xs font-medium bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-sm">
                   <Clock size={16} />
                   <div className="flex flex-col items-end">
                       <span className="leading-none mb-1">
                          {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                       </span>
                       <span className="font-mono font-bold text-sm text-white leading-none tracking-wider">
                          {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')}
                       </span>
                   </div>
                </div>
            </div>

        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
         <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
         <h3 className="font-bold text-gray-700 text-lg">Menu Aplikasi</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        
        {/* LOGIC STRICT: Jika Admin, Tampilkan Menu Admin SAJA. Jika User, Tampilkan Menu User SAJA. */}
        
        {isAdmin ? (
           <>
             {/* Menu Khusus Admin */}
             <MenuButton label="Import Data" icon={Database} color="#e74c3c" path="/import-data" desc="Upload CSV (Massal)" />
             <MenuButton label="Input Jadwal" icon={CalendarPlus} color="#8e44ad" path="/input-jadwal" desc="Input Manual" />
             <MenuButton label="Data User" icon={Users} color="#16a085" path="/users" desc="Kelola Akun Pengguna" />
           </>
        ) : (
           <>
             {/* Menu User / Guru */}
             <MenuButton label="Isi Jurnal" icon={FileEdit} color="#3498db" path="/jurnal" desc="Input KBM Harian" />
             <MenuButton label="Jadwalku" icon={CalendarDays} color="#9b59b6" path="/jadwal" desc="Lihat Jadwal Mengajar" />
             <MenuButton label="Kehadiran" icon={UserCheck} color="#2ecc71" path="/rekap-absensi" desc="Rekap Absensi Siswa" />
             <MenuButton label="Laporan" icon={Printer} color="#f1c40f" path="/laporan" desc="Cetak Jurnal & Laporan" />
             <MenuButton label="Kedisiplinan" icon={ShieldAlert} color="#e67e22" path="/kedisiplinan" desc="Poin Pelanggaran" />
             <MenuButton label="Presensi QR" icon={QrCode} color="#34495e" path="/qr" desc="Scan Kartu Siswa" />
           </>
        )}

      </div>
    </Layout>
  );
};

export default Dashboard;