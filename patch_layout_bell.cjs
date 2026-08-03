const fs = require('fs');
let code = fs.readFileSync('components/Layout.tsx', 'utf8');

const emptyDiv = `<div className="absolute inset-0 rounded-full overflow-hidden shadow-sm">
                                    
                                </div>`;
const pingDiv = `<div className="absolute inset-0 rounded-full overflow-hidden shadow-sm">
                                    <div className="w-full h-full bg-red-400 animate-ping opacity-20"></div>
                                </div>`;

code = code.replace(emptyDiv, pingDiv);
code = code.replace(`<div className="absolute inset-0 rounded-full overflow-hidden shadow-sm">
                                                                </div>`, pingDiv);

fs.writeFileSync('components/Layout.tsx', code);
console.log("Patched Layout bell");
