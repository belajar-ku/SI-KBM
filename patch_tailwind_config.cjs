const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const oldConfig = `      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              slate: {
                850: '#1e293b',
                900: '#0f172a',
                950: '#020617',
              }
            }
          }
        }
      }`;

const newConfig = `      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              slate: {
                850: '#1e293b',
                900: '#0f172a',
                950: '#020617',
              }
            },
            keyframes: {
                'bell-ring': {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '10%': { transform: 'rotate(15deg)' },
                    '20%': { transform: 'rotate(-10deg)' },
                    '30%': { transform: 'rotate(5deg)' },
                    '40%': { transform: 'rotate(-5deg)' },
                    '50%': { transform: 'rotate(0deg)' },
                }
            },
            animation: {
                'bell-ring': 'bell-ring 2s ease-in-out infinite',
            }
          }
        }
      }`;

if (code.includes(oldConfig)) {
    code = code.replace(oldConfig, newConfig);
    fs.writeFileSync('index.html', code);
    console.log("Patched tailwind config in index.html");
} else {
    console.log("Could not find tailwind config to patch");
}
