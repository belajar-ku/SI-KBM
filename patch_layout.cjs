const fs = require('fs');
let code = fs.readFileSync('components/Layout.tsx', 'utf8');

const fetchOld = `                    let { data: scheds, error: schedErr } = await supabase.from('schedules').select('*')
                        .eq('teacher_id', profile.id)
                        .eq('day_of_week', dbDay)
                        .eq('academic_year', academicYear || '2025/2026')
                        .eq('semester', semester || 'Ganjil')
                        .eq('schedule_version', activeScheduleVersion || 'Utama');
                        
                    if (schedErr && (schedErr.code === '42703' || schedErr.message?.includes('academic_year') || schedErr.message?.includes('schedule_version'))) {
                        const fallback = await supabase.from('schedules').select('*').eq('teacher_id', profile.id).eq('day_of_week', dbDay).eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Genap');
                        if (fallback.error) {
                             // If even academic_year doesn't exist
                             const ultraFallback = await supabase.from('schedules').select('*').eq('teacher_id', profile.id).eq('day_of_week', dbDay);
                             scheds = (ultraFallback.data || []).filter(s => s.academic_year === academicYear && s.semester === semester);
                        } else {
                             scheds = fallback.data;
                        }
                    }`;

const fetchNew = `                    let { data: scheds, error: schedErr } = await supabase.from('schedules').select('*')
                        .eq('teacher_id', profile.id)
                        .eq('day_of_week', dbDay)
                        .eq('academic_year', academicYear || '2025/2026')
                        .eq('semester', semester || 'Ganjil')
                        .eq('schedule_version', activeScheduleVersion || 'Utama');
                        
                    if (schedErr && (schedErr.code === '42703' || schedErr.message?.includes('academic_year') || schedErr.message?.includes('schedule_version'))) {
                        const fallback = await supabase.from('schedules').select('*').eq('teacher_id', profile.id).eq('day_of_week', dbDay).eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Genap');
                        if (fallback.error) {
                             // If even academic_year doesn't exist
                             const ultraFallback = await supabase.from('schedules').select('*').eq('teacher_id', profile.id).eq('day_of_week', dbDay);
                             scheds = (ultraFallback.data || []).filter(s => s.academic_year === academicYear && s.semester === semester);
                        } else {
                             scheds = fallback.data;
                        }
                    }

                    // Cek kegiatan sekolah
                    const { data: activity } = await supabase.from('school_activities').select('*').eq('date', todayStr).single();
                    if (activity) {
                        scheds = [];
                        if (profile.wali_kelas) {
                            scheds = [
                                { id: 'act-pagi', hour: '1', kelas: profile.wali_kelas, subject: 'Presensi Pagi - ' + activity.name, teacher_id: profile.id, day_of_week: dbDay },
                                { id: 'act-pulang', hour: '2', kelas: profile.wali_kelas, subject: 'Presensi Pulang - ' + activity.name, teacher_id: profile.id, day_of_week: dbDay }
                            ];
                        }
                    }`;
code = code.replace(fetchOld, fetchNew);

fs.writeFileSync('components/Layout.tsx', code);
console.log("Patched Layout.tsx for School Activities");
