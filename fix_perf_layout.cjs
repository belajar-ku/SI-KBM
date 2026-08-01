const fs = require('fs');

['pages/Dashboard.tsx', 'pages/AppsMenu.tsx'].forEach(file => {
    let code = fs.readFileSync(file, 'utf8');
    
    // Fix the 3rd section (Performance Status)
    const oldSection3 = `<div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-10 h-10 mb-2 rounded-full border border-orange-100 bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm">
                                <Star size={20} strokeWidth={2} />
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <span className={"text-[10px] font-bold leading-[1.3] uppercase text-center tracking-wide max-w-[70px] " + performanceColor}>
                                    {performanceStatus}
                                </span>
                            </div>
                        </div>`;
                        
    const newSection3 = `<div className="flex-[1.2] flex items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-orange-100 bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm shrink-0">
                                <Star size={20} strokeWidth={2} />
                            </div>
                            <span className={"text-[10px] font-bold leading-[1.2] uppercase text-left tracking-wide max-w-[80px] " + performanceColor}>
                                {performanceStatus}
                            </span>
                        </div>`;
    
    if (code.includes(oldSection3)) {
        code = code.replace(oldSection3, newSection3);
    } else {
        // Try a more relaxed replace if spacing is slightly different
        code = code.replace(/<div className="flex-1 flex flex-col items-center justify-center">\s*<div className="w-10 h-10 mb-2 rounded-full border border-orange-100 bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm">\s*<Star size=\{20\} strokeWidth=\{2\} \/>\s*<\/div>\s*<div className="flex flex-col items-center justify-center">\s*<span className=\{"text-\[10px\] font-bold leading-\[1\.3\] uppercase text-center tracking-wide max-w-\[70px\] " \+ performanceColor\}>\s*\{performanceStatus\}\s*<\/span>\s*<\/div>\s*<\/div>/, newSection3);
    }

    fs.writeFileSync(file, code);
});
