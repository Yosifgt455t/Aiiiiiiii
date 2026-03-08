
import React from 'react';
import { PDFData, ChatHistoryEntry, UserSettings } from '../types';

interface SidebarProps {
  currentPdf: PDFData | null;
  onClear: () => void;
  history: ChatHistoryEntry[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  settings: UserSettings;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentPdf, 
  onClear, 
  history, 
  activeChatId, 
  onSelectChat, 
  onNewChat,
  onDeleteChat,
  settings
}) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'اليوم';
    return d.toLocaleDateString('ar-IQ');
  };

  const accentColorClasses = {
    blue: { active: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400', hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' },
    emerald: { active: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400', hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' },
    violet: { active: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400', hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' },
    rose: { active: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400', hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' },
    amber: { active: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400', hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' },
    slate: { active: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100', hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' },
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
    <div className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-colors">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <button 
          onClick={onNewChat}
          className="w-full bg-slate-800 dark:bg-slate-700 text-white rounded-2xl py-3 px-4 flex items-center justify-between font-black hover:bg-slate-900 dark:hover:bg-slate-600 transition-all shadow-lg shadow-slate-200 dark:shadow-none"
        >
          <span>محادثة جديدة</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {history.length === 0 ? (
          <div className="p-8 text-center opacity-40">
             <span className="text-4xl block mb-2">💬</span>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">ماكو محادثات سابقة</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {Object.entries(groupedHistory).map(([date, chats]: [string, any]) => (
              <div key={date}>
                <h4 className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-3 px-2">{date}</h4>
                <div className="space-y-1">
                  {chats.map((chat: ChatHistoryEntry) => (
                    <div key={chat.id} className="group relative">
                      <button 
                        onClick={() => onSelectChat(chat.id)}
                        className={`w-full text-right px-3 py-3 rounded-xl transition-all text-sm font-bold flex items-center gap-3 ${
                          activeChatId === chat.id 
                            ? themeClasses.active
                            : `${themeClasses.hover} text-slate-600 dark:text-slate-400`
                        }`}
                      >
                        <span className="flex-shrink-0 text-lg opacity-60">{chat.pdf ? '📖' : '💬'}</span>
                        <span className="truncate flex-1">{chat.title}</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 dark:text-slate-700 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">أدوات إضافية</h4>
        <div className="space-y-1">
          <QuickAction label="توقعات الوزاري" icon="🔮" color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" />
          <QuickAction label="جدول الدراسة" icon="📅" color="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" />
        </div>
        
        <div className="mt-6 bg-slate-900 dark:bg-slate-800 rounded-2xl p-4 text-white shadow-xl">
           <div className="flex justify-between items-center mb-2">
             <h4 className="font-black text-[11px] text-blue-400">نبراس برو 👑</h4>
             <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded-full uppercase">Active</span>
           </div>
           <p className="text-[9px] opacity-70 leading-relaxed">استمتع بكل الميزات مفتوحة بدون حدود.</p>
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ label, icon, color }: { label: string; icon: string; color: string }) => (
  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all text-[12px] font-bold text-slate-600 dark:text-slate-400 group">
    <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg ${color}`}>{icon}</span>
    {label}
  </button>
);

export default Sidebar;
