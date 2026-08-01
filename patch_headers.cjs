const fs = require('fs');

function patchFile(filename, replaceRegex, replacement, extraImports) {
    if (!fs.existsSync(filename)) return;
    let content = fs.readFileSync(filename, 'utf8');
    
    // add extra imports if not exists
    if (extraImports) {
        extraImports.forEach(imp => {
            if (!content.includes(imp)) {
                // Find lucide-react import
                const lucideRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];/;
                const match = content.match(lucideRegex);
                if (match) {
                    content = content.replace(lucideRegex, `import { $1, ${imp} } from 'lucide-react';`);
                }
            }
        });
    }

    content = content.replace(replaceRegex, replacement);
    fs.writeFileSync(filename, content);
    console.log(`Patched ${filename}`);
}

// 1. MySchedule.tsx
patchFile('pages/MySchedule.tsx', 
    /<div className="flex items-center gap-3">[\s\S]*?<\/div>\s*<\/div>/,
    `<div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                    <Compass size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Jadwal Mengajar</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Agenda KBM mingguan Anda.</p>
                </div>
            </div>`,
    ['Compass']
);

// 2. LaporanJurnal.tsx
patchFile('pages/LaporanJurnal.tsx', 
    /<div className="flex items-center gap-3">[\s\S]*?<\/div>\s*<\/div>/,
    `<div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-sm">
                <TrendingUp size={20} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Laporan Jurnal Guru</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Rekapitulasi agenda kegiatan belajar mengajar.</p>
            </div>
         </div>`,
    ['TrendingUp']
);

// 3. JurnalForm.tsx
patchFile('pages/JurnalForm.tsx',
    /<div className="flex justify-between items-center mb-8 px-2">\s*<div><h2[^>]*>\{editJournalId \? 'Edit Jurnal' : 'Isi Jurnal KBM'\}<\/h2><p[^>]*>Langkah \{step\} dari 4<\/p><\/div>\s*<div className="flex gap-2">\[1,2,3,4\]\.map\(i => <div key=\{i\}[^>]*><\/div>\)\}<\/div>\s*<\/div>/,
    `<div className="flex justify-between items-center mb-6 px-1">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-sm">
                    <BookOpenText size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{editJournalId ? 'Edit Jurnal' : 'Isi Jurnal KBM'}</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Langkah {step} dari 4</p>
                </div>
            </div>
            <div className="flex gap-1.5">{[1,2,3,4].map(i => <div key={i} className={\`h-1.5 rounded-full transition-all duration-500 \${step >= i ? 'bg-blue-600 w-6' : 'bg-slate-200 dark:bg-slate-700 w-2'}\`}></div>)}</div>
        </div>`,
    ['BookOpenText']
);

// 4. RekapAbsensi.tsx
patchFile('pages/RekapAbsensi.tsx',
    /<div className="flex items-center gap-3">[\s\S]*?<\/div>\s*<\/div>/,
    `<div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 text-white flex items-center justify-center shadow-sm">
                    <UserCheck size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Rekap Kehadiran</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Laporan kehadiran murid per mapel.</p>
                </div>
            </div>`,
    ['UserCheck']
);

// 5. RekapDhuha.tsx
patchFile('pages/RekapDhuha.tsx',
    /<div className="flex items-center gap-3">[\s\S]*?<\/div>\s*<\/div>/,
    `<div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center shadow-sm">
                    <Sun size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Presensi Dhuha</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Rekapitulasi kehadiran sholat dhuha.</p>
                </div>
            </div>`,
    ['Sun']
);

// 6. AbsensiRapor.tsx
patchFile('pages/AbsensiRapor.tsx',
    /<div className="flex items-center gap-3">[\s\S]*?<\/div>\s*<\/div>/,
    `<div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-600 text-white flex items-center justify-center shadow-sm">
                    <UserMinus size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Absensi Rapor</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Ketidakhadiran murid per kelas wali.</p>
                </div>
            </div>`,
    ['UserMinus']
);

// 7. Kedisiplinan.tsx
patchFile('pages/Kedisiplinan.tsx',
    /<div className="flex items-center gap-3">[\s\S]*?<\/div>\s*<\/div>/,
    `<div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shadow-sm">
                    <ShieldAlert size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Laporan Kedisiplinan</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Temuan pelanggaran di luar jam KBM.</p>
                </div>
            </div>`,
    ['ShieldAlert']
);

