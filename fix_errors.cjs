const fs = require('fs');

// Fix AppsMenu.tsx
let appsMenuCode = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');
appsMenuCode = appsMenuCode.replace(/import \{ User, useNavigate \} from 'react-router-dom';/, "import { useNavigate } from 'react-router-dom';");
if (!appsMenuCode.includes('import { User,')) {
    appsMenuCode = appsMenuCode.replace(/import \{ ChevronRight,/, "import { User, ChevronRight,");
}
fs.writeFileSync('pages/AppsMenu.tsx', appsMenuCode);

// Fix Dashboard.tsx
let dashboardCode = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
// It says greeting is redeclared at 52 and 526.
// Let's remove the one at 526 or the one at 52.
dashboardCode = dashboardCode.replace(/const greeting = getGreeting\(\);\n/g, "");
dashboardCode = dashboardCode.replace(/const getGreeting = \(\) => \{[\s\S]*?\};\n/g, "");

// And re-add it ONLY ONCE in the correct place, maybe inside the component.
const componentStart = "const Dashboard: React.FC = () => {";
dashboardCode = dashboardCode.replace(componentStart, componentStart + "\n  const getGreeting = () => {\n      const hour = getWIBDate().getHours();\n      if (hour < 11) return 'Selamat Pagi,';\n      if (hour < 15) return 'Selamat Siang,';\n      if (hour < 18) return 'Selamat Sore,';\n      return 'Selamat Malam,';\n  };\n  const greeting = getGreeting();\n");

fs.writeFileSync('pages/Dashboard.tsx', dashboardCode);

