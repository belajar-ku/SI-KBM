const fs = require('fs');
let content = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');

// Replace the dynamic textColorClass with a direct map
const targetDynamic = `const textColorClass = gradientClass ? (gradientClass.match(/from-([a-z]+-[0-9]+)/)?.[0].replace('from-', 'text-') || 'text-slate-700') : 'text-slate-700';`;

const replacementDynamic = `
    const colorMap: Record<string, string> = {
        'from-rose-400': 'text-rose-500',
        'from-indigo-400': 'text-indigo-500',
        'from-purple-400': 'text-purple-500',
        'from-teal-400': 'text-teal-500',
        'from-blue-400': 'text-blue-500',
        'from-slate-500': 'text-slate-500',
        'from-blue-500': 'text-blue-500',
        'from-purple-500': 'text-purple-500',
        'from-emerald-400': 'text-emerald-500',
        'from-red-400': 'text-red-500',
        'from-amber-400': 'text-amber-500',
        'from-orange-500': 'text-orange-500',
        'from-slate-600': 'text-slate-600',
    };
    const fromClass = gradientClass ? (gradientClass.match(/from-([a-z]+-[0-9]+)/)?.[0] || '') : '';
    const textColorClass = colorMap[fromClass] || 'text-slate-700';
`;

content = content.replace(targetDynamic, replacementDynamic);

fs.writeFileSync('pages/AppsMenu.tsx', content);
console.log("AppsMenu Tailwind mapped");
