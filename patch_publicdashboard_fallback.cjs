const fs = require('fs');
let code = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const oldHomeroom = `            supabase.from('homeroom_attendance').select('student_id, status, kelas').eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').gte('date', semesterStart ? \`\${semesterStart}\` : '2000-01-01').lte('date', semesterEnd ? \`\${semesterEnd}\` : '2100-01-01').eq('date', todayStr)`;

const newHomeroom = `            supabase.from('homeroom_attendance').select('student_id, status, kelas').eq('date', todayStr).then(async (res) => {
                if (res.data) {
                    // Client-side filter to be safe, but actually we just want today's data regardless of academic_year since it's today
                    // The bug was that Wali input didn't have academic_year set, so it defaulted to 2025/2026, while the dashboard might be querying 2024/2025
                    return { data: res.data.filter((h: any) => h.academic_year === (academicYear || '2025/2026') || !h.academic_year || h.academic_year === '2025/2026'), error: res.error };
                }
                return res;
            })`;

code = code.replace(oldHomeroom, newHomeroom);
fs.writeFileSync('pages/PublicDashboard.tsx', code);
console.log("Patched PublicDashboard homeroom query");
