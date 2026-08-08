const fs = require('fs');
let code = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

// Add expandedStatus state
const oldState = `  const [expandedClass, setExpandedClass] = useState<string | null>(null);`;
const newState = `  const [expandedClass, setExpandedClass] = useState<string | null>(null);\n  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);`;
code = code.replace(oldState, newState);

// Reset expandedStatus when opening absence modal
const oldAbsenceClick = `  const handleAbsenceClick = () => {
      if (!stats) return;
      setExpandedClass(null);
      setModalContent({ title: 'Rincian Ketidakhadiran Hari Ini', type: 'absence', data: stats });
      setModalOpen(true);
  };`;
const newAbsenceClick = `  const handleAbsenceClick = () => {
      if (!stats) return;
      setExpandedClass(null);
      setExpandedStatus(null);
      setModalContent({ title: 'Rincian Ketidakhadiran Hari Ini', type: 'absence', data: stats });
      setModalOpen(true);
  };`;
code = code.replace(oldAbsenceClick, newAbsenceClick);

// Add getAbsentStudentsForStatus function
const oldGetClass = `  const getAbsentStudentsForClass = (cls: string) => {`;
const newGetClass = `  const getAbsentStudentsForStatus = (status: string) => {
      const absentStudents = rawAttendance.filter(log => log.status === status);
      return absentStudents.map(s => ({
          name: s.name === 'Loading...' ? 'Siswa (Data Wali)' : s.name, 
          status: s.status,
          source: s.source,
          kelas: studentClassMap[s.student_id] || '?'
      }));
  };

  const getAbsentStudentsForClass = (cls: string) => {`;
code = code.replace(oldGetClass, newGetClass);


// Update the Absence Modal rendering
const oldAbsenceGrid = `                        <>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center justify-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-2xl border border-yellow-100 dark:border-yellow-800/50">
                                    <span className="text-yellow-700 dark:text-yellow-400 font-bold text-[10px] uppercase mb-1">Sakit</span>
                                    <span className="text-3xl font-extrabold text-yellow-600 dark:text-yellow-400">{modalContent.data.absenceDetails.S}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                    <span className="text-blue-700 dark:text-blue-400 font-bold text-[10px] uppercase mb-1">Izin</span>
                                    <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{modalContent.data.absenceDetails.I}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-3 bg-red-50 dark:bg-red-900/30 rounded-2xl border border-red-100 dark:border-red-800/50">
                                    <span className="text-red-700 dark:text-red-400 font-bold text-[10px] uppercase mb-1">Alpa</span>
                                    <span className="text-3xl font-extrabold text-red-600 dark:text-red-400">{modalContent.data.absenceDetails.A}</span>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-600 rounded-xl text-center">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">*Termasuk input dari Wali Kelas & Guru Mapel.</span>
                            </div>
                            <hr className="border-gray-100 dark:border-slate-700" />
                            <div>
                                <h3 className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase mb-3 flex items-center gap-2"><School size={14}/> Per Kelas</h3>`;

const newAbsenceGrid = `                        <>
                            <div className="grid grid-cols-3 gap-3">
                                <button onClick={() => setExpandedStatus(expandedStatus === 'S' ? null : 'S')} className={\`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 \${expandedStatus === 'S' ? 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-600 ring-2 ring-yellow-200 dark:ring-yellow-800' : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-100 dark:border-yellow-800/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/40'}\`}>
                                    <span className="text-yellow-700 dark:text-yellow-400 font-bold text-[10px] uppercase mb-1">Sakit</span>
                                    <span className="text-3xl font-extrabold text-yellow-600 dark:text-yellow-400">{modalContent.data.absenceDetails.S}</span>
                                </button>
                                <button onClick={() => setExpandedStatus(expandedStatus === 'I' ? null : 'I')} className={\`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 \${expandedStatus === 'I' ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-600 ring-2 ring-blue-200 dark:ring-blue-800' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/40'}\`}>
                                    <span className="text-blue-700 dark:text-blue-400 font-bold text-[10px] uppercase mb-1">Izin</span>
                                    <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{modalContent.data.absenceDetails.I}</span>
                                </button>
                                <button onClick={() => setExpandedStatus(expandedStatus === 'A' ? null : 'A')} className={\`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 \${expandedStatus === 'A' ? 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-600 ring-2 ring-red-200 dark:ring-red-800' : 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40'}\`}>
                                    <span className="text-red-700 dark:text-red-400 font-bold text-[10px] uppercase mb-1">Alpa</span>
                                    <span className="text-3xl font-extrabold text-red-600 dark:text-red-400">{modalContent.data.absenceDetails.A}</span>
                                </button>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-600 rounded-xl text-center">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">*Termasuk input dari Wali Kelas & Guru Mapel.</span>
                            </div>
                            
                            {expandedStatus && (
                                <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-100 dark:border-slate-700 space-y-2 animate-fade-in mt-3">
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">
                                        Daftar Murid {expandedStatus === 'S' ? 'Sakit' : expandedStatus === 'I' ? 'Izin' : 'Alpa'}
                                    </div>
                                    {getAbsentStudentsForStatus(expandedStatus).length > 0 ? getAbsentStudentsForStatus(expandedStatus).map((s: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-700 p-3 rounded-xl border border-gray-100 dark:border-slate-600 text-xs shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 dark:text-white">{s.name}</span>
                                                <span className="text-[10px] font-semibold text-slate-500 mt-0.5">Kelas {s.kelas}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {s.source === 'Wali' && <span className="text-[9px] bg-purple-100 text-purple-600 px-1 rounded border border-purple-200">Wali</span>}
                                                <span className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase \${s.status === 'S' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100' : s.status === 'I' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100'}\`}>
                                                    {s.status === 'S' ? 'Sakit' : s.status === 'I' ? 'Izin' : 'Alpa'}
                                                </span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center text-xs text-slate-500 font-medium py-2">Tidak ada data</div>
                                    )}
                                </div>
                            )}

                            <hr className="border-gray-100 dark:border-slate-700 my-4" />
                            <div>
                                <h3 className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase mb-3 flex items-center gap-2"><School size={14}/> Per Kelas</h3>`;

code = code.replace(oldAbsenceGrid, newAbsenceGrid);

fs.writeFileSync('pages/PublicDashboard.tsx', code);
console.log("Patched absence grid in PublicDashboard.tsx");
