const fs = require('fs');
let content = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');

const targetAppCard = `  const AppCard = ({ label, subLabel, icon: Icon, path, gradientClass }: any) => (
    <button
      onClick={() => navigate(path)}
      className="bg-white dark:bg-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-slate-600 hover:-translate-y-1 transition-all duration-300 w-full h-52 group relative overflow-hidden"
    >
      {/* 3D ICON CONTAINER */}
      <div className={\`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-\${gradientClass.split('-')[gradientClass.split('-').length-1]}/30 border-t border-white/40 relative z-10 transform transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 \${gradientClass}\`}>
         <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/20 to-transparent opacity-50 pointer-events-none"></div>
         <Icon size={36} strokeWidth={1.8} className="drop-shadow-md" />
      </div>
      
      <div className="text-center relative z-10">
          <h3 className="text-lg font-extrabold text-slate-700 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight leading-tight">{label}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1.5 uppercase tracking-wide group-hover:text-slate-500 dark:group-hover:text-slate-400">{subLabel}</p>
      </div>
      
      {/* Background Decor */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-white/5 dark:to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    </button>
  );`;

const replacementAppCard = `  const AppCard = ({ label, subLabel, icon: Icon, path, gradientClass, shadowColor }: any) => (
    <button
      onClick={() => navigate(path)}
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[1.75rem] p-5 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full relative overflow-hidden group text-left min-h-[120px]"
    >
        {/* Background Decor (Leaves pattern simulation) */}
        <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transition-transform duration-500 group-hover:scale-110 text-slate-900 dark:text-white">
             <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22c0-4.5 3.5-8 8-8-4.5 0-8-3.5-8-8 0 4.5-3.5 8-8 8 4.5 0 8 3.5 8 8z"/>
                <path d="M12 22c0-3 2.5-6 6-6-3.5 0-6-2.5-6-6 0 3-2.5 6-6 6 3.5 0 6 2.5 6 6z"/>
             </svg>
        </div>
        
        {/* Colorful background splash at bottom */}
        <div className={\`absolute -bottom-4 right-0 w-3/4 h-12 \${gradientClass} opacity-[0.08] blur-xl rounded-full\`}></div>

      {/* 3D ICON CONTAINER */}
      <div className={\`w-[72px] h-[72px] shrink-0 rounded-[1.25rem] flex items-center justify-center text-white \${shadowColor} border border-white/20 relative z-10 transition-transform duration-500 group-hover:scale-105 \${gradientClass}\`}>
         <Icon size={32} strokeWidth={2} className="drop-shadow-sm" />
      </div>
      
      <div className="relative z-10 flex-1 py-1 pr-6">
          <h3 className="text-[17px] font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-1.5">{label}</h3>
          <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest leading-[1.3]">{subLabel.split('\\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}</p>
      </div>

      <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors z-10">
          <ChevronRight size={18} strokeWidth={2.5} />
      </div>
    </button>
  );`;

if (content.includes(targetAppCard)) {
    if (!content.includes('ChevronRight')) {
        content = content.replace(/lucide-react';/, "ChevronRight, lucide-react';").replace(', lucide-react', '');
    }
    content = content.replace(targetAppCard, replacementAppCard);
    
    // Update the props for AppCards
    content = content.replace(/label="Isi Jurnal"\s+subLabel="Input KBM Harian"/g, 'label="Isi Jurnal" subLabel="INPUT KBM\\nHARIAN" shadowColor="shadow-[0_8px_16px_rgba(59,130,246,0.3)]"');
    content = content.replace(/label="Jadwalku"\s+subLabel="Jadwal Mengajar"/g, 'label="Jadwalku" subLabel="JADWAL\\nMENGAJAR" shadowColor="shadow-[0_8px_16px_rgba(99,102,241,0.3)]"');
    content = content.replace(/label="Kehadiran"\s+subLabel="Rekap Absensi Mapel"/g, 'label="Kehadiran" subLabel="REKAP ABSENSI\\nMAPEL" shadowColor="shadow-[0_8px_16px_rgba(16,185,129,0.3)]"');
    content = content.replace(/label="Ketidakhadiran"\s+subLabel="Untuk Rapor"/g, 'label="Ketidakhadiran" subLabel="UNTUK\\nRAPOR" shadowColor="shadow-[0_8px_16px_rgba(244,63,94,0.3)]"');
    content = content.replace(/label="Laporan"\s+subLabel="Cetak Jurnal"/g, 'label="Laporan" subLabel="CETAK\\nJURNAL" shadowColor="shadow-[0_8px_16px_rgba(245,158,11,0.3)]"');
    content = content.replace(/label="Pelanggaran"\s+subLabel="Temuan di Luar KBM"/g, 'label="Pelanggaran" subLabel="TEMUAN DI\\nLUAR KBM" shadowColor="shadow-[0_8px_16px_rgba(239,68,68,0.3)]"');
    content = content.replace(/label="Presensi QR"\s+subLabel="Scan Kartu"/g, 'label="Presensi QR" subLabel="SCAN\\nKARTU" shadowColor="shadow-[0_8px_16px_rgba(71,85,105,0.3)]"');
    content = content.replace(/label="Presensi Dhuha"\s+subLabel="Rekap Kehadiran"/g, 'label="Presensi Dhuha" subLabel="REKAP\\nKEHADIRAN" shadowColor="shadow-[0_8px_16px_rgba(168,85,247,0.3)]"');
    
    content = content.replace(/<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">/g, '<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">');

    fs.writeFileSync('pages/AppsMenu.tsx', content);
    console.log("AppsMenu patched!");
} else {
    console.log("AppsMenu target not found!");
}
