const fs = require('fs');
let code = fs.readFileSync('pages/OperatorDashboard.tsx', 'utf8');

const oldHomeroom = `              supabase.from('homeroom_attendance').select('student_id, status, kelas').eq('academic_year', academicYear || '2025/2026').eq('semester', semester || 'Ganjil').gte('date', semesterStart ? \`\${semesterStart}\` : '2000-01-01').lte('date', semesterEnd ? \`\${semesterEnd}\` : '2100-01-01').eq('date', filterDate)`;

const newHomeroom = `              supabase.from('homeroom_attendance').select('student_id, status, kelas').eq('date', filterDate).then(async (res) => {
                  if (res.data) {
                      return { data: res.data.filter((h: any) => h.academic_year === (academicYear || '2025/2026') || !h.academic_year || h.academic_year === '2025/2026'), error: res.error };
                  }
                  return res;
              })`;

code = code.replace(oldHomeroom, newHomeroom);
fs.writeFileSync('pages/OperatorDashboard.tsx', code);
console.log("Patched OperatorDashboard homeroom query");
