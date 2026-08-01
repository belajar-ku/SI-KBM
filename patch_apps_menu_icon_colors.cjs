const fs = require('fs');
let content = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');

const targetAppCard = `  const AppCard = ({ label, subLabel, icon: Icon, path, gradientClass, shadowColor = '' }: any) => (
    <button`;

const replacementAppCard = `  const AppCard = ({ label, subLabel, icon: Icon, path, gradientClass, shadowColor = '' }: any) => {
    const textColorClass = gradientClass ? (gradientClass.match(/from-([a-z]+-[0-9]+)/)?.[0].replace('from-', 'text-') || 'text-slate-700') : 'text-slate-700';
    return (
    <button`;

if (content.includes(targetAppCard)) {
    content = content.replace(targetAppCard, replacementAppCard);
    
    const targetIconContainer = `{/* OUTLINE ICON CONTAINER */}
      <div className="w-[42px] h-[42px] md:w-[56px] md:h-[56px] shrink-0 flex items-center justify-center relative z-10 transition-transform duration-500 group-hover:scale-110">
         <Icon className="w-8 h-8 md:w-10 md:h-10 text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors" strokeWidth={1.2} />
      </div>`;

    const replacementIconContainer = `{/* OUTLINE ICON CONTAINER */}
      <div className="w-[42px] h-[42px] md:w-[56px] md:h-[56px] shrink-0 flex items-center justify-center relative z-10 transition-transform duration-500 group-hover:scale-110">
         <Icon className={\`w-8 h-8 md:w-10 md:h-10 transition-colors \${textColorClass}\`} strokeWidth={1.5} />
      </div>`;
      
    content = content.replace(targetIconContainer, replacementIconContainer);
    
    // Close the return function
    const targetClose = `    </button>
  );`;
    const replacementClose = `    </button>
  );
  };`;
    content = content.replace(targetClose, replacementClose);
    
    fs.writeFileSync('pages/AppsMenu.tsx', content);
    console.log("AppsMenu icons patched");
}
