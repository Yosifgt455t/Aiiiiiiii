
import React, { useState, useRef, useEffect } from 'react';
import { InteractionMode, ChatMessage, PDFData, User, UserSettings, AccentColor, ThemeMode } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import LiveModeOverlay from './LiveModeOverlay';

interface ChatInterfaceProps {
  initialMessages: ChatMessage[];
  currentPdf: PDFData | null;
  onPdfUpload: (pdf: PDFData) => void;
  currentUser: User;
  settings: UserSettings;
  onSettingsChange: (s: UserSettings) => void;
  onPointsUpdate: (points: number) => void;
  onMessagesChange: (messages: ChatMessage[]) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  initialMessages, 
  currentPdf, 
  onPdfUpload, 
  currentUser, 
  settings,
  onSettingsChange,
  onPointsUpdate,
  onMessagesChange
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<InteractionMode>(InteractionMode.QA);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) setIsSettingsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    scrollToBottom();
    onMessagesChange(messages);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && !pendingImage) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
      mode: activeMode,
      imageUrl: pendingImage?.preview
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsMenuOpen(false);

    const response = await getGeminiResponse(
      input,
      currentPdf ? { base64: currentPdf.base64, mimeType: currentPdf.mimeType } : null,
      activeMode,
      pendingImage ? { base64: pendingImage.base64, mimeType: pendingImage.mimeType } : undefined
    );

    const modelMsg: ChatMessage = {
      role: 'model',
      content: response.text,
      timestamp: new Date(),
      generatedImageUrl: response.generatedImage
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
    setPendingImage(null);
    onPointsUpdate(currentUser.points + 15);
    setActiveMode(InteractionMode.QA);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        onPdfUpload({ name: file.name, base64, mimeType: file.type });
        setIsMenuOpen(false);
        onPointsUpdate(currentUser.points + 50);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setPendingImage({ 
          base64, 
          mimeType: file.type, 
          preview: event.target?.result as string 
        });
        setActiveMode(InteractionMode.CORRECT_MY_WORK);
        setIsMenuOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectMode = (mode: InteractionMode) => {
    setActiveMode(mode);
    setIsMenuOpen(false);
    if (mode === InteractionMode.SUMMARY) setInput("لخص لي المادة الحالية بـ 5 دقائق");
    if (mode === InteractionMode.QUIZ) setInput("اختبرني بالمادة الحالية");
  };

  const accentColorClasses = {
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-100', lightBg: 'bg-blue-50', hover: 'hover:bg-blue-700', shadow: 'shadow-blue-100', darkText: 'dark:text-blue-400' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-100', lightBg: 'bg-emerald-50', hover: 'hover:bg-emerald-700', shadow: 'shadow-emerald-100', darkText: 'dark:text-emerald-400' },
    violet: { bg: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-100', lightBg: 'bg-violet-50', hover: 'hover:bg-violet-700', shadow: 'shadow-violet-100', darkText: 'dark:text-violet-400' },
    rose: { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-100', lightBg: 'bg-rose-50', hover: 'hover:bg-rose-700', shadow: 'shadow-rose-100', darkText: 'dark:text-rose-400' },
    amber: { bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-100', lightBg: 'bg-amber-50', hover: 'hover:bg-amber-700', shadow: 'shadow-amber-100', darkText: 'dark:text-amber-400' },
    slate: { bg: 'bg-slate-800', text: 'text-slate-800', border: 'border-slate-100', lightBg: 'bg-slate-50', hover: 'hover:bg-slate-900', shadow: 'shadow-slate-100', darkText: 'dark:text-slate-400' },
  };

  const theme = accentColorClasses[settings.accentColor] || accentColorClasses.blue;

  return (
    <div className="flex flex-col flex-1 h-full bg-[#f8fafc] dark:bg-slate-950 relative transition-colors">
      {isLiveMode && (
        <LiveModeOverlay 
          currentPdf={currentPdf} 
          onClose={() => setIsLiveMode(false)}
          onTranscription={(t, r) => setMessages(prev => [...prev, { role: r, content: t, timestamp: new Date() }])}
        />
      )}

      {/* Top Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">الجلسة:</span>
           <span className={`text-xs font-bold ${theme.text} ${theme.darkText} truncate max-w-[150px]`}>
             {currentPdf ? currentPdf.name : 'لا يوجد ملف'}
           </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-2xl font-black text-xs border border-amber-200 dark:border-amber-800 flex items-center gap-2">
              <span className="animate-pulse">💎</span> {currentUser.points} نقطة
          </div>
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>

        {/* Settings Modal */}
        {isSettingsOpen && (
          <div ref={settingsRef} className="absolute top-16 left-4 w-72 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-top-4 duration-300 z-50">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4">تخصيص المظهر</h3>
            
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">الوضع</span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => onSettingsChange({ ...settings, theme: m })}
                      className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${settings.theme === m ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      {m === 'light' ? 'نهاري' : m === 'dark' ? 'ليلي' : 'تلقائي'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">اللون الأساسي</span>
                <div className="grid grid-cols-6 gap-2">
                  {(['blue', 'emerald', 'violet', 'rose', 'amber', 'slate'] as AccentColor[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => onSettingsChange({ ...settings, accentColor: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${settings.accentColor === c ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent opacity-70'} ${accentColorClasses[c].bg}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto opacity-80">
             <div className={`w-24 h-24 ${theme.bg} rounded-[2rem] flex items-center justify-center text-white text-5xl shadow-2xl mb-8 animate-bounce-slow transition-colors`}>ن</div>
             <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">هلا بيك {currentUser.username}!</h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">أني نبراس، جاهز أساعدك اليوم. ارفع ملزمتك من علامة (+) أو اسألني أي شي ببالك.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-lg shadow-md transition-colors ${msg.role === 'user' ? 'bg-slate-800 dark:bg-slate-700 text-white' : `${theme.bg} text-white`}`}>
              {msg.role === 'user' ? currentUser.username[0] : 'ن'}
            </div>
            <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-5 rounded-3xl shadow-sm border text-[16px] leading-relaxed transition-colors ${msg.role === 'user' ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tr-none' : `${theme.lightBg} dark:bg-slate-800/50 ${theme.border} dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none`}`}>
                {msg.imageUrl && <img src={msg.imageUrl} className="w-full max-w-sm rounded-2xl mb-4 border border-slate-200 dark:border-slate-700" alt="Capture" />}
                {msg.generatedImageUrl && <img src={msg.generatedImageUrl} className="w-full max-w-sm rounded-2xl mb-4 border-4 border-white dark:border-slate-800 shadow-xl" alt="Visual" />}
                <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-600 mt-2 font-bold uppercase tracking-widest">{msg.role === 'model' ? 'نبراس' : currentUser.username} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className={`${theme.text} ${theme.darkText} flex items-center gap-3 font-black italic text-xs animate-pulse px-16`}>
             <div className="flex gap-1">
               <span className={`w-1.5 h-1.5 ${theme.bg} rounded-full animate-bounce`}></span>
               <span className={`w-1.5 h-1.5 ${theme.bg} rounded-full animate-bounce [animation-delay:200ms]`}></span>
               <span className={`w-1.5 h-1.5 ${theme.bg} rounded-full animate-bounce [animation-delay:400ms]`}></span>
             </div>
             نبراس جاي يفكر...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 relative transition-colors">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          
          <div className="relative" ref={menuRef}>
            <button 
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${isMenuOpen ? 'bg-slate-800 dark:bg-slate-700 text-white rotate-45' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            </button>

            {isMenuOpen && (
              <div className="absolute bottom-20 right-0 w-64 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-4 animate-in slide-in-from-bottom-6 duration-300 z-50">
                <div className="space-y-1">
                  <label className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-200 cursor-pointer transition-all group">
                    <span className="text-2xl">📁</span>
                    <div className="flex flex-col text-right">
                      <span className="text-sm font-black group-hover:text-blue-600">رفع كتاب</span>
                      <span className="text-[10px] text-slate-400">PDF فقط</span>
                    </div>
                    <input type="file" className="hidden" accept="application/pdf" onChange={handlePdfUpload} />
                  </label>
                  
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                  
                  <MenuOption icon="🗣️" title="سالفة عراقية" desc="شرح ممتع باللهجة" onClick={() => selectMode(InteractionMode.EXPLAIN)} themeColor={theme.text} />
                  <MenuOption icon="⚡" title="خلاصة سريعة" desc="أهم 5 نقاط" onClick={() => selectMode(InteractionMode.SUMMARY)} themeColor={theme.text} />
                  <MenuOption icon="🃏" title="بطاقات حفظ" desc="سؤال وجواب" onClick={() => selectMode(InteractionMode.FLASHCARDS)} themeColor={theme.text} />
                  <MenuOption icon="🎨" title="تخيل المادة" desc="توليد صورة" onClick={() => selectMode(InteractionMode.VISUALIZE)} themeColor={theme.text} />
                  
                  <label className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-200 cursor-pointer transition-all group">
                    <span className="text-2xl">📸</span>
                    <div className="flex flex-col text-right">
                      <span className="text-sm font-black group-hover:text-amber-600">صحح دفتري</span>
                      <span className="text-[10px] text-slate-400">تحليل صورة الحل</span>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageCapture} />
                  </label>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex-1 flex flex-col gap-2">
            {pendingImage && (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-2xl border border-blue-100 dark:border-blue-800 self-start animate-in zoom-in duration-200">
                <img src={pendingImage.preview} className="w-10 h-10 rounded-xl object-cover" alt="Preview" />
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">صورة الحل جاهزة</span>
                <button type="button" onClick={() => setPendingImage(null)} className="text-red-400 p-1">✕</button>
              </div>
            )}
            <div className="relative group">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder={activeMode !== InteractionMode.QA ? `وضع ${activeMode} نشط...` : "اسألني أي شي ببالك..."}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-[1.8rem] py-5 px-7 pr-16 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 text-slate-800 dark:text-slate-100 transition-all shadow-inner font-bold resize-none min-h-[64px] max-h-40 custom-scrollbar"
              />
              <button 
                type="button" 
                onClick={() => setIsLiveMode(true)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
            </div>
          </form>

          <button 
            onClick={handleSendMessage}
            disabled={isLoading || (!input.trim() && !pendingImage)}
            className={`w-14 h-14 ${theme.bg} text-white rounded-2xl flex items-center justify-center shadow-xl ${theme.shadow} ${theme.hover} hover:-translate-y-0.5 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:shadow-none transition-all flex-shrink-0`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const MenuOption = ({ icon, title, desc, onClick, themeColor }: { icon: string; title: string; desc: string; onClick: () => void; themeColor: string }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-right transition-all group">
    <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
    <div className="flex flex-col text-right">
      <span className={`text-sm font-black text-slate-700 dark:text-slate-200 group-hover:${themeColor}`}>{title}</span>
      <span className="text-[10px] text-slate-400 font-bold">{desc}</span>
    </div>
  </button>
);

export default ChatInterface;
