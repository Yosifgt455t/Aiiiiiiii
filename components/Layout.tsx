
import React, { useEffect } from 'react';
import { User, UserSettings } from '../types';
import { LogOut, GraduationCap, Trophy, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    blue: 'bg-blue-600 shadow-blue-500/20',
    emerald: 'bg-emerald-600 shadow-emerald-500/20',
    violet: 'bg-violet-600 shadow-violet-500/20',
    rose: 'bg-rose-600 shadow-rose-500/20',
    amber: 'bg-amber-600 shadow-amber-500/20',
    slate: 'bg-slate-800 shadow-slate-500/20'
  };

  const accentBg = colorMap[settings.accentColor] || colorMap.blue;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden transition-colors duration-500">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 h-16">
        <div className="max-w-screen-2xl mx-auto px-4 h-full flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className={`w-10 h-10 ${accentBg} rounded-xl flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer`}>
              <GraduationCap size={24} strokeWidth={2.5} />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">نبراس</h1>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mt-0.5">المدرس الخصوصي الذكي</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
             <div className="hidden sm:flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col items-end leading-tight">
                   <span className="text-sm font-black text-slate-800 dark:text-slate-200">{user.username}</span>
                   <div className="flex items-center gap-1">
                      <Trophy size={10} className="text-amber-500" />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{user.points} نقطة</span>
                   </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-600">
                  <UserIcon size={16} />
                </div>
             </div>
             
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onLogout();
                }}
                className="group relative bg-white dark:bg-slate-800 text-slate-400 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all border border-slate-200 dark:border-slate-700 active:scale-90"
                title="تسجيل الخروج"
              >
                <LogOut size={20} strokeWidth={2.5} />
                <span className="absolute -bottom-10 right-0 scale-0 group-hover:scale-100 transition-all bg-slate-800 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap z-50">
                  تسجيل الخروج
                </span>
             </button>
          </motion.div>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
