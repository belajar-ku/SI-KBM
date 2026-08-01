const fs = require('fs');
let content = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const targetTimeBlock = `<div className="bg-white border border-slate-100 rounded-[1.25rem] p-2 pr-3 flex items-center gap-2.5 shadow-sm shrink-0">
                      <div className="w-[34px] h-[34px] bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                          <Calendar size={18} strokeWidth={2.5} />
                      </div>
                      <div className="text-right">
                          <p className="text-[8px] font-bold text-slate-500 mb-0.5">{formatDateIndo(time)}</p>
                          <div className="flex items-baseline justify-end gap-1 text-blue-600">
                              <span className="text-lg font-black tracking-tighter leading-none">{formatTimeIndo(time).replace(' WIB', '')}</span>
                              <span className="text-[8px] font-bold text-blue-500">WIB</span>
                          </div>
                      </div>
                  </div>`;

if (content.includes(targetTimeBlock)) {
    content = content.replace(targetTimeBlock, '');
} else {
    // try replacing with regex ignoring spaces
    content = content.replace(/<div className="bg-white border border-slate-100 rounded-\[1.25rem\].*?WIB<\/span>\s*<\/div>\s*<\/div>\s*<\/div>/s, '');
}

const targetHeaderEnd = `</div>
          </div>

          {/* 2. ACADEMIC YEAR PILL */}`;

const newTimePill = `</div>
          </div>

          {/* DATE & TIME PILL (Modern Elegant) */}
          <div className="flex justify-center">
              <div className="bg-white/90 backdrop-blur-xl rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 p-1.5 pr-4 flex items-center justify-between w-full max-w-sm">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1281ff] rounded-[0.85rem] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                          <Calendar size={20} strokeWidth={2} />
                      </div>
                      <span className="text-[13px] font-black text-slate-700 tracking-tight">{formatDateIndo(time)}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-3 border-l border-slate-100 shrink-0">
                      <Clock size={16} className="text-[#1281ff]" strokeWidth={2.5} />
                      <div className="flex items-baseline gap-1 text-[#1281ff]">
                           <span className="text-[14px] font-black tracking-widest leading-none">{formatTimeIndo(time).replace(' WIB', '').split(':').join(' : ')}</span>
                           <span className="text-[9px] font-bold text-slate-500 mb-[1px]">WIB</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* 2. ACADEMIC YEAR PILL */}`;

if (content.includes(targetHeaderEnd)) {
    content = content.replace(targetHeaderEnd, newTimePill);
    
    // Add Clock icon if missing
    if (!content.includes('Clock,')) {
        content = content.replace("Calendar, Check } from 'lucide-react';", "Calendar, Check, Clock } from 'lucide-react';");
    }
}

fs.writeFileSync('pages/PublicDashboard.tsx', content);
console.log("PublicDashboard patched");
