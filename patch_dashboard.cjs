const fs = require('fs');
let content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

const targetKinerja = `<div className="bg-white dark:bg-slate-800 rounded-3xl w-full overflow-hidden shadow-lg border border-white/20">
                            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700 p-1">
                                <div className="p-3 py-5 flex items-center justify-center gap-3">
                                    <div className="w-[42px] h-[42px] rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800 shrink-0">
                                        <Users size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[28px] font-medium text-blue-600 dark:text-blue-400 leading-none">{stats.totalMeetings}</span>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-widest">Pertemuan</span>
                                    </div>
                                </div>
                                <div className="p-3 py-5 flex items-center justify-center gap-3">
                                    <div className="w-[42px] h-[42px] rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 shrink-0">
                                        <FileText size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[28px] font-medium text-emerald-600 dark:text-emerald-400 leading-none">{stats.totalJp}</span>
                                            <span className="text-xs font-bold text-slate-400">/ {stats.targetJp}</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-widest">Total JP</span>
                                    </div>
                                </div>
                                <div className="p-3 py-5 flex items-center justify-center gap-3">
                                     <div className="w-[42px] h-[42px] rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center border border-orange-100 dark:border-orange-800 shrink-0">
                                         <Star size={20} strokeWidth={2.5} />
                                     </div>
                                     <div className="flex flex-col text-left">
                                        <span className={"text-[10px] font-extrabold leading-[1.2] uppercase " + performanceColor}>
                                            {performanceStatus.split(' ').map((word, i) => <React.Fragment key={i}>{word}<br/></React.Fragment>)}
                                        </span>
                                     </div>
                                </div>
                            </div>
                        </div>`;

const replacementKinerja = `<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                        </div>`;

if (content.includes(targetKinerja)) {
    content = content.replace(targetKinerja, replacementKinerja);
} else {
    // try replacing with regex
    content = content.replace(/<div className="bg-white dark:bg-slate-800 rounded-3xl w-full overflow-hidden shadow-lg border border-white\/20">.*?<\/div>\s*<\/div>\s*<\/div>/s, replacementKinerja);
}

fs.writeFileSync('pages/Dashboard.tsx', content);
console.log("Dashboard patched");
