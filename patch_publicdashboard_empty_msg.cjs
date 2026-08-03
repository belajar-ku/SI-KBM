const fs = require('fs');
let code = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const oldStr = `                                                {isExpanded && absentCount === 0 && (
                                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 text-center text-xs text-green-700 dark:text-green-400 font-bold border-t border-green-100 dark:border-green-900/30">
                                                        Semua murid hadir.
                                                    </div>
                                                )}`;

const newStr = `                                                {isExpanded && absentCount === 0 && (
                                                    <div className={showAsEmpty ? "bg-gray-50 dark:bg-slate-800 p-3 text-center text-xs text-gray-500 dark:text-gray-400 font-bold border-t border-gray-100 dark:border-slate-700" : "bg-green-50 dark:bg-green-900/20 p-3 text-center text-xs text-green-700 dark:text-green-400 font-bold border-t border-green-100 dark:border-green-900/30"}>
                                                        {showAsEmpty ? "Belum ada laporan absen/jurnal." : "Semua murid hadir."}
                                                    </div>
                                                )}`;

code = code.replace(oldStr, newStr);
fs.writeFileSync('pages/PublicDashboard.tsx', code);
console.log("Patched empty msg");
