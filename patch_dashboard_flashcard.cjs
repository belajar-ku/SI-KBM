const fs = require('fs');
let content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

const targetHeader = `<div className="bg-[#1281ff] dark:bg-blue-900 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-200/50 dark:shadow-none relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
                 <Clock size={200} strokeWidth={2.5} className="-mr-8 -mt-8" />
            </div>
            
            <div className="relative z-10 flex flex-col items-start gap-4">
                <div className="flex items-center gap-5">
                    <div className="flex-shrink-0">
                        <div className="w-[84px] h-[84px] rounded-full border-[3px] border-white shadow-sm overflow-hidden bg-white flex items-center justify-center">
                            {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={40} className="text-slate-300" />}
                        </div>
                    </div>
                    <div>
                        <p className="text-blue-50 text-sm mb-1">{greeting},</p>
                        <h1 className="text-xl md:text-2xl font-semibold mb-0.5">{profile?.full_name}</h1>
                        <p className="text-blue-100/90 text-sm mb-3 font-mono">{isAdmin ? 'Administrator' : (profile?.nip || 'NIP -')}</p>
                        <div className="flex flex-wrap gap-2">
                            {!isAdmin && profile?.mengajar_mapel && <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider"><BookOpen size={12} className="mr-1.5 opacity-80"/> {profile.mengajar_mapel}</span>}
                            {!isAdmin && profile?.wali_kelas && <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider"><Users size={12} className="mr-1.5 opacity-80"/> Wali Kelas {profile.wali_kelas}</span>}
                        </div>
                    </div>
                </div>
                
                {!isAdmin && (
                    <div className="w-full mt-4 bg-white/10 border border-white/20 rounded-2xl p-3 flex flex-col gap-3 relative z-10">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-extrabold text-white/90 uppercase tracking-widest pl-1">Kinerja Bulan {currentMonthName}</p>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white rounded-xl p-2.5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
                                <div className="w-7 h-7 mb-1.5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Users size={14} strokeWidth={2.5} />
                                </div>
                                <div className="flex items-baseline gap-1 justify-center">
                                    <span className="text-[18px] font-black text-slate-800 leading-none tracking-tighter">{stats.totalMeetings}</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Kali</span>
                                </div>
                                <span className="text-[8px] font-extrabold text-slate-400 uppercase mt-0.5 tracking-widest">Pertemuan</span>
                            </div>
                            
                            <div className="bg-white rounded-xl p-2.5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
                                <div className="w-7 h-7 mb-1.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <FileText size={14} strokeWidth={2.5} />
                                </div>
                                <div className="flex items-baseline gap-1 justify-center">
                                    <span className="text-[18px] font-black text-slate-800 leading-none tracking-tighter">{stats.totalJp}</span>
                                    <span className="text-[8px] font-bold text-slate-400">/ {stats.targetJp}</span>
                                </div>
                                <span className="text-[8px] font-extrabold text-slate-400 uppercase mt-0.5 tracking-widest">Total JP</span>
                            </div>
                            
                            <div className="bg-white rounded-xl p-2.5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
                                <div className="w-7 h-7 mb-1.5 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                                    <Star size={14} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col items-center justify-center mt-0.5">
                                    <span className={"text-[10px] font-black leading-tight uppercase text-center " + performanceColor}>
                                        {performanceStatus.split(' ').map((word, i) => <React.Fragment key={i}>{word} </React.Fragment>)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>`;

const replacementHeader = `
        {/* Flashcard Profile */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 relative overflow-hidden flex items-center gap-4">
             <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50/50 dark:bg-blue-900/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
             
             <div className="flex-shrink-0 z-10">
                 <div className="w-[72px] h-[72px] rounded-[1.25rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center relative rotate-3 group-hover:rotate-0 transition-transform duration-300">
                     {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover -rotate-3 group-hover:rotate-0 transition-transform duration-300" /> : <User size={32} className="text-slate-300 -rotate-3" />}
                 </div>
             </div>
             
             <div className="z-10 flex-1">
                 <p className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">{greeting}</p>
                 <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white leading-none tracking-tight mb-1">{profile?.full_name}</h1>
                 <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">{isAdmin ? 'Administrator' : (profile?.nip || 'NIP -')}</p>
                 
                 <div className="flex flex-wrap gap-1.5">
                     {!isAdmin && profile?.mengajar_mapel && <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[9px] font-bold uppercase tracking-wider"><BookOpen size={10} className="mr-1"/> {profile.mengajar_mapel}</span>}
                     {!isAdmin && profile?.wali_kelas && <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold uppercase tracking-wider"><Users size={10} className="mr-1"/> Wali {profile.wali_kelas}</span>}
                 </div>
             </div>
        </div>

        {/* Kinerja Bulan (3 Columns) */}
        {!isAdmin && (
            <div className="w-full">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-[13px] font-extrabold text-slate-800 dark:text-white uppercase tracking-widest">Kinerja Bulan {currentMonthName}</h2>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 p-2 md:p-3 relative overflow-hidden">
                    <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700/50">
                        <div className="flex flex-col items-center justify-center p-2 text-center group">
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                                <Users size={16} strokeWidth={2.5} />
                            </div>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-xl font-black text-slate-800 dark:text-white leading-none">{stats.totalMeetings}</span>
                                <span className="text-[9px] font-bold text-slate-400">x</span>
                            </div>
                            <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mt-1">Pertemuan</span>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center p-2 text-center group">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                                <FileText size={16} strokeWidth={2.5} />
                            </div>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-xl font-black text-slate-800 dark:text-white leading-none">{stats.totalJp}</span>
                                <span className="text-[9px] font-bold text-slate-400">/{stats.targetJp}</span>
                            </div>
                            <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mt-1">Total JP</span>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center p-2 text-center group">
                            <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                                <Star size={16} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <span className={"text-[10px] font-black uppercase leading-tight " + performanceColor}>
                                    {performanceStatus.split(' ').map((word, i) => <React.Fragment key={i}>{word} </React.Fragment>)}
                                </span>
                            </div>
                            <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mt-1">Status</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
`;

content = content.replace(targetHeader, replacementHeader);
fs.writeFileSync('pages/Dashboard.tsx', content);
console.log("Dashboard flashcard patched");
