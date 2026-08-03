const fs = require('fs');
let code = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const oldStr = `        if (homeroomRes.data) {
            homeroomRes.data.forEach((h: any) => {
                if (['S', 'I', 'A'].includes(h.status)) {
                    combinedAttendance[h.student_id] = { name: studentNameMap[h.student_id] || 'Unknown', status: h.status, source: 'Wali' };
                }
            });
        }

        if (attendanceRes.data) {
            attendanceRes.data.forEach((log: any) => {
                if (['S', 'I', 'A'].includes(log.status)) {
                    if (!combinedAttendance[log.student_id]) {
                        combinedAttendance[log.student_id] = { name: log.student_name, status: log.status, source: 'Guru' };
                    }
                }
            });
        }`;

const newStr = `        const waliProcessed = new Set<string>();
        if (homeroomRes.data) {
            homeroomRes.data.forEach((h: any) => {
                waliProcessed.add(h.student_id);
                if (['S', 'I', 'A'].includes(h.status)) {
                    combinedAttendance[h.student_id] = { name: studentNameMap[h.student_id] || 'Unknown', status: h.status, source: 'Wali' };
                }
            });
        }

        if (attendanceRes.data) {
            attendanceRes.data.forEach((log: any) => {
                if (['S', 'I', 'A'].includes(log.status)) {
                    // Ignore guru's input if wali already processed this student
                    if (!waliProcessed.has(log.student_id) && !combinedAttendance[log.student_id]) {
                        combinedAttendance[log.student_id] = { name: log.student_name, status: log.status, source: 'Guru' };
                    }
                }
            });
        }`;

code = code.replace(oldStr, newStr);
fs.writeFileSync('pages/PublicDashboard.tsx', code);
console.log("Patched wali prioritization");
