const fs = require('fs');
let code = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const oldCheck = `    if (jpPerClass === 0 || !isSupabaseConfigured) {
        useMockData(); return;
    }`;
    
const newCheck = `    if (!isSupabaseConfigured) {
        useMockData(); return;
    }`;

code = code.replace(oldCheck, newCheck);
fs.writeFileSync('pages/PublicDashboard.tsx', code);
console.log("Fixed jpPerClass check in PublicDashboard.");
