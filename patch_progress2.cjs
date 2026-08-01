const fs = require('fs');
let content = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const target = `<div className="text-[26px] sm:text-[32px] font-black text-[#1d4ed8] leading-none shrink-0 mb-5">
                                              {percentage}%
                                          </div>`;
const replace = `<div className="text-[26px] sm:text-[32px] font-black text-[#1d4ed8] leading-none shrink-0">
                                              {percentage}%
                                          </div>`;

content = content.replace(target, replace);
fs.writeFileSync('pages/PublicDashboard.tsx', content);
console.log("Patched mb-5");
