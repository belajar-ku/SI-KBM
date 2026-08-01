const fs = require('fs');
let code = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');

code = code.replace(/shadow-sm border border-slate-100/g, 'shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-50');
code = code.replace(/rounded-\[24px\]/g, 'rounded-[20px]');
code = code.replace(/rounded-\[18px\]/g, 'rounded-[16px]');
code = code.replace(/w-16 h-16/g, 'w-[60px] h-[60px]');
code = code.replace(/w-8 h-8/g, 'w-7 h-7');
code = code.replace(/min-h-\[140px\]/g, 'min-h-[135px]');

fs.writeFileSync('pages/AppsMenu.tsx', code);
