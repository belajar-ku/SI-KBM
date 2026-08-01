const fs = require('fs');

['pages/Dashboard.tsx', 'pages/AppsMenu.tsx'].forEach(file => {
    let code = fs.readFileSync(file, 'utf8');
    
    code = code.replace(/<span className=\{"text-\[10px\] font-bold leading-\[1\.3\] uppercase text-center tracking-wide " \+ performanceColor\}>/g, '<span className={"text-[10px] font-bold leading-[1.3] uppercase text-center tracking-wide max-w-[70px] " + performanceColor}>');

    fs.writeFileSync(file, code);
});
