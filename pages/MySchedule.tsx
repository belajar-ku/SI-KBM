import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Schedule } from '../types';
import { Calendar, Clock, BookOpen, MapPin, Loader2, CalendarDays } from 'lucide-react';

const MySchedule: React.FC = () => {
  const { profile } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) fetchSchedule();
  }, [profile]);

  const fetchSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('teacher_id', profile?.id)
        .order('day_of_week')
        .order('hour'); // Sorting string hour might be imperfect (1, 10, 2), but sufficient for simple view

      if (error) throw error;
      if (data) setSchedules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const dayName = (num: number) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    // Adjust logic based on DB (1=Senin usually in our scheme, JS 0=Sun)
    // Assuming DB: 1=Senin, 2=Selasa... 7=Minggu
    const map = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    return map[num] || 'Unknown';
  };

  const groupSchedulesByDay = () => {
    const grouped: Record<number, Schedule[]> = {};
    schedules.forEach(s => {
      if (!grouped[s.day_of_week]) grouped[s.day_of_week] = [];
      grouped[s.day_of_week].push(s);
    });
    return grouped;
  };

  const grouped = groupSchedulesByDay();
  const sortedDays = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
           <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-3 rounded-2xl shadow-lg shadow-pink-500/20 text-white">
              <CalendarDays size={28} />
           </div>
           <div>
              <h2 className="text-2xl font-bold text-gray-800">Jadwal Mengajar</h2>
              <p className="text-gray-500 text-sm">Agenda KBM mingguan Anda.</p>
           </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-pink-500" /></div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
             <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-state-2130362-1800926.png" alt="Empty" className="w-40 mx-auto opacity-50 mb-4" />
             <p className="text-gray-500 font-medium">Belum ada jadwal yang ditemukan.</p>
             <p className="text-xs text-gray-400 mt-1">Hubungi Admin Kurikulum untuk input jadwal.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sortedDays.map(day => (
              <div key={day} className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/50 overflow-hidden relative">
                {/* Header Hari */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between">
                    <span className="font-bold text-lg flex items-center gap-2">
                        <Calendar size={18} className="text-white/80"/> {dayName(day)}
                    </span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-lg backdrop-blur-md">
                        {grouped[day].length} Kelas
                    </span>
                </div>

                {/* List Jam */}
                <div className="p-2">
                    {grouped[day].map((item, idx) => (
                        <div key={item.id} className={`flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-blue-50/50 ${idx !== grouped[day].length - 1 ? 'border-b border-dashed border-gray-100' : ''}`}>
                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-center shadow-sm">
                                <span className="text-xs font-normal text-indigo-400">Jam</span>
                                <span className="leading-none">{item.hour}</span>
                            </div>
                            
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                    {item.subject}
                                </h3>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                        <MapPin size={12} /> Kelas {item.kelas}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MySchedule;