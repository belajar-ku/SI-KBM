const fs = require('fs');
let code = fs.readFileSync('pages/OperatorDashboard.tsx', 'utf8');

const regex = /supabase\.from\('students'\)\.select\('id, kelas, name'\)\.eq\('academic_year', academicYear \|\| '2025\/2026'\)\.then\(async \(res\) => \{\s+if \(res\.error && \(res\.error\.code === '42703' \|\| res\.error\.message\?\.includes\('academic_year'\)\)\) \{\s+return supabase\.from\('students'\)\.select\('id, kelas, name'\)\.eq\('academic_year', academicYear \|\| '2025\/2026'\);\s+\}/g;

code = code.replace(regex, `supabase.from('students').select('id, kelas, name').eq('academic_year', academicYear || '2025/2026').then(async (res) => {
                  if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year'))) {
                      return supabase.from('students').select('id, kelas, name');
                  }
                  if (res.data && res.data.length === 0) {
                      const allStudents = await supabase.from('students').select('id, kelas, name');
                      return allStudents;
                  }`);

fs.writeFileSync('pages/OperatorDashboard.tsx', code);
console.log("Fixed OperatorDashboard.tsx");
