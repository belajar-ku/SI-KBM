const fs = require('fs');
let code = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

const startStr = "  const greeting = getGreeting();";
const endStr = "  if (isHeadmaster) {\n      // Headmaster view code";

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx + startStr.length) + "\n\n" + code.substring(endIdx);
    fs.writeFileSync('pages/Dashboard.tsx', code);
    console.log("Fixed!");
} else {
    console.log("Could not find delimiters");
}
