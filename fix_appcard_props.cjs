const fs = require('fs');
let code = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');

// Replace non-admin cards entirely
const newNonAdmin = `<>
                    <AppCard 
                        label="Isi Jurnal" subLabel="INPUT KBM HARIAN" 
                        icon={BookOpen} 
                        path="/jurnal" 
                        colorClass="bg-[#2563eb]" 
                    />
                    <AppCard 
                        label="Jadwalku" subLabel="JADWAL MENGAJAR" 
                        icon={Compass} 
                        path="/jadwal" 
                        colorClass="bg-[#6366f1]" 
                    />
                    {isDhuhaTeacher && (
                      <AppCard 
                          label="Presensi Dhuha" subLabel="REKAP KEHADIRAN" 
                          icon={Sun} 
                          path="/rekap-dhuha" 
                          colorClass="bg-[#a855f7]" 
                      />
                    )}
                    <AppCard 
                        label="Kehadiran" subLabel="REKAP ABSENSI MAPEL" 
                        icon={UserCheck} 
                        path="/rekap-absensi" 
                        colorClass="bg-[#10b981]" 
                    />
                    <AppCard 
                        label="Ketidakhadiran" subLabel="UNTUK RAPOR" 
                        icon={UserMinus} 
                        path="/absensi-rapor" 
                        colorClass="bg-[#f43f5e]" 
                    />
                    <AppCard 
                        label="Laporan" subLabel="CETAK JURNAL" 
                        icon={TrendingUp} 
                        path="/laporan" 
                        colorClass="bg-[#f59e0b]" 
                    />
                    <AppCard 
                        label="Pelanggaran" subLabel="TEMUAN DI LUAR KBM" 
                        icon={ShieldAlert} 
                        path="/kedisiplinan" 
                        colorClass="bg-[#ef4444]" 
                    />
                    <AppCard 
                        label="Presensi QR" subLabel="SCAN KEHADIRAN" 
                        icon={ScanLine} 
                        path="/qr" 
                        colorClass="bg-[#475569]" 
                    />
                </>`;

code = code.replace(/<>\s*<AppCard\s*label="Isi Jurnal"[\s\S]*?<\/AppCard>\s*<\/AppCard>\s*<\/AppCard>\s*<\/AppCard>\s*<\/AppCard>\s*<\/AppCard>\s*<\/AppCard>\s*<\/AppCard>\s*<\/>/, '');
// Wait, the regex replace for non-admin is tricky. Let's just find everything between `) : (` and `)}` and replace it.

const startIdx = code.indexOf(') : (');
const endIdx = code.lastIndexOf(')}');
if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx + 5) + '\n' + newNonAdmin + '\n                ' + code.substring(endIdx);
}

// Change `gradientClass` to `colorClass` for Admin cards so they don't break either
code = code.replace(/gradientClass=/g, 'colorClass=');

// Fix AppCard definition back to support colorClass
code = code.replace(/const AppCard = \(\{ label, subLabel, icon: Icon, path, colorClass \}: any\) => \{/, 
  'const AppCard = ({ label, subLabel, icon: Icon, path, colorClass }: any) => {');

fs.writeFileSync('pages/AppsMenu.tsx', code);
