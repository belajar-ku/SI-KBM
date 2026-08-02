const fs = require('fs');

function fixFile(file, oldStr, newStr) {
    if (fs.existsSync(file)) {
        let code = fs.readFileSync(file, 'utf8');
        code = code.replace(oldStr, newStr);
        fs.writeFileSync(file, code);
        console.log(`Fixed ${file}`);
    }
}

fixFile('pages/StudentsData.tsx', 'data = res.data;\n              else data = [];', 'data = res.data;');
fixFile('pages/StudentsData.tsx', 'if (true) {\n             data = res.data;\n          } else {\n             data = [];\n          }', 'data = res.data;');

