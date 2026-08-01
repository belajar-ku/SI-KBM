#!/bin/bash
sed -i '414c\
          {/* DESKTOP TOP BAR */}\
          <div className="hidden md:flex justify-between items-center sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-8 py-3 pt-[calc(env(safe-area-inset-top)+0.25rem)]">\
              <div className="flex items-center gap-3 text-sm font-bold">\
                  <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800/50 shadow-sm">\
                      <span className="text-blue-400 dark:text-blue-500">T.A:</span> {academicYear}\
                  </div>\
                  <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-xl border border-purple-100 dark:border-purple-800/50 shadow-sm">\
                      <span className="text-purple-400 dark:text-purple-500">Semester:</span> {semester}\
                  </div>\
              </div>\
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">' components/Layout.tsx
