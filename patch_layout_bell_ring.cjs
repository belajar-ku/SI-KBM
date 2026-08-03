const fs = require('fs');
let code = fs.readFileSync('components/Layout.tsx', 'utf8');

// Replace mobile bell
const oldMobileBell = `<Bell size={18} strokeWidth={2.5} />`;
const newMobileBell = `<Bell size={18} strokeWidth={2.5} className="animate-bell-ring text-blue-500" />`;
code = code.replace(oldMobileBell, newMobileBell);

// Replace desktop bell
const oldDesktopBell = `<button onClick={() => openNotifModal()} className="relative z-10 w-[34px] h-[34px] m-[2px] bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 border border-slate-200 dark:border-slate-600 transition-transform active:scale-95">
                              <Bell size={16} />
                          </button>`;
const newDesktopBell = `<button onClick={() => openNotifModal()} className="relative z-10 w-[34px] h-[34px] m-[2px] bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-500 dark:text-blue-400 border border-slate-200 dark:border-slate-600 transition-transform active:scale-95">
                              <Bell size={16} className="animate-bell-ring" />
                          </button>`;
code = code.replace(oldDesktopBell, newDesktopBell);

fs.writeFileSync('components/Layout.tsx', code);
console.log("Patched Layout.tsx to use animate-bell-ring");
