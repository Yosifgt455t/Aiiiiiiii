import React from 'react';
import { PDFData, ChatHistoryEntry, UserSettings } from '../types';
import { Plus, MessageSquare, BookOpen, Trash2, Sparkles, Calendar, Crown, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  currentPdf: PDFData | null;
  onClear: () => void;
  history: ChatHistoryEntry[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onDownloadReport: () => void;
  onCancelSubscription: () => void;
  onUpgrade: () => void;
  settings: UserSettings;
  isPremium?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentPdf, 
  onClear, 
  history, 
  activeChatId, 
  onSelectChat, 
  onNewChat,
  onDeleteChat,
  onDownloadReport,
  onCancelSubscription,
  onUpgrade,
  settings,
  isPremium
}) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'اليوم';
    return d.toLocaleDateString('ar-IQ');
  };

  const accentColorClasses = {
    blue: { active: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' },
    emerald: { active: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' },
    violet: { active: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800', hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' },
    rose: { active: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800', hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' },
    amber: { active: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' },
    slate: { active: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-600', hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' },
  };

  const themeClasses = accentColorClasses[settings.accentColor] || accentColorClasses.blue;

  // Group by date
  const groupedHistory = history.reduce((acc: any, chat) => {
    const date = formatDate(chat.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(chat);
    return acc;
  }, {});

  return (
    <div className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-colors duration-500">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="w-full bg-slate-800 dark:bg-slate-700 text-white rounded-2xl py-3 px-4 flex items-center justify-between font-black hover:bg-slate-900 dark:hover:bg-slate-600 transition-all shadow-lg shadow-slate-200 dark:shadow-none"
        >
          <span>محادثة جديدة</span>
          <Plus size={20} strokeWidth={3} />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {history.length === 0 ? (
          <div className="p-8 text-center opacity-40">
             <MessageSquare size={48} className="mx-auto mb-2 text-slate-400" />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">ماكو محادثات سابقة</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            <AnimatePresence>
              {Object.entries(groupedHistory).map(([date, chats]: [string, any]) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={date}
                >
                  <h4 className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-3 px-2">{date}</h4>
                  <div className="space-y-1">
                    {chats.map((chat: ChatHistoryEntry) => (
                      <div key={chat.id} className="group relative">
                        <button 
                          onClick={() => onSelectChat(chat.id)}
                          className={cn(
                            "w-full text-right px-3 py-3 rounded-xl transition-all text-sm font-bold flex items-center gap-3 border border-transparent",
                            activeChatId === chat.id 
                              ? themeClasses.active
                              : cn(themeClasses.hover, "text-slate-600 dark:text-slate-400")
                          )}
                        >
                          <span className="flex-shrink-0 opacity-60">
                            {chat.pdf ? <BookOpen size={18} /> : <MessageSquare size={18} />}
                          </span>
                          <span className="truncate flex-1">{chat.title}</span>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 dark:text-slate-700 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">أدوات إضافية</h4>
        <div className="space-y-1">
          <QuickAction label="توقعات الوزاري" icon={<Sparkles size={16} />} color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" />
          <QuickAction label="جدول الدراسة" icon={<Calendar size={16} />} color="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" />
          <QuickAction label="تحميل تقرير الجلسة" icon={<Download size={16} />} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" onClick={onDownloadReport} />
          {isPremium && (
            <QuickAction 
              label="إلغاء الاشتراك" 
              icon={<Trash2 size={16} />} 
              color="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" 
              onClick={onCancelSubscription} 
            />
          )}
        </div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          onClick={!isPremium ? onUpgrade : undefined}
          className="mt-6 bg-slate-900 dark:bg-slate-800 rounded-2xl p-4 text-white shadow-xl relative overflow-hidden group cursor-pointer"
        >
           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150"></div>
           <div className="relative z-10">
             <div className="flex justify-between items-center mb-2">
               <h4 className="font-black text-[11px] text-blue-400 flex items-center gap-1">
                 نبراس برو <Crown size={12} />
               </h4>
               <span className={cn(
                 "text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black",
                 isPremium ? "bg-emerald-500/20 text-emerald-400" : "bg-white/20"
               )}>
                 {isPremium ? 'مفعل' : 'ترقية'}
               </span>
             </div>
             <p className="text-[9px] opacity-70 leading-relaxed font-medium">
               {isPremium ? 'استمتع بكل الميزات مفتوحة بدون حدود.' : 'افتح ميزات التقارير والذكاء الاصطناعي المتطور.'}
             </p>
           </div>
        </motion.div>
      </div>
    </div>
  );
};

const QuickAction = ({ label, icon, color, onClick }: { label: string; icon: React.ReactNode; color: string; onClick?: () => void }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all text-[12px] font-bold text-slate-600 dark:text-slate-400 group">
    <span className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-all group-hover:scale-110", color)}>
      {icon}
    </span>
    {label}
  </button>
);

export default Sidebar;
