const fs = require('fs');
let code = fs.readFileSync('pages/InputJadwal.tsx', 'utf8');

// 1. Add state for copy current version
const stateOld = `const [newVersionName, setNewVersionName] = useState('');`;
const stateNew = `const [newVersionName, setNewVersionName] = useState('');\n  const [copyCurrentVersion, setCopyCurrentVersion] = useState(false);`;
code = code.replace(stateOld, stateNew);

// 2. Make handleCreateNewVersion async and implement copy
const handleCreateOld = `  const handleCreateNewVersion = () => {
      if (!newVersionName.trim()) {
          showAlert("Nama versi tidak boleh kosong!");
          return;
      }
      
      const vName = newVersionName.trim();
      setAvailableVersions(prev => Array.from(new Set([...prev, vName])));
      setWorkingVersion(vName);
      setNewVersionName('');
      setShowNewVersionModal(false);
      showAlert(\`Berhasil membuat versi jadwal baru: \${vName}. Silakan tambahkan jadwal.\`);
  };`;

const handleCreateNew = `  const handleCreateNewVersion = async () => {
      if (!newVersionName.trim()) {
          showAlert("Nama versi tidak boleh kosong!");
          return;
      }
      
      const vName = newVersionName.trim();
      
      if (copyCurrentVersion) {
          setLoading(true);
          try {
              // Get all schedules for the current working version
              const { data: currentSchedules, error: fetchErr } = await supabase
                  .from('schedules')
                  .select('*')
                  .eq('academic_year', academicYear || '2025/2026')
                  .eq('semester', semester || 'Ganjil')
                  .eq('schedule_version', workingVersion);
                  
              if (fetchErr) throw fetchErr;
              
              if (currentSchedules && currentSchedules.length > 0) {
                  const newSchedules = currentSchedules.map(s => {
                      const { id, created_at, ...rest } = s; // remove id and created_at
                      return { ...rest, schedule_version: vName };
                  });
                  
                  const { error: insertErr } = await supabase.from('schedules').insert(newSchedules);
                  if (insertErr) throw insertErr;
              }
              
              showAlert(\`Berhasil menyalin jadwal ke versi baru: \${vName}.\`);
          } catch (err: any) {
              console.error(err);
              showAlert('Error', 'Gagal menyalin jadwal: ' + err.message);
          } finally {
              setLoading(false);
          }
      } else {
          showAlert(\`Berhasil membuat versi jadwal kosong baru: \${vName}.\`);
      }
      
      setAvailableVersions(prev => Array.from(new Set([...prev, vName])));
      setWorkingVersion(vName);
      setNewVersionName('');
      setCopyCurrentVersion(false);
      setShowNewVersionModal(false);
      
      // Refresh teacher schedules if a teacher is selected
      if (selectedTeacher) {
          fetchTeacherSchedules(selectedTeacher.id);
      }
  };`;
code = code.replace(handleCreateOld, handleCreateNew);

// 3. Add checkbox in modal UI
const modalOld = `                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Nama Versi Jadwal Baru</label>
                                <input 
                                    type="text" 
                                    className="w-full border rounded-xl p-3 bg-white focus:ring-2 focus:ring-purple-500 outline-none font-medium text-slate-800" 
                                    value={newVersionName}
                                    onChange={(e) => setNewVersionName(e.target.value)}
                                    placeholder="Contoh: Jadwal UTS, Revisi 2"
                                    autoFocus
                                />
                            </div>
                        </div>`;

const modalNew = `                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Nama Versi Jadwal Baru</label>
                                <input 
                                    type="text" 
                                    className="w-full border rounded-xl p-3 bg-white focus:ring-2 focus:ring-purple-500 outline-none font-medium text-slate-800" 
                                    value={newVersionName}
                                    onChange={(e) => setNewVersionName(e.target.value)}
                                    placeholder="Contoh: Jadwal UTS, Revisi 2"
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <input 
                                    type="checkbox" 
                                    id="copySchedule"
                                    checked={copyCurrentVersion}
                                    onChange={(e) => setCopyCurrentVersion(e.target.checked)}
                                    className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                />
                                <label htmlFor="copySchedule" className="text-sm font-medium text-indigo-900 cursor-pointer">
                                    Salin jadwal dari versi <strong>{workingVersion}</strong>
                                </label>
                            </div>
                        </div>`;
code = code.replace(modalOld, modalNew);

// Also handle the disabled button when loading
const buttonOld = `<button onClick={handleCreateNewVersion} className="px-5 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors">
                                Buat Jadwal Baru
                            </button>`;
const buttonNew = `<button onClick={handleCreateNewVersion} disabled={loading} className="px-5 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50">
                                {loading ? 'Memproses...' : 'Buat Jadwal Baru'}
                            </button>`;
code = code.replace(buttonOld, buttonNew);

fs.writeFileSync('pages/InputJadwal.tsx', code);
console.log('Patched InputJadwal for copy feature');
