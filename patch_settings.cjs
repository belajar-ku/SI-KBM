const fs = require('fs');
let code = fs.readFileSync('pages/SettingsPage.tsx', 'utf8');

// Replace import to include SchoolActivity
const importOld = `import { AppSetting, NonEffectiveDay, Profile } from '../types';`;
const importNew = `import { AppSetting, NonEffectiveDay, Profile } from '../types';\nexport interface SchoolActivity {\n  id?: string;\n  date: string;\n  name: string;\n  academic_year?: string;\n  semester?: string;\n}`;
code = code.replace(importOld, importNew);

const stateOld = `const [nonEffectiveDays, setNonEffectiveDays] = useState<NonEffectiveDay[]>([]);`;
const stateNew = `const [nonEffectiveDays, setNonEffectiveDays] = useState<NonEffectiveDay[]>([]);
  const [schoolActivities, setSchoolActivities] = useState<SchoolActivity[]>([]);
  const [newActivityDate, setNewActivityDate] = useState('');
  const [newActivityName, setNewActivityName] = useState('');`;
code = code.replace(stateOld, stateNew);

const fetchOld = `const { data: settingsData, error } = await supabase.from('app_settings').select('*');`;
const fetchNew = `const { data: settingsData, error } = await supabase.from('app_settings').select('*');
        const { data: acts } = await supabase.from('school_activities').select('*').order('date');
        if (acts) setSchoolActivities(acts);`;
code = code.replace(fetchOld, fetchNew);

const uiOld = `{/* Non-Effective Days Settings */}`;
const uiNew = `{/* Kegiatan Sekolah Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Kegiatan Sekolah</h2>
              <p className="text-sm text-gray-500">Atur jadwal kegiatan (KBM Ditiadakan, Wali Kelas mengisi presensi)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="date" value={newActivityDate} onChange={e => setNewActivityDate(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              <input type="text" placeholder="Nama Kegiatan (ex: Lomba 17an)" value={newActivityName} onChange={e => setNewActivityName(e.target.value)} className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              <button onClick={async () => {
                  if(!newActivityDate || !newActivityName) return showAlert('Error', 'Isi tanggal dan nama kegiatan');
                  const { error } = await supabase.from('school_activities').insert({ date: newActivityDate, name: newActivityName, academic_year: settings.academic_year || '2025/2026', semester: settings.semester || 'Ganjil' });
                  if(error) return showAlert('Error', error.message);
                  setNewActivityDate(''); setNewActivityName('');
                  const { data } = await supabase.from('school_activities').select('*').order('date');
                  if (data) setSchoolActivities(data);
              }} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <Plus size={18} /> Tambah
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Nama Kegiatan</th>
                    <th className="py-3 px-4 w-20 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schoolActivities.length === 0 ? (
                    <tr><td colSpan={3} className="py-4 text-center text-gray-500">Belum ada data</td></tr>
                  ) : (
                    schoolActivities.map(act => (
                      <tr key={act.id}>
                        <td className="py-3 px-4">{new Date(act.date).toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</td>
                        <td className="py-3 px-4">{act.name}</td>
                        <td className="py-3 px-4 text-center">
                          <button onClick={async () => {
                              const conf = await showConfirm('Hapus Kegiatan', 'Yakin ingin menghapus kegiatan ini?');
                              if(!conf) return;
                              const { error } = await supabase.from('school_activities').delete().eq('id', act.id);
                              if(error) return showAlert('Error', error.message);
                              setSchoolActivities(schoolActivities.filter(a => a.id !== act.id));
                          }} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Non-Effective Days Settings */}`;
code = code.replace(uiOld, uiNew);

fs.writeFileSync('pages/SettingsPage.tsx', code);
console.log("Patched SettingsPage for School Activities");
