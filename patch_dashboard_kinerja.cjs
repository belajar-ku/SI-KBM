const fs = require('fs');
let content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

const targetKinerja = `<div className="w-full mt-6">
                        <div className="flex items-center justify-center gap-4 mb-4 max-w-sm mx-auto">
                            <div className="h-px bg-white/30 flex-1"></div>
                            <p className="text-[13px] font-medium text-white/90">Kinerja Bulan {currentMonthName}</p>
                            <div className="h-px bg-white/30 flex-1"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                <div className="flex flex-col z-10">
                                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Pertemuan</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-[26px] font-black text-blue-600 dark:text-blue-400 leading-none tracking-tighter">{stats.totalMeetings}</span>
                                        <span className="text-[10px] font-bold text-slate-400">Kali</span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-[1rem] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                    <Users size={22} strokeWidth={2.5} />
                                </div>
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
                            </div>
                            
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                <div className="flex flex-col z-10">
                                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Total JP</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-[26px] font-black text-emerald-600 dark:text-emerald-400 leading-none tracking-tighter">{stats.totalJp}</span>
                                        <span className="text-[10px] font-bold text-slate-400">/ {stats.targetJp}</span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                    <FileText size={22} strokeWidth={2.5} />
                                </div>
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
                            </div>
                            
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                <div className="flex flex-col z-10">
                                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Kinerja</span>
                                    <div className="flex items-baseline mt-1">
                                        <span className={"text-[13px] font-black leading-tight uppercase " + performanceColor}>
                                            {performanceStatus.split(' ').map((word, i) => <React.Fragment key={i}>{word}<br/></React.Fragment>)}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-[1rem] bg-orange-50 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                    <Star size={22} strokeWidth={2.5} />
                                </div>
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-xl pointer-events-none"></div>
                            </div>
                        </div>
                    </div>`;

const replacementKinerja = `<div className="w-full mt-4 bg-white/10 border border-white/20 rounded-2xl p-3 flex flex-col gap-3 relative z-10">
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
                    </div>`;

if (content.includes(targetKinerja)) {
    content = content.replace(targetKinerja, replacementKinerja);
} else {
    // try regex
    const regex = /<div className="w-full mt-6">.*?<div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500\/5 dark:bg-orange-500\/10 rounded-full blur-xl pointer-events-none"><\/div>\s*<\/div>\s*<\/div>\s*<\/div>/s;
    content = content.replace(regex, replacementKinerja);
}

fs.writeFileSync('pages/Dashboard.tsx', content);
console.log("Dashboard Kinerja patched");
