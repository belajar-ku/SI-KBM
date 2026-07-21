import React, { useEffect } from 'react';
import { motion } from 'motion/react';

export const AppSplash: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[999999] bg-[#F0F4F8] dark:bg-slate-900 flex flex-col items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
         <img src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0" alt="Logo" className="w-32 h-32 object-contain mb-6 drop-shadow-xl" />
         <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white text-center tracking-wide leading-tight">UPT SMP NEGERI 1<br/>PASURUAN</h1>
         <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-3 tracking-widest bg-blue-100 dark:bg-blue-900/30 px-6 py-2 rounded-full shadow-sm">SI - KBM</h2>
      </motion.div>
    </motion.div>
  );
};
