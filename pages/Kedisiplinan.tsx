
import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Loader2, Calendar, Search } from 'lucide-react';
import { getWIBISOString, formatDateIndo } from '../utils/dateUtils';

interface StudentDiscipline {
    id: string;
    nisn: string;
    name: string;
    finalStatus: string; // S, I, A, or '' (Hadir)
    details: string[];   // e.g. ["Sakit di Matematika", "Alpa di IPA"]
}

const Kedisiplinan: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState(getWIBISOString());
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  
  const [disciplineData, setDisciplineData] = useState<StudentDiscipline[]>([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchDisciplineData();
    } else {
        setDisciplineData([]);
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
        const { data } = await supabase.from('students').select('kelas');
        if (data) {
            const unique = Array.from(new Set(data.map((s:any) => s.kelas))).sort();
            setClasses(unique);
        }
    } catch (e) { console.error(e); }
  };

  const fetchDisciplineData = async () => {
      setLoading(true);
      try {
        // 1. Get All Students in Class
        const { data: students } = await supabase
            .from('students')
            .select('id, nisn, name')
            .eq('kelas', selectedClass)
            .order('name');
        
        if (!students) throw new Error("Tidak ada data siswa.");

        const startOfDay = `${selectedDate}T00:00:00+07:00`;
        const endOfDay = `${selectedDate}T23:59:59+07:00`;

        // 2. Get All Journals for this Class on this Date (All Teachers)
        const { data: journals } = await supabase
            .from('journals')
            .select('id, subject, teacher_id')
            .eq('kelas', selectedClass)
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay);
        
        const journalIds = journals?.map(j => j.id) || [];
        
        let attendanceLogs: any[] = [];
        if (journalIds.length > 0) {
            const { data: logs } = await supabase
                .from('attendance_logs')
                .select('student_id, status, subject')
                .in('journal_id', journalIds);
            attendanceLogs = logs || [];
        }

        // 3. Consolidate Data with Priority Logic (S > I > A)
        const consolidated: StudentDiscipline[] = students.map(student => {
            // Find logs for this specific student
            const studentLogs = attendanceLogs.filter(l => l.student_id === student.id);
            
            const statuses = studentLogs.map(l => l.status);
            const details: string[] = studentLogs
                .filter(l => ['S','I','A'].includes(l.status))
                .map(l => `${l.status === 'S' ? 'Sakit' : l.status === 'I' ? 'Izin' : 'Alpa'} (${l.subject || 'Mapel'})`);

            let finalStatus = '';
            
            // Priority Logic
            if (statuses.includes('S')) finalStatus = 'S';
            else if (statuses.includes('I')) finalStatus = 'I';
            else if (statuses.includes('A')) finalStatus = 'A';
            
            return {
                id: student.id,
                nisn: student.nisn,
                name: student.name,
                finalStatus,
                details
            };
        });

        setDisciplineData(consolidated);

      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                <ShieldAlert size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Rekap Kedisiplinan</h2>
                <p className="text-gray-500 text-sm">Monitoring ketidakhadiran siswa harian per kelas.</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="grid md:grid-cols-2 gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Tanggal</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 text-gray-400" size={16}/>
                        <input 
                            type="date"
                            className="w-full border rounded-xl p-3 pl-10 bg-gray-50 font-bold text-gray-700"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Kelas</label>
                    <select 
                        className="w-full border rounded-xl p-3 bg-gray-50 font-bold text-gray-700 focus:ring-2 focus:ring-orange-500"
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                    >
                        <option value="">-- Pilih Kelas --</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
        </div>

        {selectedClass && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Data Absensi Kelas {selectedClass}</h3>
                    <span className="text-xs text-gray-500">{formatDateIndo(selectedDate)}</span>
                </div>
                
                {loading ? (
                    <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-orange-500"/></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 w-10">No</th>
                                    <th className="px-6 py-4 w-32">NISN</th>
                                    <th className="px-6 py-4">Nama Murid</th>
                                    <th className="px-6 py-4 text-center w-24">Status Akhir</th>
                                    <th className="px-6 py-4">Rincian Ketidakhadiran</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {disciplineData.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Tidak ada siswa di kelas ini.</td></tr>
                                ) : (
                                    disciplineData.map((s, idx) => (
                                        <tr key={s.id} className="hover:bg-orange-50/30">
                                            <td className="px-6 py-3 text-center text-gray-500">{idx + 1}</td>
                                            <td className="px-6 py-3 font-mono text-gray-500">{s.nisn}</td>
                                            <td className="px-6 py-3 font-bold text-gray-700">{s.name}</td>
                                            <td className="px-6 py-3 text-center">
                                                {s.finalStatus ? (
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                                        s.finalStatus === 'S' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                        s.finalStatus === 'I' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                        'bg-red-100 text-red-700 border-red-200'
                                                    }`}>
                                                        {s.finalStatus === 'S' ? 'Sakit' : s.finalStatus === 'I' ? 'Izin' : 'Alpa'}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 font-medium">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-xs text-gray-600">
                                                {s.details.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {s.details.map((d, i) => (
                                                            <span key={i} className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{d}</span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 italic">Hadir Penuh</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )}
      </div>
    </Layout>
  );
};

export default Kedisiplinan;
