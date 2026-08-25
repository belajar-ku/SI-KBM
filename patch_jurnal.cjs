const fs = require('fs');
let code = fs.readFileSync('pages/JurnalForm.tsx', 'utf8');

const fetchOld = `        const [schedulesRes, settingsRes] = await Promise.all([
             supabase.from('schedules').select('*').eq('teacher_id', profile.id).eq('day_of_week', dbDay).eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').eq('schedule_version', activeScheduleVersion || 'Utama').order('hour').then(async (res) => {
                 if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year') || res.error.message?.includes('semester'))) {
                     const fallback = await supabase.from('schedules').select('*').eq('teacher_id', profile.id).eq('day_of_week', dbDay).order('hour');
                     if (fallback.data && fallback.data.length > 0 && fallback.data[0].academic_year !== undefined) {
                         fallback.data = fallback.data.filter(s => s.academic_year === (academicYear || '2025/2026') && s.semester === (semester || 'Ganjil'));
                     }
                     return fallback;
                 }
                 return res;
             }),
             supabase.from('app_settings').select('*')
        ]);

        const schedules = schedulesRes.data;`;

const fetchNew = `        const [schedulesRes, settingsRes, activityRes] = await Promise.all([
             supabase.from('schedules').select('*').eq('teacher_id', profile.id).eq('day_of_week', dbDay).eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').eq('schedule_version', activeScheduleVersion || 'Utama').order('hour').then(async (res) => {
                 if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year') || res.error.message?.includes('semester'))) {
                     const fallback = await supabase.from('schedules').select('*').eq('teacher_id', profile.id).eq('day_of_week', dbDay).order('hour');
                     if (fallback.data && fallback.data.length > 0 && fallback.data[0].academic_year !== undefined) {
                         fallback.data = fallback.data.filter(s => s.academic_year === (academicYear || '2025/2026') && s.semester === (semester || 'Ganjil'));
                     }
                     return fallback;
                 }
                 return res;
             }),
             supabase.from('app_settings').select('*'),
             supabase.from('school_activities').select('*').eq('date', todayStr).single()
        ]);

        let schedules = schedulesRes.data;
        if (activityRes.data) {
            schedules = [];
            if (profile.wali_kelas) {
                schedules = [
                    { id: 'act-pagi', hour: '1', kelas: profile.wali_kelas, subject: 'Presensi Pagi - ' + activityRes.data.name, teacher_id: profile.id, day_of_week: dbDay },
                    { id: 'act-pulang', hour: '2', kelas: profile.wali_kelas, subject: 'Presensi Pulang - ' + activityRes.data.name, teacher_id: profile.id, day_of_week: dbDay }
                ];
            }
        }`;
code = code.replace(fetchOld, fetchNew);

fs.writeFileSync('pages/JurnalForm.tsx', code);
console.log("Patched JurnalForm for School Activities");
