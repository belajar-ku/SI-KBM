const fs = require('fs');
let code = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

const fetchOld = `        const [todaySchedRes, todayJournalRes] = await Promise.all([
            supabase.from('schedules').select('*').eq('teacher_id', profile?.id).eq('day_of_week', dbDay).eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').eq('schedule_version', activeScheduleVersion || 'Utama').then(async (res) => {
                if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year'))) {
                    const fallback = await supabase.from('schedules').select('*').eq('teacher_id', profile?.id).eq('day_of_week', dbDay);
                    if (fallback.data && fallback.data.length > 0 && fallback.data[0].academic_year !== undefined) {
                        fallback.data = fallback.data.filter(s => s.academic_year === (academicYear || '2025/2026') && s.semester === (semester || 'Ganjil'));
                    }
                    return fallback;
                }
                return res;
            }),
            supabase.from('journals').select('*').eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').gte('created_at', semesterStart ? \`\${semesterStart}T00:00:00+07:00\` : '2000-01-01T00:00:00+07:00').lte('created_at', semesterEnd ? \`\${semesterEnd}T23:59:59+07:00\` : '2100-01-01T23:59:59+07:00').eq('teacher_id', profile?.id).gte('created_at', todayStart).lte('created_at', todayEnd)
        ]);`;

const fetchNew = `        const [todaySchedRes, todayJournalRes, activityRes] = await Promise.all([
            supabase.from('schedules').select('*').eq('teacher_id', profile?.id).eq('day_of_week', dbDay).eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').eq('schedule_version', activeScheduleVersion || 'Utama').then(async (res) => {
                if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year'))) {
                    const fallback = await supabase.from('schedules').select('*').eq('teacher_id', profile?.id).eq('day_of_week', dbDay);
                    if (fallback.data && fallback.data.length > 0 && fallback.data[0].academic_year !== undefined) {
                        fallback.data = fallback.data.filter(s => s.academic_year === (academicYear || '2025/2026') && s.semester === (semester || 'Ganjil'));
                    }
                    return fallback;
                }
                return res;
            }),
            supabase.from('journals').select('*').eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').gte('created_at', semesterStart ? \`\${semesterStart}T00:00:00+07:00\` : '2000-01-01T00:00:00+07:00').lte('created_at', semesterEnd ? \`\${semesterEnd}T23:59:59+07:00\` : '2100-01-01T23:59:59+07:00').eq('teacher_id', profile?.id).gte('created_at', todayStart).lte('created_at', todayEnd),
            supabase.from('school_activities').select('*').eq('date', todayStr).single()
        ]);

        if (activityRes.data) {
            // Jika ada kegiatan sekolah, jadwal normal ditiadakan
            if (todaySchedRes.data) todaySchedRes.data = [];
            
            // Jika wali kelas, tambahkan jadwal kegiatan khusus
            if (profile?.wali_kelas) {
                todaySchedRes.data = [
                    { id: 'act-pagi', hour: '1', kelas: profile.wali_kelas, subject: 'Presensi Pagi - ' + activityRes.data.name, teacher_id: profile.id, day_of_week: dbDay },
                    { id: 'act-pulang', hour: '2', kelas: profile.wali_kelas, subject: 'Presensi Pulang - ' + activityRes.data.name, teacher_id: profile.id, day_of_week: dbDay }
                ];
            }
        }`;
code = code.replace(fetchOld, fetchNew);

fs.writeFileSync('pages/Dashboard.tsx', code);
console.log("Patched Dashboard for School Activities");
