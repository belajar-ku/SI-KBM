
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Student, Schedule, Journal } from '../types';
import { getWIBISOString, getWIBDate } from '../utils/dateUtils';
import { ArrowLeft, ArrowRight, Check, Send, Sparkles, BookOpen, Clock, ToggleLeft, ToggleRight, Loader2, Edit3, XCircle, CheckCircle2, MessageSquare, History, ClipboardCheck, X, ClipboardList, BookOpenCheck, Ban } from 'lucide-react';

const JurnalForm: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [allClasses, setAllClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [existingJournals, setExistingJournals] = useState<Journal[]>([]);
  const [editJournalId, setEditJournalId] = useState<string | null>(null);
  
  const [lastMaterials, setLastMaterials] = useState<Record<string, string>>({}); 
  const [inputMode, setInputMode] = useState<'auto' | 'manual'>('auto');

  // --- ASSESSMENT STATE ---
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showStudentChecklistModal, setShowStudentChecklistModal] = useState(false);
  const [assessmentType, setAssessmentType] = useState<'harian' | 'tugas' | 'none'>('none');
  const [missingStudents, setMissingStudents] = useState<string[]>([]); // List ID Siswa yang tidak ikut

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  const [formData, setFormData] = useState({
    kelas: '',
    subject: '',
    hours: [] as string[],
    material: '',
    attendance: {} as Record<string, 'S' | 'I' | 'A' | 'D'>,
    cleanliness: '',
    validation: '',
    notes: '',
    isConfirmed: false
  });

  useEffect(() => {
    fetchInitData();
  }, [profile]);

  const fetchInitData = async () => {
    setInitLoading(true);
    try {
        if (!profile) return;
        const wibDate = getWIBDate();
        const jsDay = wibDate.getDay(); 
        const dbDay = jsDay === 0 ? 7 : jsDay;
        const todayStr = getWIBISOString();

        const { data: schedules } = await supabase
            .from('schedules')
            .select('*')
            .eq('teacher_id', profile.id)
            .eq('day_of_week', dbDay)
            .order('hour');
        
        const startOfDay = `${todayStr}T00:00:00+07:00`;
        const endOfDay = `${todayStr}T23:59:59+07:00`;

        const { data: journals } = await supabase
            .from('journals')
            .select('*')
            .eq('teacher_id', profile.id)
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay);

        if (journals) setExistingJournals(journals);
        
        const { data: historyJournals } = await supabase
            .from('journals')
            .select('kelas, subject, material, created_at')
            .eq('teacher_id', profile.id)
            .lt('created_at', startOfDay)
            .order('created_at', { ascending: false })
            .limit(100);

        const materialMap: Record<string, string> = {};
        if (historyJournals) {
            historyJournals.forEach(j => {
                const key = `${j.kelas}-${j.subject}`;
                if (!materialMap[key]) materialMap[key] = j.material;
            });
        }
        setLastMaterials(materialMap);

        if (schedules && schedules.length > 0) {
            setTodaySchedules(schedules);
            setInputMode('auto');
        } else {
            setInputMode('manual');
        }

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

  useEffect(() => {
    if (formData.kelas) {
      const fetchStudents = async () => {
        setLoading(true);
        const { data } = await supabase.from('students').select('*').eq('kelas', formData.kelas).order('name');
        if (data) setStudents(data);
        setLoading(false);
      };
      fetchStudents();
    }
  }, [formData.kelas]);

  const handleScheduleSelect = async (scheduleId: string) => {
      setLoading(true);
      try {
        const selectedSchedule = todaySchedules.find(s => s.id === scheduleId);
        if (!selectedSchedule) return;

        const existing = existingJournals.find(j => 
            j.kelas === selectedSchedule.kelas && 
            j.subject === selectedSchedule.subject
        );

        if (existing) {
            setEditJournalId(existing.id);
            const { data: logs } = await supabase.from('attendance_logs').select('student_id, status').eq('journal_id', existing.id);
            
            const attendanceMap: Record<string, 'S'|'I'|'A'|'D'> = {};
            if (logs) logs.forEach(l => { attendanceMap[l.student_id] = l.status as any; });

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
            setEditJournalId(null);
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
      } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleMaterialChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      const titleCased = val.replace(/\b\w/g, l => l.toUpperCase());
      setFormData({...formData, material: titleCased});
  };

  // --- LOGIC PENILAIAN ---
  const handlePreSubmit = () => {
      // Trigger Assessment Modal first
      setShowAssessmentModal(true);
      setMissingStudents([]); // Reset missing
  };

  const handleAssessmentSelect = (type: 'harian' | 'tugas' | 'none') => {
      setAssessmentType(type);
      setShowAssessmentModal(false);
      
      if (type === 'none') {
          // Direct Submit
          handleSubmitFinal([], 'none');
      } else {
          // Show Checklist
          setShowStudentChecklistModal(true);
      }
  };

  const handleMissingStudentToggle = (studentId: string) => {
      setMissingStudents(prev => 
          prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
      );
  };

  const handleFinishAssessment = () => {
      setShowStudentChecklistModal(false);
      handleSubmitFinal(missingStudents, assessmentType);
  };

  const handleSubmitFinal = async (missingIds: string[], type: string) => {
    setLoading(true);
    try {
      if (!profile) throw new Error("Not authenticated");

      let finalJournalId = editJournalId;
      const validationStatus = formData.isConfirmed ? 'hadir_kbm' : 'inval'; 
      
      // Get Names of Missing Students
      const missingNames = students.filter(s => missingIds.includes(s.id)).map(s => s.name);

      const payload = {
        hours: formData.hours.join(','),
        material: formData.material,
        cleanliness: formData.cleanliness,
        validation: validationStatus,
        notes: formData.notes,
        assessment_type: type,
        assessment_missing_students: JSON.stringify(missingNames)
      };

      if (editJournalId) {
          const { error } = await supabase.from('journals').update(payload).eq('id', editJournalId);
          if (error) throw error;
          await supabase.from('attendance_logs').delete().eq('journal_id', editJournalId);
      } else {
          const { data: journal, error: journalError } = await supabase.from('journals')
            .insert({
                teacher_id: profile.id,
                kelas: formData.kelas,
                subject: formData.subject,
                ...payload
            }).select().single();
          if (journalError) throw journalError;
          finalJournalId = journal.id;
      }

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
        message: 'Data jurnal pembelajaran dan penilaian telah tersimpan.'
      });
    } catch (err: any) {
      setAlertState({ isOpen: true, type: 'error', title: 'Gagal Menyimpan', message: err.message });
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

  const isScheduleFilled = (sch: Schedule) => existingJournals.some(j => j.kelas === sch.kelas && j.subject === sch.subject);
  
  const getDisplayMaterial = (sch: Schedule, filled: boolean) => {
      if (filled) {
          const journal = existingJournals.find(j => j.kelas === sch.kelas && j.subject === sch.subject);
          return journal?.material || '-';
      } else {
          const key = `${sch.kelas}-${sch.subject}`;
          return lastMaterials[key] || 'Belum ada data materi sebelumnya.';
      }
  };

  // Helper untuk mendapatkan siswa yang HADIR saja (tidak ada di formData.attendance)
  const getPresentStudents = () => {
      return students.filter(s => !formData.attendance[s.id]);
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
                                <div className="mt-1 pt-2 border-t border-dashed border-gray-300/50 flex items-start gap-2">
                                     <History size={14} className="text-gray-400 mt-0.5 flex-shrink-0"/>
                                     <div className="text-xs">
                                         <span className="font-bold text-gray-500 block mb-0.5">
                                            {filled ? "Materi Hari Ini:" : "Materi Terakhir:"}
                                         </span>
                                         <p className="text-gray-600 italic line-clamp-2">"{materialText}"</p>
                                     </div>
                                </div>
                            </div>
                         );
                     })}
                 </div>
             </div>
         ) : (
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Kelas (Manual)</label>
                <select className="w-full border border-gray-300 rounded-xl p-3 bg-white" value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value, attendance: {}})}>
                <option value="">-- Pilih Kelas --</option>
                {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
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
                   <th className="p-3 w-10 text-center">S</th><th className="p-3 w-10 text-center">I</th><th className="p-3 w-10 text-center">A</th><th className="p-3 w-10 text-center">D</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {students.map(student => (
                   <tr key={student.id} className="bg-white">
                     <td className="p-3 font-medium text-gray-700">{student.name}</td>
                     {['S', 'I', 'A', 'D'].map((status) => (
                       <td key={status} className="p-2 text-center">
                         <input type="checkbox" className="w-5 h-5 rounded cursor-pointer" 
                           checked={formData.attendance[student.id] === status}
                           onChange={() => {
                              const newAtt = {...formData.attendance};
                              if (newAtt[student.id] === status) delete newAtt[student.id];
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
         </div>
       )}

       <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
         <button disabled={!formData.kelas} onClick={handleNext} className="text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30">Lanjut <ArrowRight size={18} /></button>
       </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
          <div><h3 className="font-bold text-xl text-gray-800 mb-1">Detail Pembelajaran</h3></div>
          {inputMode === 'auto' && <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-bold border border-blue-100">Mode Jadwal</div>}
      </div>
      <div className="space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">Mata Pelajaran</label>
          <input type="text" className="w-full border border-gray-300 rounded-xl p-3 bg-gray-50" value={formData.subject} readOnly={inputMode === 'auto'} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Contoh: Matematika"/>
        </div>
        <div>
           <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">Jam Ke-</label>
           <div className="flex gap-2 flex-wrap">
             {[1,2,3,4,5,6,7,8,9,10].map(h => (
               <label key={h} className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border cursor-pointer ${formData.hours.includes(String(h)) ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}>
                 <input type="checkbox" className="hidden" value={h} disabled={inputMode === 'auto'} checked={formData.hours.includes(String(h))} 
                   onChange={() => {
                     const val = String(h);
                     let newHours = [...formData.hours];
                     if (newHours.includes(val)) newHours = newHours.filter(x => x !== val); else newHours.push(val);
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
          <textarea className="w-full border border-gray-300 rounded-xl p-3 min-h-[100px]" rows={3} value={formData.material} onChange={handleMaterialChange} placeholder="Ringkasan materi..."></textarea>
        </div>
      </div>
      <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
         <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 font-bold px-4 py-2 flex items-center gap-2"><ArrowLeft size={18} /> Kembali</button>
         <button disabled={!formData.subject || !formData.material} onClick={handleNext} className="text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600">Lanjut <ArrowRight size={18} /></button>
       </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 animate-fade-in">
       <h3 className="font-bold text-xl text-gray-800 mb-1">Validasi Akhir</h3>
       <p className="text-gray-500 text-xs mb-6">Konfirmasi keadaan kelas dan status KBM.</p>
       
       <div className="space-y-6">
          {/* ... (Existing Validation UI) ... */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
             <ul className="text-sm space-y-1 text-gray-600">
                 <li>📚 <b>{formData.subject}</b> (Kelas {formData.kelas})</li>
                 <li>⏰ Jam ke: {formData.hours.join(', ')}</li>
                 <li>📝 Absen: {Object.keys(formData.attendance).length} Murid tidak hadir</li>
             </ul>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Kebersihan Kelas</label>
            <div className="grid grid-cols-2 gap-3">
               <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center gap-2 ${formData.cleanliness === 'mengarahkan_piket' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-100'}`}>
                 <input type="radio" name="cleanliness" value="mengarahkan_piket" className="hidden" checked={formData.cleanliness === 'mengarahkan_piket'} onChange={e => setFormData({...formData, cleanliness: e.target.value})} />
                 <Sparkles size={24} /> <span className="text-xs font-bold text-center">Mengarahkan Piket</span>
               </label>
               <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center gap-2 ${formData.cleanliness === 'sudah_bersih' ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-100'}`}>
                 <input type="radio" name="cleanliness" value="sudah_bersih" className="hidden" checked={formData.cleanliness === 'sudah_bersih'} onChange={e => setFormData({...formData, cleanliness: e.target.value})} />
                 <CheckCircleIcon /> <span className="text-xs font-bold text-center">Sudah Bersih</span>
               </label>
            </div>
          </div>

          <div>
            <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.isConfirmed ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                 <input type="checkbox" className="w-5 h-5 text-blue-600" checked={formData.isConfirmed} onChange={e => setFormData({...formData, isConfirmed: e.target.checked})} />
                 <span className="font-bold text-gray-700 text-sm">Saya "Benar-benar Melaksanakan KBM."</span>
            </label>
          </div>

          <div>
             <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><MessageSquare size={16}/> Catatan Selama KBM</label>
             <textarea className="w-full border border-gray-300 rounded-xl p-3 text-sm" rows={2} value={formData.notes} onChange={e => setFormData(prev => ({...prev, notes: e.target.value}))} placeholder="Opsional..."></textarea>
          </div>
       </div>

       <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
         <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 font-bold px-4 py-2 flex items-center gap-2"><ArrowLeft size={18} /> Kembali</button>
         <button 
            disabled={!formData.cleanliness || !formData.isConfirmed || loading} 
            onClick={handlePreSubmit} 
            className="text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600"
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
                   {editJournalId ? 'Edit Jurnal' : 'Isi Jurnal'}
               </h2>
               <p className="text-gray-500 text-xs">{step}/3</p>
            </div>
            <div className="flex gap-1">
               {[1,2,3].map(i => <div key={i} className={`h-2 rounded-full w-8 ${step >= i ? 'bg-blue-500' : 'bg-gray-200'}`}></div>)}
            </div>
        </div>
        
        {initLoading ? <div className="text-center py-20"><Loader2 className="animate-spin inline"/></div> : 
            <>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </>
        }

        {/* MODAL 1: PILIH JENIS PENILAIAN (MODERN UI) */}
        {showAssessmentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-all border border-white/20">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 relative">
                        <div className="relative z-10">
                            <h3 className="text-white font-bold text-xl mb-1 flex items-center gap-2">
                                <ClipboardCheck size={24} className="text-blue-200"/>
                                Konfirmasi Penilaian
                            </h3>
                            <p className="text-blue-100 text-xs opacity-90">Pilih jenis kegiatan penilaian hari ini.</p>
                        </div>
                        <button onClick={() => setShowAssessmentModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-1.5 rounded-full hover:bg-white/20 transition-all cursor-pointer z-20">
                            <X size={20}/>
                        </button>
                        
                        {/* Decorative Circles */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-xl"></div>
                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-500/30 rounded-full translate-y-8 -translate-x-8 blur-lg"></div>
                    </div>

                    <div className="p-6 space-y-3 bg-gray-50/50">
                        <button 
                            onClick={() => handleAssessmentSelect('harian')} 
                            className="w-full flex items-center gap-4 p-4 bg-white border border-purple-100 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-300 group transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <ClipboardList size={22} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">Penilaian Harian</h4>
                                <p className="text-[10px] text-gray-500">Ulangan, Kuis, atau Tes Tulis.</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => handleAssessmentSelect('tugas')} 
                            className="w-full flex items-center gap-4 p-4 bg-white border border-orange-100 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-300 group transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <BookOpenCheck size={22} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-gray-800 group-hover:text-orange-700 transition-colors">Penilaian Tugas</h4>
                                <p className="text-[10px] text-gray-500">PR, Proyek, atau Portofolio.</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => handleAssessmentSelect('none')} 
                            className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-400 group transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-gray-600 group-hover:text-white transition-colors">
                                <Ban size={22} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-gray-800">Tidak Ada Penilaian</h4>
                                <p className="text-[10px] text-gray-500">KBM Biasa / Materi.</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL 2: CHECKLIST MURID (MODERN UI) */}
        {showStudentChecklistModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh] border border-white/20">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 flex-shrink-0 relative">
                        <div className="flex justify-between items-start text-white relative z-10">
                            <div>
                                <h3 className="font-bold text-lg mb-1">Daftar Murid</h3>
                                <p className="text-purple-100 text-xs opacity-90 leading-tight">
                                    Centang yang <b>tidak mengikuti</b><br/>
                                    {assessmentType === 'harian' ? 'Penilaian Harian' : 'Penilaian Tugas'}.
                                </p>
                            </div>
                            <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold backdrop-blur-md border border-white/10">
                                {getPresentStudents().length} Hadir
                            </div>
                        </div>
                        {/* Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10 blur-2xl"></div>
                    </div>

                    {/* List */}
                    <div className="p-2 overflow-y-auto flex-1 bg-gray-50 custom-scrollbar">
                        {getPresentStudents().length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                <XCircle size={48} className="mb-2 opacity-50"/>
                                <p className="text-sm font-medium">Tidak ada murid yang hadir.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 p-2">
                                {getPresentStudents().map(s => {
                                    const isMissing = missingStudents.includes(s.id);
                                    return (
                                        <div 
                                            key={s.id} 
                                            onClick={() => handleMissingStudentToggle(s.id)} 
                                            className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer border transition-all duration-200 group ${
                                                isMissing 
                                                ? 'bg-red-50 border-red-200 shadow-inner' 
                                                : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-sm'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                                    isMissing ? 'bg-red-200 text-red-700' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                                                }`}>
                                                    {s.name.charAt(0)}
                                                </div>
                                                <span className={`text-sm font-bold transition-colors ${isMissing ? 'text-red-700' : 'text-gray-700'}`}>
                                                    {s.name}
                                                </span>
                                            </div>
                                            
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                isMissing 
                                                ? 'bg-red-500 border-red-500 text-white scale-110' 
                                                : 'border-gray-300 bg-white group-hover:border-blue-400'
                                            }`}>
                                                {isMissing && <Check size={14} strokeWidth={3}/>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0 flex gap-3">
                        <button 
                            onClick={() => {
                                setShowStudentChecklistModal(false);
                                setShowAssessmentModal(true); // Kembali ke pilihan
                            }} 
                            className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                        >
                            Kembali
                        </button>
                        <button 
                            onClick={handleFinishAssessment} 
                            className="flex-[2] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/30 text-sm"
                        >
                            <ClipboardCheck size={18}/> Simpan Hasil
                        </button>
                    </div>
                </div>
            </div>
        )}

        {alertState.isOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${alertState.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {alertState.type === 'success' ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{alertState.title}</h3>
                    <p className="text-gray-500 text-sm mb-8">{alertState.message}</p>
                    <button onClick={handleCloseAlert} className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-600">Lanjutkan</button>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default JurnalForm;
