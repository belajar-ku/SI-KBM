const fs = require('fs');
let content = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const target = `                  {/* 4. SUMMARY ROW */}
                  <div className="grid grid-cols-2 gap-3">
                      {/* KBM Terlaksana */}
                      <div className="bg-white rounded-[1.75rem] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 relative overflow-hidden flex flex-col justify-between min-h-[140px] text-left hover:shadow-md transition-all group">
                          <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-50/50 rounded-tl-full transition-colors z-0"></div>
                          
                          <div className="w-[34px] h-[34px] rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 relative z-10">
                              <BookOpen size={18} strokeWidth={2} />
                          </div>
                          
                          <div className="relative z-10 mt-auto">
                              <div className="flex items-baseline gap-1">
                                  <span className="text-[32px] font-black text-purple-700 tracking-tighter leading-none">{stats.completedJp}</span>
                                  <span className="text-[11px] font-bold text-slate-600">/ {stats.totalJpRequired} JP</span>
                              </div>
                              <div className="text-[10px] font-black text-slate-700 uppercase mt-2 tracking-wide leading-tight">KBM Terlaksana</div>
                          </div>

                          {/* 3D-like Icon Simulation */}
                          <div className="absolute right-4 bottom-4 w-[60px] h-[60px] bg-gradient-to-br from-[#c4b5fd] to-[#8b5cf6] rounded-[1.25rem] shadow-[0_8px_16px_rgba(139,92,246,0.3)] flex items-center justify-center transform -rotate-3 border-t-[3px] border-l-[3px] border-white/40 z-10">
                              <div className="w-10 h-10 bg-white rounded-xl shadow-inner flex items-center justify-center relative overflow-hidden">
                                 <div className="absolute top-0 w-full h-2.5 bg-gradient-to-b from-slate-100 to-white"></div>
                                 <Check size={24} strokeWidth={4} className="text-[#8b5cf6] drop-shadow-sm z-10" />
                              </div>
                              {/* Binder rings */}
                              <div className="absolute -top-1.5 left-3 w-1.5 h-3.5 bg-slate-200 rounded-full shadow-sm border border-slate-300"></div>
                              <div className="absolute -top-1.5 right-3 w-1.5 h-3.5 bg-slate-200 rounded-full shadow-sm border border-slate-300"></div>
                          </div>
                      </div>

                      {/* Ketidakhadiran */}
                      <button onClick={handleAbsenceClick} className="bg-white rounded-[1.75rem] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 relative overflow-hidden flex flex-col justify-between min-h-[140px] text-left hover:shadow-md transition-all group">
                          <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-50/50 rounded-tl-full transition-colors z-0"></div>
                          
                          <div className="w-[34px] h-[34px] rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 relative z-10">
                              <AlertCircle size={18} strokeWidth={2} />
                          </div>
                          
                          <div className="relative z-10 mt-auto">
                              <div className="text-[32px] font-black text-orange-500 tracking-tighter leading-none">{stats.absenceCount}</div>
                              <div className="text-[10px] font-black text-slate-700 uppercase mt-2 tracking-wide leading-tight">Ketidakhadiran<br/>Murid</div>
                          </div> 

                          {/* 3D-like Icon Simulation */}
                          <div className="absolute right-4 bottom-4 w-[56px] h-[64px] bg-gradient-to-br from-[#fed7aa] to-[#f97316] rounded-xl shadow-[0_8px_16px_rgba(249,115,22,0.3)] flex flex-col items-center justify-center transform rotate-6 border-t-[3px] border-l-[3px] border-white/50 z-10 pt-2">
                              {/* Paper */}
                              <div className="w-10 h-10 bg-white rounded shadow-inner flex flex-col items-center justify-center gap-1">
                                  <div className="w-6 h-0.5 bg-slate-200 rounded-full"></div>
                                  <div className="w-6 h-0.5 bg-slate-200 rounded-full"></div>
                                  <div className="w-4 h-0.5 bg-slate-200 rounded-full mr-2"></div>
                              </div>
                              {/* Clip */}
                              <div className="absolute -top-1 w-6 h-3 bg-slate-700 rounded-md shadow-md border-b-2 border-slate-800"></div>
                              <div className="absolute -top-3 w-3 h-3 border-2 border-slate-700 rounded-full"></div>
                              
                              {/* Alert Badge */}
                              <div className="absolute -right-2 -bottom-2 w-7 h-7 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg text-white font-black text-[13px] leading-none">!</div>
                          </div>
                      </button>
                  </div>`;

const replace = `                  {/* 4. SUMMARY ROW */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 my-2">
                      {/* KBM Terlaksana */}
                      <div className="bg-white rounded-[1.25rem] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 relative overflow-hidden flex flex-col justify-between min-h-[140px] text-left">
                          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#f3e8ff] rounded-tl-full blur-2xl z-0 opacity-50"></div>
                          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-[#f5d0fe]/20 to-transparent z-0"></div>
                          <svg className="absolute bottom-0 left-0 w-full h-auto text-[#f3e8ff] z-0" viewBox="0 0 100 30" preserveAspectRatio="none">
                              <path fill="currentColor" d="M0,30 Q25,10 50,20 T100,5 L100,30 L0,30 Z"></path>
                          </svg>
                          
                          <div className="w-[38px] h-[38px] rounded-xl bg-white border-2 border-[#f3e8ff] text-[#9333ea] flex items-center justify-center shadow-sm relative z-10 mb-2">
                              <BookOpen size={20} strokeWidth={2.5} />
                          </div>
                          
                          <div className="relative z-10 mt-auto">
                              <div className="flex items-baseline gap-1">
                                  <span className="text-[36px] sm:text-[42px] font-black text-[#7e22ce] tracking-tighter leading-none">{stats.completedJp}</span>
                                  <span className="text-[12px] font-bold text-[#475569] mb-1">/ {stats.totalJpRequired} JP</span>
                              </div>
                              <div className="text-[11px] font-bold text-[#334155] uppercase mt-1 tracking-wide leading-tight">KBM Terlaksana</div>
                          </div>

                          {/* 3D-like Icon Simulation - Calendar */}
                          <div className="absolute -right-2 -bottom-2 w-[85px] h-[85px] sm:w-[95px] sm:h-[95px] flex items-center justify-center transform -rotate-[8deg] z-10 pointer-events-none">
                              <div className="relative w-full h-full bg-[#f8fafc] rounded-2xl shadow-[inset_0_-4px_12px_rgba(0,0,0,0.1),_0_8px_16px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden flex items-center justify-center">
                                  <div className="absolute top-0 w-full h-1/3 bg-[#a855f7] border-b border-[#9333ea] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"></div>
                                  <div className="absolute top-3 flex justify-evenly w-full px-2">
                                     <div className="w-1.5 h-4 bg-[#334155] rounded-full shadow-md border border-[#1e293b]"></div>
                                     <div className="w-1.5 h-4 bg-[#334155] rounded-full shadow-md border border-[#1e293b]"></div>
                                     <div className="w-1.5 h-4 bg-[#334155] rounded-full shadow-md border border-[#1e293b]"></div>
                                     <div className="w-1.5 h-4 bg-[#334155] rounded-full shadow-md border border-[#1e293b]"></div>
                                  </div>
                                  <div className="relative z-10 mt-3 w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center border border-slate-100">
                                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#a855f7]">
                                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                                     </svg>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Ketidakhadiran */}
                      <button onClick={handleAbsenceClick} className="bg-white rounded-[1.25rem] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 relative overflow-hidden flex flex-col justify-between min-h-[140px] text-left transition-all group">
                          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#ffedd5] rounded-tl-full blur-2xl z-0 opacity-50"></div>
                          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-[#ffedd5]/40 to-transparent z-0"></div>
                          <svg className="absolute bottom-0 left-0 w-full h-auto text-[#ffedd5] z-0" viewBox="0 0 100 30" preserveAspectRatio="none">
                              <path fill="currentColor" d="M0,30 Q25,10 50,20 T100,5 L100,30 L0,30 Z"></path>
                          </svg>
                          
                          <div className="w-[38px] h-[38px] rounded-xl bg-white border-2 border-[#ffedd5] text-[#ea580c] flex items-center justify-center shadow-sm relative z-10 mb-2">
                              <AlertCircle size={20} strokeWidth={2.5} />
                          </div>
                          
                          <div className="relative z-10 mt-auto">
                              <div className="text-[36px] sm:text-[42px] font-black text-[#ea580c] tracking-tighter leading-none">{stats.absenceCount}</div>
                              <div className="text-[11px] font-bold text-[#334155] uppercase mt-2 tracking-wide leading-tight">Ketidakhadiran<br/>Murid</div>
                          </div> 

                          {/* 3D-like Icon Simulation - Clipboard */}
                          <div className="absolute -right-1 -bottom-2 w-[75px] h-[95px] sm:w-[85px] sm:h-[105px] flex flex-col items-center justify-center transform rotate-[6deg] z-10 pointer-events-none">
                              {/* Board */}
                              <div className="relative w-full h-full bg-[#f97316] rounded-xl shadow-[inset_0_-4px_12px_rgba(0,0,0,0.1),_0_8px_16px_rgba(0,0,0,0.15)] border border-[#ea580c] p-2 flex flex-col items-center">
                                  {/* Clip */}
                                  <div className="absolute -top-2 w-10 h-4 bg-slate-200 rounded-md shadow-md border border-slate-300 z-20 flex justify-center">
                                      <div className="w-4 h-1.5 bg-slate-400 rounded-full mt-1"></div>
                                  </div>
                                  {/* Paper */}
                                  <div className="w-full h-full bg-white rounded-md mt-1 shadow-sm p-2 flex flex-col gap-2 relative">
                                      <div className="flex items-center gap-1.5 mt-2">
                                          <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                                          <div className="h-1 w-full bg-slate-200 rounded-full"></div>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                          <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                                          <div className="h-1 w-3/4 bg-slate-200 rounded-full"></div>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                          <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                                          <div className="h-1 w-5/6 bg-slate-200 rounded-full"></div>
                                      </div>
                                      
                                      {/* Alert Badge */}
                                      <div className="absolute -right-4 -bottom-2 w-8 h-8 bg-[#ef4444] rounded-full border-2 border-white flex items-center justify-center shadow-lg text-white font-black text-[16px] leading-none z-20">!</div>
                                  </div>
                              </div>
                          </div>
                      </button>
                  </div>`;

if(content.includes(target)) {
    content = content.replace(target, replace);
    fs.writeFileSync('pages/PublicDashboard.tsx', content);
    console.log("Patched PublicDashboard Summary Layout");
} else {
    console.log("Could not find Summary Layout target!");
}
