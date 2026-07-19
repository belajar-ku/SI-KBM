const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../pages/RekapAbsensi.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /\.eq\('teacher_id', profile\.id\)\s*\n\s*\.eq\('kelas', selectedClass\)\s*\n\s*\.eq\('subject', selectedSubject\);/,
    `.eq('teacher_id', profile.id)
            .eq('kelas', selectedClass)
            .eq('subject', selectedSubject)
            .eq('academic_year', academicYear || '2025/2026')
            .eq('semester', semester || 'Ganjil')
            .gte('created_at', semesterStart ? \`\${semesterStart}T00:00:00+07:00\` : '2000-01-01T00:00:00+07:00')
            .lte('created_at', semesterEnd ? \`\${semesterEnd}T23:59:59+07:00\` : '2100-01-01T23:59:59+07:00');`
);

fs.writeFileSync(file, content);
console.log('Fixed RekapAbsensi');
