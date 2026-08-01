const fs = require('fs');
let content = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');

const targetIconContainer = `{/* 3D ICON CONTAINER */}
      <div className={\`w-[50px] h-[50px] md:w-[72px] md:h-[72px] shrink-0 rounded-[1rem] md:rounded-[1.25rem] flex items-center justify-center text-white \${shadowColor} border border-white/20 relative z-10 transition-transform duration-500 group-hover:scale-105 \${gradientClass}\`}>
         <Icon className="w-6 h-6 md:w-8 md:h-8 drop-shadow-sm" strokeWidth={2} />
      </div>`;

const replacementIconContainer = `{/* OUTLINE ICON CONTAINER */}
      <div className="w-[42px] h-[42px] md:w-[56px] md:h-[56px] shrink-0 flex items-center justify-center relative z-10 transition-transform duration-500 group-hover:scale-110">
         <Icon className="w-8 h-8 md:w-10 md:h-10 text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors" strokeWidth={1.2} />
      </div>`;

if (content.includes(targetIconContainer)) {
    content = content.replace(targetIconContainer, replacementIconContainer);
} else {
    // regex
    content = content.replace(/\{\/\* 3D ICON CONTAINER \*\/}.*?<\/div>/s, replacementIconContainer);
}

// Remove the colorful background splash at bottom since we want an elegant look
const targetSplash = `{/* Colorful background splash at bottom */}
        <div className={\`absolute -bottom-4 right-0 w-3/4 h-12 \${gradientClass} opacity-[0.08] blur-xl rounded-full\`}></div>`;
        
if (content.includes(targetSplash)) {
    content = content.replace(targetSplash, '');
}

fs.writeFileSync('pages/AppsMenu.tsx', content);
console.log("AppsMenu outline patched");
