const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../pages/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

const t1 = `                  if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year'))) {
                      const fallback = await supabase.from('schedules').select('*').eq('day_of_week', dbDay);
                      if (academicYear === '2025/2026' && semester === 'Genap') return fallback;
                      return { data: [], error: null };
                  }`;
const r1 = `                  if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year'))) {
                      const fallback = await supabase.from('schedules').select('*').eq('day_of_week', dbDay);
                      if (fallback.data && fallback.data.length > 0 && fallback.data[0].academic_year !== undefined) {
                          fallback.data = fallback.data.filter(s => s.academic_year === (academicYear || '2025/2026') && s.semester === (semester || 'Ganjil'));
                      }
                      return fallback;
                  }`;
content = content.replace(t1, r1);

const t2 = `        if (mySchedError && (mySchedError.code === '42703' || mySchedError.message?.includes('academic_year'))) {
            const fallback = await supabase.from('schedules').select('day_of_week, hour').eq('teacher_id', profile?.id);
            if (academicYear === '2025/2026' && semester === 'Genap') mySchedules = fallback.data;
            else mySchedules = [];
        }`;
const r2 = `        if (mySchedError && (mySchedError.code === '42703' || mySchedError.message?.includes('academic_year'))) {
            const fallback = await supabase.from('schedules').select('*').eq('teacher_id', profile?.id);
            if (fallback.data && fallback.data.length > 0 && fallback.data[0].academic_year !== undefined) {
                mySchedules = fallback.data.filter(s => s.academic_year === (academicYear || '2025/2026') && s.semester === (semester || 'Ganjil'));
            } else {
                mySchedules = fallback.data;
            }
        }`;
content = content.replace(t2, r2);

const t3 = `                if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year'))) {
                    const fallback = await supabase.from('schedules').select('*').eq('teacher_id', profile?.id).eq('day_of_week', dbDay);
                    if (academicYear === '2025/2026' && semester === 'Genap') return fallback;
                    return { data: [], error: null };
                }`;
const r3 = `                if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year'))) {
                    const fallback = await supabase.from('schedules').select('*').eq('teacher_id', profile?.id).eq('day_of_week', dbDay);
                    if (fallback.data && fallback.data.length > 0 && fallback.data[0].academic_year !== undefined) {
                        fallback.data = fallback.data.filter(s => s.academic_year === (academicYear || '2025/2026') && s.semester === (semester || 'Ganjil'));
                    }
                    return fallback;
                }`;
content = content.replace(t3, r3);

fs.writeFileSync(file, content);
console.log('Fixed Dashboard fallback');
