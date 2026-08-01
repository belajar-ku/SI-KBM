const fs = require('fs');
let content = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const target = `          {/* 2. ACADEMIC YEAR PILL */}
          <div className="flex justify-center">
              <div className="bg-white rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 pl-1.5 pr-6 py-1.5 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
                      <GraduationCap size={16} strokeWidth={2.5}/>
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-700">
                      Tahun Ajaran: {academicYear} <span className="text-slate-300 mx-1">|</span> Semester: {semester}
                  </div>
              </div>
          </div>

          {/* 3. CLASS CARDS */}
          {loading || !stats ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={32}/></div>
          ) : (
              <>
                  <div className="grid grid-cols-3 gap-3">
                      {/* Kelas 7 */}
                      <button onClick={() => handleClassClick('7')} className="bg-white rounded-[1.5rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 text-left relative overflow-hidden group hover:shadow-md transition-all">
                          <svg className="absolute bottom-0 left-0 w-full h-auto text-blue-50/80 group-hover:text-blue-100/80 transition-colors" viewBox="0 0 100 40" preserveAspectRatio="none">
                              <path fill="currentColor" d="M0,20 Q25,40 50,20 T100,20 L100,40 L0,40 Z"></path>
                          </svg>
                          <div className="w-8 h-8 rounded-full border border-blue-200 flex items-center justify-center text-blue-500 mb-4 bg-white relative z-10 shadow-sm">
                              <User size={14} strokeWidth={2.5} />
                          </div>
                          <div className="relative z-10">
                              <div className="text-[28px] font-black text-slate-800 tracking-tighter leading-none">{stats.count7}</div>
                              <div className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase">Kelas 7</div>
                              <div className="w-6 h-1 bg-blue-500 rounded-full mt-2.5"></div>
                          </div>
                      </button>
                      {/* Kelas 8 */}
                      <button onClick={() => handleClassClick('8')} className="bg-white rounded-[1.5rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 text-left relative overflow-hidden group hover:shadow-md transition-all">
                          <svg className="absolute bottom-0 left-0 w-full h-auto text-emerald-50/80 group-hover:text-emerald-100/80 transition-colors" viewBox="0 0 100 40" preserveAspectRatio="none">
                              <path fill="currentColor" d="M0,20 Q25,40 50,20 T100,20 L100,40 L0,40 Z"></path>
                          </svg>
                          <div className="w-8 h-8 rounded-full border border-emerald-200 flex items-center justify-center text-emerald-500 mb-4 bg-white relative z-10 shadow-sm">
                              <User size={14} strokeWidth={2.5} />
                          </div>
                          <div className="relative z-10">
                              <div className="text-[28px] font-black text-slate-800 tracking-tighter leading-none">{stats.count8}</div>
                              <div className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase">Kelas 8</div>
                              <div className="w-6 h-1 bg-emerald-500 rounded-full mt-2.5"></div>
                          </div>
                      </button>
                      {/* Kelas 9 */}
                      <button onClick={() => handleClassClick('9')} className="bg-white rounded-[1.5rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 text-left relative overflow-hidden group hover:shadow-md transition-all">
                          <svg className="absolute bottom-0 left-0 w-full h-auto text-red-50/80 group-hover:text-red-100/80 transition-colors" viewBox="0 0 100 40" preserveAspectRatio="none">
                              <path fill="currentColor" d="M0,20 Q25,40 50,20 T100,20 L100,40 L0,40 Z"></path>
                          </svg>
                          <div className="w-8 h-8 rounded-full border border-red-200 flex items-center justify-center text-red-500 mb-4 bg-white relative z-10 shadow-sm">
                              <User size={14} strokeWidth={2.5} />
                          </div>
                          <div className="relative z-10">
                              <div className="text-[28px] font-black text-slate-800 tracking-tighter leading-none">{stats.count9}</div>
                              <div className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase">Kelas 9</div>
                              <div className="w-6 h-1 bg-red-500 rounded-full mt-2.5"></div>
                          </div>
                      </button>
                  </div>`;

const replace = `          {/* 2. ACADEMIC YEAR PILL */}
          <div className="flex justify-center my-1">
              <div className="bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-50 pl-2 pr-6 py-2 flex items-center gap-4">
                  <div className="w-[34px] h-[34px] bg-[#2563eb] rounded-full flex items-center justify-center text-white shadow-sm shrink-0">
                      <GraduationCap size={18} strokeWidth={2.5}/>
                  </div>
                  <div className="text-[12px] font-extrabold text-[#1e293b]">
                      Tahun Ajaran: {academicYear} <span className="text-slate-300 mx-2 text-[14px]">|</span> Semester: {semester}
                  </div>
              </div>
          </div>

          {/* 3. CLASS CARDS */}
          {loading || !stats ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#2563eb]" size={32}/></div>
          ) : (
              <>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      {/* Kelas 7 */}
                      <button onClick={() => handleClassClick('7')} className="bg-white rounded-[1.25rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 text-left relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#eff6ff] rounded-full blur-xl z-0"></div>
                          <div className="absolute bottom-0 right-0 w-20 h-20 bg-[radial-gradient(#93c5fd_1.5px,transparent_1.5px)] [background-size:8px_8px] opacity-40 z-0 mask-radial"></div>
                          <svg className="absolute bottom-0 left-0 w-full h-auto text-[#dbeafe] z-0" viewBox="0 0 100 30" preserveAspectRatio="none">
                              <path fill="currentColor" d="M0,30 Q25,10 50,20 T100,5 L100,30 L0,30 Z"></path>
                          </svg>

                          <div className="w-[34px] h-[34px] rounded-full bg-[#eff6ff] flex items-center justify-center text-[#3b82f6] border border-[#dbeafe] mb-5 relative z-10">
                              <User size={16} strokeWidth={2.5} />
                          </div>
                          <div className="relative z-10">
                              <div className="text-[34px] sm:text-[40px] font-black text-[#1d4ed8] tracking-tighter leading-none">{stats.count7}</div>
                              <div className="text-[11px] font-bold text-[#475569] mt-2 tracking-wide">KELAS 7</div>
                              <div className="w-7 h-1 bg-[#2563eb] rounded-full mt-2"></div>
                          </div>
                      </button>
                      
                      {/* Kelas 8 */}
                      <button onClick={() => handleClassClick('8')} className="bg-white rounded-[1.25rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 text-left relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#ecfdf5] rounded-full blur-xl z-0"></div>
                          <div className="absolute bottom-0 right-0 w-20 h-20 bg-[radial-gradient(#6ee7b7_1.5px,transparent_1.5px)] [background-size:8px_8px] opacity-40 z-0 mask-radial"></div>
                          <svg className="absolute bottom-0 left-0 w-full h-auto text-[#d1fae5] z-0" viewBox="0 0 100 30" preserveAspectRatio="none">
                              <path fill="currentColor" d="M0,30 Q25,10 50,20 T100,5 L100,30 L0,30 Z"></path>
                          </svg>
                          
                          <div className="w-[34px] h-[34px] rounded-full bg-[#ecfdf5] flex items-center justify-center text-[#10b981] border border-[#d1fae5] mb-5 relative z-10">
                              <User size={16} strokeWidth={2.5} />
                          </div>
                          <div className="relative z-10">
                              <div className="text-[34px] sm:text-[40px] font-black text-[#059669] tracking-tighter leading-none">{stats.count8}</div>
                              <div className="text-[11px] font-bold text-[#475569] mt-2 tracking-wide">KELAS 8</div>
                              <div className="w-7 h-1 bg-[#10b981] rounded-full mt-2"></div>
                          </div>
                      </button>
                      
                      {/* Kelas 9 */}
                      <button onClick={() => handleClassClick('9')} className="bg-white rounded-[1.25rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 text-left relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#fef2f2] rounded-full blur-xl z-0"></div>
                          <div className="absolute bottom-0 right-0 w-20 h-20 bg-[radial-gradient(#fca5a5_1.5px,transparent_1.5px)] [background-size:8px_8px] opacity-40 z-0 mask-radial"></div>
                          <svg className="absolute bottom-0 left-0 w-full h-auto text-[#fee2e2] z-0" viewBox="0 0 100 30" preserveAspectRatio="none">
                              <path fill="currentColor" d="M0,30 Q25,10 50,20 T100,5 L100,30 L0,30 Z"></path>
                          </svg>

                          <div className="w-[34px] h-[34px] rounded-full bg-[#fef2f2] flex items-center justify-center text-[#ef4444] border border-[#fee2e2] mb-5 relative z-10">
                              <User size={16} strokeWidth={2.5} />
                          </div>
                          <div className="relative z-10">
                              <div className="text-[34px] sm:text-[40px] font-black text-[#dc2626] tracking-tighter leading-none">{stats.count9}</div>
                              <div className="text-[11px] font-bold text-[#475569] mt-2 tracking-wide">KELAS 9</div>
                              <div className="w-7 h-1 bg-[#ef4444] rounded-full mt-2"></div>
                          </div>
                      </button>
                  </div>`;

if(content.includes(target)) {
    content = content.replace(target, replace);
    fs.writeFileSync('pages/PublicDashboard.tsx', content);
    console.log("Patched PublicDashboard Cards Layout");
} else {
    console.log("Could not find Cards Layout target!");
}
