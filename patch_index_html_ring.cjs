const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

if (!code.includes('@keyframes bell-ring')) {
    const styleBlock = `
      @keyframes bell-ring {
        0%, 100% { transform: rotate(0deg); }
        10% { transform: rotate(15deg); }
        20% { transform: rotate(-10deg); }
        30% { transform: rotate(5deg); }
        40% { transform: rotate(-5deg); }
        50% { transform: rotate(0deg); }
      }
      .animate-bell-ring {
        animation: bell-ring 2s ease-in-out infinite;
        transform-origin: top center;
      }
    `;
    code = code.replace('</style>', styleBlock + '</style>');
    fs.writeFileSync('index.html', code);
    console.log("Added bell-ring animation to index.html");
}
