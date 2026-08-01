const fs = require('fs');
let content = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const regex = /\{\/\* 4\. SUMMARY ROW \*\/\}.*?\{\/\* 7\. FOOTER QUOTE \*\/\}.*?<\/div>/s;

const replace = `{/* 4. SUMMARY ROW */}
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
                      <button onClick={handleAbsenceClick} className="bg-white rounded-[1.25rem] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 relative overflow-hidden flex flex-col justify-between min-h-[140px] text-left transition-all group hover:shadow-md">
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
                  </div>

                  {/* 5. PROGRESS BAR */}
                  <div className="bg-white rounded-[1.25rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col gap-4">
                      {(() => {
                          const percentage = stats.totalJpRequired > 0 ? (Math.round((stats.completedJp / stats.totalJpRequired) * 1000) / 10) : 0;
                          return (
                              <>
                                  <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-3">
                                          {/* Icon */}
                                          <div className="w-[42px] h-[42px] rounded-full bg-[#eff6ff] flex items-center justify-center text-[#2563eb] border border-[#dbeafe]">
                                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M18 20V10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                  <path d="M12 20V4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                  <path d="M6 20V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                          </div>
                                          <span className="text-[12px] font-black text-[#1e293b] tracking-widest uppercase">PROGRESS KBM HARI INI</span>
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-end justify-between w-full gap-4">
                                      <div className="flex-1 flex flex-col gap-2 pb-1">
                                          <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                              <div className="h-full bg-[#2563eb] rounded-full transition-all duration-1000 ease-out" style={{ width: \`\${percentage}%\`}}></div>
                                          </div>
                                          <span className="text-[12px] font-bold text-[#475569]">{percentage}% Terlaksana</span>
                                      </div>
                                      <div className="text-[38px] font-black text-[#2563eb] leading-none shrink-0 tracking-tighter">
                                          {percentage}%
                                      </div>
                                  </div>
                              </>
                          );
                      })()}
                  </div>
              </>
          )}

          {/* 6. LOGIN BUTTON */}
          <button 
              onClick={() => setShowLoginModal(true)}
              className="w-full bg-[#007aff] hover:bg-[#0062cc] text-white rounded-[1.25rem] py-4 flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,122,255,0.25)] transition-all active:scale-[0.98] mt-3 group"
          >
              <LogIn size={20} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
              <span className="font-extrabold text-[15px]">Login Sebagai</span>
          </button>

          {/* 7. FOOTER QUOTE */}
          <div className="bg-white rounded-full py-3 px-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 mx-2 mt-4">
              <div className="w-[38px] h-[38px] rounded-full bg-[#2563eb] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </div>
              <p className="text-[10px] font-bold text-[#475569] text-center leading-[1.3] mx-3">
                  <span className="text-[#3b82f6] font-serif font-black text-base mr-1">"</span>
                  Setiap hari adalah kesempatan baru<br/>untuk belajar, mengajar, dan menginspirasi.
              </p>
              <div className="flex flex-col items-center justify-center shrink-0 w-8">
                 <div className="w-8 h-8 text-[#60a5fa] relative flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="absolute top-1 right-2"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"/></svg>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="absolute bottom-1 left-0"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"/></svg>
                 </div>
              </div>
          </div>`;

if(regex.test(content)) {
    content = content.replace(regex, replace);
    fs.writeFileSync('pages/PublicDashboard.tsx', content);
    console.log("Patched PublicDashboard Lower Section with Regex");
} else {
    console.log("Could not match Lower Section Regex!");
}
