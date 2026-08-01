const fs = require('fs');
let content = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

// 1. Replace TOP HEADER CARD
const targetHeader = `          {/* 1. TOP HEADER CARD */}
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-center border border-slate-100 min-h-[140px]">
              {/* Decorative wave at bottom right */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-blue-600/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-16 -right-4 w-48 h-32 bg-blue-500/10 rounded-[100%] rotate-12 pointer-events-none"></div>
              
              <div className="flex items-center justify-between z-10 relative h-full">
                  <div className="flex items-center gap-4">
                      <div className="w-14 h-16 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center p-1 shrink-0 relative overflow-hidden">
                          <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                      <div className="flex flex-col">
                          <h1 className="text-lg sm:text-xl font-black text-slate-800 leading-tight tracking-tight mb-0.5">UPT SMP NEGERI 1<br/>PASURUAN</h1>
                          <p className="text-[10px] sm:text-xs text-slate-500 leading-tight font-medium">Sistem Informasi Kegiatan Belajar Mengajar</p>
                      </div>
                  </div>
                  
                  <div className="flex flex-col text-right">
                      <p className="text-[10px] sm:text-xs font-bold text-slate-500 mb-0.5">{formatDateIndo(time)}</p>
                      <div className="flex items-baseline justify-end gap-1 text-blue-600">
                          <span className="text-xl sm:text-2xl font-black tracking-tighter leading-none">{formatTimeIndo(time).replace(' WIB', '')}</span>
                          <span className="text-[10px] font-bold text-blue-500">WIB</span>
                      </div>
                  </div>
              </div>
          </div>`;

const replaceHeader = `          {/* 1. TOP HEADER CARD */}
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-center border border-slate-100 min-h-[140px]">
              {/* Decorative wave at bottom right */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-blue-600/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-16 -right-4 w-48 h-32 bg-blue-500/10 rounded-[100%] rotate-12 pointer-events-none"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between z-10 relative h-full gap-4">
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
              </div>
          </div>`;

content = content.replace(targetHeader, replaceHeader);

// 2. Replace PROGRESS BAR
const targetProgress = `                  {/* 5. PROGRESS BAR */}
                  <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
                      <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                             <Bookmark size={12} strokeWidth={3}/>
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wide">Progress KBM Hari Ini</span>
                      </div>
                      
                      {(() => {
                          const percentage = stats.totalJpRequired > 0 ? Math.min(100, Math.round((stats.completedJp / stats.totalJpRequired) * 100)) : 0;
                          return (
                              <div>
                                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2 shadow-inner">
                                      <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out relative" style={{ width: \`\${percentage}%\`}}>
                                          <div className="absolute inset-0 bg-white/20 w-full h-full skew-x-12 translate-x-full animate-[shimmer_2s_infinite]"></div>
                                      </div>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] font-bold">
                                      <span className="text-slate-500">{percentage}% Terlaksana</span>
                                      <span className="text-blue-600 text-sm font-black">{percentage}%</span>
                                  </div>
                              </div>
                          );
                      })()}
                  </div>`;

const replaceProgress = `                  {/* 5. PROGRESS BAR */}
                  <div className="bg-white rounded-[2rem] p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex items-center gap-4 sm:gap-5">
                      {(() => {
                          const percentage = stats.totalJpRequired > 0 ? (Math.round((stats.completedJp / stats.totalJpRequired) * 1000) / 10) : 0;
                          return (
                              <>
                                  {/* Icon */}
                                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#f0f4ff] border-2 border-white shadow-[0_2px_15px_rgba(37,99,235,0.08)] flex items-center justify-center shrink-0">
                                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
                                          <path d="M22 6L14.5 13.5L9.5 8.5L2 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                          <path d="M16 6H22V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                          <path d="M14 14V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                          <path d="M8 16V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                          <path d="M2 18V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                  </div>
                                  
                                  <div className="flex-1 flex flex-col justify-center py-1">
                                      <span className="text-[11px] sm:text-xs font-bold text-[#1e3a8a] uppercase tracking-wider mb-2">Progress KBM Hari Ini</span>
                                      
                                      <div className="flex items-center gap-3 sm:gap-4">
                                          <div className="flex-1 flex flex-col gap-1.5">
                                              <div className="h-2.5 sm:h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                                  <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: \`\${percentage}%\`}}></div>
                                              </div>
                                              <span className="text-[10px] sm:text-[11px] font-semibold text-[#1e40af]">{percentage}% Terlaksana</span>
                                          </div>
                                          <div className="text-2xl sm:text-3xl font-black text-blue-600 leading-none shrink-0 mb-3">
                                              {percentage}%
                                          </div>
                                      </div>
                                  </div>
                              </>
                          );
                      })()}
                  </div>`;

content = content.replace(targetProgress, replaceProgress);

fs.writeFileSync('pages/PublicDashboard.tsx', content);
console.log("Patched PublicDashboard");
