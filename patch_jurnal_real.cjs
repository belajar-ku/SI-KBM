const fs = require('fs');
let code = fs.readFileSync('pages/JurnalForm.tsx', 'utf8');

const isDhuhaLine = `const isDhuha = isSpecialSubjectDhuha(formData.subject);`;
const newIsDhuhaLine = `const isDhuha = isSpecialSubjectDhuha(formData.subject);\n  const isSchoolActivity = formData.subject.startsWith('Presensi Pagi -') || formData.subject.startsWith('Presensi Pulang -');`;
code = code.replace(isDhuhaLine, newIsDhuhaLine);

// Replace Step 2 render (which is actually step 1 internally sometimes? Wait. The form steps are: 1 is class select, 2 is material, 3 is attendance.
// Let's check renderStep2 and renderStep3 from the code.
