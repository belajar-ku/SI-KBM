const fs = require('fs');
let code = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

const regex = /if \(academicYear === '2025\/2026'\) students = res\.data;\s+else students = \[\];/g;

code = code.replace(regex, 'students = res.data;');

fs.writeFileSync('pages/Dashboard.tsx', code);
console.log("Fixed Dashboard.tsx students fallback.");
