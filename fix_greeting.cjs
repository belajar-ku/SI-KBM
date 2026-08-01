const fs = require('fs');
let code = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
code = code.replace("  let greeting = 'Selamat Malam';\n  if (currentHour >= 5 && currentHour < 11) greeting = 'Selamat Pagi';\n  else if (currentHour >= 11 && currentHour < 15) greeting = 'Selamat Siang';\n  else if (currentHour >= 15 && currentHour < 18) greeting = 'Selamat Sore';\n", "");
code = code.replace("  const currentHour = new Date().getHours();\n", "");
fs.writeFileSync('pages/Dashboard.tsx', code);
