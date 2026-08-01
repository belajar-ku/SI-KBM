const fs = require('fs');
let code = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');

code = code.replace(/bg-\[#2563eb\]/g, 'bg-blue-600');
code = code.replace(/bg-\[#6366f1\]/g, 'bg-indigo-500');
code = code.replace(/bg-\[#a855f7\]/g, 'bg-purple-500');
code = code.replace(/bg-\[#10b981\]/g, 'bg-emerald-500');
code = code.replace(/bg-\[#f43f5e\]/g, 'bg-rose-500');
code = code.replace(/bg-\[#f59e0b\]/g, 'bg-amber-500');
code = code.replace(/bg-\[#ef4444\]/g, 'bg-red-500');
code = code.replace(/bg-\[#475569\]/g, 'bg-slate-600');

fs.writeFileSync('pages/AppsMenu.tsx', code);
