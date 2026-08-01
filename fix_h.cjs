const fs = require('fs');
let code = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');

code = code.replace(/\(h\) =>/g, '(h: string) =>');

fs.writeFileSync('pages/AppsMenu.tsx', code);
