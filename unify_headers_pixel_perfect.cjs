const fs = require('fs');

const sharedLogic = `  const currentMonthName = getWIBDate().toLocaleDateString('id-ID', { month: 'long' });

  let performanceStatus = "TIDAK ADA DATA";
  let performanceColor = "text-slate-400";
  
  if (stats.targetJp > 0) {
      const percentage = (stats.totalJp / stats.targetJp) * 100;
      if (percentage >= 90) {
          performanceStatus = "DI ATAS EKSPEKTASI";
          performanceColor = "text-emerald-500";
      } else if (percentage >= 70) {
          performanceStatus = "SESUAI EKSPEKTASI";
          performanceColor = "text-blue-500";
      } else {
          performanceStatus = "DI BAWAH EKSPEKTASI";
          performanceColor = "text-orange-500";
      }
  }

  const getGreeting = () => {
      const hour = getWIBDate().getHours();
      if (hour < 11) return 'Selamat Pagi,';
      if (hour < 15) return 'Selamat Siang,';
      if (hour < 18) return 'Selamat Sore,';
      return 'Selamat Malam,';
  };
  const greeting = getGreeting();
`;

const sharedHeaderUI = `<div className="bg-[#1281ff] rounded-[32px] p-5 md:p-8 text-white relative overflow-hidden mb-6">
            {/* Background pattern from the image */}
            <div className="absolute bottom-0 right-0 w-[60%] h-full pointer-events-none opacity-20">
                 <div className="absolute right-0 bottom-0 w-64 h-64" style={{ backgroundImage: 'radial-gradient(circle, white 2.5px, transparent 2.5px)', backgroundSize: '16px 16px' }}></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-start gap-4 w-full">
                <div className="flex items-center gap-5 w-full pl-2">
                    <div className="flex-shrink-0">
                        <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-white flex items-center justify-center">
                            {profile?.avatar_url ? <img src={profile?.avatar_url} className="w-full h-full object-cover" /> : <User size={50} strokeWidth={1.5} className="text-slate-300" />}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        <p className="text-white text-[13px] mb-1 font-medium">{greeting}</p>
                        <h1 className="text-[22px] md:text-3xl font-bold mb-1 leading-tight">{profile?.full_name}</h1>
                        <p className="text-white text-[13px] mb-3 font-medium tracking-wide">{profile?.nip || 'NIP -'}</p>
                        <div className="flex flex-col items-start gap-2">
                            {profile?.mengajar_mapel && <span className="inline-flex items-start px-4 py-2 rounded-[24px] bg-white/20 text-[10px] font-bold uppercase tracking-wider max-w-[240px] text-left leading-[1.4]"><BookOpen size={14} className="mr-2 mt-[2px] shrink-0" strokeWidth={2.5}/> <span>{profile.mengajar_mapel}</span></span>}
                            {profile?.wali_kelas && <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider"><Users size={14} className="mr-2" strokeWidth={2.5}/> Wali Kelas {profile.wali_kelas}</span>}
                        </div>
                    </div>
                </div>
                
                <div className="w-full mt-2 relative z-10">
                    <div className="flex items-center justify-center gap-4 mb-4 mt-2">
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-white/60 to-transparent max-w-[100px]"></div>
                        <p className="text-[13px] font-semibold text-white">Kinerja Bulan {currentMonthName}</p>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/60 to-transparent max-w-[100px]"></div>
                    </div>
                    
                    <div className="bg-white rounded-[24px] p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.1)] relative">
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            <div className="flex flex-row items-center gap-3 mb-1">
                                <div className="w-12 h-12 rounded-full border border-blue-100 bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <Users size={22} strokeWidth={2} />
                                </div>
                                <span className="text-[44px] font-medium text-blue-600 leading-none tracking-tight">{stats.totalMeetings}</span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">Pertemuan</span>
                            <div className="absolute right-0 top-[10%] bottom-[10%] w-[1px] bg-slate-100"></div>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            <div className="flex flex-row items-center gap-3 mb-1">
                                <div className="w-12 h-12 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <FileText size={22} strokeWidth={2} />
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[44px] font-medium text-emerald-600 leading-none tracking-tight">{stats.totalJp}</span>
                                    <span className="text-[20px] font-medium text-slate-400">/{stats.targetJp}</span>
                                </div>
                            </div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">Total JP</span>
                            <div className="absolute right-0 top-[10%] bottom-[10%] w-[1px] bg-slate-100"></div>
                        </div>
                        
                        <div className="flex-[1.2] flex items-center justify-center gap-3 pl-2">
                            <div className="w-12 h-12 rounded-full border border-orange-100 bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                <Star size={24} strokeWidth={2} />
                            </div>
                            <span className={"text-[11px] font-bold leading-[1.3] uppercase text-left tracking-wider max-w-[90px] " + performanceColor}>
                                {performanceStatus}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

// Dashboard.tsx
let dashboardCode = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

// The UI was previously enclosed in `{!isAdmin && (\n ... \n )}` and we know it's right before `{/* MAIN WIDGETS */}`
// But wait, the previous UI replacement replaced `{/* HEADER */}` entirely. 
// Let's find `<div className="bg-gradient-to-br from-[#1281ff]` which is how the header started previously.
const dashUIStartStr = '<div className="bg-gradient-to-br from-[#1281ff]';
const dashUIEndStr = '        {/* MAIN WIDGETS */}';
const dashStart = dashboardCode.indexOf(dashUIStartStr);
const dashEnd = dashboardCode.indexOf(dashUIEndStr);

if (dashStart !== -1 && dashEnd !== -1) {
    // Note: The previous block ended with `)}\n` before MAIN WIDGETS. So we must preserve that.
    dashboardCode = dashboardCode.substring(0, dashStart) + sharedHeaderUI + '\n        )}\n\n' + dashboardCode.substring(dashEnd);
}
fs.writeFileSync('pages/Dashboard.tsx', dashboardCode);

// AppsMenu.tsx
let appsMenuCode = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');

const appUIStartStr = '<div className="bg-gradient-to-br from-[#1281ff]';
const appUIEndStr = '  ) : null;';
const appStart = appsMenuCode.indexOf(appUIStartStr);
const appEnd = appsMenuCode.indexOf(appUIEndStr);

if (appStart !== -1 && appEnd !== -1) {
    appsMenuCode = appsMenuCode.substring(0, appStart) + sharedHeaderUI + '\n' + appsMenuCode.substring(appEnd);
}
fs.writeFileSync('pages/AppsMenu.tsx', appsMenuCode);

