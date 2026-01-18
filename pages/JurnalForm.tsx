import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Student } from '../types';
import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react';

const JurnalForm: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    kelas: '',
    subject: '',
    hours: [] as string[],
    material: '',
    attendance: {} as Record<string, 'S' | 'I' | 'A' | 'D'>, // StudentID -> Status
    cleanliness: '',
    validation: ''
  });

  useEffect(() => {
    // 1. Fetch available classes (Mocked or from DB)
    // In Supabase, you might query distinct classes from 'students' table
    const fetchInitData = async () => {
      const { data: studentData } = await supabase.from('students').select('kelas');
      if (studentData) {
        const uniqueClasses = Array.from(new Set(studentData.map(s => s.kelas))).sort();
        setClasses(uniqueClasses);
      }
      
      const { data: subjectData } = await supabase.from('subjects').select('name');
      if (subjectData) {
        setSubjects(subjectData.map(s => s.name));
      }
    };
    fetchInitData();
  }, []);

  useEffect(() => {
    if (formData.kelas) {
      const fetchStudents = async () => {
        setLoading(true);
        const { data } = await supabase
          .from('students')
          .select('*')
          .eq('kelas', formData.kelas)
          .order('name');
        if (data) setStudents(data);
        setLoading(false);
      };
      fetchStudents();
    }
  }, [formData.kelas]);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!profile) throw new Error("Not authenticated");

      // 1. Insert Journal
      const { data: journal, error: journalError } = await supabase
        .from('journals')
        .insert({
          teacher_id: profile.id,
          kelas: formData.kelas,
          subject: formData.subject,
          hours: formData.hours.join(','),
          material: formData.material,
          cleanliness: formData.cleanliness,
          validation: formData.validation
        })
        .select()
        .single();

      if (journalError) throw journalError;

      // 2. Insert Attendance (if any)
      const attendanceInserts = Object.entries(formData.attendance).map(([studentId, status]) => {
          const studentName = students.find(s => s.id === studentId)?.name || 'Unknown';
          return {
            journal_id: journal.id,
            student_id: studentId, // Assuming we change schema to use ID, but generic types use name
            student_name: studentName,
            status: status
          };
      });

      if (attendanceInserts.length > 0) {
        const { error: attError } = await supabase
          .from('attendance_logs')
          .insert(attendanceInserts);
        if (attError) throw attError;
      }

      alert('Jurnal berhasil disimpan!');
      navigate('/dashboard');

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const Step1 = () => (
    <div className="bg-white rounded-2xl p-6 shadow-md">
       <h3 className="font-bold text-lg border-b pb-3 mb-4">1. Pilih Kelas & Absensi</h3>
       <div className="mb-4">
         <label className="block text-sm font-medium mb-1">Kelas</label>
         <select 
            className="w-full border rounded-lg p-2"
            value={formData.kelas}
            onChange={e => setFormData({...formData, kelas: e.target.value, attendance: {}})}
         >
           <option value="">-- Pilih Kelas --</option>
           {classes.map(c => <option key={c} value={c}>{c}</option>)}
         </select>
       </div>

       {formData.kelas && (
         <div className="overflow-x-auto">
           <table className="w-full text-sm">
             <thead className="bg-gray-100">
               <tr>
                 <th className="p-2 text-left">Nama</th>
                 <th className="p-2 w-10">S</th>
                 <th className="p-2 w-10">I</th>
                 <th className="p-2 w-10">A</th>
                 <th className="p-2 w-10">D</th>
               </tr>
             </thead>
             <tbody>
               {students.map(student => (
                 <tr key={student.id} className="border-b">
                   <td className="p-2">{student.name}</td>
                   {['S', 'I', 'A', 'D'].map((status) => (
                     <td key={status} className="p-2 text-center">
                       <input 
                         type="radio" 
                         name={`att-${student.id}`}
                         checked={formData.attendance[student.id] === status}
                         onChange={() => {
                            const newAtt = {...formData.attendance};
                            if (newAtt[student.id] === status) delete newAtt[student.id]; // Toggle off
                            else newAtt[student.id] = status as any;
                            setFormData({...formData, attendance: newAtt});
                         }}
                         onClick={(e: any) => {
                             if(formData.attendance[student.id] === status) {
                                 const newAtt = {...formData.attendance};
                                 delete newAtt[student.id];
                                 setFormData({...formData, attendance: newAtt});
                                 e.target.checked = false;
                             }
                         }}
                       />
                     </td>
                   ))}
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       )}
       <div className="flex justify-end mt-4">
         <button disabled={!formData.kelas} onClick={handleNext} className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">
           Lanjut <ArrowRight size={16} />
         </button>
       </div>
    </div>
  );

  const Step2 = () => (
    <div className="bg-white rounded-2xl p-6 shadow-md">
      <h3 className="font-bold text-lg border-b pb-3 mb-4">2. Detail Pembelajaran</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Mata Pelajaran</label>
          <select 
            className="w-full border rounded-lg p-2"
            value={formData.subject}
            onChange={e => setFormData({...formData, subject: e.target.value})}
          >
            <option value="">-- Pilih Mapel --</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
           <label className="block text-sm font-medium mb-1">Jam Ke-</label>
           <div className="flex gap-2 flex-wrap">
             {[1,2,3,4,5,6,7,8].map(h => (
               <label key={h} className={`p-2 border rounded cursor-pointer ${formData.hours.includes(String(h)) ? 'bg-blue-100 border-blue-500' : ''}`}>
                 <input 
                   type="checkbox" 
                   className="hidden" 
                   value={h}
                   checked={formData.hours.includes(String(h))}
                   onChange={e => {
                     const val = String(h);
                     let newHours = [...formData.hours];
                     if (newHours.includes(val)) newHours = newHours.filter(x => x !== val);
                     else newHours.push(val);
                     setFormData({...formData, hours: newHours.sort()});
                   }}
                 />
                 {h}
               </label>
             ))}
           </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Materi</label>
          <textarea 
            className="w-full border rounded-lg p-2" 
            rows={3}
            value={formData.material}
            onChange={e => setFormData({...formData, material: e.target.value})}
          ></textarea>
        </div>
      </div>
      <div className="flex justify-between mt-6">
         <button onClick={handleBack} className="border px-4 py-2 rounded-lg flex items-center gap-2">
           <ArrowLeft size={16} /> Kembali
         </button>
         <button disabled={!formData.subject || !formData.material} onClick={handleNext} className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">
           Lanjut <ArrowRight size={16} />
         </button>
       </div>
    </div>
  );

  const Step3 = () => (
    <div className="bg-white rounded-2xl p-6 shadow-md">
       <h3 className="font-bold text-lg border-b pb-3 mb-4">3. Validasi & Kirim</h3>
       <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Kebersihan Kelas</label>
            <div className="space-y-2">
               <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                 <input type="radio" name="cleanliness" value="mengarahkan_piket" onChange={e => setFormData({...formData, cleanliness: e.target.value})} />
                 Mengarahkan Piket
               </label>
               <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                 <input type="radio" name="cleanliness" value="sudah_bersih" onChange={e => setFormData({...formData, cleanliness: e.target.value})} />
                 Kelas Sudah Bersih
               </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Validasi KBM</label>
            <div className="space-y-2">
               <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                 <input type="radio" name="validasi" value="hadir_kbm" onChange={e => setFormData({...formData, validation: e.target.value})} />
                 Hadir KBM Tatap Muka
               </label>
               <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                 <input type="radio" name="validasi" value="izin_tugas" onChange={e => setFormData({...formData, validation: e.target.value})} />
                 Izin (Tugas)
               </label>
            </div>
          </div>
       </div>
       <div className="flex justify-between mt-6">
         <button onClick={handleBack} className="border px-4 py-2 rounded-lg flex items-center gap-2">
           <ArrowLeft size={16} /> Kembali
         </button>
         <button 
            disabled={!formData.cleanliness || !formData.validation || loading} 
            onClick={handleSubmit} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
         >
           {loading ? 'Mengirim...' : <><Send size={16} /> Kirim Jurnal</>}
         </button>
       </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#2c3e50]">Isi Jurnal KBM</h2>
            <div className="flex gap-2">
               {[1,2,3].map(i => (
                 <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= i ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                   {step > i ? <Check size={16}/> : i}
                 </div>
               ))}
            </div>
        </div>
        
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
      </div>
    </Layout>
  );
};

export default JurnalForm;