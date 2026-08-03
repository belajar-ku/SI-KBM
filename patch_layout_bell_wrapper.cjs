const fs = require('fs');
let code = fs.readFileSync('components/Layout.tsx', 'utf8');

// Replace mobile bell
const oldMobileBell = `<Bell size={18} strokeWidth={2.5} className="animate-bell-ring text-blue-500" />`;
const newMobileBell = `<div className="animate-bell-ring flex items-center justify-center text-blue-500"><Bell size={18} strokeWidth={2.5} /></div>`;
code = code.replace(oldMobileBell, newMobileBell);

// Replace desktop bell
const oldDesktopBell = `<Bell size={16} className="animate-bell-ring" />`;
const newDesktopBell = `<div className="animate-bell-ring flex items-center justify-center text-blue-500 dark:text-blue-400"><Bell size={16} /></div>`;
code = code.replace(oldDesktopBell, newDesktopBell);

fs.writeFileSync('components/Layout.tsx', code);
console.log("Patched Layout.tsx to wrap Bell in animated div");
