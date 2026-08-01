const fs = require('fs');
let content = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const targetHeader = `              <div className="flex flex-col sm:flex-row sm:items-center justify-between z-10 relative h-full gap-4">
                  <div className="flex items-center gap-4">
                      <div className="w-14 h-16 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center p-1 shrink-0 relative overflow-hidden">
                          <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                      <div className="flex flex-col">
                          <h1 className="text-lg sm:text-xl font-black text-slate-800 leading-tight tracking-tight mb-0.5">UPT SMP NEGERI 1<br/>PASURUAN</h1>
                          <p className="text-[10px] sm:text-xs text-slate-500 leading-tight font-medium">Sistem Informasi Kegiatan Belajar Mengajar</p>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto ml-16 sm:ml-0">
                      <div className="w-[38px] h-[38px] bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                          <Calendar size={18} strokeWidth={2.5} />
                      </div>
                      <div className="text-left sm:text-right">
                          <p className="text-[10px] font-bold text-slate-500 mb-0.5">{formatDateIndo(time)}</p>
                          <div className="flex items-baseline justify-start sm:justify-end gap-1 text-blue-600">
                              <span className="text-xl sm:text-2xl font-black tracking-tighter leading-none">{formatTimeIndo(time).replace(' WIB', '')}</span>
                              <span className="text-[10px] font-bold text-blue-500">WIB</span>
                          </div>
                      </div>
                  </div>
              </div>`;

const replaceHeader = `              <div className="flex items-center justify-between z-10 relative h-full gap-2">
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
              </div>`;

content = content.replace(targetHeader, replaceHeader);
fs.writeFileSync('pages/PublicDashboard.tsx', content);
console.log("Patched PublicDashboard Mobile Header Layout");
