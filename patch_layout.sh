#!/bin/bash
sed -i '351,412c\
          {/* Mobile Header */}\
          <div className="md:hidden sticky top-0 bg-[#F8FAFC] dark:bg-slate-900 z-30 pt-[calc(env(safe-area-inset-top)+0.25rem)]">\
             <div className="px-4 py-3 flex justify-between items-center">\
                 <div className="flex items-center gap-2.5">\
                     <img\
                        src="https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0"\
                        className="h-11 w-auto object-contain"\
                        alt="Logo"\
                     />\
                     <div>\
                         <h1 className="text-[11px] font-black text-[#0f172a] dark:text-white leading-tight">SISTEM INFORMASI<br/>KEGIATAN BELAJAR MENGAJAR</h1>\
                         <p className="text-[9px] text-[#64748b] dark:text-slate-400 font-bold uppercase mt-0.5 tracking-wide">\
                            SEMESTER {semester} <span className="mx-0.5 text-slate-300">|</span> T.A {academicYear}\
                         </p>\
                     </div>\
                 </div>\
                 <div className="flex items-center gap-2">\
                     {!isAdmin && !isOperator && !isHeadmaster && (notifications.length > 0 || waliNotifications.length > 0) && (\
                        <div className="relative group">\
                            {(hasUnfilled || waliNotifications.length > 0) && (\
                                <div className="absolute inset-0 rounded-full overflow-hidden shadow-sm">\
                                    <div className="absolute inset-[-100%] z-0 animate-[spin_4s_linear_infinite]" style={{ background: "conic-gradient(from 0deg, transparent 0 340deg, #ef4444 360deg)" }}></div>\
                                </div>\
                            )}\
                            <button onClick={() => setShowNotifModal(true)} className="relative z-10 w-9 h-9 m-[2px] bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-[#475569] dark:text-gray-300 transition-transform active:scale-95 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">\
                                <Bell size={18} strokeWidth={2.5} />\
                            </button>\
                            {(hasUnfilled || waliNotifications.length > 0) && (\
                                <span className="absolute -top-1 -right-1 z-20 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-800 rounded-full px-[3px] bg-red-500">\
                                    {notifications.filter(n => !n.isFilled).length + waliNotifications.length}\
                                </span>\
                            )}\
                        </div>\
                    )}\
                    {!isAdmin && !isOperator && !isHeadmaster && notifications.length === 0 && waliNotifications.length === 0 && (\
                        <button onClick={() => setShowNotifModal(true)} className="relative w-9 h-9 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-[#475569] dark:text-gray-300 transition-transform active:scale-95 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">\
                            <Bell size={18} strokeWidth={2.5} />\
                        </button>\
                    )}\
                     <button onClick={handleLogoutClick} className="w-9 h-9 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-[#475569] dark:text-slate-300 active:bg-gray-50 flex-shrink-0 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">\
                         <LogOut size={18} strokeWidth={2.5} className="ml-0.5" />\
                     </button>\
                 </div>\
             </div>\
             \
             {/* Running Date & Time Bar */}\
             <div className="px-4 pb-3">\
                 <div className="bg-white dark:bg-slate-800 px-3 py-2.5 rounded-[14px] flex justify-between items-center text-[11px] font-bold text-[#0f172a] dark:text-slate-400 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">\
                     <div className="flex items-center gap-2">\
                         <div className="w-7 h-7 rounded-[10px] bg-[#2563eb] text-white flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(37,99,235,0.4)]">\
                             <Calendar size={14} strokeWidth={2.5} />\
                         </div>\
                         <span className="ml-1 tracking-wide">{formattedDate}</span>\
                     </div>\
                     <div className="flex items-center gap-1.5 font-mono text-[#2563eb] dark:text-blue-400 pr-1">\
                         <Clock size={15} strokeWidth={2.5} />\
                         <span className="text-[12px]">{formattedTime} WIB</span>\
                     </div>\
                 </div>\
             </div>\
          </div>' components/Layout.tsx
