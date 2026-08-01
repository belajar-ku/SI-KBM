const fs = require('fs');

['pages/Dashboard.tsx', 'pages/AppsMenu.tsx'].forEach(file => {
    let code = fs.readFileSync(file, 'utf8');
    
    // For Dashboard.tsx
    code = code.replace(/\{performanceStatus\.split\(' '\)\.map\(\(word, i\) => <React\.Fragment key=\{i\}>\{word\}<br\/><\/React\.Fragment>\)\}/g, '{performanceStatus}');
    
    // For AppsMenu.tsx
    code = code.replace(/\{performanceStatus\.split\(' '\)\.map\(\(word, i\) => <span key=\{i\}>\{word\}<br\/><\/span>\)\}/g, '{performanceStatus}');

    fs.writeFileSync(file, code);
});
