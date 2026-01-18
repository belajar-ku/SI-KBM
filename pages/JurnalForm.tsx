import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Student, Schedule } from '../types';
import { ArrowLeft, ArrowRight, Check, Send, Sparkles, BookOpen, Clock, Users, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

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
  
  // Mode: 'auto' (dari jadwal) atau 'manual' (inval/luar jadwal)
  const [inputMode, setInputMode] = useState<'auto' | 'manual'>('auto');

  // Form State
  const [formData, setFormData] = useState({
    kelas: '',
    subject: '',
    hours: [] as string[],
    material: '',
    attendance: {} as Record<string, 'S' | 'I' | 'A' | 'D'>,
    cleanliness: '',
    validation: ''
  });

  useEffect(() => {
    fetchInitData();
  }, [profile]);

  const fetchInitData = async () => {
    setInitLoading(true);
    try {
        if (!profile) return;

        // 1. Determine Day (1 = Senin, ... 7 = Minggu)
        // JS: 0=Sun, 1=Mon. 
        const jsDay = new Date().getDay(); 
        const dbDay = jsDay === 0 ? 7 : jsDay;

        // 2. Fetch Today's Schedule
        const { data: schedules } = await supabase
            .from('schedules')
            .select('*')
            .eq('teacher_id', profile.id)
            .eq('day_of_week', dbDay);
        
        if (schedules && schedules.length > 0) {
            setTodaySchedules(schedules);
            setInputMode('auto');
        } else {
            setInputMode('manual'); // No schedule today, fallback to manual
        }

        // 3. Fetch All Classes (For Manual Mode)
        const { data: studentData } = await supabase.from('students').select('kelas');
        if (studentData) {
            const unique = Array.from(new Set(studentData.map(s => s.kelas))).sort();
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
  const handleScheduleSelect = (scheduleId: string) => {
      if (scheduleId === 'manual_override') {
          setInputMode('manual');
          setFormData({ ...formData, kelas: '', subject: '', hours: [] });
          return;
      }

      const selected = todaySchedules.find(s => s.id === scheduleId);
      if (selected) {
          // Parse Hours (e.g., "1, 2" or "1-2")
          let hoursParsed: string[] = [];
          if (selected.hour.includes(',')) hoursParsed = selected.hour.split(',').map(s => s.trim());
          else if (selected.hour.includes('-')) { 
             // simple range parsing if needed, usually we store comma separated
             hoursParsed = [selected.hour]; 
          } else {
             hoursParsed = [selected.hour];
          }

          setFormData(prev => ({
              ...prev,
              kelas: selected.kelas,
              subject: selected.subject,
              hours: hoursParsed,
              attendance: {} // reset attendance
          }));
      }
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!profile) throw new Error("Not authenticated");

      // 1. Insert Journal
      const { data: journal, error: journalError } = await supabase
        .from('journals')
        .insert({
          teacher_id: profile.id,
          kelas: formData.kelas,
          subject: formData.subject,
          hours: formData.hours.join(','),
          material: formData.material,
          cleanliness: formData.cleanliness,
          validation: formData.validation
        })
        .select()
        .single();

      if (journalError) throw journalError;

      // 2. Insert Attendance
      const attendanceInserts = Object.entries(formData.attendance).map(([studentId, status]) => {
          const studentName = students.find(s => s.id === studentId)?.name || 'Unknown';
          return {
            journal_id: journal.id,
            student_id: studentId,
            student_name: studentName,
            status: status
          };
      });

      if (attendanceInserts.length > 0) {
        const { error: attError } = await supabase.from('attendance_logs').insert(attendanceInserts);
        if (attError) throw attError;
      }

      // Success Animation/Redirect
      alert('✅ Jurnal berhasil disimpan!');
      navigate('/dashboard');

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const CheckCircleIcon = ({className = "text-blue-500"}: {className?: string}) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  );

  // FIX: Mengubah Step Components menjadi Render Functions
  // Ini mencegah unmounting/remounting input saat state berubah (mengetik)
  
  const renderStep1 = () => (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 animate-fade-in">
       <div className="flex justify-between items-start mb-6">
           <div>
               <h3 className="font-bold text-xl text-gray-800">Presensi Siswa</h3>
               <p className="text-gray-500 text-xs">Pilih kelas & tandai siswa yang tidak hadir.</p>
           </div>
           
           {/* Toggle Mode */}
           <button 
             onClick={() => {
                 const newMode = inputMode === 'auto' ? 'manual' : 'auto';
                 setInputMode(newMode);
                 setFormData({...formData, kelas: '', subject: '', hours: []});
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
                 <label className="text-sm font-bold text-gray-600">Pilih Jadwal Hari Ini</label>
                 <div className="grid gap-3">
                     {todaySchedules.map(sch => (
                         <div 
                            key={sch.id}
                            onClick={() => handleScheduleSelect(sch.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${formData.kelas === sch.kelas && formData.subject === sch.subject ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-100 hover:border-blue-200 bg-white'}`}
                         >
                             <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${formData.kelas === sch.kelas ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                     {sch.kelas}
                                 </div>
                                 <div>
                                     <p className="font-bold text-gray-800">{sch.subject}</p>
                                     <p className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12}/> Jam ke-{sch.hour}</p>
                                 </div>
                             </div>
                             {formData.kelas === sch.kelas && <CheckCircleIcon />}
                         </div>
                     ))}
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

       {loading && <div className="text-center py-4 text-gray-500"><Loader2 className="animate-spin inline mr-2"/> Mengambil data siswa...</div>}

       {formData.kelas && !loading && (
         <div className="animate-fade-in">
           <div className="flex justify-between items-center mb-2">
               <span className="text-sm font-bold text-gray-700">Daftar Siswa ({students.length})</span>
               <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded">Default: Hadir</span>
           </div>
           <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden max-h-[300px] overflow-y-auto">
             <table className="w-full text-sm">
               <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                 <tr>
                   <th className="p-3 text-left text-gray-600 font-bold">Nama</th>
                   <th className="p-3 w-10 text-center"><span className="bg-yellow-100 text-yellow-700 px-1 rounded">S</span></th>
                   <th className="p-3 w-10 text-center"><span className="bg-blue-100 text-blue-700 px-1 rounded">I</span></th>
                   <th className="p-3 w-10 text-center"><span className="bg-red-100 text-red-700 px-1 rounded">A</span></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {students.map(student => (
                   <tr key={student.id} className="bg-white">
                     <td className="p-3 font-medium text-gray-700">{student.name}</td>
                     {['S', 'I', 'A'].map((status) => (
                       <td key={status} className="p-2 text-center">
                         <input 
                           type="checkbox" 
                           className={`w-5 h-5 rounded cursor-pointer transition-transform transform active:scale-90 ${
                               status === 'S' ? 'text-yellow-500 focus:ring-yellow-500' :
                               status === 'I' ? 'text-blue-500 focus:ring-blue-500' :
                               'text-red-500 focus:ring-red-500'
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
           <p className="text-[10px] text-gray-400 mt-2 text-right">* Siswa yang tidak dicentang dianggap <b>Hadir</b>.</p>
         </div>
       )}

       <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
         <button 
            disabled={!formData.kelas} 
            onClick={handleNext} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1"
         >
           Lanjut <ArrowRight size={18} />
         </button>
       </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 animate-fade-in">
      <h3 className="font-bold text-xl text-gray-800 mb-1">Detail Pembelajaran</h3>
      <p className="text-gray-500 text-xs mb-6">Informasi materi dan jam pelajaran.</p>

      <div className="space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <BookOpen size={16} className="text-blue-500"/> Mata Pelajaran
          </label>
          <input 
            type="text"
            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            value={formData.subject}
            onChange={e => setFormData({...formData, subject: e.target.value})}
            placeholder="Contoh: Matematika"
          />
        </div>

        <div>
           <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
               <Clock size={16} className="text-blue-500"/> Jam Ke-
           </label>
           <div className="flex gap-2 flex-wrap">
             {[1,2,3,4,5,6,7,8,9,10].map(h => (
               <label 
                key={h} 
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold cursor-pointer transition-all border ${
                    formData.hours.includes(String(h)) 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-110' 
                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                }`}
               >
                 <input 
                   type="checkbox" 
                   className="hidden" 
                   value={h}
                   checked={formData.hours.includes(String(h))}
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
             ))}
           </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Materi / Bahasan</label>
          <textarea 
            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]" 
            rows={3}
            value={formData.material}
            onChange={e => setFormData(prev => ({...prev, material: e.target.value}))}
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
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1"
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
             <h4 className="font-bold text-blue-800 text-sm mb-2">Ringkasan</h4>
             <ul className="text-sm space-y-1 text-gray-600">
                 <li>📚 <b>{formData.subject}</b> (Kelas {formData.kelas})</li>
                 <li>⏰ Jam ke: {formData.hours.join(', ')}</li>
                 <li>📝 Absen: {Object.keys(formData.attendance).length} Siswa tidak hadir</li>
             </ul>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Kebersihan Kelas</label>
            <div className="grid grid-cols-2 gap-3">
               <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${formData.cleanliness === 'mengarahkan_piket' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-100 hover:border-gray-300'}`}>
                 <input type="radio" name="cleanliness" value="mengarahkan_piket" className="hidden" onChange={e => setFormData({...formData, cleanliness: e.target.value})} />
                 <Sparkles size={24} className={formData.cleanliness === 'mengarahkan_piket' ? 'text-orange-500' : 'text-gray-300'} />
                 <span className="text-xs font-bold text-center">Mengarahkan Piket</span>
               </label>
               <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${formData.cleanliness === 'sudah_bersih' ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-100 hover:border-gray-300'}`}>
                 <input type="radio" name="cleanliness" value="sudah_bersih" className="hidden" onChange={e => setFormData({...formData, cleanliness: e.target.value})} />
                 <CheckCircleIcon className={formData.cleanliness === 'sudah_bersih' ? 'text-green-500' : 'text-gray-300'} />
                 <span className="text-xs font-bold text-center">Sudah Bersih</span>
               </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Status Pembelajaran</label>
            <div className="space-y-2">
               <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.validation === 'hadir_kbm' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                 <input type="radio" name="validasi" value="hadir_kbm" className="w-4 h-4 text-blue-600" onChange={e => setFormData({...formData, validation: e.target.value})} />
                 <span className="font-medium text-gray-700">Hadir KBM Tatap Muka</span>
               </label>
               <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.validation === 'izin_tugas' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                 <input type="radio" name="validasi" value="izin_tugas" className="w-4 h-4 text-blue-600" onChange={e => setFormData({...formData, validation: e.target.value})} />
                 <span className="font-medium text-gray-700">Izin (Memberi Tugas)</span>
               </label>
            </div>
          </div>
       </div>

       <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
         <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 font-bold px-4 py-2 flex items-center gap-2">
           <ArrowLeft size={18} /> Kembali
         </button>
         <button 
            disabled={!formData.cleanliness || !formData.validation || loading} 
            onClick={handleSubmit} 
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-green-500/30 transition-all transform hover:-translate-y-1"
         >
           {loading ? 'Menyimpan...' : <><Send size={18} /> Kirim Jurnal</>}
         </button>
       </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-xl mx-auto pb-10">
        {/* Modern Progress Header */}
        <div className="flex justify-between items-center mb-8 px-2">
            <div>
               <h2 className="text-2xl font-bold text-gray-800">Isi Jurnal</h2>
               <p className="text-gray-500 text-xs">{step === 1 ? 'Langkah 1 dari 3' : step === 2 ? 'Langkah 2 dari 3' : 'Langkah Terakhir'}</p>
            </div>
            <div className="flex gap-1">
               {[1,2,3].map(i => (
                 <div key={i} className={`h-2 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-blue-500' : 'w-2 bg-gray-200'}`}></div>
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
      </div>
    </Layout>
  );
};

export default JurnalForm;