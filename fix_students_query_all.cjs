const fs = require('fs');
let code = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const oldStr = `supabase.from('students').select('id, kelas, gender').eq('academic_year', academicYear || '2025/2026').then(async (res) => {
                  if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year'))) {
                      return supabase.from('students').select('id, kelas, gender');
                  }
                  return res;
            }),`;
            
const newStr = `supabase.from('students').select('id, kelas, gender').eq('academic_year', academicYear || '2025/2026').then(async (res) => {
                  if (res.error && (res.error.code === '42703' || res.error.message?.includes('academic_year'))) {
                      return supabase.from('students').select('id, kelas, gender');
                  }
                  // If it succeeded but returned empty, they might be old records with null academic_year.
                  if (res.data && res.data.length === 0) {
                      const allStudents = await supabase.from('students').select('id, kelas, gender');
                      return allStudents;
                  }
                  return res;
            }),`;

if (code.includes(oldStr)) {
    code = code.replace(oldStr, newStr);
    fs.writeFileSync('pages/PublicDashboard.tsx', code);
    console.log("Fixed PublicDashboard.tsx");
} else {
    console.log("Not found in PublicDashboard.tsx");
}
