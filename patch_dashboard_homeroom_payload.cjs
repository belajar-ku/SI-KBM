const fs = require('fs');
let code = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

const oldInserts = `          const inserts = Object.entries(modalAttendance).map(([studentId, status]) => ({
              date: filterDate,
              kelas: profile.wali_kelas,
              student_id: studentId,
              status: status,
              created_by: profile.id,
              
              
          }));`;

const newInserts = `          const inserts = Object.entries(modalAttendance).map(([studentId, status]) => ({
              date: filterDate,
              kelas: profile.wali_kelas,
              student_id: studentId,
              status: status,
              created_by: profile.id,
              academic_year: academicYear || '2025/2026',
              semester: semester || 'Ganjil'
          }));`;

code = code.replace(oldInserts, newInserts);

const oldUpsert = `                  const payload: any = {
                      date: filterDate,
                      kelas: profile.wali_kelas,
                      student_id: item.student_id,
                      status: item.newStatus,
                      created_by: profile.id,
                      
                      
                  };`;

const newUpsert = `                  const payload: any = {
                      date: filterDate,
                      kelas: profile.wali_kelas,
                      student_id: item.student_id,
                      status: item.newStatus,
                      created_by: profile.id,
                      academic_year: academicYear || '2025/2026',
                      semester: semester || 'Ganjil'
                  };`;

code = code.replace(oldUpsert, newUpsert);
fs.writeFileSync('pages/Dashboard.tsx', code);
console.log("Patched homeroom payloads");
