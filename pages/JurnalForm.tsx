
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Student, Schedule, Journal } from '../types';
import { getWIBISOString, getWIBDate } from '../utils/dateUtils';
import { ArrowLeft, ArrowRight, Check, Send, Sparkles, BookOpen, Clock, ToggleLeft, ToggleRight, Loader2, Edit3, XCircle, CheckCircle2, MessageSquare, History, ClipboardCheck, X, ClipboardList, BookOpenCheck, Ban, ChevronRight, Plus, Trash2, ChevronDown, CheckSquare, Square, Gavel } from 'lucide-react';

interface NoteItem {
    category: string;
    studentIds: string[];
    followUp?: string; // Dropdown
    note?: string; // Manual Note
}

// SMART TITLE CASE HELPER (Improved)
const smartTitleCase = (str: string) => {
    // Kata sambung yang tidak perlu kapital kecuali di awal
    const smallWords = ['di', 'ke', 'dari', 'pada', 'dalam', 'dengan', 'dan', 'atau', 'yang', 'untuk', 'saja'];
    
    return str.split(' ').map((word, index) => {
        const lower = word.toLowerCase();
        
        // 1. Selalu kapital di awal kalimat
        if (index === 0) return lower.charAt(0).toUpperCase() + lower.slice(1);
        
        // 2. Kecilkan jika kata sambung
        if (smallWords.includes(lower)) return lower;
        
        // 3. Kecilkan jika satu huruf (misal: "Titik a, b") 
        if (/^[a-z][.,]?$/.test(lower)) return lower;
        
        // 4. Sisanya Kapital
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }).join(' ');
};

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

  // --- SETTINGS MASTER DATA ---
  const [disciplineTypes, setDisciplineTypes] = useState<string[]>([]);
  const [followUpTypes, setFollowUpTypes] = useState<string[]>([]); // New State
  const [activityTypes, setActivityTypes] = useState<string[]>([]);

  // --- ASSESSMENT STATE ---
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showStudentChecklistModal, setShowStudentChecklistModal] = useState(false);
  const [assessmentType, setAssessmentType] = useState<'harian' | 'tugas' | 'none'>('none');
  const [missingStudents, setMissingStudents] = useState<string[]>([]); 

  // --- NOTES STATE (STEP 3) ---
  const [notesData, setNotesData] = useState<{
      discipline: NoteItem[];
      activity: NoteItem[];
  }>({ discipline: [], activity: [] });

  // --- PREVIOUS ATTENDANCE STATE (FOR ALL SUBJECTS) ---
  const [prevMeetingStats, setPrevMeetingStats] = useState<Record<string, string>>({});
  const [hasPrevMeeting, setHasPrevMeeting] = useState(false);

  // --- HOMEROOM ATTENDANCE STATE ---
  const [homeroomStats, setHomeroomStats] = useState<Record<string, string>>({});

  // --- ALPA COUNTS STATE ---
  const [studentAlpaCounts, setStudentAlpaCounts] = useState<Record<string, number>>({});

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

  // --- SPECIAL SUBJECT LOGIC (Salat Dhuha) ---
  const isSpecialSubjectDhuha = (subject: string) => {
      return subject && subject.toLowerCase().includes('dhuha');
  };
  const isDhuha = isSpecialSubjectDhuha(formData.subject);

  useEffect(() => {
    fetchInitData();
  }, [profile]);

  // Effect to auto-fill material for Salat Dhuha
  useEffect(() => {
      if (isDhuha && !formData.material) {
          setFormData(prev => ({ ...prev, material: 'Salat Dhuha' }));
      }
  }, [formData.subject, isDhuha]);

  // Effect to fetch PREVIOUS Attendance (Generalized for ALL Subjects)
  useEffect(() => {
      if (formData.kelas && formData.subject) {
          const fetchPreviousAttendance = async () => {
              try {
                  const todayStr = getWIBISOString();
                  // 1. Cari jurnal TERAKHIR untuk mapel & kelas ini sebelum hari ini
                  const { data: journals } = await supabase.from('journals')
                      .select('id')
                      .eq('kelas', formData.kelas)
                      .eq('subject', formData.subject) // Match exact subject name
                      .lt('created_at', `${todayStr}T00:00:00+07:00`) // Hanya ambil yang sebelum hari ini
                      .order('created_at', { ascending: false })
                      .limit(1);

                  if (journals && journals.length > 0) {
                      const lastJid = journals[0].id;
                      setHasPrevMeeting(true);

                      // 2. Ambil log absensi dari jurnal tersebut
                      const { data: logs } = await supabase.from('attendance_logs')
                          .select('student_id, status')
                          .eq('journal_id', lastJid);
                      
                      const map: Record<string, string> = {};
                      if (logs) {
                          logs.forEach(l => map[l.student_id] = l.status);
                      }
                      setPrevMeetingStats(map);
                  } else {
                      setHasPrevMeeting(false);
                      setPrevMeetingStats({});
                  }
              } catch (e) {
                  console.error("Error fetching prev attendance", e);
              }
          };
          fetchPreviousAttendance();
      }
  }, [formData.subject, formData.kelas]);

  const fetchInitData = async () => {
    setInitLoading(true);
    try {
        if (!profile) return;
        const wibDate = getWIBDate();
        const jsDay = wibDate.getDay(); 
        const dbDay = jsDay === 0 ? 7 : jsDay;
        const todayStr = getWIBISOString();

        const [schedulesRes, settingsRes] = await Promise.all([
             supabase.from('schedules').select('*').eq('teacher_id', profile.id).eq('day_of_week', dbDay).order('hour'),
             supabase.from('app_settings').select('*')
        ]);

        const schedules = schedulesRes.data;
        
        // Parse Settings
        if (settingsRes.data) {
            settingsRes.data.forEach(item => {
                if (item.key === 'discipline_types') setDisciplineTypes(item.value ? JSON.parse(item.value) : []);
                if (item.key === 'follow_up_types') setFollowUpTypes(item.value ? JSON.parse(item.value) : []);
                if (item.key === 'activity_types') setActivityTypes(item.value ? JSON.parse(item.value) : []);
            });
        }
        
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
    if (formData.kelas && profile) {
      const fetchStudentsAndStats = async () => {
        setLoading(true);
        // 1. Fetch Students
        const { data: studentsData } = await supabase.from('students').select('*').eq('kelas', formData.kelas).order('name');
        
        if (studentsData) {
            setStudents(studentsData);
            
            // 2. Fetch Total Alpa Count for these students
            // FILTER: Hanya Alpa pada Guru yang Login (profile.id)
            // FILTER: Hanya untuk Mapel yang sedang dipilih (formData.subject) - Jika ada
            const studentIds = studentsData.map(s => s.id);
            if (studentIds.length > 0) {
                // Gunakan inner join ke tabel journals untuk filter by teacher_id & subject
                let query = supabase
                    .from('attendance_logs')
                    .select('student_id, journal_id, journals!inner(teacher_id, subject)')
                    .eq('status', 'A')
                    .in('student_id', studentIds)
                    .eq('journals.teacher_id', profile.id);
                
                // Jika sedang mengedit, jangan hitung log dari jurnal yang sedang diedit (biar historis murni)
                if (editJournalId) {
                    query = query.neq('journal_id', editJournalId);
                }

                // Jika Mapel sudah terisi (Mode Auto atau Manual Step 2), filter by Mapel juga
                if (formData.subject) {
                    query = query.eq('journals.subject', formData.subject);
                }
                
                const { data: alpaLogs, error } = await query;
                
                if (error) console.error("Error fetching teacher alpa stats:", error);

                const alpaCounts: Record<string, number> = {};
                alpaLogs?.forEach((log: any) => {
                    alpaCounts[log.student_id] = (alpaCounts[log.student_id] || 0) + 1;
                });
                setStudentAlpaCounts(alpaCounts);
            } else {
                setStudentAlpaCounts({});
            }
        }
        setLoading(false);
      };
      fetchStudentsAndStats();
    }
  }, [formData.kelas, formData.subject, profile?.id, editJournalId]); 

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
            // Fetch Attendance
            const { data: logs } = await supabase.from('attendance_logs').select('student_id, status').eq('journal_id', existing.id);
            const attendanceMap: Record<string, 'S'|'I'|'A'|'D'> = {};
            if (logs) logs.forEach(l => { attendanceMap[l.student_id] = l.status as any; });

            // Fetch Notes
            const { data: notes } = await supabase.from('journal_notes').select('type, category, student_id, follow_up, note').eq('journal_id', existing.id);
            const loadedNotes = { discipline: [] as NoteItem[], activity: [] as NoteItem[] };
            
            if (notes) {
                const discMap: Record<string, string[]> = {};
                const actMap: Record<string, string[]> = {};

                notes.forEach(n => {
                    const key = `${n.category}|${n.follow_up || ''}|${n.note || ''}`;
                    if (n.type === 'kedisiplinan') {
                        if (!discMap[key]) discMap[key] = [];
                        discMap[key].push(n.student_id);
                    } else {
                        if (!actMap[key]) actMap[key] = [];
                        actMap[key].push(n.student_id);
                    }
                });

                loadedNotes.discipline = Object.entries(discMap).map(([key, studentIds]) => {
                    const [category, followUp, note] = key.split('|');
                    return { category, followUp, note, studentIds };
                });
                loadedNotes.activity = Object.entries(actMap).map(([key, studentIds]) => {
                    const [category, _, note] = key.split('|');
                    return { category, note, studentIds };
                });
            }
            setNotesData(loadedNotes);

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
            // NEW JOURNAL MODE
            setEditJournalId(null);
            setNotesData({ discipline: [], activity: [] });
            let hoursParsed: string[] = [];
            if (selectedSchedule.hour.includes(',')) hoursParsed = selectedSchedule.hour.split(',').map(s => s.trim());
            else hoursParsed = [selectedSchedule.hour];

            // Auto-fill material for Dhuha immediately upon selection if not existing
            const isDhuhaSched = isSpecialSubjectDhuha(selectedSchedule.subject);
            const defaultMaterial = isDhuhaSched ? 'Salat Dhuha' : '';

            // --- FETCH HOMEROOM ATTENDANCE (Wali Kelas Input) ---
            // If data exists, pre-fill formData.attendance
            const todayStr = getWIBISOString();
            const { data: hrData } = await supabase.from('homeroom_attendance')
                .select('student_id, status')
                .eq('date', todayStr)
                .eq('kelas', selectedSchedule.kelas);
            
            const initialAttendance: Record<string, 'S' | 'I' | 'A' | 'D'> = {};
            
            if (hrData && hrData.length > 0) {
                hrData.forEach(r => {
                    if (['S', 'I', 'A', 'D'].includes(r.status)) {
                        initialAttendance[r.student_id] = r.status as any;
                    }
                });
            }

            setFormData({
                kelas: selectedSchedule.kelas,
                subject: selectedSchedule.subject,
                hours: hoursParsed,
                material: defaultMaterial,
                attendance: initialAttendance, // Pre-filled here
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
      const formatted = smartTitleCase(val);
      setFormData({...formData, material: formatted});
  };

  // --- LOGIC NOTES (STEP 3) ---
  const addNoteRow = (type: 'discipline' | 'activity') => {
      setNotesData(prev => ({
          ...prev,
          [type]: [...prev[type], { category: '', studentIds: [], followUp: '', note: '' }]
      }));
  };

  const removeNoteRow = (type: 'discipline' | 'activity', index: number) => {
      setNotesData(prev => ({
          ...prev,
          [type]: prev[type].filter((_, i) => i !== index)
      }));
  };

  const updateNoteRow = (type: 'discipline' | 'activity', index: number, field: keyof NoteItem, value: any) => {
      setNotesData(prev => {
          const list = [...prev[type]];
          list[index] = { ...list[index], [field]: value };
          return { ...prev, [type]: list };
      });
  };

  // --- LOGIC PENILAIAN & SUBMIT ---
  const handlePreSubmit = () => {
      setShowAssessmentModal(true);
      setMissingStudents([]); 
  };

  const handleAssessmentSelect = (type: 'harian' | 'tugas' | 'none') => {
      setAssessmentType(type);
      setShowAssessmentModal(false);
      
      if (type === 'none') {
          handleSubmitFinal([], 'none');
      } else {
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

      // 1. Save Journal
      if (editJournalId) {
          const { error } = await supabase.from('journals').update(payload).eq('id', editJournalId);
          if (error) throw error;
          await supabase.from('attendance_logs').delete().eq('journal_id', editJournalId);
          await supabase.from('journal_notes').delete().eq('journal_id', editJournalId);
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

      // 2. Insert Attendance Logs
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

          // 3. Insert Journal Notes (Discipline & Activity)
          const notesInserts: any[] = [];
          
          notesData.discipline.forEach(row => {
              if (row.category && row.studentIds.length > 0) {
                  row.studentIds.forEach(sid => {
                      const sName = students.find(s => s.id === sid)?.name || 'Unknown';
                      notesInserts.push({
                          journal_id: finalJournalId,
                          student_id: sid,
                          student_name: sName,
                          type: 'kedisiplinan',
                          category: row.category,
                          follow_up: row.followUp || '', // Save Dropdown
                          note: row.note || '' // Save Manual Note
                      });
                  });
              }
          });

          notesData.activity.forEach(row => {
              if (row.category && row.studentIds.length > 0) {
                  row.studentIds.forEach(sid => {
                      const sName = students.find(s => s.id === sid)?.name || 'Unknown';
                      notesInserts.push({
                          journal_id: finalJournalId,
                          student_id: sid,
                          student_name: sName,
                          type: 'keaktifan',
                          category: row.category,
                          follow_up: '', 
                          note: row.note || ''
                      });
                  });
              }
          });

          if (notesInserts.length > 0) {
              const { error: noteError } = await supabase.from('journal_notes').insert(notesInserts);
              if (noteError) throw noteError;
          }
      }

      setAlertState({
        isOpen: true,
        type: 'success',
        title: editJournalId ? 'Berhasil Diperbarui!' : 'Berhasil Disimpan!',
        message: 'Data jurnal pembelajaran dan penilaian telah tersimpan.'
      });
    } catch (err: any) {
      console.error("Submit Error:", err);
      setAlertState({ isOpen: true, type: 'error', title: 'Gagal Menyimpan', message: err.message || 'Terjadi kesalahan sistem.' });
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

  // --- COMPONENT: STUDENT TABLE (REUSABLE) ---
  const RenderStudentTable = () => (
      <div className="animate-fade-in border rounded-2xl overflow-hidden border-slate-200 bg-white">
           <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
               <span className="text-sm font-bold text-slate-700">Daftar Murid ({students.length})</span>
               <span className="text-[10px] text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 font-bold whitespace-nowrap">Default: Hadir</span>
           </div>
           
           <div className="overflow-x-auto w-full">
               <div className="max-h-[500px] overflow-y-auto custom-scrollbar min-w-[350px]">
                 <table className="w-full text-sm">
                   <thead className="bg-white sticky top-0 z-10 shadow-sm">
                     <tr className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide">
                       <th className="p-2 sm:p-3 text-left pl-3 sm:pl-4">Nama</th>
                       {isDhuha ? (
                            <>
                                <th className="p-2 sm:p-3 w-20 text-center" title="Kehadiran pertemuan terakhir">Pekan Lalu</th>
                                <th className="p-2 sm:p-3 w-12 text-center" title="Tidak Hadir (Alpa)">TH</th>
                                <th className="p-2 sm:p-3 w-12 text-center" title="Dispensasi">D</th>
                            </>
                       ) : (
                            <>
                                <th className="p-2 sm:p-3 w-20 text-center" title="Kehadiran pertemuan terakhir">Pekan Lalu</th>
                                <th className="p-2 sm:p-3 w-8 sm:w-10 text-center">S</th>
                                <th className="p-2 sm:p-3 w-8 sm:w-10 text-center">I</th>
                                <th className="p-2 sm:p-3 w-8 sm:w-10 text-center">A</th>
                                <th className="p-2 sm:p-3 w-8 sm:w-10 text-center">D</th>
                            </>
                       )}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {students.map(student => {
                       // LOGIKA PEKAN LALU
                       let prevStatusDisplay = '-';
                       let prevStatusColor = 'bg-slate-100 text-slate-400';

                       if (hasPrevMeeting) {
                            const rawStatus = prevMeetingStats[student.id];
                            
                            if (!rawStatus) {
                                // Tidak ada data log = Hadir (H)
                                prevStatusDisplay = 'H';
                                prevStatusColor = 'bg-green-100 text-green-700';
                            } else if (rawStatus === 'D') {
                                prevStatusDisplay = 'D';
                                prevStatusColor = 'bg-purple-100 text-purple-700';
                            } else if (isDhuha && ['S', 'I', 'A'].includes(rawStatus)) {
                                // Khusus Dhuha: S, I, A jadi TH
                                prevStatusDisplay = 'TH';
                                prevStatusColor = 'bg-red-100 text-red-700';
                            } else {
                                // Mapel Lain: Tampilkan sesuai status
                                prevStatusDisplay = rawStatus;
                                if (rawStatus === 'S') prevStatusColor = 'bg-yellow-100 text-yellow-700';
                                else if (rawStatus === 'I') prevStatusColor = 'bg-blue-100 text-blue-700';
                                else if (rawStatus === 'A') prevStatusColor = 'bg-red-100 text-red-700';
                            }
                       }

                       // LOGIKA ALPA COUNT (Untuk Tampilan di Nama)
                       const alpaCount = studentAlpaCounts[student.id] || 0;

                       return (
                       <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                         <td className="p-2 sm:p-3 pl-3 sm:pl-4 font-bold text-slate-700 text-xs sm:text-sm">
                             {student.name}
                             {alpaCount > 0 && (
                                 <span className="text-red-500 text-[10px] ml-1 sm:ml-2 font-extrabold bg-red-50 px-1.5 py-0.5 rounded border border-red-100 whitespace-nowrap">
                                     | A: {alpaCount}
                                 </span>
                             )}
                         </td>
                         
                         {/* Kolom Kehadiran Pekan Lalu (Ada di kedua mode) */}
                         <td className="p-1 sm:p-2 text-center border-l border-r border-slate-100 bg-slate-50/50">
                            <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold ${prevStatusColor}`}>
                                {prevStatusDisplay}
                            </span>
                         </td>

                         {isDhuha ? (
                             <>
                                <td className="p-1 sm:p-2 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-slate-300 focus:ring-0 cursor-pointer text-red-500 focus:ring-red-500 checked:bg-red-500 checked:border-red-500"
                                        checked={formData.attendance[student.id] === 'A'} // TH maps to A
                                        onChange={() => {
                                            const newAtt = {...formData.attendance};
                                            if (newAtt[student.id] === 'A') delete newAtt[student.id];
                                            else newAtt[student.id] = 'A';
                                            setFormData({...formData, attendance: newAtt});
                                        }}
                                    />
                                </td>
                                <td className="p-1 sm:p-2 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-slate-300 focus:ring-0 cursor-pointer text-purple-500 focus:ring-purple-500 checked:bg-purple-500 checked:border-purple-500"
                                        checked={formData.attendance[student.id] === 'D'}
                                        onChange={() => {
                                            const newAtt = {...formData.attendance};
                                            if (newAtt[student.id] === 'D') delete newAtt[student.id];
                                            else newAtt[student.id] = 'D';
                                            setFormData({...formData, attendance: newAtt});
                                        }}
                                    />
                                </td>
                             </>
                         ) : (
                             ['S', 'I', 'A', 'D'].map((status) => (
                                <td key={status} className="p-1 sm:p-2 text-center">
                                    <input 
                                        type="checkbox" 
                                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-slate-300 focus:ring-0 cursor-pointer ${
                                            status === 'S' ? 'text-yellow-400 focus:ring-yellow-400 checked:bg-yellow-400 checked:border-yellow-400' :
                                            status === 'I' ? 'text-blue-400 focus:ring-blue-400 checked:bg-blue-400 checked:border-blue-400' :
                                            status === 'A' ? 'text-red-400 focus:ring-red-400 checked:bg-red-400 checked:border-red-400' :
                                            'text-purple-400 focus:ring-purple-400 checked:bg-purple-400 checked:border-purple-400'
                                        }`}
                                    checked={formData.attendance[student.id] === status}
                                    onChange={() => {
                                        const newAtt = {...formData.attendance};
                                        if (newAtt[student.id] === status) delete newAtt[student.id];
                                        else newAtt[student.id] = status as any;
                                        setFormData({...formData, attendance: newAtt});
                                    }}
                                    />
                                </td>
                                ))
                         )}
                       </tr>
                     )})}
                   </tbody>
                 </table>
               </div>
           </div>
      </div>
  );

  // --- CUSTOM MULTI-SELECT COMPONENT (Checklist Style) ---
  const MultiSelectDropdown = ({ options, selectedIds, onChange, placeholder }: any) => {
      const [isOpen, setIsOpen] = useState(false);
      const wrapperRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
          const handleClickOutside = (event: MouseEvent) => {
              if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                  setIsOpen(false);
              }
          };
          document.addEventListener('mousedown', handleClickOutside);
          return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

      const toggleSelection = (id: string) => {
          const newSelection = selectedIds.includes(id) 
            ? selectedIds.filter((sid: string) => sid !== id)
            : [...selectedIds, id];
          onChange(newSelection);
      };

      const selectedNames = options.filter((o: any) => selectedIds.includes(o.id)).map((o: any) => o.name);

      return (
          <div className="relative" ref={wrapperRef}>
              <button 
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-white text-left flex justify-between items-center focus:ring-2 focus:ring-blue-500"
              >
                  <span className={`truncate text-sm ${selectedIds.length === 0 ? 'text-gray-400' : 'text-slate-700 font-bold'}`}>
                      {selectedIds.length === 0 ? placeholder : `${selectedIds.length} Murid Dipilih`}
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-1 custom-scrollbar">
                      {options.map((opt: any) => {
                          const isSelected = selectedIds.includes(opt.id);
                          return (
                              <div 
                                  key={opt.id}
                                  onClick={() => toggleSelection(opt.id)}
                                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                              >
                                  {/* Custom Checkbox UI */}
                                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                      isSelected 
                                      ? 'bg-blue-600 border-blue-600' 
                                      : 'bg-white border-slate-300'
                                  }`}>
                                      {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                                  </div>
                                  
                                  <span className={`text-sm ${isSelected ? 'text-blue-700 font-bold' : 'text-slate-700'}`}>
                                      {opt.name}
                                  </span>
                              </div>
                          );
                      })}
                      {options.length === 0 && <div className="p-3 text-center text-xs text-gray-400">Tidak ada murid tersedia (Hadir).</div>}
                  </div>
              )}
              {selectedIds.length > 0 && (
                 <div className="mt-2 flex flex-wrap gap-1">
                     {selectedNames.map((name: string, idx: number) => {
                         const studentId = options.find((o:any) => o.name === name)?.id;
                         return (
                             <span key={idx} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1 font-medium">
                                 {name}
                                 {studentId && (
                                     <button onClick={() => toggleSelection(studentId)} className="hover:bg-blue-100 rounded-full p-0.5">
                                         <X size={10} />
                                     </button>
                                 )}
                             </span>
                         )
                     })}
                 </div>
              )}
          </div>
      );
  };

  const renderStep1 = () => (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-fade-in">
       {/* ... Same as previous implementation ... */}
       <div className="flex justify-between items-start mb-6">
           <div>
               <h3 className="font-extrabold text-lg text-slate-800">Presensi Murid</h3>
               <p className="text-slate-500 text-sm mt-1">Pilih kelas & tandai murid yang tidak hadir.</p>
           </div>
           
           <button 
             onClick={() => {
                 const newMode = inputMode === 'auto' ? 'manual' : 'auto';
                 setInputMode(newMode);
                 setEditJournalId(null);
                 setFormData({ kelas: '', subject: '', hours: [], material: '', attendance: {}, cleanliness: '', validation: '', notes: '', isConfirmed: false});
             }}
             className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
           >
             {inputMode === 'auto' ? <ToggleLeft size={18}/> : <ToggleRight size={18}/>}
             {inputMode === 'auto' ? 'Mode Jadwal' : 'Mode Manual'}
           </button>
       </div>
       
       <div className="mb-6 space-y-4">
         {inputMode === 'auto' && todaySchedules.length > 0 ? (
             <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pilih Jadwal Hari Ini</label>
                 <div className="grid gap-3">
                     {todaySchedules.map(sch => {
                         const filled = existingJournals.some(j => j.kelas === sch.kelas && j.subject === sch.subject);
                         const isSelected = formData.kelas === sch.kelas && formData.subject === sch.subject;
                         const materialText = filled 
                            ? (existingJournals.find(j => j.kelas === sch.kelas && j.subject === sch.subject)?.material || '-')
                            : (lastMaterials[`${sch.kelas}-${sch.subject}`] || 'Belum ada data materi sebelumnya.');
                         
                         return (
                            <div 
                                key={sch.id}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 relative ${
                                    isSelected 
                                    ? (filled ? 'border-green-500 bg-green-50' : 'border-blue-600 bg-blue-50') 
                                    : (filled ? 'border-green-100 bg-green-50/20' : 'border-slate-100 hover:border-blue-200 bg-white')
                                }`}
                            >
                                <div onClick={() => handleScheduleSelect(sch.id)} className="cursor-pointer flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-sm ${
                                            filled ? 'bg-green-500' : (isSelected ? 'bg-blue-600' : 'bg-slate-400')
                                        }`}>
                                            {sch.kelas}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{sch.subject}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5"><Clock size={12}/> Jam ke-{sch.hour}</p>
                                        </div>
                                    </div>
                                    
                                    {filled ? (
                                        <div className="flex items-center gap-1 text-green-700 text-[10px] font-bold bg-white px-2 py-1 rounded-lg border border-green-200">
                                            <Check size={12} strokeWidth={3} /> {isSelected ? 'DIEDIT' : 'SELESAI'}
                                        </div>
                                    ) : isSelected && (
                                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                                <div onClick={() => handleScheduleSelect(sch.id)} className="cursor-pointer mt-1 pt-2 border-t border-slate-200/50 flex items-start gap-2">
                                     <History size={14} className="text-slate-400 mt-0.5 flex-shrink-0"/>
                                     <div className="text-xs">
                                         <span className="font-bold text-slate-500 block mb-0.5">
                                            {filled ? "Materi Hari Ini:" : "Materi Terakhir:"}
                                         </span>
                                         <p className="text-slate-600 line-clamp-1">"{materialText}"</p>
                                     </div>
                                </div>

                                {isSelected && (
                                    <div className="mt-4 pt-4 border-t border-blue-200 animate-fade-in">
                                        {loading ? (
                                            <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center"><Loader2 className="animate-spin mb-2" size={24}/> Mengambil data siswa...</div>
                                        ) : (
                                            <RenderStudentTable />
                                        )}
                                    </div>
                                )}
                            </div>
                         );
                     })}
                 </div>
             </div>
         ) : (
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Pilih Kelas (Manual)</label>
                <select 
                    className="w-full border border-slate-200 rounded-xl p-3.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-700" 
                    value={formData.kelas} 
                    onChange={e => setFormData({...formData, kelas: e.target.value, attendance: {}})}
                >
                    <option value="">-- Pilih Kelas --</option>
                    {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
         )}
       </div>

       {inputMode !== 'auto' && loading && <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center"><Loader2 className="animate-spin mb-2" size={24}/> Mengambil data siswa...</div>}

       {inputMode !== 'auto' && formData.kelas && !loading && (
         <RenderStudentTable />
       )}

       <div className="flex justify-end mt-8 pt-6 border-t border-slate-100">
         <button disabled={!formData.kelas} onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all">Lanjut <ArrowRight size={18} /></button>
       </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-lg text-slate-800">Detail Pembelajaran</h3>
          {inputMode === 'auto' && <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-100">AUTO</span>}
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Mata Pelajaran</label>
          <input type="text" className="w-full border border-slate-200 rounded-xl p-3.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-slate-700" value={formData.subject} readOnly={inputMode === 'auto'} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Contoh: Matematika"/>
        </div>
        <div>
           <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Jam Pelajaran Ke-</label>
           <div className="flex gap-2 flex-wrap">
             {[1,2,3,4,5,6,7,8,9,10].map(h => (
               <label key={h} className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border-2 cursor-pointer transition-all ${formData.hours.includes(String(h)) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}>
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
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Materi / Topik Bahasan</label>
          <textarea 
            className="w-full border border-slate-200 rounded-xl p-4 min-h-[140px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 font-medium leading-relaxed" 
            value={formData.material} 
            onChange={handleMaterialChange} 
            placeholder="Tuliskan ringkasan materi yang diajarkan hari ini..."
          ></textarea>
          {isDhuha && <p className="text-[10px] text-green-600 mt-1 font-bold flex items-center gap-1"><Sparkles size={10}/> Materi otomatis terisi untuk Salat Dhuha.</p>}
          <p className="text-[10px] text-gray-400 mt-1 italic">*Teks akan otomatis diformat kapital di awal kata (kecuali kata sambung).</p>
        </div>
      </div>
      <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
         <button onClick={handleBack} className="text-slate-500 hover:bg-slate-50 px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"><ArrowLeft size={18} /> Kembali</button>
         <button disabled={!formData.subject || !formData.material} onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all">Lanjut <ArrowRight size={18} /></button>
       </div>
    </div>
  );

  // --- NEW STEP 3: CATATAN MURID ---
  const renderStep3 = () => {
    const presentStudents = students.filter(s => !formData.attendance[s.id]);

    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-fade-in">
         <h3 className="font-extrabold text-lg text-slate-800 mb-4">Catatan Murid</h3>
         
         {/* SECTION 1: KEDISIPLINAN */}
         <div className="mb-8">
             <div className="flex justify-between items-center mb-3">
                 <h4 className="font-bold text-gray-700 text-sm">Catatan Kedisiplinan</h4>
             </div>
             
             <div className="space-y-3">
                 {notesData.discipline.map((row, idx) => (
                     <div key={idx} className="flex flex-col gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50 relative">
                         {/* Row Controls: Category & Follow Up */}
                         <div className="flex flex-col md:flex-row gap-3">
                            <div className="w-full md:w-1/2">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Jenis Pelanggaran</label>
                                <select 
                                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                                    value={row.category}
                                    onChange={e => updateNoteRow('discipline', idx, 'category', e.target.value)}
                                >
                                    <option value="">-- Pilih Jenis --</option>
                                    {disciplineTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="w-full md:w-1/2">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1"><Gavel size={10}/> Tindak Lanjut</label>
                                <select 
                                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                                    value={row.followUp || ''}
                                    onChange={e => updateNoteRow('discipline', idx, 'followUp', e.target.value)}
                                >
                                    <option value="">-- Pilih Tindakan --</option>
                                    {followUpTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                                </select>
                            </div>
                         </div>

                         {/* NEW: NOTE INPUT (MANUAL) */}
                         <div>
                             <label className="block text-[10px] font-bold text-slate-500 mb-1">Keterangan / Catatan Kejadian</label>
                             <input 
                                type="text"
                                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="Contoh: Siswa tidur saat jam pelajaran berlangsung..."
                                value={row.note || ''}
                                onChange={e => updateNoteRow('discipline', idx, 'note', e.target.value)}
                             />
                         </div>
                         
                         {/* Student Select */}
                         <div className="w-full">
                             <label className="block text-[10px] font-bold text-slate-500 mb-1">Murid Terlibat</label>
                             <MultiSelectDropdown 
                                 options={presentStudents} 
                                 selectedIds={row.studentIds}
                                 onChange={(ids: string[]) => updateNoteRow('discipline', idx, 'studentIds', ids)}
                                 placeholder="Pilih Murid (Hadir)"
                             />
                         </div>

                         <button onClick={() => removeNoteRow('discipline', idx)} className="absolute top-2 right-2 p-2 text-red-500 hover:bg-red-50 rounded-lg">
                             <Trash2 size={16}/>
                         </button>
                     </div>
                 ))}
                 <button onClick={() => addNoteRow('discipline')} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                     <Plus size={14}/> Tambah Catatan Kedisiplinan
                 </button>
             </div>
         </div>

         {/* SECTION 2: KEAKTIFAN */}
         <div className="mb-6">
             <div className="flex justify-between items-center mb-3">
                 <h4 className="font-bold text-gray-700 text-sm">Catatan Keaktifan</h4>
             </div>
             
             <div className="space-y-3">
                 {notesData.activity.map((row, idx) => (
                     <div key={idx} className="flex flex-col gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50 relative">
                         <div className="flex flex-col md:flex-row gap-3">
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Jenis Keaktifan</label>
                                <select 
                                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                                    value={row.category}
                                    onChange={e => updateNoteRow('activity', idx, 'category', e.target.value)}
                                >
                                    <option value="">-- Pilih Jenis --</option>
                                    {activityTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                                </select>
                            </div>
                         </div>
                         
                         <div>
                             <label className="block text-[10px] font-bold text-slate-500 mb-1">Keterangan (Opsional)</label>
                             <input 
                                type="text"
                                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-green-500"
                                placeholder="Contoh: Menjawab pertanyaan dengan benar..."
                                value={row.note || ''}
                                onChange={e => updateNoteRow('activity', idx, 'note', e.target.value)}
                             />
                         </div>

                         <div className="w-full">
                             <label className="block text-[10px] font-bold text-slate-500 mb-1">Murid Terlibat</label>
                             <MultiSelectDropdown 
                                 options={presentStudents} 
                                 selectedIds={row.studentIds}
                                 onChange={(ids: string[]) => updateNoteRow('activity', idx, 'studentIds', ids)}
                                 placeholder="Pilih Murid (Hadir)"
                             />
                         </div>
                         <button onClick={() => removeNoteRow('activity', idx)} className="absolute top-2 right-2 p-2 text-red-500 hover:bg-red-50 rounded-lg">
                             <Trash2 size={16}/>
                         </button>
                     </div>
                 ))}
                 <button onClick={() => addNoteRow('activity')} className="text-green-600 text-xs font-bold flex items-center gap-1 hover:underline">
                     <Plus size={14}/> Tambah Catatan Keaktifan
                 </button>
             </div>
         </div>

         <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            <button onClick={handleBack} className="text-slate-500 hover:bg-slate-50 px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"><ArrowLeft size={18} /> Kembali</button>
            <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all">Lanjut <ArrowRight size={18} /></button>
        </div>
      </div>
    );
  };

  // --- STEP 4 (Validation) ---
  const renderStep4 = () => {
    // Calculate total notes from rows that have studentIds
    const noteCount = [...notesData.discipline, ...notesData.activity].reduce((acc, row) => acc + row.studentIds.length, 0);

    return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-fade-in">
       <h3 className="font-extrabold text-lg text-slate-800 mb-1">Validasi Akhir</h3>
       <p className="text-slate-500 text-sm mb-6">Konfirmasi status kelas sebelum mengirim laporan.</p>
       
       <div className="space-y-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
             <ul className="text-sm space-y-2 text-slate-700">
                 <li className="flex"><span className="font-bold text-slate-400 w-24 flex-shrink-0">Mapel</span> <span className="font-bold">: {formData.subject}</span></li>
                 <li className="flex"><span className="font-bold text-slate-400 w-24 flex-shrink-0">Kelas</span> <span className="font-bold">: {formData.kelas}</span></li>
                 <li className="flex"><span className="font-bold text-slate-400 w-24 flex-shrink-0">Jam Ke</span> <span className="font-bold">: {formData.hours.join(', ')}</span></li>
                 <li className="flex"><span className="font-bold text-slate-400 w-24 flex-shrink-0">Absen</span> <span className="font-extrabold text-red-500 bg-red-50 px-2 rounded">: {Object.keys(formData.attendance).length} Murid</span></li>
                 <li className="flex"><span className="font-bold text-slate-400 w-24 flex-shrink-0">Catatan</span> <span className="font-bold">: {noteCount} Murid</span></li>
             </ul>
          </div>

          {/* ... (SAME AS BEFORE) ... */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">Kondisi Kebersihan Kelas</label>
            <div className="grid grid-cols-2 gap-4">
               <label className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center gap-3 transition-all ${formData.cleanliness === 'mengarahkan_piket' ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-md' : 'border-slate-100 hover:border-orange-200 bg-white text-slate-500'}`}>
                 <input type="radio" name="cleanliness" value="mengarahkan_piket" className="hidden" checked={formData.cleanliness === 'mengarahkan_piket'} onChange={e => setFormData({...formData, cleanliness: e.target.value})} />
                 <Sparkles size={28} /> <span className="text-xs font-bold text-center">Perlu Dibersihkan</span>
               </label>
               <label className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center gap-3 transition-all ${formData.cleanliness === 'sudah_bersih' ? 'border-green-500 bg-green-50 text-green-700 shadow-md' : 'border-slate-100 hover:border-green-200 bg-white text-slate-500'}`}>
                 <input type="radio" name="cleanliness" value="sudah_bersih" className="hidden" checked={formData.cleanliness === 'sudah_bersih'} onChange={e => setFormData({...formData, cleanliness: e.target.value})} />
                 <CheckCircle2 size={28} /> <span className="text-xs font-bold text-center">Sudah Bersih</span>
               </label>
            </div>
          </div>

          <div>
            <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.isConfirmed ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-200 hover:border-blue-300'}`}>
                 <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0 ${formData.isConfirmed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                    {formData.isConfirmed && <Check size={16} strokeWidth={4} />}
                 </div>
                 <input type="checkbox" className="hidden" checked={formData.isConfirmed} onChange={e => setFormData({...formData, isConfirmed: e.target.checked})} />
                 <span className="font-bold text-slate-700 text-sm leading-tight">Saya menyatakan bahwa saya benar-benar melaksanakan KBM di dalam kelas dengan baik.</span>
            </label>
          </div>

          <div>
             <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide"><MessageSquare size={14}/> Catatan Tambahan (Opsional)</label>
             <textarea className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={2} value={formData.notes} onChange={e => setFormData(prev => ({...prev, notes: e.target.value}))} placeholder="Catatan kejadian khusus..."></textarea>
          </div>
       </div>

       <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
         <button onClick={handleBack} className="text-slate-500 hover:bg-slate-50 px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"><ArrowLeft size={18} /> Kembali</button>
         <button 
            disabled={!formData.cleanliness || !formData.isConfirmed || loading} 
            onClick={handlePreSubmit} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all"
         >
           {loading ? 'Menyimpan...' : (editJournalId ? <><Edit3 size={18} /> Update Jurnal</> : <><Send size={18} /> Kirim Data</>)}
         </button>
       </div>
    </div>
  );
  };

  // Helper functions used in render
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
  const getPresentStudents = () => students.filter(s => !formData.attendance[s.id]);

  return (
    <Layout>
      <div className="max-w-xl mx-auto pb-24">
        <div className="flex justify-between items-center mb-8 px-2">
            <div>
               <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                   {editJournalId ? 'Edit Jurnal' : 'Isi Jurnal KBM'}
               </h2>
               <p className="text-slate-500 font-medium text-sm mt-1">Langkah {step} dari 4</p>
            </div>
            <div className="flex gap-2">
               {[1,2,3,4].map(i => <div key={i} className={`h-2 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-600 w-8' : 'bg-slate-200 w-3'}`}></div>)}
            </div>
        </div>
        
        {initLoading ? <div className="text-center py-20 text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Memuat data...</div> : 
            <>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </>
        }

        {/* MODAL 1: PILIH JENIS PENILAIAN */}
        {showAssessmentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-all">
                    <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <ClipboardCheck size={24}/> Konfirmasi Penilaian
                        </h3>
                        <button onClick={() => setShowAssessmentModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
                    </div>

                    <div className="p-6 space-y-4 bg-slate-50">
                        <p className="text-slate-600 font-medium mb-2">Apakah ada penilaian pada jam ini?</p>
                        
                        <button 
                            onClick={() => handleAssessmentSelect('harian')} 
                            className="w-full flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-purple-500 hover:shadow-lg hover:shadow-purple-100 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                                <ClipboardList size={20} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-slate-800">Penilaian Harian (PH)</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Ulangan / Tes Tulis.</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => handleAssessmentSelect('tugas')} 
                            className="w-full flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-orange-500 hover:shadow-lg hover:shadow-orange-100 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors shadow-sm">
                                <BookOpenCheck size={20} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-slate-800">Penilaian Tugas</h4>
                                <p className="text-xs text-slate-500 mt-0.5">PR / Proyek / Portofolio.</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => handleAssessmentSelect('none')} 
                            className="w-full flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-400 hover:shadow-lg transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-slate-600 group-hover:text-white transition-colors shadow-sm">
                                <Ban size={20} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-slate-800">Tidak Ada Penilaian</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Hanya materi biasa.</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL 2: CHECKLIST MURID */}
        {showStudentChecklistModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh]">
                    <div className="bg-purple-600 p-6 text-white">
                        <h3 className="font-bold text-xl mb-1">Daftar Murid</h3>
                        <p className="text-purple-100 text-xs">Centang yang <b>TIDAK</b> mengikuti penilaian.</p>
                    </div>

                    <div className="p-2 overflow-y-auto flex-1 bg-slate-50 custom-scrollbar">
                        {getPresentStudents().length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <p className="text-sm font-medium">Tidak ada murid hadir.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 p-3">
                                {getPresentStudents().map(s => {
                                    const isMissing = missingStudents.includes(s.id);
                                    return (
                                        <div 
                                            key={s.id} 
                                            onClick={() => handleMissingStudentToggle(s.id)} 
                                            className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer border transition-all ${
                                                isMissing 
                                                ? 'bg-red-50 border-red-300 shadow-sm' 
                                                : 'bg-white border-slate-200 hover:border-blue-400'
                                            }`}
                                        >
                                            <span className={`text-sm font-bold ${isMissing ? 'text-red-700' : 'text-slate-700'}`}>
                                                {s.name}
                                            </span>
                                            <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                                                isMissing 
                                                ? 'bg-red-500 border-red-500 text-white' 
                                                : 'border-slate-300 bg-white'
                                            }`}>
                                                {isMissing && <Check size={16} strokeWidth={4}/>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-200 bg-white flex gap-3">
                        <button 
                            onClick={() => {
                                setShowStudentChecklistModal(false);
                                setShowAssessmentModal(true);
                            }} 
                            className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm transition-colors"
                        >
                            Kembali
                        </button>
                        <button 
                            onClick={handleFinishAssessment} 
                            className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-200 transition-colors"
                        >
                            <ClipboardCheck size={18}/> Simpan
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* STATUS ALERT (Standard Toast) */}
        {alertState.isOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center transform scale-100">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ${alertState.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {alertState.type === 'success' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800 mb-2">{alertState.title}</h3>
                    <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">{alertState.message}</p>
                    <button onClick={handleCloseAlert} className="w-full py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">OK, Lanjutkan</button>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default JurnalForm;
