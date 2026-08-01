const fs = require('fs');
let code = fs.readFileSync('components/Layout.tsx', 'utf8');

// Replace BottomNavItem component
const oldBottomNavRegex = /const BottomNavItem = \(\{ path, label, icon: Icon \}: any\) => \{[\s\S]*?return \([\s\S]*?<\/button>\s*\);\s*\};/;

const newBottomNav = `const BottomNavItem = ({ path, label, icon: Icon }: any) => {
      const isActive = location.pathname === path;
      return (
          <button 
            onClick={() => navigate(path)}
            className="relative flex flex-col items-center justify-center w-[80px] h-[64px]"
          >
              {isActive ? (
                  <div className="absolute -top-[28px] flex flex-col items-center justify-center w-[72px] h-[72px] bg-[#1281ff] rounded-full shadow-[0_0_0_8px_rgba(18,129,255,0.1)] text-white z-10 transition-transform duration-300">
                      <Icon size={26} strokeWidth={2.5} className="mb-0.5" />
                      <span className="text-[10px] font-bold tracking-wide">{label}</span>
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mt-2">
                      <Icon size={24} strokeWidth={2} className="mb-1" />
                      <span className="text-[11px] font-semibold">{label}</span>
                  </div>
              )}
          </button>
      );
  };`;

code = code.replace(oldBottomNavRegex, newBottomNav);

// Update bottom nav containers for mobile
code = code.replace(/<nav className="relative z-10 bg-white\/95 dark:bg-slate-800\/95 backdrop-blur-xl rounded-full flex items-center p-2 gap-2 w-full h-full border border-slate-200\/50 dark:border-slate-700\/50 shadow-\[0_8px_30px_rgb\(0,0,0,0\.08\)\]">/g, 
  '<nav className="relative z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-[32px] flex items-center justify-around px-2 w-full h-[76px] border border-slate-200/50 dark:border-slate-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">');

code = code.replace(/<nav className="bg-white\/95 dark:bg-slate-800\/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-full shadow-\[0_8px_30px_rgb\(0,0,0,0\.12\)\] flex items-center p-2 pointer-events-auto gap-2">/g, 
  '<nav className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex items-center justify-around px-2 pointer-events-auto w-full max-w-[340px] h-[76px] relative">');

// We also need to remove that animate-spin conic gradient that was in the active mode before
code = code.replace(/<div className="absolute inset-\[-100%\] z-0 animate-\[spin_4s_linear_infinite\]".*?<\/div>/, '');

fs.writeFileSync('components/Layout.tsx', code);
