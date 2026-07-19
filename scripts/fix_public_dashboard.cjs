const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../pages/PublicDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// Fix useEffect dependencies
content = content.replace(
    /return \(\) => clearInterval\(timer\);\n\s*\}, \[\]\);/g,
    `return () => clearInterval(timer);
  }, [academicYear, semester, semesterStart, semesterEnd]);`
);

// We need to inject the "Tahun Ajaran 2026/2027" container right above the class counts.
// Where are the class counts?
// Look for "{/* ROW 1 */}" or "<ClassCard label=\"Kelas 7\""
content = content.replace(
    /\{\/\* ROW 1 \*\/\}/,
    `{/* ROW 1 */}
            <div className="flex justify-center mb-4">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-6 py-2 rounded-full shadow-sm text-sm font-bold text-slate-700 dark:text-slate-300">
                    Tahun Ajaran: {academicYear} | Semester: {semester}
                </div>
            </div>`
);

fs.writeFileSync(file, content);
console.log('Fixed PublicDashboard');
