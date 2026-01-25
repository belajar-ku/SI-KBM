
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { Upload, FileText, CheckCircle, AlertCircle, Download, BookOpen, X, Siren, UserX, Loader2, AlertTriangle } from 'lucide-react';

const InputManual: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jurnal' | 'pelanggaran' | 'absensi'>('jurnal');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  
  // State untuk menyimpan data yang gagal
  const [failedRows, setFailedRows] = useState<any[]>([]);

  // Mapping Data (Cache)
  const [studentsMap, setStudentsMap] = useState<Record<string, string>>({}); // NISN -> ID
  const [teachersMap, setTeachersMap] = useState<Record<string, string>>({}); // NIP -> ID

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      // Load mapping data on mount
      const fetchMappings = async () => {
          const { data: s } = await supabase.from('students').select('id, nisn');
          const { data: t } = await supabase.from('profiles').select('id, nip');
          
          const sMap: Record<string, string> = {};
          s?.forEach(item => { if(item.nisn) sMap[item.nisn] = item.id; });
          setStudentsMap(sMap);

          const tMap: Record<string, string> = {};
          t?.forEach(item => { if(item.nip) tMap[item.nip] = item.id; });
          setTeachersMap(tMap);
      };
      fetchMappings();
  }, []);

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
  };

  const downloadTemplate = () => {
    let csvContent = "";
    let filename = "";

    if (activeTab === 'jurnal') {
        csvContent = "Tanggal;Jam Ke;Kelas;Mapel;Materi;NIP Guru\n2024-01-20;1-2;7A;Matematika;Aljabar Dasar;19800101xxx\n2024-01-20;3-4;8B;IPA;Hukum Newton;19900202xxx";
        filename = 'template_input_jurnal.csv';
    } else if (activeTab === 'pelanggaran') {
        // Updated: Added NIP Pelapor
        csvContent = "Tanggal;NISN;Kategori;Tindak Lanjut;Catatan;NIP Pelapor\n2024-01-20;0012345678;Terlambat;Teguran Lisan;Datang jam 07.15;19800101xxx\n2024-01-21;0087654321;Seragam Tidak Lengkap;Poin;Tidak pakai dasi;19900202xxx";
        filename = 'template_input_pelanggaran.csv';
    } else if (activeTab === 'absensi') {
        // Updated: Added NIP Guru
        csvContent = "Tanggal;NISN;Status;NIP Guru\n2024-01-20;0012345678;S;19800101xxx\n2024-01-20;0087654321;I;19800101xxx\n2024-01-20;0099887766;A;19800101xxx";
        filename = 'template_input_absensi.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const downloadFailedLog = () => {
      if (failedRows.length === 0) return;
      
      const headers = Object.keys(failedRows[0]);
      const csvContent = [
          headers.join(';'),
          ...failedRows.map(row => headers.map(fieldName => `"${row[fieldName] || ''}"`).join(';'))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `error_log_${activeTab}_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        setStatus(null);
        setFailedRows([]);
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const text = evt.target?.result as string;
                const data = parseCSV(text);
                if (data.length === 0) {
                    setStatus({ type: 'error', msg: 'File CSV kosong atau format salah.' });
                } else {
                    setPreviewData(data);
                }
            } catch (err) {
                setStatus({ type: 'error', msg: 'Gagal membaca file CSV.' });
            }
        };
        reader.readAsText(selectedFile);
    }
  };

  const handleProcess = async () => {
      if (previewData.length === 0) return;
      setLoading(true);
      setStatus(null);
      setFailedRows([]);

      let successCount = 0;
      let errorCount = 0;
      const failedData: any[] = [];

      try {
          if (activeTab === 'jurnal') {
              const inserts = [];
              for (const row of previewData) {
                  const teacherNip = String(row['NIP Guru'] || row['nip'] || '').trim();
                  const teacherId = teachersMap[teacherNip];
                  const date = row['Tanggal'] || row['tanggal']; // YYYY-MM-DD
                  
                  if (teacherId && date) {
                      const createdAt = `${date}T07:00:00+07:00`;
                      inserts.push({
                          teacher_id: teacherId,
                          kelas: row['Kelas'] || row['kelas'],
                          subject: row['Mapel'] || row['mapel'],
                          hours: row['Jam Ke'] || row['jam'],
                          material: row['Materi'] || row['materi'] || '-',
                          cleanliness: 'sudah_bersih', 
                          validation: 'hadir_kbm', 
                          created_at: createdAt
                      });
                  } else {
                      errorCount++;
                      failedData.push({
                          ...row,
                          error_reason: !teacherId ? `NIP ${teacherNip} tidak ditemukan di Data User` : 'Format Tanggal Salah'
                      });
                  }
              }
              if (inserts.length > 0) {
                  const { error } = await supabase.from('journals').insert(inserts);
                  if (error) throw error;
                  successCount = inserts.length;
              }

          } else if (activeTab === 'pelanggaran') {
              const inserts = [];
              for (const row of previewData) {
                  const nisn = String(row['NISN'] || row['nisn']).trim();
                  const reporterNip = String(row['NIP Pelapor'] || row['nip pelapor'] || row['NIP'] || '').trim();
                  
                  const studentId = studentsMap[nisn];
                  // Opsional: Validasi NIP pelapor jika ada, tapi tidak wajib membatalkan insert jika hanya untuk catatan
                  const reporterId = teachersMap[reporterNip]; 
                  
                  const date = row['Tanggal'] || row['tanggal'];
                  
                  if (studentId && date) {
                      const createdAt = `${date}T07:00:00+07:00`;
                      // Append reporter NIP to note since journal_notes doesn't strictly have a reporter_id column yet
                      const baseNote = (row['Catatan'] || row['catatan'] || '');
                      const finalNote = reporterNip 
                        ? `${baseNote} (Pelapor NIP: ${reporterNip})` 
                        : `${baseNote} (Import Manual)`;

                      inserts.push({
                          student_id: studentId,
                          type: 'kedisiplinan',
                          category: row['Kategori'] || row['kategori'],
                          follow_up: row['Tindak Lanjut'] || row['tindak lanjut'],
                          note: finalNote,
                          created_at: createdAt
                      });
                  } else {
                      errorCount++;
                      failedData.push({
                          ...row,
                          error_reason: !studentId ? `NISN ${nisn} tidak ditemukan` : 'Format Tanggal Salah'
                      });
                  }
              }
              if (inserts.length > 0) {
                  const { error } = await supabase.from('journal_notes').insert(inserts);
                  if (error) throw error;
                  successCount = inserts.length;
              }

          } else if (activeTab === 'absensi') {
              const { data: allStudents } = await supabase.from('students').select('id, nisn, kelas');
              const sFullMap: Record<string, {id: string, kelas: string}> = {};
              allStudents?.forEach(s => { if(s.nisn) sFullMap[s.nisn] = {id: s.id, kelas: s.kelas}; });

              const finalInserts = [];
              for (const row of previewData) {
                  const nisn = String(row['NISN'] || row['nisn']).trim();
                  const teacherNip = String(row['NIP Guru'] || row['nip guru'] || row['NIP'] || '').trim();
                  const teacherId = teachersMap[teacherNip];

                  const sData = sFullMap[nisn];
                  const date = row['Tanggal'] || row['tanggal'];
                  const status = (row['Status'] || row['status']).toUpperCase();

                  if (sData && date && teacherId && ['S','I','A','D'].includes(status)) {
                      finalInserts.push({
                          student_id: sData.id,
                          kelas: sData.kelas,
                          date: date,
                          status: status,
                          created_by: teacherId // Link to specific teacher
                      });
                  } else {
                      errorCount++;
                      let reason = '';
                      if (!sData) reason = `NISN ${nisn} tidak ditemukan`;
                      else if (!teacherId) reason = `NIP Guru ${teacherNip} tidak ditemukan`;
                      else reason = 'Format Tanggal/Status Salah';

                      failedData.push({
                          ...row,
                          error_reason: reason
                      });
                  }
              }

              if (finalInserts.length > 0) {
                  const { error } = await supabase.from('homeroom_attendance').upsert(finalInserts, { onConflict: 'date,student_id' });
                  if (error) throw error;
                  successCount = finalInserts.length;
              }
          }

          setFailedRows(failedData);
          setStatus({ 
              type: failedData.length > 0 ? 'error' : 'success', 
              msg: `Proses Selesai. Sukses: ${successCount} data. Gagal/Skip: ${errorCount} data.` 
          });
          
          if(failedData.length === 0) {
              setFile(null);
              setPreviewData([]);
              if (fileInputRef.current) fileInputRef.current.value = "";
          }

      } catch (err: any) {
          setStatus({ type: 'error', msg: "Terjadi kesalahan sistem: " + err.message });
      } finally {
          setLoading(false);
      }
  };

  const handleClear = () => {
      setFile(null);
      setPreviewData([]);
      setStatus(null);
      setFailedRows([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="text-indigo-600" /> Input Data Manual (Massal)
                </h2>
                <p className="text-gray-500 text-sm">Upload file CSV untuk mengisi data Jurnal, Pelanggaran, atau Absensi secara massal.</p>
            </div>
            <button 
                onClick={downloadTemplate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all"
            >
                <Download size={18} /> Download Template
            </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b overflow-x-auto bg-gray-50">
                <button 
                    onClick={() => { setActiveTab('jurnal'); handleClear(); }}
                    className={`flex-1 min-w-[120px] py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'jurnal' ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <BookOpen size={18} /> Jurnal KBM
                </button>
                <button 
                    onClick={() => { setActiveTab('pelanggaran'); handleClear(); }}
                    className={`flex-1 min-w-[120px] py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'pelanggaran' ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Siren size={18} /> Catatan Pelanggaran
                </button>
                <button 
                    onClick={() => { setActiveTab('absensi'); handleClear(); }}
                    className={`flex-1 min-w-[120px] py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'absensi' ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <UserX size={18} /> Ketidakhadiran Murid
                </button>
            </div>

            <div className="p-8">
                <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3 text-sm text-blue-800">
                    <FileText className="flex-shrink-0 mt-1" />
                    <div>
                        <p className="font-bold">Panduan:</p>
                        <ul className="list-disc ml-4 mt-1 space-y-1">
                            <li>Format Tanggal harus <strong>YYYY-MM-DD</strong> (Contoh: 2024-01-25).</li>
                            <li>Pastikan <strong>NISN</strong> (Murid) dan <strong>NIP</strong> (Guru/Pelapor) sudah terdaftar di database.</li>
                            <li>Gunakan <strong>Titik Koma (;)</strong> atau Koma (,) sebagai pemisah CSV.</li>
                        </ul>
                    </div>
                </div>

                {!file ? (
                    <div 
                        className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:bg-indigo-50 hover:border-indigo-400 transition-colors cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="text-indigo-600" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700">Klik untuk Upload File CSV</h3>
                        <p className="text-gray-500 text-sm mt-1">Target: {activeTab.toUpperCase()}</p>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".csv, .txt" 
                            className="hidden" 
                        />
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-3">
                                <FileText className="text-indigo-600" size={32} />
                                <div>
                                    <p className="font-bold text-gray-800">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB • {previewData.length} Baris Data</p>
                                </div>
                            </div>
                            <button onClick={handleClear} className="p-2 hover:bg-indigo-200 rounded-full text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        {previewData.length > 0 && (
                            <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto text-xs border border-gray-200">
                                <p className="font-bold mb-2 text-gray-500 sticky top-0">Preview Data (5 Baris Pertama):</p>
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-300">
                                            {Object.keys(previewData[0]).slice(0, 5).map(key => (
                                                <th key={key} className="py-1 px-2 text-gray-600">{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.slice(0, 5).map((row, idx) => (
                                            <tr key={idx} className="border-b border-gray-200">
                                                {Object.values(row).slice(0, 5).map((val: any, i) => (
                                                    <td key={i} className="py-1 px-2">{val}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <button 
                            onClick={handleProcess}
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Proses & Simpan ke Database'}
                        </button>
                    </div>
                )}

                {status && (
                    <div className={`mt-6 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm font-medium animate-fade-in ${status.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        <div className="flex items-start gap-3">
                            {status.type === 'success' ? <CheckCircle size={20} className="mt-0.5" /> : <AlertCircle size={20} className="mt-0.5" />}
                            <span className="leading-relaxed">{status.msg}</span>
                        </div>
                        {failedRows.length > 0 && (
                            <button 
                                onClick={downloadFailedLog}
                                className="bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-red-50 flex items-center gap-2"
                            >
                                <Download size={14} /> Download Error Log
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default InputManual;
