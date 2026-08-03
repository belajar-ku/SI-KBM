const fs = require('fs');
let code = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const oldStr = `                                        const absentCount = modalContent.data.absencePerClass[cls] || 0;
                                        const presentCount = totalStudents - absentCount;
                                        const isExpanded = expandedClass === cls;
                                        return (
                                            <div key={cls} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                                                <button onClick={() => setExpandedClass(isExpanded ? null : cls)} className="w-full flex items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-black text-slate-700 dark:text-white mr-3 shrink-0 text-sm">
                                                        {cls}
                                                    </div>
                                                    <div className="flex-1 px-1">
                                                        <div className="flex items-center gap-2 text-xs font-bold">
                                                            <span className="text-green-600 dark:text-green-400">{presentCount} Hadir</span>
                                                            <span className="text-gray-300 dark:text-gray-600">|</span>
                                                            <span className={absentCount > 0 ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}>
                                                                {absentCount} Tidak Hadir
                                                            </span>
                                                        </div>
                                                    </div>`;

const newStr = `                                        const absentCount = modalContent.data.absencePerClass[cls] || 0;
                                        const presentCount = totalStudents - absentCount;
                                        const isExpanded = expandedClass === cls;
                                        
                                        const isFilled = modalContent.data.filledClasses?.includes(cls);
                                        const showAsEmpty = absentCount === 0 && !isFilled;

                                        return (
                                            <div key={cls} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                                                <button onClick={() => setExpandedClass(isExpanded ? null : cls)} className="w-full flex items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-black text-slate-700 dark:text-white mr-3 shrink-0 text-sm">
                                                        {cls}
                                                    </div>
                                                    <div className="flex-1 px-1">
                                                        <div className="flex items-center gap-2 text-xs font-bold">
                                                            <span className={showAsEmpty ? "text-gray-400 dark:text-gray-500" : "text-green-600 dark:text-green-400"}>{presentCount} Hadir</span>
                                                            <span className="text-gray-300 dark:text-gray-600">|</span>
                                                            <span className={absentCount > 0 ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}>
                                                                {absentCount} Tidak Hadir
                                                            </span>
                                                        </div>
                                                    </div>`;

code = code.replace(oldStr, newStr);

fs.writeFileSync('pages/PublicDashboard.tsx', code);
console.log("Patched render in PublicDashboard.tsx");
