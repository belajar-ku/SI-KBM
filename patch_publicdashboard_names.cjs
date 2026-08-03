const fs = require('fs');
let code = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const oldStr = `        const combinedAttendance: Record<string, {name: string, status: string, source: 'Wali' | 'Guru'}> = {};

        if (homeroomRes.data) {
            homeroomRes.data.forEach((h: any) => {
                if (['S', 'I', 'A'].includes(h.status)) {
                    combinedAttendance[h.student_id] = { name: 'Loading...', status: h.status, source: 'Wali' };
                }
            });
        }`;

const newStr = `        const combinedAttendance: Record<string, {name: string, status: string, source: 'Wali' | 'Guru'}> = {};
        
        const studentNameMap: Record<string, string> = {};
        if (studentsRes.data) {
            studentsRes.data.forEach((s: any) => {
                studentNameMap[s.id] = s.name || 'Unknown';
            });
        }

        if (homeroomRes.data) {
            homeroomRes.data.forEach((h: any) => {
                if (['S', 'I', 'A'].includes(h.status)) {
                    combinedAttendance[h.student_id] = { name: studentNameMap[h.student_id] || 'Unknown', status: h.status, source: 'Wali' };
                }
            });
        }`;

code = code.replace(oldStr, newStr);
fs.writeFileSync('pages/PublicDashboard.tsx', code);
console.log("Patched homeroom names");
