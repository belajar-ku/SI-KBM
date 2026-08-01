const fs = require('fs');
let code = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

const regex = /\{\/\*\s*CLASS PROGRESS WIDGET\s*\*\/\}(.|\n)*?stats\.monthJournals\.map/;

const newCode = `{/* CLASS PROGRESS WIDGET */}
                <div className="bg-white dark:bg-slate-800 rounded-[20px] p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp size={18} strokeWidth={2.5} className="text-[#2563eb]"/>
                        <h3 className="text-[13px] font-bold text-[#0f172a] dark:text-slate-300 uppercase tracking-wide">Distribusi Pertemuan Kelas ({currentMonthName})</h3>
                    </div>
                    <div className="relative z-10">
                        {stats.monthJournals.length === 0 ? (
                            <div className="relative py-14 px-8 bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] dark:from-slate-800/50 dark:to-slate-700/50 rounded-2xl border border-white dark:border-slate-700 overflow-hidden flex items-center justify-between">
                                {/* Subtle stars decorations */}
                                <div className="absolute top-4 left-1/4 text-blue-200/60 dark:text-blue-500/30">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"/></svg>
                                </div>
                                <div className="absolute top-8 right-1/4 text-blue-200/60 dark:text-blue-500/30">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"/></svg>
                                </div>
                                <div className="absolute bottom-6 left-10 text-blue-200/60 dark:text-blue-500/30">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"/></svg>
                                </div>

                                <p className="text-[13px] text-[#475569] dark:text-slate-400 font-medium italic leading-relaxed max-w-[150px] relative z-10 ml-2">
                                    Belum ada data<br/>mengajar bulan ini.
                                </p>
                                
                                <div className="absolute -right-4 -bottom-4">
                                    <div className="relative">
                                        <div className="w-[120px] h-[140px] bg-[#3b82f6] rounded-xl transform rotate-[10deg] shadow-[0_8px_20px_rgba(37,99,235,0.2)]"></div>
                                        <div className="absolute inset-0 w-[110px] h-[130px] bg-white rounded-lg transform rotate-[10deg] ml-2 mt-2 flex flex-col p-3">
                                            <div className="w-full h-3 bg-blue-100 rounded-sm mb-2"></div>
                                            <div className="flex gap-2 mb-2 items-end">
                                                <div className="w-3 h-8 bg-[#60a5fa] rounded-t-sm"></div>
                                                <div className="w-3 h-12 bg-[#2563eb] rounded-t-sm"></div>
                                                <div className="w-5 h-5 rounded-full bg-[#93c5fd] ml-1"></div>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-sm mt-auto"></div>
                                        </div>
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-6 bg-[#93c5fd] rounded-lg rotate-[10deg] shadow-sm flex justify-center pt-1">
                                            <div className="w-4 h-1.5 bg-[#2563eb] rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="absolute right-6 bottom-4 bg-[#3b82f6] text-white rounded-full p-2.5 shadow-[0_4px_12px_rgba(37,99,235,0.4)] z-10 border-2 border-white">
                                    <Check size={20} strokeWidth={3} />
                                </div>
                            </div>
                        ) : (
                            stats.monthJournals.map`;

code = code.replace(regex, newCode);
fs.writeFileSync('pages/Dashboard.tsx', code);
