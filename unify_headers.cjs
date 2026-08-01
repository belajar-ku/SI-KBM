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

const sharedHeaderUI = `<div className="bg-gradient-to-br from-[#1281ff] via-[#1070e0] to-[#0a5abf] dark:from-blue-900 dark:to-blue-950 rounded-[1.75rem] p-5 md:p-8 text-white shadow-[0_8px_30px_rgba(18,129,255,0.3)] dark:shadow-none relative overflow-hidden mb-6">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 bottom-0 w-1/2 overflow-hidden pointer-events-none">
                 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
                 {/* Dotted pattern approximation */}
                 <div className="absolute bottom-10 right-0 w-32 h-32 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)', backgroundSize: '10px 10px' }}></div>
                 <Clock size={220} strokeWidth={1} className="absolute top-6 -right-12 opacity-15 text-white" />
                 
                 {/* Curved line approximations */}
                 <svg className="absolute bottom-0 right-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                     <path d="M0,100 C30,80 70,80 100,100 L100,100 Z" fill="white" />
                     <path d="M20,100 C50,60 90,60 100,80 L100,100 Z" fill="white" />
                 </svg>
            </div>
            
            <div className="relative z-10 flex flex-col items-start gap-4 w-full">
                <div className="flex items-center gap-4 w-full">
                    <div className="flex-shrink-0">
                        <div className="w-[88px] h-[88px] rounded-full border-4 border-white shadow-sm overflow-hidden bg-white flex items-center justify-center">
                            {profile?.avatar_url ? <img src={profile?.avatar_url} className="w-full h-full object-cover" /> : <User size={40} className="text-slate-300" />}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        <p className="text-white text-[13px] mb-0.5 tracking-wide">{greeting}</p>
                        <h1 className="text-[22px] md:text-2xl font-bold mb-1 leading-tight tracking-tight">{profile?.full_name}</h1>
                        <p className="text-white/80 text-[13px] mb-2 font-mono tracking-wide">{profile?.nip || 'NIP -'}</p>
                        <div className="flex flex-wrap gap-2">
                            {profile?.mengajar_mapel && <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider"><BookOpen size={12} className="mr-1.5 opacity-90" strokeWidth={2.5}/> {profile.mengajar_mapel}</span>}
                            {profile?.wali_kelas && <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider"><Users size={12} className="mr-1.5 opacity-90" strokeWidth={2.5}/> Wali Kelas {profile.wali_kelas}</span>}
                        </div>
                    </div>
                </div>
                
                <div className="w-full mt-2 relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-4 mt-2">
                        <div className="h-[1px] w-12 bg-gradient-to-l from-white/60 to-transparent"></div>
                        <p className="text-[12px] font-semibold text-white/95 tracking-wide">Kinerja Bulan {currentMonthName}</p>
                        <div className="h-[1px] w-12 bg-gradient-to-r from-white/60 to-transparent"></div>
                    </div>
                    
                    <div className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.1)] relative overflow-hidden group">
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            <div className="flex flex-row items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-full border border-blue-100 bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                                    <Users size={20} strokeWidth={2} />
                                </div>
                                <span className="text-[36px] font-medium text-blue-600 leading-none tracking-tight">{stats.totalMeetings}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Pertemuan</span>
                            <div className="absolute right-0 top-[10%] bottom-[10%] w-[1px] bg-slate-100"></div>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            <div className="flex flex-row items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                                    <FileText size={20} strokeWidth={2} />
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[36px] font-medium text-emerald-600 leading-none tracking-tight">{stats.totalJp}</span>
                                    <span className="text-[16px] font-medium text-slate-400">/{stats.targetJp}</span>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total JP</span>
                            <div className="absolute right-0 top-[10%] bottom-[10%] w-[1px] bg-slate-100"></div>
                        </div>
                        
                        <div className="flex-[1.2] flex items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-orange-100 bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm shrink-0">
                                <Star size={20} strokeWidth={2} />
                            </div>
                            <span className={"text-[10px] font-bold leading-[1.2] uppercase text-left tracking-wide max-w-[80px] " + performanceColor}>
                                {performanceStatus}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

// Replace in Dashboard.tsx
let dashboardCode = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

// Logic replace
const dashLogicStart = dashboardCode.indexOf('  const currentMonthName =');
const dashLogicEnd = dashboardCode.indexOf('  if (isHeadmaster) {');
if (dashLogicStart !== -1 && dashLogicEnd !== -1) {
    dashboardCode = dashboardCode.substring(0, dashLogicStart) + sharedLogic + '\n' + dashboardCode.substring(dashLogicEnd);
}

// UI replace
const dashUIStart = dashboardCode.indexOf('        {/* HEADER */}');
const dashUIEnd = dashboardCode.indexOf('        {/* MAIN WIDGETS */}');
if (dashUIStart !== -1 && dashUIEnd !== -1) {
    dashboardCode = dashboardCode.substring(0, dashUIStart) + 
      '        {/* HEADER */}\n' +
      '        {!isAdmin && (\n' +
      '        ' + sharedHeaderUI + '\n' +
      '        )}\n\n' + 
      dashboardCode.substring(dashUIEnd);
}

// Import User icon if missing
if (!dashboardCode.includes('User,')) {
    dashboardCode = dashboardCode.replace(/import \{\s*/, 'import { User, ');
}

fs.writeFileSync('pages/Dashboard.tsx', dashboardCode);

// Replace in AppsMenu.tsx
let appsMenuCode = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');

const appLogicStart = appsMenuCode.indexOf('  const getGreeting');
const appLogicEnd = appsMenuCode.indexOf('  // Header UI Block');
if (appLogicStart !== -1 && appLogicEnd !== -1) {
    appsMenuCode = appsMenuCode.substring(0, appLogicStart) + sharedLogic + '\n' + appsMenuCode.substring(appLogicEnd);
}

const appUIStart = appsMenuCode.indexOf('  const headerUI = !isAdmin ? (');
const appUIEnd = appsMenuCode.indexOf('  ) : null;');
if (appUIStart !== -1 && appUIEnd !== -1) {
    appsMenuCode = appsMenuCode.substring(0, appUIStart) + 
      '  const headerUI = !isAdmin ? (\n' +
      sharedHeaderUI + '\n' +
      appsMenuCode.substring(appUIEnd);
}

if (!appsMenuCode.includes('User,')) {
    appsMenuCode = appsMenuCode.replace(/import \{\s*/, 'import { User, ');
}

fs.writeFileSync('pages/AppsMenu.tsx', appsMenuCode);

