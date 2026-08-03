const fs = require('fs');
let code = fs.readFileSync('pages/OperatorDashboard.tsx', 'utf8');

const oldStr = `          const uniqueAbsenceMap: Record<string, {name: string, status: string, kelas: string}> = {};
          homeroomLogs.forEach((h: any) => { if (['S', 'I', 'A'].includes(h.status)) { uniqueAbsenceMap[h.student_id] = { name: studentNameMap[h.student_id] || 'Siswa', status: h.status, kelas: studentClassMap[h.student_id] || h.kelas || '?' }; } });
          attendanceLogs.forEach((log: any) => { if (!uniqueAbsenceMap[log.student_id]) { if (['S', 'I', 'A'].includes(log.status)) { uniqueAbsenceMap[log.student_id] = { name: log.student_name, status: log.status, kelas: studentClassMap[log.student_id] || '?' }; } } });`;

const newStr = `          const uniqueAbsenceMap: Record<string, {name: string, status: string, kelas: string}> = {};
          const waliProcessed = new Set<string>();
          homeroomLogs.forEach((h: any) => { 
              waliProcessed.add(h.student_id);
              if (['S', 'I', 'A'].includes(h.status)) { 
                  uniqueAbsenceMap[h.student_id] = { name: studentNameMap[h.student_id] || 'Siswa', status: h.status, kelas: studentClassMap[h.student_id] || h.kelas || '?' }; 
              } 
          });
          attendanceLogs.forEach((log: any) => { 
              if (!waliProcessed.has(log.student_id) && !uniqueAbsenceMap[log.student_id]) { 
                  if (['S', 'I', 'A'].includes(log.status)) { 
                      uniqueAbsenceMap[log.student_id] = { name: log.student_name, status: log.status, kelas: studentClassMap[log.student_id] || '?' }; 
                  } 
              } 
          });`;

code = code.replace(oldStr, newStr);
fs.writeFileSync('pages/OperatorDashboard.tsx', code);
console.log("Patched OperatorDashboard wali");
