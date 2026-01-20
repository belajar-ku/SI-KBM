
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Student, Schedule, Journal } from '../types';
import { getWIBISOString, getWIBDate } from '../utils/dateUtils';
import { ArrowLeft, ArrowRight, Check, Send, Sparkles, BookOpen, Clock, ToggleLeft, ToggleRight, Loader2, Edit3, XCircle, CheckCircle2, MessageSquare, History } from 'lucide-react';

const JurnalForm: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  
  // Data Sources
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [allClasses, setAllClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // State untuk mengecek jurnal yang SUDAH diisi hari ini
  const [existingJournals, setExistingJournals] = useState<Journal[]>([]);
  const [editJournalId, setEditJournalId] = useState<string | null>(null); // Jika sedang edit
  
  // State untuk Materi Terakhir (History)
  const [lastMaterials, setLastMaterials] = useState<Record<string, string>>({}); // Key: "Kelas-Mapel", Value: "Materi"

  // Mode: 'auto' (dari jadwal) atau 'manual' (inval/luar jadwal)
  const [inputMode, setInputMode] = useState<'auto' | 'manual'>('auto');

  // Custom Alert State
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  // Form State
  const [formData, setFormData] = useState({
    kelas: '',
    subject: '',
    hours: [] as string[],
    material: '',
    attendance: {} as Record<string, 'S' | 'I' | 'A' | 'D'>,
    cleanliness: '',
    validation: '', // Disimpan sebagai 'hadir_kbm' jika checkbox dicentang
    notes: '', // Catatan KBM
    isConfirmed: false // Checkbox state
  });

  useEffect(() => {
    fetchInitData();
  }, [profile]);

  const fetchInitData = async () => {
    setInitLoading(true);
    try {
        if (!profile) return;

        // 1. Determine Day based on WIB
        const wibDate = getWIBDate();
        const jsDay = wibDate.getDay(); 
        const dbDay = jsDay === 0 ? 7 : jsDay;
        const todayStr = getWIBISOString(); // YYYY-MM-DD WIB

        // 2. Fetch Today's Schedule
        const { data: schedules } = await supabase
            .from('schedules')
            .select('*')
            .eq('teacher_id', profile.id)
            .eq('day_of_week', dbDay)
            .order('hour'); // sort jam
        
        // 3. Fetch Jurnal yang SUDAH dibuat HARI INI (WIB) oleh guru ini
        // Kita gunakan filter range timestamp untuk memastikan akurasi zona waktu
        // Supabase menyimpan UTC. Kita harus memastikan 'todayStr' dicocokkan dengan benar.
        // Cara termudah: gunakan format YYYY-MM-DDT00:00:00+07:00
        const startOfDay = `${todayStr}T00:00:00+07:00`;
        const endOfDay = `${todayStr}T23:59:59+07:00`;

        const { data: journals } = await supabase
            .from('journals')
            .select('*')
            .eq('teacher_id', profile.id)
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay);

        if (journals) setExistingJournals(journals);
        
        // 4. Fetch History Materi Terakhir (Dari jurnal SEBELUM hari ini)
        // Kita ambil 50 jurnal terakhir guru ini, lalu filter manual di JS untuk mendapatkan materi terakhir per kelas-mapel
        const { data: historyJournals } = await supabase
            .from('journals')
            .select('kelas, subject, material, created_at')
            .eq('teacher_id', profile.id)
            .lt('created_at', startOfDay) // Hanya data SEBELUM hari ini
            .order('created_at', { ascending: false })
            .limit(100);

        const materialMap: Record<string, string> = {};
        
        if (historyJournals) {
            historyJournals.forEach(j => {
                const key = `${j.kelas}-${j.subject}`;
                if (!materialMap[key]) {
                    materialMap[key] = j.material;
                }
            });
        }
        setLastMaterials(materialMap);

        if (schedules && schedules.length > 0) {
            setTodaySchedules(schedules);
            setInputMode('auto');
        } else {
            setInputMode('manual'); // No schedule today, fallback to manual
        }

        // 5. Fetch All Classes (For Manual Mode)
        const { data: studentData } = await supabase.from('students').select('kelas');
        if (studentData) {
            const unique = Array.from(new Set(studentData.map((s: any) => s.kelas))).sort() as string[];
            setAllClasses(unique);
        }

    } catch (err) {
        console.error(err);
    } finally {
        setInitLoading(false);
    }
  };

  // Fetch Students when Class changes
  useEffect(() => {
    if (formData.kelas) {
      const fetchStudents = async () => {
        setLoading(true);
        // Jika sedang edit, kita butuh data siswa dulu baru load absensi
        const { data } = await supabase
          .from('students')
          .select('*')
          .eq('kelas', formData.kelas)
          .order('name');
        
        if (data) setStudents(data);
        setLoading(false);
      };
      fetchStudents();
    }
  }, [formData.kelas]);

  // Handle selection from Schedule Dropdown
  const handleScheduleSelect = async (scheduleId: string) => {
      setLoading(true);
      try {
        const selectedSchedule = todaySchedules.find(s => s.id === scheduleId);
        if (!selectedSchedule) return;

        // Cek apakah jadwal ini SUDAH diisi jurnalnya? (Match Kelas & Mapel)
        const existing = existingJournals.find(j => 
            j.kelas === selectedSchedule.kelas && 
            j.subject === selectedSchedule.subject
        );

        if (existing) {
            // MODE EDIT
            setEditJournalId(existing.id);
            
            // Ambil data absensi lama
            const { data: logs } = await supabase
                .from('attendance_logs')
                .select('student_id, status')
                .eq('journal_id', existing.id);
            
            const attendanceMap: Record<string, 'S'|'I'|'A'|'D'> = {};
            if (logs) {
                logs.forEach(l => {
                    attendanceMap[l.student_id] = l.status as any;
                });
            }

            // Pre-fill Form
            setFormData({
                kelas: existing.kelas,
                subject: existing.subject,
                hours: existing.hours.split(',').map(s => s.trim()),
                material: existing.material,
                attendance: attendanceMap,
                cleanliness: existing.cleanliness as any,
                validation: existing.validation as any,
                notes: existing.notes || '',
                isConfirmed: existing.validation === 'hadir_kbm'
            });

        } else {
            // MODE BARU (INSERT)
            setEditJournalId(null);
            
            // Parse Hours
            let hoursParsed: string[] = [];
            if (selectedSchedule.hour.includes(',')) hoursParsed = selectedSchedule.hour.split(',').map(s => s.trim());
            else hoursParsed = [selectedSchedule.hour];

            setFormData({
                kelas: selectedSchedule.kelas,
                subject: selectedSchedule.subject,
                hours: hoursParsed,
                material: '',
                attendance: {},
                cleanliness: '',
                validation: '',
                notes: '',
                isConfirmed: false
            });
        }
      } catch (e) {
        console.error("Error selecting schedule", e);
      } finally {
        setLoading(false);
      }
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  // Helper untuk mengubah Text ke Title Case
  const handleMaterialChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      // Regex untuk ubah huruf pertama setiap kata jadi uppercase
      const titleCased = val.replace(/\b\w/g, l => l.toUpperCase());
      setFormData({...formData, material: titleCased});
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!profile) throw new Error("Not authenticated");

      let finalJournalId = editJournalId;
      
      // Tentukan nilai validation string berdasarkan checkbox
      const validationStatus = formData.isConfirmed ? 'hadir_kbm' : 'inval'; 

      if (editJournalId) {
          // --- UPDATE EXISTING ---
          const { error } = await supabase
            .from('journals')
            .update({
                hours: formData.hours.join(','),
                material: formData.material,
                cleanliness: formData.cleanliness,
                validation: validationStatus,
                notes: formData.notes
            })
            .eq('id', editJournalId);
            
          if (error) throw error;

          // Update Attendance: Hapus semua log lama, insert baru
          await supabase.from('attendance_logs').delete().eq('journal_id', editJournalId);

      } else {
          // --- INSERT NEW ---
          const { data: journal, error: journalError } = await supabase
            .from('journals')
            .insert({
                teacher_id: profile.id,
                kelas: formData.kelas,
                subject: formData.subject,
                hours: formData.hours.join(','),
                material: formData.material,
                cleanliness: formData.cleanliness,
                validation: validationStatus,
                notes: formData.notes
                // created_at akan otomatis diisi DB, biasanya UTC. 
                // Tidak masalah, karena saat fetch kita convert ke WIB
            })
            .select()
            .single();

          if (journalError) throw journalError;
          finalJournalId = journal.id;
      }

      // --- INSERT ATTENDANCE LOGS ---
      if (finalJournalId) {
          const attendanceInserts = Object.entries(formData.attendance).map(([studentId, status]) => {
              const studentName = students.find(s => s.id === studentId)?.name || 'Unknown';
              return {
                journal_id: finalJournalId,
                student_id: studentId,
                student_name: studentName,
                status: status,
                teacher_name: profile.full_name, 
                subject: formData.subject
              };
          });

          if (attendanceInserts.length > 0) {
            const { error: attError } = await supabase.from('attendance_logs').insert(attendanceInserts);
            if (attError) throw attError;
          }
      }

      setAlertState({
        isOpen: true,
        type: 'success',
        title: editJournalId ? 'Berhasil Diperbarui!' : 'Berhasil Disimpan!',
        message: 'Data jurnal pembelajaran telah tersimpan di sistem.'
      });

    } catch (err: any) {
      setAlertState({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err.message || 'Terjadi kesalahan sistem.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = () => {
      setAlertState(prev => ({ ...prev, isOpen: false }));
      if (alertState.type === 'success') {
          navigate('/dashboard');
      }
  };

  const CheckCircleIcon = ({className = "text-blue-500"}: {className?: string}) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  );

  // Helper Check Schedule status
  const isScheduleFilled = (sch: Schedule) => {
      return existingJournals.some(j => j.kelas === sch.kelas && j.subject === sch.subject);
  };

  // Helper Get Display Material
  const getDisplayMaterial = (sch: Schedule, filled: boolean) => {
      if (filled) {
          // Jika sudah diisi hari ini, ambil materi dari jurnal hari ini
          const journal = existingJournals.find(j => j.kelas === sch.kelas && j.subject === sch.subject);
          return journal?.material || '-';
      } else {
          // Jika belum diisi, ambil materi terakhir (History)
          const key = `${sch.kelas}-${sch.subject}`;
          return lastMaterials[key] || 'Belum ada data materi sebelumnya.';
      }
  };

  const renderStep1 = () => (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 animate-fade-in">
       <div className="flex justify-between items-start mb-6">
           <div>
               <h3 className="font-bold text-xl text-gray-800">Presensi Murid</h3>
               <p className="text-gray-500 text-xs">Pilih kelas & tandai murid yang tidak hadir/dispensasi.</p>
           </div>
           
           <button 
             onClick={() => {
                 const newMode = inputMode === 'auto' ? 'manual' : 'auto';
                 setInputMode(newMode);
                 setEditJournalId(null);
                 setFormData({ kelas: '', subject: '', hours: [], material: '', attendance: {}, cleanliness: '', validation: '', notes: '', isConfirmed: false});
             }}
             className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
           >
             {inputMode === 'auto' ? <ToggleLeft size={20}/> : <ToggleRight size={20}/>}
             {inputMode === 'auto' ? 'Sesuai Jadwal' : 'Mode Manual'}
           </button>
       </div>

       <div className="mb-6 space-y-4">
         {inputMode === 'auto' && todaySchedules.length > 0 ? (
             <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-600">Pilih Jadwal Hari Ini ({getWIBDate().toLocaleDateString('id-ID', {weekday:'long', timeZone:'Asia/Jakarta'})})</label>
                 <div className="grid gap-3">
                     {todaySchedules.map(sch => {
                         const filled = isScheduleFilled(sch);
                         const isSelected = formData.kelas === sch.kelas && formData.subject === sch.subject;
                         const materialText = getDisplayMaterial(sch, filled);
                         
                         return (
                            <div 
                                key={sch.id}
                                onClick={() => handleScheduleSelect(sch.id)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-2 group relative overflow-hidden ${
                                    isSelected 
                                    ? (filled ? 'border-green-500 bg-green-50 shadow-md' : 'border-blue-500 bg-blue-50 shadow-md') 
                                    : (filled ? 'border-green-100 bg-green-50/30' : 'border-gray-100 hover:border-blue-200 bg-white')
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white transition-colors ${
                                            filled ? 'bg-green-500' : (isSelected ? 'bg-blue-500' : 'bg-gray-300')
                                        }`}>
                                            {sch.kelas}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{sch.subject}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12}/> Jam ke-{sch.hour}</p>
                                        </div>
                                    </div>
                                    
                                    {filled ? (
                                        <div className="flex items-center gap-1 text-green-600 text-xs font-bold bg-white px-2 py-1 rounded-full border border-green-200">
                                            <Check size={14} strokeWidth={3} />
                                            {isSelected ? 'Sedang Diedit' : 'Sudah Diisi'}
                                        </div>
                                    ) : isSelected && (
                                        <CheckCircleIcon />
                                    )}
                                </div>
                                
                                {/* MATERI TERAKHIR / CURRENT MATERIAL */}
                                <div className="mt-1 pt-2 border-t border-dashed border-gray-300/50 flex items-start gap-2">
                                     <History size={14} className="text-gray-400 mt-0.5 flex-shrink-0"/>
                                     <div className="text-xs">
                                         <span className="font-bold text-gray-500 block mb-0.5">
                                            {filled ? "Materi Hari Ini:" : "Materi Terakhir:"}
                                         </span>
                                         <p className="text-gray-600 italic line-clamp-2">
                                            "{materialText}"
                                         </p>
                                     </div>
                                </div>
                            </div>
                         );
                     })}
                 </div>
                 <p className="text-xs text-center text-gray-400 mt-2">Kelas tidak ada di list? Ubah ke <b>Mode Manual</b> di pojok kanan atas.</p>
             </div>
         ) : (
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Kelas (Manual)</label>
                <select 
                    className="w-full border border-gray-300 rounded-xl p-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.kelas}
                    onChange={e => setFormData({...formData, kelas: e.target.value, attendance: {}})}
                >
                <option value="">-- Pilih Kelas --</option>
                {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {inputMode === 'auto' && (
                    <div className="mt-2 p-3 bg-yellow-50 text-yellow-700 text-xs rounded-lg flex items-center gap-2">
                        <Sparkles size={14}/> Tidak ada jadwal mengajar terdeteksi hari ini. Mode Manual aktif.
                    </div>
                )}
             </div>
         )}
       </div>

       {loading && <div className="text-center py-4 text-gray-500"><Loader2 className="animate-spin inline mr-2"/> Mengambil data...</div>}

       {formData.kelas && !loading && (
         <div className="animate-fade-in">
           <div className="flex justify-between items-center mb-2">
               <span className="text-sm font-bold text-gray-700">Daftar Murid ({students.length})</span>
               <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded">Default: Hadir</span>
           </div>
           <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden max-h-[300px] overflow-y-auto">
             <table className="w-full text-sm">
               <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                 <tr>
                   <th className="p-3 text-left text-gray-600 font-bold">Nama Murid</th>
                   <th className="p-3 w-10 text-center"><span className="bg-yellow-100 text-yellow-700 px-1 rounded font-bold">S</span></th>
                   <th className="p-3 w-10 text-center"><span className="bg-blue-100 text-blue-700 px-1 rounded font-bold">I</span></th>
                   <th className="p-3 w-10 text-center"><span className="bg-red-100 text-red-700 px-1 rounded font-bold">A</span></th>
                   <th className="p-3 w-10 text-center"><span className="bg-purple-100 text-purple-700 px-1 rounded font-bold">D</span></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {students.map(student => (
                   <tr key={student.id} className="bg-white">
                     <td className="p-3 font-medium text-gray-700">{student.name}</td>
                     {['S', 'I', 'A', 'D'].map((status) => (
                       <td key={status} className="p-2 text-center">
                         <input 
                           type="checkbox" 
                           className={`w-5 h-5 rounded cursor-pointer transition-transform transform active:scale-90 ${
                               status === 'S' ? 'text-yellow-500 focus:ring-yellow-500' :
                               status === 'I' ? 'text-blue-500 focus:ring-blue-500' :
                               status === 'A' ? 'text-red-500 focus:ring-red-500' :
                               'text-purple-500 focus:ring-purple-500'
                           }`}
                           checked={formData.attendance[student.id] === status}
                           onChange={() => {
                              const newAtt = {...formData.attendance};
                              if (newAtt[student.id] === status) delete newAtt[student.id]; // Toggle off
                              else newAtt[student.id] = status as any;
                              setFormData({...formData, attendance: newAtt});
                           }}
                         />
                       </td>
                     ))}
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           <p className="text-[10px] text-gray-400 mt-2 text-right">* Murid yang tidak dicentang dianggap <b>Hadir</b>.</p>
         </div>
       )}

       <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
         <button 
            disabled={!formData.kelas} 
            onClick={handleNext} 
            className={`text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg transition-all transform hover:-translate-y-1 ${
                editJournalId 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:shadow-green-500/30'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30'
            }`}
         >
           Lanjut <ArrowRight size={18} />
         </button>
       </div>
    </div>
  );

  // ... (Step 2 and Step 3 remain mostly same, just ensuring no logic break)
  // I will just return the full component to be safe as previously requested.
  const renderStep2 = () => (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-xl text-gray-800 mb-1">Detail Pembelajaran</h3>
            <p className="text-gray-500 text-xs">Informasi materi dan jam pelajaran.</p>
          </div>
          {inputMode === 'auto' && (
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-bold border border-blue-100 flex items-center gap-1">
                  <Clock size={12}/> Mode Jadwal (Jam Terkunci)
              </div>
          )}
      </div>

      <div className="space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <BookOpen size={16} className="text-blue-500"/> Mata Pelajaran
          </label>
          <input 
            type="text"
            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-gray-50"
            value={formData.subject}
            readOnly={inputMode === 'auto'}
            onChange={e => setFormData({...formData, subject: e.target.value})}
            placeholder="Contoh: Matematika"
          />
        </div>

        <div>
           <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
               <Clock size={16} className="text-blue-500"/> Jam Ke-
           </label>
           <div className="flex gap-2 flex-wrap">
             {[1,2,3,4,5,6,7,8,9,10].map(h => {
               const isSelected = formData.hours.includes(String(h));
               const isDisabled = inputMode === 'auto';

               return (
               <label 
                key={h} 
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all border relative ${
                    isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                    : (isDisabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 cursor-pointer')
                }`}
               >
                 <input 
                   type="checkbox" 
                   className="hidden" 
                   value={h}
                   disabled={isDisabled}
                   checked={isSelected}
                   onChange={e => {
                     const val = String(h);
                     let newHours = [...formData.hours];
                     if (newHours.includes(val)) newHours = newHours.filter(x => x !== val);
                     else newHours.push(val);
                     setFormData({...formData, hours: newHours.sort()});
                   }}
                 />
                 {h}
               </label>
             )})}
           </div>
           {inputMode === 'auto' && <p className="text-[10px] text-gray-400 mt-1 italic">* Jam otomatis terpilih sesuai jadwal.</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Materi / Bahasan (Auto Title Case)</label>
          <textarea 
            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]" 
            rows={3}
            value={formData.material}
            onChange={handleMaterialChange}
            placeholder="Ringkasan materi yang diajarkan hari ini..."
          ></textarea>
        </div>
      </div>

      <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
         <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 font-bold px-4 py-2 flex items-center gap-2">
           <ArrowLeft size={18} /> Kembali
         </button>
         <button 
            disabled={!formData.subject || !formData.material || formData.hours.length === 0} 
            onClick={handleNext} 
            className={`text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg transition-all transform hover:-translate-y-1 ${
                editJournalId 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:shadow-green-500/30'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30'
            }`}
         >
           Lanjut <ArrowRight size={18} />
         </button>
       </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 animate-fade-in">
       <h3 className="font-bold text-xl text-gray-800 mb-1">Validasi Akhir</h3>
       <p className="text-gray-500 text-xs mb-6">Konfirmasi keadaan kelas dan status KBM.</p>
       
       <div className="space-y-6">
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
             <h4 className="font-bold text-blue-800 text-sm mb-2 flex justify-between">
                Ringkasan
                {editJournalId && <span className="bg-green-200 text-green-800 text-[10px] px-2 py-0.5 rounded-full">Mode Edit</span>}
             </h4>
             <ul className="text-sm space-y-1 text-gray-600">
                 <li>📚 <b>{formData.subject}</b> (Kelas {formData.kelas})</li>
                 <li>⏰ Jam ke: {formData.hours.join(', ')}</li>
                 <li>📝 Absen: {Object.keys(formData.attendance).length} Murid tidak hadir/dispensasi</li>
             </ul>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Kebersihan Kelas</label>
            <div className="grid grid-cols-2 gap-3">
               <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${formData.cleanliness === 'mengarahkan_piket' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-100 hover:border-gray-300'}`}>
                 <input type="radio" name="cleanliness" value="mengarahkan_piket" className="hidden" checked={formData.cleanliness === 'mengarahkan_piket'} onChange={e => setFormData({...formData, cleanliness: e.target.value})} />
                 <Sparkles size={24} className={formData.cleanliness === 'mengarahkan_piket' ? 'text-orange-500' : 'text-gray-300'} />
                 <span className="text-xs font-bold text-center">Mengarahkan Piket</span>
               </label>
               <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${formData.cleanliness === 'sudah_bersih' ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-100 hover:border-gray-300'}`}>
                 <input type="radio" name="cleanliness" value="sudah_bersih" className="hidden" checked={formData.cleanliness === 'sudah_bersih'} onChange={e => setFormData({...formData, cleanliness: e.target.value})} />
                 <CheckCircleIcon className={formData.cleanliness === 'sudah_bersih' ? 'text-green-500' : 'text-gray-300'} />
                 <span className="text-xs font-bold text-center">Sudah Bersih</span>
               </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Validasi</label>
            <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.isConfirmed ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                 <input 
                    type="checkbox" 
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" 
                    checked={formData.isConfirmed} 
                    onChange={e => setFormData({...formData, isConfirmed: e.target.checked})} 
                 />
                 <span className="font-bold text-gray-700 text-sm">
                    Saya "Benar-benar Melaksanakan Kegiatan Belajar Mengajar di Kelas."
                 </span>
            </label>
          </div>

          <div>
             <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                 <MessageSquare size={16} className="text-blue-500"/> Catatan Selama KBM
             </label>
             <textarea 
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] text-sm" 
                rows={2}
                value={formData.notes}
                onChange={e => setFormData(prev => ({...prev, notes: e.target.value}))}
                placeholder="Tambahkan catatan khusus jika ada (Opsional)..."
             ></textarea>
          </div>
       </div>

       <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
         <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 font-bold px-4 py-2 flex items-center gap-2">
           <ArrowLeft size={18} /> Kembali
         </button>
         <button 
            disabled={!formData.cleanliness || !formData.isConfirmed || loading} 
            onClick={handleSubmit} 
            className={`text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg transition-all transform hover:-translate-y-1 ${
                editJournalId 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/30'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-blue-500/30'
            }`}
         >
           {loading ? 'Menyimpan...' : (editJournalId ? <><Edit3 size={18} /> Update Jurnal</> : <><Send size={18} /> Kirim Jurnal</>)}
         </button>
       </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-xl mx-auto pb-10 relative">
        <div className="flex justify-between items-center mb-8 px-2">
            <div>
               <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                   {editJournalId && <Edit3 className="text-green-600" size={24} />} 
                   {editJournalId ? 'Edit Jurnal' : 'Isi Jurnal'}
               </h2>
               <p className="text-gray-500 text-xs">{step === 1 ? 'Langkah 1 dari 3' : step === 2 ? 'Langkah 2 dari 3' : 'Langkah Terakhir'}</p>
            </div>
            <div className="flex gap-1">
               {[1,2,3].map(i => (
                 <div key={i} className={`h-2 rounded-full transition-all duration-500 ${
                     step >= i 
                     ? (editJournalId ? 'w-8 bg-green-500' : 'w-8 bg-blue-500') 
                     : 'w-2 bg-gray-200'
                 }`}></div>
               ))}
            </div>
        </div>
        
        {initLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-500 w-10 h-10 mb-4"/>
                <p className="text-gray-500 font-medium">Mengecek jadwal hari ini...</p>
            </div>
        ) : (
            <>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </>
        )}

        {alertState.isOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center transform scale-100 transition-all border border-white/20">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
                        alertState.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                        {alertState.type === 'success' ? (
                            <CheckCircle2 size={48} strokeWidth={3} />
                        ) : (
                            <XCircle size={48} strokeWidth={3} />
                        )}
                    </div>
                    
                    <h3 className={`text-2xl font-bold mb-2 ${
                        alertState.type === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}>
                        {alertState.title}
                    </h3>
                    
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                        {alertState.message}
                    </p>
                    
                    <button 
                        onClick={handleCloseAlert}
                        className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform hover:-translate-y-1 active:scale-95 ${
                            alertState.type === 'success' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/30' 
                            : 'bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-red-500/30'
                        }`}
                    >
                        {alertState.type === 'success' ? 'Lanjutkan ke Dashboard' : 'Tutup & Perbaiki'}
                    </button>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default JurnalForm;
