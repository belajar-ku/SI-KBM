const fs = require('fs');

const sharedHeaderUI = `<div className="bg-[#1281ff] rounded-[24px] md:rounded-[32px] p-4 md:p-8 text-white relative overflow-hidden mb-6">
            {/* Background pattern from the image */}
            <div className="absolute bottom-0 right-0 w-[60%] h-full pointer-events-none opacity-20">
                 <div className="absolute right-0 bottom-0 w-64 h-64" style={{ backgroundImage: 'radial-gradient(circle, white 2.5px, transparent 2.5px)', backgroundSize: '16px 16px' }}></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-start gap-4 w-full">
                <div className="flex items-center gap-3 md:gap-5 w-full md:pl-2">
                    <div className="flex-shrink-0">
                        <div className="w-[60px] h-[60px] md:w-[100px] md:h-[100px] rounded-full overflow-hidden bg-white flex items-center justify-center shadow-sm">
                            {profile?.avatar_url ? <img src={profile?.avatar_url} className="w-full h-full object-cover" /> : <User size={40} strokeWidth={1.5} className="text-slate-300 w-8 h-8 md:w-12 md:h-12" />}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0 overflow-hidden">
                        <p className="text-white/90 text-[10px] sm:text-[11px] md:text-[13px] mb-0 font-medium">{greeting}</p>
                        <div className="w-full overflow-x-auto no-scrollbar" style={{ maskImage: 'linear-gradient(to right, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent 100%)' }}>
                             <h1 className="text-[14px] sm:text-[16px] md:text-2xl lg:text-3xl font-bold mb-0.5 leading-tight whitespace-nowrap min-w-max pr-4">{profile?.full_name}</h1>
                        </div>
                        <p className="text-white/90 text-[10px] sm:text-[11px] md:text-[13px] mb-1.5 font-medium tracking-wide">{profile?.nip || 'NIP -'}</p>
                        <div className="flex flex-col items-start gap-1">
                            {profile?.mengajar_mapel && <span className="inline-flex items-start px-2 py-1 md:px-4 md:py-2 rounded-[24px] bg-white/20 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider max-w-full text-left leading-[1.3]"><BookOpen className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 mr-1 mt-[1px] shrink-0" strokeWidth={2.5}/> <span className="line-clamp-2 break-words">{profile.mengajar_mapel}</span></span>}
                            {profile?.wali_kelas && <span className="inline-flex items-center px-2 py-1 md:px-4 md:py-2 rounded-full bg-white/20 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider"><Users className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 mr-1" strokeWidth={2.5}/> Wali Kelas {profile.wali_kelas}</span>}
                        </div>
                    </div>
                </div>
                
                <div className="w-full mt-2 relative z-10">
                    <div className="flex items-center justify-center gap-2 md:gap-4 mb-3 md:mb-4 mt-1 md:mt-2">
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-white/60 to-transparent max-w-[80px] md:max-w-[100px]"></div>
                        <p className="text-[10px] sm:text-[11px] md:text-[13px] font-semibold text-white tracking-wide whitespace-nowrap">Kinerja Bulan {currentMonthName}</p>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/60 to-transparent max-w-[80px] md:max-w-[100px]"></div>
                    </div>
                    
                    <div className="bg-white rounded-[16px] md:rounded-[24px] p-2 sm:p-3 md:p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.1)] relative overflow-hidden">
                        <div className="flex-[1] flex flex-col items-center justify-center relative px-0.5 sm:px-1">
                            <div className="flex flex-row items-center gap-1 md:gap-3 mb-0.5 md:mb-1">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-full border border-blue-100 bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" strokeWidth={2} />
                                </div>
                                <span className="text-[20px] sm:text-[24px] md:text-[44px] font-medium text-blue-600 leading-none tracking-tight">{stats.totalMeetings}</span>
                            </div>
                            <span className="text-[7px] sm:text-[8px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 text-center">Pertemuan</span>
                            <div className="absolute right-0 top-[15%] bottom-[15%] w-[1px] bg-slate-100"></div>
                        </div>
                        
                        <div className="flex-[1] flex flex-col items-center justify-center relative px-0.5 sm:px-1">
                            <div className="flex flex-row items-center gap-1 md:gap-3 mb-0.5 md:mb-1">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" strokeWidth={2} />
                                </div>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-[20px] sm:text-[24px] md:text-[44px] font-medium text-emerald-600 leading-none tracking-tight">{stats.totalJp}</span>
                                    <span className="text-[10px] sm:text-[12px] md:text-[20px] font-medium text-slate-400">/{stats.targetJp}</span>
                                </div>
                            </div>
                            <span className="text-[7px] sm:text-[8px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 text-center">Total JP</span>
                            <div className="absolute right-0 top-[15%] bottom-[15%] w-[1px] bg-slate-100"></div>
                        </div>
                        
                        <div className="flex-[1] flex items-center justify-center gap-1 md:gap-3 pl-0.5 sm:pl-1">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-full border border-orange-100 bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                <Star className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6" strokeWidth={2} />
                            </div>
                            <span className={"text-[7px] sm:text-[8px] md:text-[11px] font-bold leading-[1.2] md:leading-[1.3] uppercase text-left tracking-wider max-w-[50px] sm:max-w-[65px] md:max-w-[90px] break-words " + performanceColor}>
                                {performanceStatus}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

function replaceHeader(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');
    const startStr = '<div className="bg-[#1281ff]';
    let endStr = '';
    
    if (filePath.includes('Dashboard.tsx')) {
        endStr = '        {/* MAIN WIDGETS */}';
    } else if (filePath.includes('AppsMenu.tsx')) {
        endStr = '  ) : null;';
    }

    const start = code.indexOf(startStr);
    const end = code.indexOf(endStr);
    
    if (start !== -1 && end !== -1) {
        if (filePath.includes('Dashboard.tsx')) {
            code = code.substring(0, start) + sharedHeaderUI + '\n        )}\n\n' + code.substring(end);
        } else {
            code = code.substring(0, start) + sharedHeaderUI + '\n' + code.substring(end);
        }
        fs.writeFileSync(filePath, code);
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`Failed to update ${filePath}. Start: ${start}, End: ${end}`);
    }
}

replaceHeader('pages/Dashboard.tsx');
replaceHeader('pages/AppsMenu.tsx');
