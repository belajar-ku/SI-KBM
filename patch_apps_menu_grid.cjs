const fs = require('fs');
let content = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');
content = content.replace(/grid-cols-1 sm:grid-cols-2/g, 'grid-cols-2');
fs.writeFileSync('pages/AppsMenu.tsx', content);
console.log("Grid patched");
