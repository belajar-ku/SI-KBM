const fs = require('fs');
let code = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

code = code.replace(
    /const res = await supabase\.from\('students'\)\.select\('\*'\)\.eq\('academic_year', academicYear \|\| '2025\/2026'\)\.eq\('kelas', profile\.wali_kelas\)\.order\('name'\);/g,
    "const res = await supabase.from('students').select('*').eq('kelas', profile.wali_kelas).order('name');"
);

fs.writeFileSync('pages/Dashboard.tsx', code);
console.log("Dashboard students fallback fixed.");
