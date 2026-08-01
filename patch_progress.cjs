const fs = require('fs');
let content = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const targetProgress = `                  {/* 5. PROGRESS BAR */}
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

const replaceProgress = `                  {/* 5. PROGRESS BAR */}
                  <div className="bg-white rounded-[1.5rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex items-center gap-4 sm:gap-5">
                      {(() => {
                          const percentage = stats.totalJpRequired > 0 ? (Math.round((stats.completedJp / stats.totalJpRequired) * 1000) / 10) : 0;
                          return (
                              <>
                                  {/* Icon */}
                                  <div className="w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-full bg-[#f4f7ff] shadow-[0_4px_20px_rgba(37,99,235,0.12)] flex items-center justify-center shrink-0 border-[3px] border-white">
                                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1d4ed8]">
                                          <path d="M22 6L14.5 13.5L9.5 8.5L2 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                          <path d="M16 6H22V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                          <path d="M12 21V13" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                          <path d="M18 21V16" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                          <path d="M6 21V17" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                      </svg>
                                  </div>
                                  
                                  <div className="flex-1 flex flex-col justify-center">
                                      <span className="text-[12px] sm:text-[13px] font-black text-[#1e3a8a] tracking-wide mb-2">PROGRESS KBM HARI INI</span>
                                      
                                      <div className="flex items-center gap-4">
                                          <div className="flex-1 flex flex-col gap-1.5">
                                              <div className="h-2.5 sm:h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                                  <div className="h-full bg-[#1d4ed8] rounded-full transition-all duration-1000 ease-out" style={{ width: \`\${percentage}%\`}}></div>
                                              </div>
                                              <span className="text-[11px] sm:text-[12px] font-semibold text-[#1e40af]">{percentage}% Terlaksana</span>
                                          </div>
                                          <div className="text-[26px] sm:text-[32px] font-black text-[#1d4ed8] leading-none shrink-0 mb-5">
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
console.log("Patched PublicDashboard Progress Bar");
