const fs = require('fs');
let content = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');

const regex = /const AppCard = \(\{ label, subLabel, icon: Icon, path, gradientClass, shadowColor = '' \}: any\) => \{[\s\S]*?return \([\s\S]*?<\/button>\s*\);\s*\};/m;

const replaceAppCard = `const AppCard = ({ label, subLabel, icon: Icon, path, gradientClass, shadowColor = '' }: any) => {
    return (
    <button
      onClick={() => navigate(path)}
      className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 w-full relative overflow-hidden group text-center min-h-[160px]"
    >
      <div className={\`w-[76px] h-[76px] shrink-0 flex items-center justify-center rounded-[1.5rem] \${gradientClass} transition-transform duration-500 group-hover:scale-110 shadow-lg \${shadowColor}\`}>
         <Icon className="w-10 h-10 text-white" strokeWidth={2} />
      </div>
      
      <div className="relative z-10 w-full">
          <h3 className="text-[14px] md:text-[16px] font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-2">{label}</h3>
          <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed opacity-80">{subLabel?.replace(/\\\\n/g, ' ')}</p>
      </div>
    </button>
  );
  };`;

content = content.replace(regex, replaceAppCard);
fs.writeFileSync('pages/AppsMenu.tsx', content);
console.log("Patched AppsMenu");
