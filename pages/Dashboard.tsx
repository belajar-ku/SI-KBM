
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { 
  User, Bell, Activity, BookOpen, Clock, Stethoscope, CheckCircle2, XCircle, FileText, ClipboardList, 
  CalendarDays, TrendingUp, Users, Edit2, Plus, X, Loader2, Save, Flag, ArrowRight, Check, Minus
} from 'lucide-react';
import { getWIBDate, getWIBISOString, formatDateIndo } from '../utils/dateUtils';
import { Student } from '../types';

interface MonthlyStats {
    totalJp: number;
    targetJp: number;
    totalMeetings: number;
    classProgress: Record<string, number>;
}

interface WaliKelasAbsence {
    student_id: string; 
    student_name: string;
    kelas: string;
    status: string;
    source: 'wali' | 'guru'; 
    hours?: string; 
}

interface EditingStudent {
    student_id: string;
    student_name: string;
    currentStatus: string;
    newStatus: string;
    note: string;
}

interface KbmStatus {
    hour: number;
    className: string;
    isScheduled: boolean;
    isFilled: boolean;
}

const Dashboard: React.FC = () => {
  const { isAdmin, profile } = useAuth();
  
  const [stats, setStats] = useState<MonthlyStats>({ totalJp: 0, targetJp: 0, totalMeetings: 0, classProgress: {} });
  const [homeroomAbsences, setHomeroomAbsences] = useState<WaliKelasAbsence[]>([]);
  const [kbmStatus, setKbmStatus] = useState<KbmStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(getWIBISOString());

  // MODAL STATE
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [modalStudents, setModalStudents] = useState<Student[]>([]);
  const [modalAttendance, setModalAttendance] = useState<Record<string, 'S' | 'I' | 'A' | 'D'>>({});
  
  // MODAL STATE: Specific Edit
  const [showEditSpecificModal, setShowEditSpecificModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState('');
  const [specificAbsenceData, setSpecificAbsenceData] = useState<EditingStudent[]>([]);

  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    if (profile && !isAdmin) {
        fetchDashboardData();
    } else {
        setLoading(false);
    }
  }, [profile, filterDate]);

  const fetchDashboardData = async () => {
    try {
        const date = getWIBDate();
        const currentYear = date.getFullYear();
        const currentMonth = date.getMonth(); 
        
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        
        const firstDayStr = firstDayOfMonth.toISOString();
        const todayStr = getWIBISOString();
        const startOfDay = `${filterDate}T00:00:00+07:00`;
        const endOfDay = `${filterDate}T23:59:59+07:00`;

        // 1. Fetch Journals Stats
        const { data: journals } = await supabase
            .from('journals')
            .select('hours, kelas')
            .eq('teacher_id', profile?.id)
            .gte('created_at', firstDayStr);

        let jp = 0;
        let meetings = 0;
        const classMap: Record<string, number> = {};

        if (journals) {
            meetings = journals.length;
            journals.forEach(j => {
                const parts = j.hours.split(',').filter((h: string) => h.trim().length > 0);
                jp += parts.length;
                classMap[j.kelas] = (classMap[j.kelas] || 0) + 1;
            });
        }

        // 1.5 Calculate TARGET JP
        const { data: mySchedules } = await supabase
            .from('schedules')
            .select('day_of_week, hour')
            .eq('teacher_id', profile?.id);

        let targetJp = 0;
        if (mySchedules) {
            const dayCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
            for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
                const tempDate = new Date(currentYear, currentMonth, d);
                const jsDay = tempDate.getDay(); 
                const dbDay = jsDay === 0 ? 7 : jsDay;
                dayCounts[dbDay]++;
            }
            mySchedules.forEach(s => {
                const jpCount = s.hour.split(',').filter(h => h.trim()).length;
                const occurrences = dayCounts[s.day_of_week] || 0;
                targetJp += (jpCount * occurrences);
            });
        }

        setStats({ totalJp: jp, targetJp: targetJp, totalMeetings: meetings, classProgress: classMap });

        // 2. KBM STATUS
        const dateObj = new Date(); 
        const jsDay = dateObj.getDay(); 
        const dbDay = jsDay === 0 ? 7 : jsDay; 
        const todayStart = `${todayStr}T00:00:00+07:00`;
        const todayEnd = `${todayStr}T23:59:59+07:00`;

        const [todaySchedRes, todayJournalRes] = await Promise.all([
            supabase.from('schedules').select('*').eq('teacher_id', profile?.id).eq('day_of_week', dbDay),
            supabase.from('journals').select('*').eq('teacher_id', profile?.id).gte('created_at', todayStart).lte('created_at', todayEnd)
        ]);

        const hoursList: KbmStatus[] = [];
        for(let i = 1; i <= 8; i++) {
            const hourStr = String(i);
            const scheduledClasses = todaySchedRes.data?.filter(s => {
                const hours = s.hour.split(',').map((h: string) => h.trim());
                return hours.includes(hourStr);
            }) || [];

            const classDisplay = scheduledClasses.length > 0 ? scheduledClasses.map(s => s.kelas).join(' / ') : '-';
            let allFilled = false;
            
            if (scheduledClasses.length > 0) {
                const fillStatus = scheduledClasses.map(sched => {
                    return todayJournalRes.data?.some(j => {
                        const hours = j.hours.split(',').map((h: string) => h.trim());
                        return hours.includes(hourStr) && j.kelas === sched.kelas && j.subject === sched.subject;
                    });
                });
                allFilled = fillStatus.every(status => status === true);
            }

            hoursList.push({
                hour: i,
                className: classDisplay,
                isScheduled: scheduledClasses.length > 0,
                isFilled: allFilled
            });
        }
        setKbmStatus(hoursList);

        // 3. ABSENSI WALI KELAS
        if (profile?.wali_kelas) {
            const { data: students } = await supabase.from('students').select('*').eq('kelas', profile.wali_kelas).order('name');
            
            if (students && students.length > 0) {
                const studentIds = students.map(s => s.id);
                const { data: homeroomLogs } = await supabase
                    .from('homeroom_attendance')
                    .select('student_id, status')
                    .eq('date', filterDate)
                    .in('student_id', studentIds);

                const homeroomMap: Record<string, string> = {};
                homeroomLogs?.forEach(log => { homeroomMap[log.student_id] = log.status; });

                const { data: teacherLogs } = await supabase
                    .from('attendance_logs')
                    .select(`student_id, status, journals (hours)`)
                    .in('student_id', studentIds)
                    .gte('created_at', startOfDay)
                    .lte('created_at', endOfDay)
                    .neq('status', 'D'); 

                const finalAbsences: WaliKelasAbsence[] = [];

                students.forEach(student => {
                    let finalStatus = '';
                    let source: 'wali' | 'guru' = 'guru';
                    let hoursStr = '';

                    if (homeroomMap[student.id]) {
                        finalStatus = homeroomMap[student.id];
                        source = 'wali';
                    } else {
                         const myLogs = teacherLogs?.filter((l: any) => l.student_id === student.id) || [];
                         if (myLogs.length > 0) {
                             const statuses = new Set(myLogs.map((l:any) => l.status));
                             if (statuses.has('S')) finalStatus = 'S';
                             else if (statuses.has('I')) finalStatus = 'I';
                             else if (statuses.has('A')) finalStatus = 'A';
                             
                             const hoursSet = new Set<number>();
                             myLogs.forEach((l: any) => {
                                 if(l.journals?.hours) {
                                     l.journals.hours.split(',').forEach((h: string) => {
                                        const val = parseInt(h.trim());
                                        if(!isNaN(val)) hoursSet.add(val);
                                     });
                                 }
                             });
                             hoursStr = Array.from(hoursSet).sort((a,b) => a-b).join(', ');
                         }
                    }

                    if (finalStatus) {
                        finalAbsences.push({
                            student_id: student.id,
                            student_name: student.name,
                            kelas: profile.wali_kelas!,
                            status: finalStatus,
                            source: source,
                            hours: hoursStr || 'Full Day'
                        });
                    }
                });

                finalAbsences.sort((a, b) => a.student_name.localeCompare(b.student_name));
                setHomeroomAbsences(finalAbsences);
            }
        }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // --- MODAL LOGIC ---
  const handleOpenAbsenceModal = async () => {
      setSavingAttendance(true); 
      try {
          const { data: students } = await supabase.from('students').select('*').eq('kelas', profile?.wali_kelas).order('name');
          setModalStudents(students || []);

          const { data: existing } = await supabase
             .from('homeroom_attendance')
             .select('student_id, status')
             .eq('date', filterDate)
             .in('student_id', (students || []).map(s => s.id));
          
          const attMap: Record<string, 'S'|'I'|'A'|'D'> = {};
          existing?.forEach(log => { attMap[log.student_id] = log.status as any; });
          setModalAttendance(attMap);
          setShowAbsenceModal(true);
      } catch(e) { console.error(e); }
      finally { setSavingAttendance(false); }
  };

  const handleSaveHomeroomAttendance = async () => {
      if (!profile?.wali_kelas) return;
      setSavingAttendance(true);
      try {
          const studentIds = modalStudents.map(s => s.id);
          await supabase.from('homeroom_attendance').delete().eq('date', filterDate).in('student_id', studentIds);

          const inserts = Object.entries(modalAttendance).map(([studentId, status]) => ({
              date: filterDate,
              kelas: profile.wali_kelas,
              student_id: studentId,
              status: status,
              created_by: profile.id
          }));

          if (inserts.length > 0) {
              const { error } = await supabase.from('homeroom_attendance').insert(inserts);
              if (error) throw error;
          }
          setShowAbsenceModal(false);
          fetchDashboardData(); 
      } catch(e) { alert("Gagal menyimpan absensi: " + e); } finally { setSavingAttendance(false); }
  };

  const toggleModalStatus = (studentId: string, status: 'S'|'I'|'A'|'D') => {
      setModalAttendance(prev => {
          const next = { ...prev };
          if (next[studentId] === status) delete next[studentId]; else next[studentId] = status;
          return next;
      });
  };

  // --- SPECIFIC EDIT ---
  const handleEditSpecific = (categoryName: string, list: WaliKelasAbsence[]) => {
      const editList: EditingStudent[] = list.map(item => ({
          student_id: item.student_id,
          student_name: item.student_name,
          currentStatus: item.status,
          newStatus: item.status,
          note: ''
      }));
      setSpecificAbsenceData(editList);
      setEditingCategory(categoryName);
      setShowEditSpecificModal(true);
  };

  const updateSpecificRow = (index: number, field: keyof EditingStudent, value: string) => {
      setSpecificAbsenceData(prev => {
          const next = [...prev];
          next[index] = { ...next[index], [field]: value };
          return next;
      });
  };

  const handleSaveSpecific = async () => {
      if (!profile?.wali_kelas) return;
      setSavingAttendance(true);
      try {
          for (const item of specificAbsenceData) {
              if (item.newStatus !== item.currentStatus || item.note) {
                  const payload: any = {
                      date: filterDate,
                      kelas: profile.wali_kelas,
                      student_id: item.student_id,
                      status: item.newStatus,
                      created_by: profile.id
                  };
                  const { error } = await supabase.from('homeroom_attendance').upsert(payload, { onConflict: 'date, student_id' });
                  if (error) console.error("Failed update", error);
              }
          }
          setShowEditSpecificModal(false);
          fetchDashboardData();
      } catch (e) { alert("Gagal menyimpan perubahan: " + e); } finally { setSavingAttendance(false); }
  };

  const filterAbsences = (status: string) => homeroomAbsences.filter(a => a.status === status);
  const listAlpa = filterAbsences('A');
  const listIzin = filterAbsences('I');
  const listSakit = filterAbsences('S');
  const listDispen = filterAbsences('D');

  const AbsenceSection = ({ title, list, colorClass, icon: Icon, onEdit }: any) => {
      if (list.length === 0) return null;
      return (
        <div className="flex flex-col gap-2 min-w-[200px] flex-1 animate-fade-in">
            <div className={`flex items-center gap-1.5 pb-1 border-b border-gray-100 dark:border-slate-700 mb-0.5 ${colorClass}`}>
                <Icon size={14} strokeWidth={2.5}/>
                <span className="text-[10px] font-extrabold uppercase tracking-wider">{title}</span>
                <div className="ml-auto flex items-center gap-1">
                     <span className="text-[9px] font-bold bg-white dark:bg-slate-700 dark:text-white px-1.5 py-0.5 rounded-md border border-current opacity-80">{list.length}</span>
                     <button 
                        onClick={() => onEdit(title, list)} 
                        className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                     >
                        <Edit2 size={12} />
                     </button>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                {list.map((a: any, i: number) => (
                    <div key={i} className="flex justify-between items-center w-full text-[11px] leading-tight text-slate-700 dark:text-slate-300 font-medium group">
                        <span className="truncate pr-2">{a.student_name}</span>
                        {a.source === 'wali' && <span className="text-[9px] px-1 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded mr-1" title="Input Wali Kelas">W</span>}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700 group-hover:border-slate-200 dark:group-hover:border-slate-600 transition-colors whitespace-nowrap">
                             {a.hours === 'Full Day' ? 'Seharian' : `Jam ${a.hours}`}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      );
  };

  // Performance Logic
  const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'long' });
  const percentage = stats.targetJp > 0 ? (stats.totalJp / stats.targetJp) * 100 : 0;
  let performanceStatus = "Di Bawah Ekspektasi";
  let performanceColor = "text-red-200";
  if (percentage > 85) { performanceStatus = "Di Atas Ekspektasi"; performanceColor = "text-emerald-200"; } 
  else if (percentage >= 70) { performanceStatus = "Sesuai Ekspektasi"; performanceColor = "text-blue-200"; }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        
        {/* HEADER */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 rounded-3xl p-6 text-white shadow-lg shadow-blue-200 dark:shadow-none relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                 <Clock size={200} className="-mr-10 -mt-10" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="flex-shrink-0">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white/20 shadow-inner overflow-hidden bg-white/10 flex items-center justify-center">
                            {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={32} className="text-white/80" />}
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-extrabold leading-tight tracking-tight">{profile?.full_name}</h1>
                        <p className="text-blue-100 text-sm font-mono opacity-90 mb-2">{isAdmin ? 'Administrator' : (profile?.nip || 'NIP -')}</p>
                        <div className="flex flex-wrap gap-2">
                            {!isAdmin && profile?.mengajar_mapel && <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider">{profile.mengajar_mapel}</span>}
                            {!isAdmin && profile?.wali_kelas && <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-orange-500/90 text-white border border-orange-400 text-[10px] font-bold uppercase tracking-wider shadow-sm">Wali Kelas {profile.wali_kelas}</span>}
                        </div>
                    </div>
                </div>
                
                {!isAdmin && (
                    <div className="text-right flex flex-col items-end">
                        <p className="text-xs font-bold text-blue-100 mb-2 opacity-90">Kinerja Bulan {currentMonthName}</p>
                        <div className="flex items-center gap-6 bg-white/10 p-3 px-5 rounded-2xl border border-white/10 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 p-2 rounded-lg hidden sm:block">
                                    <Activity size={20} className="text-blue-100" />
                                </div>
                                <div className="text-left">
                                    <span className="block text-2xl font-extrabold leading-none">{stats.totalMeetings}</span>
                                    <span className="text-[9px] uppercase font-bold text-blue-200 tracking-wider">Pertemuan</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/20"></div>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 p-2 rounded-lg hidden sm:block">
                                    <Clock size={20} className="text-blue-100" />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-baseline gap-1">
                                        <span className="block text-2xl font-extrabold leading-none">{stats.totalJp}</span>
                                        <span className="text-sm font-bold opacity-60">/ {stats.targetJp}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-bold text-blue-200 tracking-wider">Total JP</span>
                                        <span className={`text-[10px] font-extrabold mt-0.5 ${performanceColor}`}>
                                            {performanceStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* MAIN WIDGETS */}
        {!isAdmin && (
            <div className="flex flex-col gap-6">
                
                {/* WALI KELAS ABSENCE WIDGET */}
                {profile?.wali_kelas && (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:border-blue-200 transition-colors">
                        <div className="absolute -top-6 -right-6 p-4 opacity-5 dark:opacity-10 pointer-events-none group-hover:opacity-10 transition-opacity rotate-12"><ClipboardList size={140} className="text-slate-800 dark:text-slate-100" /></div>

                        <div className="flex flex-col md:flex-row gap-4 md:gap-8 relative z-10">
                            {/* Header Section (Left) */}
                            <div className="flex flex-row md:flex-col items-center md:items-start gap-4 flex-shrink-0 md:min-w-[180px] md:border-r md:border-slate-100 dark:md:border-slate-700 md:pr-4 pt-2 md:pt-0">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-sm border transition-colors ${
                                    homeroomAbsences.length > 0 
                                    ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800 text-orange-600 dark:text-orange-400' 
                                    : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                     {homeroomAbsences.length > 0 ? <Bell size={20} className="animate-pulse" /> : <CheckCircle2 size={22} />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wide leading-relaxed">Rekap Absensi <br className="hidden md:block"/>Kelas {profile.wali_kelas}</h3>
                                    <p className={`text-[10px] font-bold mt-1 leading-tight ${homeroomAbsences.length > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {homeroomAbsences.length > 0 ? `${homeroomAbsences.length} Murid Absen` : 'Semua Hadir'}
                                    </p>
                                    
                                    <button 
                                        onClick={handleOpenAbsenceModal}
                                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-200 dark:shadow-none transition-all active:scale-95"
                                    >
                                        <Plus size={12}/> Input Absensi
                                    </button>
                                </div>
                            </div>

                            {/* Content Section (Right) */}
                            <div className="flex-1 min-w-0 flex flex-col gap-4">
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <CalendarDays size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-wide">Tanggal Rekap</span>
                                    </div>
                                    <input 
                                        type="date" 
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg py-1 px-2 text-xs font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    />
                                </div>

                                {homeroomAbsences.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-xs font-medium italic bg-slate-50/50 dark:bg-slate-800/50 rounded-xl px-4 py-8 border border-slate-100 dark:border-slate-700 border-dashed">
                                        <CheckCircle2 size={14} className="mr-2"/> Tidak ada laporan ketidakhadiran murid pada tanggal ini.
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-x-8 gap-y-6">
                                        <AbsenceSection title="ALPA" list={listAlpa} colorClass="text-red-600 dark:text-red-400" icon={XCircle} onEdit={handleEditSpecific} />
                                        <AbsenceSection title="IZIN" list={listIzin} colorClass="text-blue-600 dark:text-blue-400" icon={FileText} onEdit={handleEditSpecific} />
                                        <AbsenceSection title="SAKIT" list={listSakit} colorClass="text-yellow-600 dark:text-yellow-400" icon={Stethoscope} onEdit={handleEditSpecific} />
                                        <AbsenceSection title="DISPEN" list={listDispen} colorClass="text-purple-600 dark:text-purple-400" icon={Flag} onEdit={handleEditSpecific} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* KBM STATUS TABLE */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mb-4 uppercase tracking-wide flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400"/>
                        Keterlaksanaan KBM Hari Ini Di Kelas
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                                    {kbmStatus.map((status) => (
                                        <th key={status.hour} className="py-2 px-1 border-r border-slate-100 dark:border-slate-700 last:border-0 font-extrabold text-slate-600 dark:text-slate-300 w-[12.5%]">
                                            {status.hour}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-slate-100 dark:border-slate-700">
                                    {kbmStatus.map((status) => (
                                        <td key={status.hour} className="py-3 px-1 border-r border-slate-100 dark:border-slate-700 last:border-0 font-bold text-slate-700 dark:text-slate-200">
                                            <div className="flex flex-col items-center justify-center min-h-[2.5rem]">
                                                {status.className.split(' / ').map((cls, idx) => (
                                                    <span key={idx} className={idx > 0 ? "mt-1 block text-xs" : ""}>{cls}</span>
                                                ))}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    {kbmStatus.map((status) => (
                                        <td key={status.hour} className="py-3 px-1 border-r border-slate-100 dark:border-slate-700 last:border-0">
                                            <div className="flex justify-center">
                                                {!status.isScheduled ? (
                                                    <Minus size={20} className="text-slate-300 dark:text-slate-600" strokeWidth={3} />
                                                ) : status.isFilled ? (
                                                    <Check size={20} className="text-green-500 dark:text-green-400" strokeWidth={4} />
                                                ) : (
                                                    <X size={20} className="text-red-500 dark:text-red-400" strokeWidth={4} />
                                                )}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* CLASS PROGRESS WIDGET */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-6 p-4 opacity-5 pointer-events-none rotate-12"><BookOpen size={180} className="text-slate-900 dark:text-white" /></div>
                    <h3 className="relative z-10 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-6 flex items-center gap-2 tracking-wide"><TrendingUp size={16} className="text-blue-500"/> Distribusi Pertemuan Kelas (Bulanan)</h3>
                    <div className="relative z-10 space-y-3">
                        {Object.keys(stats.classProgress).length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500 font-medium italic bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700 border-dashed">Belum ada data mengajar bulan ini.</div>
                        ) : (
                            Object.entries(stats.classProgress).sort().map(([kelas, count]) => (
                                <div key={kelas} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-colors group relative overflow-hidden">
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shadow-sm border border-blue-200 dark:border-blue-800">{kelas}</div>
                                        <div><h4 className="font-bold text-slate-700 dark:text-white text-sm flex items-center gap-2">Kelas {kelas}</h4><p className="text-xs text-slate-400 font-medium flex items-center gap-1"><Users size={10} /> Data KBM</p></div>
                                    </div>
                                    <div className="text-right relative z-10">
                                        <span className="block text-2xl font-extrabold text-slate-800 dark:text-white leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{count}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pertemuan</span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 h-1 bg-blue-500/10 w-full"><div className="h-full bg-blue-500/30" style={{ width: `${Math.min(Number(count) * 10, 100)}%` }}></div></div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL INPUT ABSENSI --- */}
        {showAbsenceModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="bg-white dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 z-10">
                        <div>
                            <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">Daftar Murid ({modalStudents.length})</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Absensi Mutlak - {formatDateIndo(filterDate)}</p>
                        </div>
                        <button 
                            onClick={() => { setModalAttendance({}); setShowAbsenceModal(false); }} 
                            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                         <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700 flex justify-end">
                              <button 
                                onClick={() => setModalAttendance({})}
                                className="text-[10px] font-bold text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                  Default: Hadir Semua
                              </button>
                         </div>

                         <div className="divide-y divide-slate-100 dark:divide-slate-700">
                             <div className="flex items-center px-6 py-2 bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                                 <div className="flex-1">Nama</div>
                                 <div className="flex gap-4">
                                     <span className="w-6 text-center">S</span>
                                     <span className="w-6 text-center">I</span>
                                     <span className="w-6 text-center">A</span>
                                     <span className="w-6 text-center">D</span>
                                 </div>
                             </div>

                             {modalStudents.map(student => (
                                 <div key={student.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                     <div className="flex-1 pr-4">
                                         <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{student.name}</p>
                                     </div>
                                     <div className="flex gap-4">
                                         {['S', 'I', 'A', 'D'].map(status => (
                                             <button 
                                                key={status}
                                                onClick={() => toggleModalStatus(student.id, status as any)}
                                                className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${
                                                    modalAttendance[student.id] === status
                                                    ? 'bg-slate-800 dark:bg-white border-slate-800 dark:border-white text-white dark:text-slate-900'
                                                    : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent hover:border-slate-300 dark:hover:border-slate-500'
                                                }`}
                                             >
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <button 
                            onClick={handleSaveHomeroomAttendance}
                            disabled={savingAttendance}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50 transition-all"
                        >
                            {savingAttendance ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />} 
                            Simpan Data Absensi
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL SPECIFIC EDIT --- */}
        {showEditSpecificModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
                    <div className="bg-white dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <div>
                            <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">Edit Data {editingCategory}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Ubah status / Tambah catatan</p>
                        </div>
                        <button 
                            onClick={() => setShowEditSpecificModal(false)} 
                            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                        {specificAbsenceData.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-4 border border-slate-200 dark:border-slate-600">
                                <p className="font-bold text-slate-800 dark:text-white mb-3 text-sm">{item.student_name}</p>
                                
                                <div className="flex gap-2 mb-3">
                                    {['S', 'I', 'A', 'D'].map(status => (
                                        <button 
                                            key={status}
                                            onClick={() => updateSpecificRow(idx, 'newStatus', status)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                                                item.newStatus === status 
                                                ? (status === 'S' ? 'bg-yellow-100 border-yellow-200 text-yellow-700 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-100' : 
                                                   status === 'I' ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100' :
                                                   status === 'A' ? 'bg-red-100 border-red-200 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-100' : 'bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900 dark:border-purple-700 dark:text-purple-100')
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Alasan / Catatan</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-white"
                                        placeholder="Contoh: Orang tua menelepon..."
                                        value={item.note}
                                        onChange={(e) => updateSpecificRow(idx, 'note', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <button 
                            onClick={handleSaveSpecific}
                            disabled={savingAttendance}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50 transition-all"
                        >
                            {savingAttendance ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />} 
                            Simpan Perubahan
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </Layout>
  );
};

export default Dashboard;
