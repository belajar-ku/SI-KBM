const fs = require('fs');

function removeFallback(file, regexStr, replacement) {
    let code = fs.readFileSync(file, 'utf8');
    const regex = new RegExp(regexStr, 'g');
    code = code.replace(regex, replacement);
    fs.writeFileSync(file, code);
    console.log(`Fixed ${file}`);
}

const pubDashRegex = `\\/\\/ If it succeeded but returned empty, they might be old records with null academic_year\\.\\s+if \\(res\\.data && res\\.data\\.length === 0\\) \\{\\s+const allStudents = await supabase\\.from\\('students'\\)\\.select\\('id, kelas, gender'\\);\\s+return allStudents;\\s+\\}`;
removeFallback('pages/PublicDashboard.tsx', pubDashRegex, '');

const opDashRegex = `if \\(res\\.data && res\\.data\\.length === 0\\) \\{\\s+const allStudents = await supabase\\.from\\('students'\\)\\.select\\('id, kelas, name'\\);\\s+return allStudents;\\s+\\}`;
removeFallback('pages/OperatorDashboard.tsx', opDashRegex, '');
