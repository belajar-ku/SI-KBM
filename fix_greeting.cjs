const fs = require('fs');

function replaceHeader(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Replace the greeting
    const oldGreeting = `<p className="text-white/90 text-[10px] sm:text-[11px] md:text-[13px] mb-0 font-medium">{greeting}</p>`;
    const newGreeting = `<p className="text-white/90 text-[9px] sm:text-[10px] md:text-[12px] mb-0 font-medium tracking-wide opacity-80">{greeting}</p>`;

    if (code.includes(oldGreeting)) {
        code = code.replace(oldGreeting, newGreeting);
        fs.writeFileSync(filePath, code);
        console.log(`Updated greeting in ${filePath}`);
    } else {
        console.log(`Failed to find greeting in ${filePath}`);
    }
}

replaceHeader('pages/Dashboard.tsx');
replaceHeader('pages/AppsMenu.tsx');

