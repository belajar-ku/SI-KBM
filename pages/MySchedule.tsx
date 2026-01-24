
import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Schedule } from '../types';
import { Calendar, Clock, BookOpen, Loader2, CalendarDays, Download, ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';

const MySchedule: React.FC = () => {
  const { profile } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  
  // Settings for Header
  const [settings, setSettings] = useState({
      academic_year: '...',
      semester: '...'
  });

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
        fetchSchedule();
        fetchSettings();
    }
  }, [profile]);

  const fetchSettings = async () => {
      try {
          const { data } = await supabase.from('app_settings').select('*');
          const newSettings: any = {};
          data?.forEach(item => newSettings[item.key] = item.value);
          setSettings(prev => ({ ...prev, ...newSettings }));
      } catch (e) { console.error(e); }
  };

  const fetchSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('teacher_id', profile?.id)
        .order('day_of_week')
        .order('hour'); 

      if (error) throw error;
      if (data) setSchedules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const dayName = (num: number) => {
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

  // Logic to find schedule for a specific day and period (hour)
  const getScheduleForCell = (day: number, period: number) => {
      return schedules.find(s => {
          if (s.day_of_week !== day) return false;
          // Handle "1, 2" format
          const hours = s.hour.split(',').map(h => parseInt(h.trim()));
          return hours.includes(period);
      });
  };

  const handleDownloadImage = async () => {
      if (!printRef.current) return;
      setDownloading(true);
      try {
          // Wait a bit to ensure rendering
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const canvas = await html2canvas(printRef.current, {
              scale: 2, // Higher quality
              useCORS: true,
              backgroundColor: '#ffffff'
          });

          const link = document.createElement('a');
          link.download = `Jadwal_Mengajar_${profile?.full_name?.replace(/\s+/g, '_')}.jpeg`;
          link.href = canvas.toDataURL('image/jpeg', 0.9);
          link.click();
      } catch (e) {
          alert("Gagal mengunduh gambar.");
          console.error(e);
      } finally {
          setDownloading(false);
      }
  };

  const grouped = groupSchedulesByDay();
  const sortedDays = Object.keys(grouped).map(Number).sort((a, b) => a - b);
  
  // Table Configuration based on Screenshot
  const timeSlots = [
      { p: 1, t: '7:00 - 7:40' },
      { p: 2, t: '7:40 - 8:20' },
      { p: 3, t: '8:20 - 9:00' },
      { p: 4, t: '9:00 - 9:40' },
      { p: 5, t: '10:05 - 10:45' },
      { p: 6, t: '10:45 - 11:25' },
      { p: 7, t: '11:50 - 12:30' },
      { p: 8, t: '12:30 - 13:10' },
  ];
  const days = [1, 2, 3, 4, 5, 6]; // Senin - Sabtu

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-3 rounded-2xl shadow-lg shadow-pink-500/20 text-white">
                    <CalendarDays size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Jadwal Mengajar</h2>
                    <p className="text-gray-500 text-sm">Agenda KBM mingguan Anda.</p>
                </div>
            </div>
            
            <button 
                onClick={handleDownloadImage}
                disabled={loading || downloading}
                className="bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-200 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
            >
                {downloading ? <Loader2 className="animate-spin" size={18}/> : <ImageIcon size={18} />}
                Download Jadwal (.JPEG)
            </button>
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
                                <h3 className="font-bold text-gray-800 text-xl flex items-center gap-2">
                                    Kelas {item.kelas}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 text-gray-600">
                                    <BookOpen size={16} className="text-blue-500" />
                                    <span className="font-medium">{item.subject}</span>
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

      {/* --- HIDDEN TABLE FOR IMAGE GENERATION --- */}
      <div className="fixed top-0 left-0 w-full h-0 overflow-hidden">
          <div ref={printRef} className="bg-white w-[1200px] p-8 text-black font-sans">
              
              {/* Kop Header */}
              <div className="text-center mb-6">
                  <p className="text-sm font-medium uppercase text-gray-600">SMP NEGERI 1 PASURUAN</p>
                  <p className="text-lg font-serif mb-1">JADWAL PELAJARAN ~ SEMESTER {settings.semester.toUpperCase()} TAHUN AJARAN {settings.academic_year}</p>
                  <h1 className="text-4xl font-extrabold uppercase mt-2">{profile?.full_name}</h1>
              </div>

              {/* Table Grid */}
              <div className="border-2 border-black">
                  {/* Header Row */}
                  <div className="flex border-b border-black">
                      <div className="w-24 flex-shrink-0 border-r border-black p-2"></div> {/* Corner */}
                      {timeSlots.map((slot, i) => (
                          <div key={i} className={`flex-1 border-r border-black p-2 text-center ${i === 7 ? 'border-r-0' : ''}`}>
                              <div className="text-2xl font-bold leading-none mb-1">{slot.p}</div>
                              <div className="text-[10px] font-medium">{slot.t}</div>
                          </div>
                      ))}
                  </div>

                  {/* Body Rows */}
                  {days.map((day, idx) => (
                      <div key={day} className={`flex ${idx !== days.length - 1 ? 'border-b border-black' : ''} h-24`}>
                          {/* Day Column */}
                          <div className="w-24 flex-shrink-0 border-r border-black flex items-center justify-center bg-gray-50">
                              <span className="text-xl font-serif text-gray-800">{dayName(day)}</span>
                          </div>

                          {/* Period Columns */}
                          {timeSlots.map((slot, i) => {
                              const schedule = getScheduleForCell(day, slot.p);
                              return (
                                  <div key={i} className={`flex-1 border-r border-black relative p-2 flex flex-col justify-center items-center ${i === 7 ? 'border-r-0' : ''}`}>
                                      {schedule ? (
                                          <>
                                              <div className="absolute top-1 left-2 text-xs font-medium uppercase text-gray-600">{schedule.subject}</div>
                                              <div className="text-4xl font-sans font-bold text-black tracking-tighter scale-y-110">{schedule.kelas}</div>
                                          </>
                                      ) : null}
                                  </div>
                              );
                          })}
                      </div>
                  ))}
              </div>

              <div className="flex justify-between items-end mt-2 text-[10px] text-gray-500 font-medium">
                  <span>Menghasilkan jadwal: {new Date().toLocaleDateString('id-ID')}</span>
                  <span>aSc Timetables Style</span>
              </div>
          </div>
      </div>

    </Layout>
  );
};

export default MySchedule;
