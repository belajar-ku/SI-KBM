const fs = require('fs');
let content = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const target = `          {/* 1. TOP HEADER CARD */}
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-center border border-slate-100 min-h-[140px]">
              {/* Decorative wave at bottom right */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-blue-600/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-16 -right-4 w-48 h-32 bg-blue-500/10 rounded-[100%] rotate-12 pointer-events-none"></div>
              
              <div className="flex items-center justify-between z-10 relative h-full gap-2">
                  <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-14 sm:w-14 sm:h-16 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center p-1 shrink-0 relative overflow-hidden">
                          <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                      <div className="flex flex-col">
                          <h1 className="text-base sm:text-xl font-black text-slate-800 leading-tight tracking-tight mb-0.5">UPT SMP NEGERI 1<br/>PASURUAN</h1>
                          <p className="text-[9px] sm:text-xs text-slate-500 leading-tight font-medium line-clamp-1">Sistem Informasi KBM</p>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-right">
                      <div className="hidden sm:flex w-[38px] h-[38px] bg-blue-50 rounded-full items-center justify-center text-blue-600 shrink-0">
                          <Calendar size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col">
                          <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 mb-0.5">{formatDateIndo(time)}</p>
                          <div className="flex items-baseline justify-end gap-0.5 sm:gap-1 text-blue-600">
                              <span className="text-lg sm:text-2xl font-black tracking-tighter leading-none">{formatTimeIndo(time).replace(' WIB', '')}</span>
                              <span className="text-[9px] sm:text-[10px] font-bold text-blue-500">WIB</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>`;

const replace = `          {/* 1. TOP HEADER CARD */}
          <div className="bg-white rounded-[2rem] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-center border border-slate-100 min-h-[150px]">
              {/* Decorative wave at bottom right */}
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-8 -right-4 w-48 h-24 bg-[#3b82f6] opacity-[0.08] rounded-[100%] -rotate-[15deg] pointer-events-none"></div>
              <div className="absolute -bottom-12 right-12 w-32 h-16 bg-[#2563eb] opacity-[0.06] rounded-[100%] -rotate-[25deg] pointer-events-none"></div>
              <div className="absolute top-4 right-10 w-32 h-32 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] opacity-20 pointer-events-none"></div>
              
              <div className="flex items-start justify-between z-10 relative h-full gap-2 w-full">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                      {/* Logo directly shown */}
                      <div className="w-[60px] h-[75px] sm:w-[70px] sm:h-[85px] shrink-0 relative flex items-center justify-center filter drop-shadow-md">
                          <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                      <div className="flex flex-col">
                          <h1 className="text-[17px] sm:text-[22px] font-black text-[#1e293b] leading-[1.1] tracking-tight mb-1.5">
                              UPT SMP NEGERI 1<br/>PASURUAN
                          </h1>
                          <p className="text-[11px] sm:text-[13px] text-[#64748b] leading-tight font-medium">
                              Sistem Informasi Kegiatan<br/>Belajar Mengajar (SI KBM)
                          </p>
                      </div>
                  </div>
                  
                  {/* Floating Date Time Pill */}
                  <div className="flex items-center gap-3 shrink-0 bg-white rounded-2xl py-3 px-3 sm:px-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-50 mt-1">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white border-2 border-[#eff6ff] rounded-full flex items-center justify-center text-[#2563eb] shrink-0 shadow-sm">
                          <Calendar size={20} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col text-left">
                          <p className="text-[9px] sm:text-[11px] font-bold text-[#64748b] mb-0.5">{formatDateIndo(time)}</p>
                          <div className="flex items-baseline justify-start gap-1 text-[#2563eb]">
                              <span className="text-[22px] sm:text-[26px] font-black tracking-tighter leading-none">{formatTimeIndo(time).replace(' WIB', '')}</span>
                              <span className="text-[10px] sm:text-[12px] font-bold text-[#3b82f6]">WIB</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>`;

content = content.replace(target, replace);
fs.writeFileSync('pages/PublicDashboard.tsx', content);
console.log("Patched PublicDashboard Header Layout");
