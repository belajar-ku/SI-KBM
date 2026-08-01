const fs = require('fs');
let content = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');

const targetAppCard = `  const AppCard = ({ label, subLabel, icon: Icon, path, gradientClass, shadowColor }: any) => (
    <button
      onClick={() => navigate(path)}
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[1.75rem] p-5 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full relative overflow-hidden group text-left min-h-[120px]"
    >
        {/* Background Decor (Leaves pattern simulation) */}
        <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transition-transform duration-500 group-hover:scale-110 text-slate-900 dark:text-white">
             <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22c0-4.5 3.5-8 8-8-4.5 0-8-3.5-8-8 0 4.5-3.5 8-8 8 4.5 0 8 3.5 8 8z"/>
                <path d="M12 22c0-3 2.5-6 6-6-3.5 0-6-2.5-6-6 0 3-2.5 6-6 6 3.5 0 6 2.5 6 6z"/>
             </svg>
        </div>
        
        {/* Colorful background splash at bottom */}
        <div className={\`absolute -bottom-4 right-0 w-3/4 h-12 \${gradientClass} opacity-[0.08] blur-xl rounded-full\`}></div>

      {/* 3D ICON CONTAINER */}
      <div className={\`w-[72px] h-[72px] shrink-0 rounded-[1.25rem] flex items-center justify-center text-white \${shadowColor} border border-white/20 relative z-10 transition-transform duration-500 group-hover:scale-105 \${gradientClass}\`}>
         <Icon size={32} strokeWidth={2} className="drop-shadow-sm" />
      </div>
      
      <div className="relative z-10 flex-1 py-1 pr-6">
          <h3 className="text-[17px] font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-1.5">{label}</h3>
          <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest leading-[1.3]">{subLabel.split('\\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}</p>
      </div>

      <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors z-10">
          <ChevronRight size={18} strokeWidth={2.5} />
      </div>
    </button>
  );`;

const replacementAppCard = `  const AppCard = ({ label, subLabel, icon: Icon, path, gradientClass, shadowColor }: any) => (
    <button
      onClick={() => navigate(path)}
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl md:rounded-[1.75rem] p-3 md:p-5 flex items-center gap-2.5 md:gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full relative overflow-hidden group text-left min-h-[90px] md:min-h-[120px]"
    >
        {/* Background Decor (Leaves pattern simulation) */}
        <div className="absolute -right-2 -top-2 md:-right-4 md:-top-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transition-transform duration-500 group-hover:scale-110 text-slate-900 dark:text-white">
             <svg className="w-20 h-20 md:w-[120px] md:h-[120px]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22c0-4.5 3.5-8 8-8-4.5 0-8-3.5-8-8 0 4.5-3.5 8-8 8 4.5 0 8 3.5 8 8z"/>
                <path d="M12 22c0-3 2.5-6 6-6-3.5 0-6-2.5-6-6 0 3-2.5 6-6 6 3.5 0 6 2.5 6 6z"/>
             </svg>
        </div>
        
        {/* Colorful background splash at bottom */}
        <div className={\`absolute -bottom-4 right-0 w-3/4 h-12 \${gradientClass} opacity-[0.08] blur-xl rounded-full\`}></div>

      {/* 3D ICON CONTAINER */}
      <div className={\`w-[50px] h-[50px] md:w-[72px] md:h-[72px] shrink-0 rounded-[1rem] md:rounded-[1.25rem] flex items-center justify-center text-white \${shadowColor} border border-white/20 relative z-10 transition-transform duration-500 group-hover:scale-105 \${gradientClass}\`}>
         <Icon className="w-6 h-6 md:w-8 md:h-8 drop-shadow-sm" strokeWidth={2} />
      </div>
      
      <div className="relative z-10 flex-1 py-0.5 pr-5 md:pr-6">
          <h3 className="text-[12px] md:text-[17px] font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-1 md:mb-1.5 line-clamp-1">{label}</h3>
          <p className="text-[7px] md:text-[9px] text-slate-500 font-extrabold uppercase tracking-widest leading-[1.3]">{subLabel.split('\\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}</p>
      </div>

      <div className="absolute bottom-2.5 right-2.5 md:bottom-4 md:right-4 w-6 h-6 md:w-8 md:h-8 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors z-10">
          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={3} />
      </div>
    </button>
  );`;

if (content.includes(targetAppCard)) {
    content = content.replace(targetAppCard, replacementAppCard);
    fs.writeFileSync('pages/AppsMenu.tsx', content);
    console.log("AppCards responsive patched!");
} else {
    console.log("AppCard target not found!");
}
