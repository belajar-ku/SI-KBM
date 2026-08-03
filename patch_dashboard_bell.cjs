const fs = require('fs');
let code = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

const oldStr = `                                     {homeroomAbsences.length > 0 ? <Bell size={20} className="animate-pulse" /> : <CheckCircle2 size={22} />}`;
const newStr = `                                     <Bell size={20} className="animate-pulse" />`;

code = code.replace(oldStr, newStr);

fs.writeFileSync('pages/Dashboard.tsx', code);
console.log("Patched bell in Dashboard");
