import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { PublicStats } from '../types';
import { LogIn, Loader2, Award, BookOpen, School } from 'lucide-react';

const PublicDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    fetchData();
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // 0. Cek Konfigurasi Supabase
    if (!isSupabaseConfigured) {
      console.warn("Supabase belum dikonfigurasi (.env kosong). Menggunakan Data Mock.");
      useMockData();
      setLoading(false);
      return;
    }

    try {
      // 1. Try fetching via RPC (Database Function) first for performance
      const { data, error } = await supabase.rpc('get_public_dashboard_stats');
      
      if (error) {
        // Log detailed error
        console.warn('RPC get_public_dashboard_stats failed, switching to client-side fallback.', error.message);
        throw error; // Trigger catch block for fallback
      }
      
      if (data) setStats(data);

    } catch (err) {
      // 2. Fallback: Fetch data manually via standard queries
      // This handles cases where the SQL function isn't created or permissions are missing
      try {
        await fetchStatsClientSide();
      } catch (fallbackErr: any) {
        // Log error stringified to avoid [object Object]
        console.error('Error fetching public stats (Fallback):', fallbackErr.message || JSON.stringify(fallbackErr));
        
        // 3. Last Resort: Use Mock Data if connection is totally dead (Failed to fetch)
        useMockData();
      }
    } finally {
      setLoading(false);
    }
  };

  const useMockData = () => {
      setStats({
          count7: 324, 
          count8: 310, 
          count9: 298,
          totalJpRequired: 240, 
          completedJp: 156,
          cleanestClass: '9A', 
          unfilledKbm: []
      });
  };

  const fetchStatsClientSide = async () => {
    // Parallel requests
    const [students7, students8, students9, journals] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).like('kelas', '7%'),
        supabase.from('students').select('*', { count: 'exact', head: true }).like('kelas', '8%'),
        supabase.from('students').select('*', { count: 'exact', head: true }).like('kelas', '9%'),
        supabase.from('journals').select('hours').gte('created_at', new Date().toISOString().split('T')[0])
    ]);

    // If request failed (e.g. invalid URL), these will have errors
    if (students7.error) throw students7.error;
    if (students8.error) throw students8.error;
    if (students9.error) throw students9.error;
    if (journals.error) throw journals.error;

    let completedJp = 0;
    if (journals.data) {
        journals.data.forEach((j: any) => {
            if (typeof j.hours === 'string') {
                // Assuming hours format "1, 2, 3"
                const parts = j.hours.split(',').filter((h: string) => h.trim().length > 0);
                completedJp += parts.length;
            }
        });
    }

    setStats({
        count7: students7.count || 0,
        count8: students8.count || 0,
        count9: students9.count || 0,
        totalJpRequired: 240, // Estimasi total jam per hari
        completedJp: completedJp,
        cleanestClass: '-', 
        unfilledKbm: []
    });
  };

  const StatCard = ({ title, value, colorClass, icon: Icon }: any) => (
    <div className={`glassmorphism rounded-2xl p-4 text-center transform hover:-translate-y-1 transition duration-300 ${colorClass}`}>
      <div className="flex justify-center mb-2 opacity-80">
        <Icon size={24} />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <h3 className="font-semibold text-gray-500 text-sm mt-1">{title}</h3>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-12">
      <main className="w-full max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="glassmorphism rounded-2xl p-4 flex justify-between items-center">
          <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="h-16 w-auto" />
          <div className="text-right">
            <h1 className="text-xl font-bold text-[#2c3e50]">SI KBM</h1>
            <p className="text-sm text-gray-600">
              {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm font-ramping text-[#3498db] font-semibold">
              {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <StatCard title="Kelas 7" value={stats.count7} colorClass="text-[#2980b9]" icon={School} />
              <StatCard title="Kelas 8" value={stats.count8} colorClass="text-[#27ae60]" icon={School} />
              <StatCard title="Kelas 9" value={stats.count9} colorClass="text-[#c0392b]" icon={School} />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="glassmorphism rounded-2xl p-4 text-center flex flex-col justify-center">
                  <BookOpen className="mx-auto text-[#8e44ad] mb-2" size={28} />
                  <p className="text-4xl font-bold text-[#8e44ad] mt-2 leading-none">
                    {stats.completedJp} <span className="text-2xl font-semibold text-gray-400">/ {stats.totalJpRequired} JP</span>
                  </p>
                  <h3 className="font-semibold text-gray-500 text-sm mt-1">KBM Hari Ini</h3>
               </div>
               <div className="glassmorphism rounded-2xl p-4 text-center flex flex-col justify-center">
                  <Award className="mx-auto text-green-600 mb-2" size={28} />
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.cleanestClass || 'Belum Ada'}</p>
                  <h3 className="font-semibold text-gray-500 text-sm mt-1">Kelas Terbersih</h3>
               </div>
            </div>

            {/* Progress Bar */}
            <div className="glassmorphism rounded-2xl p-4">
                <h3 className="font-semibold text-gray-500 text-sm text-center mb-2">Keterlaksanaan KBM</h3>
                <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                    <div 
                      className="bg-green-400 h-4 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min((stats.completedJp / stats.totalJpRequired) * 100, 100)}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-sm font-semibold mt-2 text-gray-600">
                    <span>{((stats.completedJp / stats.totalJpRequired) * 100).toFixed(1)}%</span>
                </div>
            </div>

            {/* Unfilled KBM Carousel simulation */}
            <div className="glassmorphism rounded-2xl p-4 text-center">
               <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Belum Melaksanakan KBM:</h3>
               <div className="min-h-[60px] flex items-center justify-center">
                 {stats.unfilledKbm.length > 0 ? (
                   <div className="animate-pulse">
                     <p className="text-lg font-bold text-red-600">{stats.unfilledKbm[0].guru}</p>
                     <p className="text-sm font-bold text-gray-600">Kelas {stats.unfilledKbm[0].kelas}</p>
                   </div>
                 ) : (
                   <p className="text-green-600 font-semibold">✅ Data KBM terpantau lancar.</p>
                 )}
               </div>
            </div>
          </>
        ) : (
          <div className="text-center text-red-500">Gagal memuat data statistik.</div>
        )}

        <div className="pt-4">
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-[#3498db] hover:bg-[#2980b9] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform transform hover:-translate-y-1 shadow-lg"
          >
            <LogIn size={20} />
            Login Guru
          </button>
        </div>
      </main>
    </div>
  );
};

export default PublicDashboard;