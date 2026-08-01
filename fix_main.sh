#!/bin/bash
sed -i '349c\
      {/* --- MAIN CONTENT --- */}\
      <main className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar relative bg-[#F8FAFC] dark:bg-slate-900 transition-colors duration-300">' components/Layout.tsx
