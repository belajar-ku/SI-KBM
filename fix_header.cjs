const fs = require('fs');

function replaceHeader(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Replace the name part
    const oldNameSection = `<div className="w-full overflow-x-auto no-scrollbar" style={{ maskImage: 'linear-gradient(to right, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent 100%)' }}>
                             <h1 className="text-[14px] sm:text-[16px] md:text-2xl lg:text-3xl font-bold mb-0.5 leading-tight whitespace-nowrap min-w-max pr-4">{profile?.full_name}</h1>
                        </div>`;
                        
    const newNameSection = `<div className="w-full flex items-center">
                             <h1 className="font-bold mb-0.5 leading-tight whitespace-nowrap tracking-tight" style={{ fontSize: 'clamp(11px, 4vw, 24px)' }}>{profile?.full_name}</h1>
                        </div>`;

    if (code.includes(oldNameSection)) {
        code = code.replace(oldNameSection, newNameSection);
        fs.writeFileSync(filePath, code);
        console.log(`Updated name in ${filePath}`);
    } else {
        console.log(`Failed to find name section in ${filePath}`);
    }
}

replaceHeader('pages/Dashboard.tsx');
replaceHeader('pages/AppsMenu.tsx');

