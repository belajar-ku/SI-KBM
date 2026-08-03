const fs = require('fs');
let code = fs.readFileSync('components/Layout.tsx', 'utf8');

const oldMobile = `                     {!isAdmin && !isOperator && !isHeadmaster && (notifications.length > 0 || waliNotifications.length > 0) && (
                        <div className="relative group">
                            {(hasUnfilled || waliNotifications.length > 0) && (
                                <div className="absolute inset-0 rounded-full overflow-hidden shadow-sm">
                                    <div className="w-full h-full bg-red-400 animate-ping opacity-20"></div>
                                </div>
                            )}
                            <button onClick={() => openNotifModal()} className="relative z-10 w-9 h-9 m-[2px] bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-[#475569] dark:text-gray-300 transition-transform active:scale-95 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
                                <Bell size={18} strokeWidth={2.5} />
                            </button>
                            {(hasUnfilled || waliNotifications.length > 0) && (
                                <span className="absolute -top-1 -right-1 z-20 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-800 rounded-full px-[3px] bg-red-500">
                                    {notifications.filter(n => !n.isFilled).length + waliNotifications.length}
                                </span>
                            )}
                        </div>
                    )}
                    {!isAdmin && !isOperator && !isHeadmaster && notifications.length === 0 && waliNotifications.length === 0 && (
                        <button onClick={() => openNotifModal()} className="relative w-9 h-9 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-[#475569] dark:text-gray-300 transition-transform active:scale-95 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
                            <Bell size={18} strokeWidth={2.5} />
                        </button>
                    )}`;

const newMobile = `                     {!isAdmin && !isOperator && !isHeadmaster && (
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-full overflow-hidden shadow-sm">
                                <div className="w-full h-full bg-blue-400 animate-ping opacity-30"></div>
                            </div>
                            <button onClick={() => openNotifModal()} className="relative z-10 w-9 h-9 m-[2px] bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-[#475569] dark:text-gray-300 transition-transform active:scale-95 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
                                <Bell size={18} strokeWidth={2.5} />
                            </button>
                            {((notifications.filter(n => !n.isFilled).length > 0) || waliNotifications.length > 0) && (
                                <span className="absolute -top-1 -right-1 z-20 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-800 rounded-full px-[3px] bg-red-500">
                                    {notifications.filter(n => !n.isFilled).length + waliNotifications.length}
                                </span>
                            )}
                        </div>
                    )}`;

code = code.replace(oldMobile, newMobile);

const oldDesktop = `                  {!isAdmin && !isOperator && !isHeadmaster && (notifications.length > 0 || waliNotifications.length > 0) && (
                      <div className="relative group hover:scale-105 transition-transform">
                          {(hasUnfilled || waliNotifications.length > 0) && (
                              <div className="absolute inset-0 rounded-full overflow-hidden shadow-sm">
                                  
                              </div>
                          )}
                          <button onClick={() => openNotifModal()} className="relative z-10 w-[34px] h-[34px] m-[2px] bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 border border-slate-200 dark:border-slate-600 transition-transform active:scale-95">
                              <Bell size={16} />
                          </button>
                          {(hasUnfilled || waliNotifications.length > 0) && (
                              <span className="absolute -top-1 -right-1 z-20 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-800 rounded-full px-[3px] bg-red-500">
                                  {notifications.filter(n => !n.isFilled).length + waliNotifications.length}
                              </span>
                          )}
                      </div>
                  )}
                  {!isAdmin && !isOperator && !isHeadmaster && notifications.length === 0 && waliNotifications.length === 0 && (
                      <button onClick={() => openNotifModal()} className="relative w-9 h-9 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 border border-slate-200 dark:border-slate-600 transition-transform hover:scale-105 active:scale-95">
                          <Bell size={18} />
                      </button>
                  )}`;

const newDesktop = `                  {!isAdmin && !isOperator && !isHeadmaster && (
                      <div className="relative group hover:scale-105 transition-transform">
                          <div className="absolute inset-0 rounded-full overflow-hidden shadow-sm">
                              <div className="w-full h-full bg-blue-400 animate-ping opacity-30"></div>
                          </div>
                          <button onClick={() => openNotifModal()} className="relative z-10 w-[34px] h-[34px] m-[2px] bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 border border-slate-200 dark:border-slate-600 transition-transform active:scale-95">
                              <Bell size={16} />
                          </button>
                          {((notifications.filter(n => !n.isFilled).length > 0) || waliNotifications.length > 0) && (
                              <span className="absolute -top-1 -right-1 z-20 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-800 rounded-full px-[3px] bg-red-500">
                                  {notifications.filter(n => !n.isFilled).length + waliNotifications.length}
                              </span>
                          )}
                      </div>
                  )}`;

code = code.replace(oldDesktop, newDesktop);
fs.writeFileSync('components/Layout.tsx', code);
console.log("Patched Layout bell to always ping");
