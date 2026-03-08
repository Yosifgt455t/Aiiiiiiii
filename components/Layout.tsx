
import React, { useEffect } from 'react';
import { User, UserSettings } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  settings: UserSettings;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, settings }) => {
  useEffect(() => {
    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const colorMap = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    violet: 'bg-violet-600',
    rose: 'bg-rose-600',
    amber: 'bg-amber-600',
    slate: 'bg-slate-800'
  };

  const accentBg = colorMap[settings.accentColor] || colorMap.blue;

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-['Tajawal'] overflow-hidden transition-colors duration-300`}>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 h-16 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${accentBg} rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-colors`}>
              ن
            </div>
            <div className="hidden xs:block">
              <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">نبراس</h1>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mt-0.5">المدرس الخصوصي</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-black text-slate-800 dark:text-slate-200">{user.username}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">نبراس {user.points} نقطة</span>
             </div>
             <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onLogout();
                }}
                className="bg-white dark:bg-slate-800 text-slate-400 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all border border-slate-200 dark:border-slate-700 active:scale-90"
                title="تسجيل الخروج"
              >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             </button>
          </div>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
