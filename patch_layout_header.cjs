const fs = require('fs');
let content = fs.readFileSync('components/Layout.tsx', 'utf8');

const mobileHeaderTarget = `<div className="md:hidden sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-30 shadow-sm pt-[calc(env(safe-area-inset-top)+0.25rem)]">`;
const mobileHeaderReplacement = `<div className="md:hidden sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 z-30 shadow-sm pt-[calc(env(safe-area-inset-top)+0.25rem)]">`;

if (content.includes(mobileHeaderTarget)) {
    content = content.replace(mobileHeaderTarget, mobileHeaderReplacement);
    
    // Adjust bottom nav container
    const navContainerTarget = `<nav className="relative z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-full flex items-center p-2 gap-2 w-full h-full border border-slate-200/50 dark:border-slate-700/50">`;
    const navContainerReplacement = `<nav className="relative z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-full flex items-center p-2 gap-2 w-full h-full border border-slate-200/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">`;
    content = content.replace(navContainerTarget, navContainerReplacement);

    const bottomNavBtnTarget = `className={\`relative flex items-center justify-center h-14 rounded-[1.75rem] transition-all duration-500 ease-out overflow-hidden \${
                isActive 
                ? 'flex-1 bg-[#1281ff] text-white shadow-lg shadow-blue-200/50 dark:shadow-none' 
                : 'w-14 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-500'
            }\`}`;
    const bottomNavBtnReplacement = `className={\`relative flex items-center justify-center h-12 rounded-full transition-all duration-500 ease-out overflow-hidden \${
                isActive 
                ? 'flex-1 bg-[#1281ff] text-white shadow-lg shadow-blue-200/50 dark:shadow-none' 
                : 'w-12 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-500'
            }\`}`;
    content = content.replace(bottomNavBtnTarget, bottomNavBtnReplacement);

    const iconTarget = `<Icon size={26} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />`;
    const iconReplacement = `<Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />`;
    content = content.replace(iconTarget, iconReplacement);

    fs.writeFileSync('components/Layout.tsx', content);
    console.log("Layout patched!");
} else {
    console.log("Layout target not found!");
}
