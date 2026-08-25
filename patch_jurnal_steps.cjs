const fs = require('fs');
let code = fs.readFileSync('pages/JurnalForm.tsx', 'utf8');

// Check if schedule is a school activity
const oldIsDhuha = `const isDhuha = formData.subject.toLowerCase().includes('dhuha');`;
const newIsDhuha = `const isDhuha = formData.subject.toLowerCase().includes('dhuha');
  const isSchoolActivity = selectedSchedule?.id.startsWith('act-');`;
code = code.replace(oldIsDhuha, newIsDhuha);

// Skip step 1 fields if isSchoolActivity
const oldStep1Render = `<div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Mata Pelajaran</label>`;
const newStep1Render = `{isSchoolActivity && <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-sm font-medium flex items-center gap-2"><Sparkles size={16}/> Mengisi presensi untuk Kegiatan Sekolah. Materi dan detail lainnya akan diisi otomatis.</div>}
            <div className={\`space-y-6 \${isSchoolActivity ? 'hidden' : ''}\`}>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Mata Pelajaran</label>`;
code = code.replace(oldStep1Render, newStep1Render);

// Modify handleNext to handle skipping for school activities
const oldHandleNext = `  const handleNext = () => {
    if (step === 1) {
        if (!formData.subject || !formData.material) return showAlert('Error', 'Mohon lengkapi mata pelajaran dan materi.');
        if (formData.hours.length === 0) return showAlert('Error', 'Mohon pilih minimal 1 jam pelajaran.');
    }
    setStep(step + 1);
  };`;
const newHandleNext = `  const handleNext = () => {
    if (step === 1) {
        if (!isSchoolActivity) {
            if (!formData.subject || !formData.material) return showAlert('Error', 'Mohon lengkapi mata pelajaran dan materi.');
            if (formData.hours.length === 0) return showAlert('Error', 'Mohon pilih minimal 1 jam pelajaran.');
        } else {
            // For school activity, auto-fill material
            if(!formData.material) formData.material = 'Kegiatan Sekolah';
        }
    }
    
    // Skip step 3 and 4 for school activities
    if (isSchoolActivity && step === 2) {
        // Prepare for submit directly from step 2
        submitActivityAttendance();
        return;
    }
    
    setStep(step + 1);
  };
  
  const submitActivityAttendance = async () => {
      setLoading(true);
      try {
        const payload = {
            teacher_id: profile?.id,
            kelas: formData.kelas,
            subject: formData.subject,
            hours: formData.hours.join(','),
            material: 'Kegiatan Sekolah',
            cleanliness: 'sudah_bersih',
            validation: 'hadir_kbm',
            academic_year: settings.academic_year || '2025/2026',
            semester: settings.semester || 'Ganjil'
        };
        const { data: jData, error: jErr } = await supabase.from('journals').insert(payload).select().single();
        if (jErr) throw jErr;
        
        const attLogs = Object.entries(formData.attendance).map(([studentId, status]) => {
            const student = students.find(s => s.id === studentId);
            return {
                journal_id: jData.id,
                student_name: student?.name || 'Unknown',
                status: status,
                academic_year: settings.academic_year || '2025/2026',
                semester: settings.semester || 'Ganjil'
            };
        });
        if (attLogs.length > 0) {
            const { error: attErr } = await supabase.from('attendance_logs').insert(attLogs);
            if (attErr) throw attErr;
        }
        
        await showAlert('Berhasil', 'Presensi kegiatan berhasil disimpan!');
        navigate('/dashboard');
      } catch (err: any) {
          console.error(err);
          showAlert('Error', err.message);
          setLoading(false);
      }
  };`;
code = code.replace(oldHandleNext, newHandleNext);

// Replace "Lanjut" button text on step 2 for isSchoolActivity
const oldStep2Btn = `<button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all">Lanjut <ArrowRight size={18} /></button>`;
const newStep2Btn = `<button onClick={handleNext} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all disabled:opacity-50">
    {isSchoolActivity ? (loading ? 'Menyimpan...' : 'Kirim Presensi') : 'Lanjut'} 
    {isSchoolActivity ? <Check size={18}/> : <ArrowRight size={18} />}
</button>`;
code = code.replace(oldStep2Btn, newStep2Btn);

// In handleScheduleSelect, auto-fill for activity
const oldSelect = `setFormData({ ...formData, kelas: sched.kelas, subject: sched.subject, hours: sched.hour.split(',').map((h: string) => h.trim()) });`;
const newSelect = `setFormData({ ...formData, kelas: sched.kelas, subject: sched.subject, hours: sched.hour.split(',').map((h: string) => h.trim()), material: sched.id.startsWith('act-') ? 'Kegiatan Sekolah' : formData.material });`;
code = code.replace(oldSelect, newSelect);

fs.writeFileSync('pages/JurnalForm.tsx', code);
console.log("Patched JurnalForm steps for School Activities");
