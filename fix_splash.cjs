const fs = require('fs');
let code = fs.readFileSync('components/TeacherLoginSplash.tsx', 'utf8');

const oldH1 = `<motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 4.5, times: [0, 0.1, 0.6, 0.7] }}
            className="text-3xl font-extrabold text-white text-center tracking-wide leading-tight mb-8 drop-shadow-lg max-w-lg"
         >
             Anda Memiliki {notifCount} Pemberitahuan. Klik Icon berikut!
         </motion.h1>`;

const newH1 = `<motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 4.5, times: [0, 0.1, 0.6, 0.7] }}
            className="text-white text-center tracking-wide leading-tight mb-8 drop-shadow-lg"
         >
             <h1 className="text-2xl md:text-3xl font-extrabold whitespace-nowrap mb-2">Anda Memiliki {notifCount} Pemberitahuan.</h1>
             <p className="text-lg md:text-xl font-bold whitespace-nowrap">Silakan klik icon berikut!</p>
         </motion.div>`;

// We might need a regex if indentation differs.
code = code.replace(/<motion.h1[\s\S]*?<\/motion.h1>/, newH1);

fs.writeFileSync('components/TeacherLoginSplash.tsx', code);
console.log("Splash updated");
