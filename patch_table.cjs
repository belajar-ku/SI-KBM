const fs = require('fs');
let code = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

const regex = /<h3 className="font-bold text-slate-800 dark:text-white text-xs mb-4 uppercase tracking-wide flex items-center gap-2">(.|\n)*?<\/table>\s*<\/div>/;

const newCode = `<div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <CalendarDays size={18} strokeWidth={2.5}/>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-[13px] uppercase tracking-wide">
                            KETERLAKSANAAN KBM HARI INI DI KELAS
                        </h3>
                    </div>
                    
                    <div className="overflow-hidden bg-white dark:bg-slate-800 rounded-[14px] border border-slate-100 dark:border-slate-700 shadow-sm">
                        <table className="w-full text-center border-collapse table-fixed">
                            <thead>
                                <tr className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                                    {kbmStatus.map((status) => (
                                        <th key={status.hour} className="py-3 px-1 border-r border-slate-100 dark:border-slate-700 last:border-r-0 font-semibold text-slate-800 dark:text-slate-300 w-[12.5%] text-[13px]">
                                            {status.hour}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-white dark:bg-slate-800">
                                    {kbmStatus.map((status) => (
                                        <td key={status.hour} className="py-3 px-1 border-r border-slate-100 dark:border-slate-700 last:border-r-0">
                                            <div className="flex flex-col items-center justify-center min-h-[1.5rem]">
                                                {status.isScheduled ? (
                                                    status.className.split(' / ').map((cls, idx) => (
                                                        <span key={idx} className={\`block font-bold text-sm \${
                                                            status.isFilled 
                                                            ? 'text-emerald-600 dark:text-emerald-400' 
                                                            : 'text-rose-600 dark:text-rose-400'
                                                        }\`}>
                                                            {cls}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-600 font-bold text-[13px] leading-none select-none">-</span>
                                                )}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>`;

code = code.replace(regex, newCode);
fs.writeFileSync('pages/Dashboard.tsx', code);
