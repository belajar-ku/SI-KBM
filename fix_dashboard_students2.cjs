const fs = require('fs');
let code = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

const regex = /let \{ data: students, error: errSt \} = await supabase\.from\('students'\)\.select\('\*'\)\.eq\('academic_year', academicYear \|\| '2025\/2026'\)\.eq\('kelas', profile\?\.wali_kelas\)\.eq\('academic_year', academicYear \|\| '2025\/2026'\)\.order\('name'\);\s+if \(errSt && \(errSt\.code === '42703' \|\| errSt\.message\?\.includes\('academic_year'\)\)\) \{\s+const res = await supabase\.from\('students'\)\.select\('\*'\)\.eq\('academic_year', academicYear \|\| '2025\/2026'\)\.eq\('kelas', profile\?\.wali_kelas\)\.order\('name'\);\s+students = res\.data;\s+\}/g;

code = code.replace(regex, `let { data: students, error: errSt } = await supabase.from('students').select('*').eq('academic_year', academicYear || '2025/2026').eq('kelas', profile?.wali_kelas).order('name');
              if (errSt && (errSt.code === '42703' || errSt.message?.includes('academic_year'))) {
                  const res = await supabase.from('students').select('*').eq('kelas', profile?.wali_kelas).order('name');
                  students = res.data;
              } else if (students && students.length === 0) {
                  const res = await supabase.from('students').select('*').eq('kelas', profile?.wali_kelas).order('name');
                  if (res.data && res.data.length > 0) students = res.data;
              }`);

fs.writeFileSync('pages/Dashboard.tsx', code);
console.log("Fixed Dashboard.tsx students toggleInputForm.");
