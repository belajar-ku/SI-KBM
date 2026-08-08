const fs = require('fs');
let code = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const oldAttendanceLoop = `        if (attendanceRes.data) {
            attendanceRes.data.forEach((log: any) => {
                if (['S', 'I', 'A'].includes(log.status)) {
                    // Ignore guru's input if wali already processed this student
                    if (!waliProcessed.has(log.student_id) && !combinedAttendance[log.student_id]) {
                        combinedAttendance[log.student_id] = { name: log.student_name, status: log.status, source: 'Guru' };
                    }
                }
            });
        }`;

const newAttendanceLoop = `        if (attendanceRes.data) {
            attendanceRes.data.forEach((log: any) => {
                if (['S', 'I', 'A'].includes(log.status) && log.subject !== 'Salat Dhuha') {
                    // Ignore guru's input if wali already processed this student
                    if (!waliProcessed.has(log.student_id) && !combinedAttendance[log.student_id]) {
                        combinedAttendance[log.student_id] = { name: log.student_name, status: log.status, source: 'Guru' };
                    }
                }
            });
        }`;

code = code.replace(oldAttendanceLoop, newAttendanceLoop);

fs.writeFileSync('pages/PublicDashboard.tsx', code);
console.log("Patched attendance filter in PublicDashboard.tsx");
