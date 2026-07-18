const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../pages/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /const res = await supabase\.from\('students'\)\.select\('\*'\)\.eq\('kelas', profile\.wali_kelas\)\.order\('name'\);\s*students = res\.data;/g,
    `const res = await supabase.from('students').select('*').eq('kelas', profile.wali_kelas).order('name');
                if (academicYear === '2025/2026') students = res.data;
                else students = [];`
);

content = content.replace(
    /const res = await supabase\.from\('students'\)\.select\('\*'\)\.eq\('kelas', profile\?\.wali_kelas\)\.order\('name'\);\s*students = res\.data;/g,
    `const res = await supabase.from('students').select('*').eq('kelas', profile?.wali_kelas).order('name');
                  if (academicYear === '2025/2026') students = res.data;
                  else students = [];`
);

fs.writeFileSync(file, content);
console.log('Dashboard.tsx fixed');
