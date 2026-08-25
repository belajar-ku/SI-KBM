const fs = require('fs');
let code = fs.readFileSync('pages/JurnalForm.tsx', 'utf8');

// 1. Add isSchoolActivity
const isDhuhaLine = `const isDhuha = isSpecialSubjectDhuha(formData.subject);`;
const newIsDhuhaLine = `const isDhuha = isSpecialSubjectDhuha(formData.subject);\n  const isSchoolActivity = formData.subject.startsWith('Presensi Pagi -') || formData.subject.startsWith('Presensi Pulang -');`;
code = code.replace(isDhuhaLine, newIsDhuhaLine);

// 2. Hide step 2 fields if isSchoolActivity
const step2Fields = `<div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Mata Pelajaran</label>`;
const newStep2Fields = `{isSchoolActivity && <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-sm font-medium flex items-center gap-2"><Sparkles size={16}/> Mengisi presensi untuk Kegiatan Sekolah. Materi dan detail lainnya akan diisi otomatis.</div>}
            <div className={\`space-y-6 \${isSchoolActivity ? 'hidden' : ''}\`}>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Mata Pelajaran</label>`;
code = code.replace(step2Fields, newStep2Fields);

// 3. Skip steps in handleNext
const oldHandleNext = `  const handleNext = () => {
    if (step === 1) {
        if (!formData.kelas) return showAlert('Error', 'Mohon pilih jadwal atau isi kelas (mode manual).');
    }
    if (step === 2) {
        if (!formData.subject || !formData.material) return showAlert('Error', 'Mohon lengkapi mata pelajaran dan materi.');
        if (formData.hours.length === 0) return showAlert('Error', 'Mohon pilih minimal 1 jam pelajaran.');
    }
    setStep(step + 1);
  };`;
const newHandleNext = `  const handleNext = () => {
    if (step === 1) {
        if (!formData.kelas) return showAlert('Error', 'Mohon pilih jadwal atau isi kelas (mode manual).');
        
        // Skip step 2, 3, 4 for school activities, just submit!
        if (isSchoolActivity) {
            submitActivityAttendance();
            return;
        }
    }
    if (step === 2) {
        if (!formData.subject || !formData.material) return showAlert('Error', 'Mohon lengkapi mata pelajaran dan materi.');
        if (formData.hours.length === 0) return showAlert('Error', 'Mohon pilih minimal 1 jam pelajaran.');
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
            academic_year: academicYear || '2025/2026',
            semester: semester || 'Ganjil'
        };
        const { data: jData, error: jErr } = await supabase.from('journals').insert(payload).select().single();
        if (jErr) throw jErr;
        
        const attLogs = Object.entries(formData.attendance).map(([studentId, status]) => {
            const student = students.find(s => s.id === studentId);
            return {
                journal_id: jData.id,
                student_name: student?.name || 'Unknown',
                student_id: studentId,
                status: status,
                academic_year: academicYear || '2025/2026',
                semester: semester || 'Ganjil'
            };
        });
        if (attLogs.length > 0) {
            const { error: attErr } = await supabase.from('attendance_logs').insert(attLogs);
            if (attErr) throw attErr;
        }
        
        // Juga simpan ke homeroom_attendance
        const todayStr = getWIBISOString();
        const hrAtts = Object.entries(formData.attendance).map(([studentId, status]) => ({
            date: todayStr,
            kelas: formData.kelas,
            student_id: studentId,
            status: status,
            academic_year: academicYear || '2025/2026',
            semester: semester || 'Ganjil'
        }));
        if (hrAtts.length > 0) {
            await supabase.from('homeroom_attendance').upsert(hrAtts, { onConflict: 'date,student_id' });
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

// 4. Update the "Lanjut" button in Step 1
const oldBtn1 = `<button disabled={!formData.kelas} onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all">
          Lanjut <ArrowRight size={18} />
        </button>`;
const newBtn1 = `<button disabled={!formData.kelas || loading} onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all">
          {isSchoolActivity ? (loading ? 'Menyimpan...' : 'Kirim Presensi') : 'Lanjut'} 
          {isSchoolActivity ? <Check size={18}/> : <ArrowRight size={18} />}
        </button>`;
code = code.replace(oldBtn1, newBtn1);

fs.writeFileSync('pages/JurnalForm.tsx', code);
console.log("Patched JurnalForm completely for School Activities");
