const fs = require('fs');
let code = fs.readFileSync('components/Layout.tsx', 'utf8');

// Replace mobile bell
code = code.replace(
  '<div className="animate-bell-ring flex items-center justify-center text-blue-500"><Bell size={18} strokeWidth={2.5} /></div>',
  '<Bell size={18} strokeWidth={2.5} className="animate-bell-ring text-blue-500" />'
);

// Replace desktop bell
code = code.replace(
  '<div className="animate-bell-ring flex items-center justify-center text-blue-500 dark:text-blue-400"><Bell size={16} /></div>',
  '<Bell size={16} className="animate-bell-ring text-blue-500 dark:text-blue-400" />'
);

fs.writeFileSync('components/Layout.tsx', code);
console.log("Patched Layout.tsx bell directly");
