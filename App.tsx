
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import { PDFData, User, ChatHistoryEntry, ChatMessage, UserSettings } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Settings management
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('nebras_settings');
      return saved ? JSON.parse(saved) : { theme: 'light', accentColor: 'blue' };
    } catch (e) {
      return { theme: 'light', accentColor: 'blue' };
    }
  });

  // History management
  const [allChats, setAllChats] = useState<ChatHistoryEntry[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Load active user
    const savedUser = localStorage.getItem('nebras_active_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user && user.username) {
          setCurrentUser(user);
        }
      } catch (e) {
        localStorage.removeItem('nebras_active_user');
      }
    }

    // 2. Load all chats
    const savedChats = localStorage.getItem('nebras_chat_history');
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats).map((chat: any) => ({
          ...chat,
          messages: (chat.messages || []).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setAllChats(parsed);
        
        const lastId = localStorage.getItem('nebras_active_chat_id');
        if (lastId && parsed.find((c: any) => c.id === lastId)) {
          setActiveChatId(lastId);
        } else if (parsed.length > 0) {
          setActiveChatId(parsed[0].id);
        } else {
          createNewChat();
        }
      } catch (e) {
        localStorage.removeItem('nebras_chat_history');
        createNewChat();
      }
    } else {
      createNewChat();
    }
    
    setIsAuthLoading(false);
  }, []);

  // Save history
  useEffect(() => {
    if (!isAuthLoading && allChats.length >= 0) {
      localStorage.setItem('nebras_chat_history', JSON.stringify(allChats));
    }
  }, [allChats, isAuthLoading]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('nebras_settings', JSON.stringify(settings));
  }, [settings]);

  // Save active chat ID
  useEffect(() => {
    if (!isAuthLoading && activeChatId) {
      localStorage.setItem('nebras_active_chat_id', activeChatId);
    }
  }, [activeChatId, isAuthLoading]);

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newChat: ChatHistoryEntry = {
      id: newId,
      title: 'محادثة جديدة',
      pdf: null,
      messages: [],
      timestamp: new Date().toISOString()
    };
    setAllChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('nebras_active_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    if (!window.confirm('متأكد تريد تطلع؟')) return;
    
    // 1. Clear State
    setCurrentUser(null);
    setActiveChatId(null);
    setAllChats([]);

    // 2. Clear Critical Session Storage
    localStorage.removeItem('nebras_active_user');
    localStorage.removeItem('nebras_active_chat_id');
    localStorage.removeItem('nebras_current_pdf');
    
    // 3. Clear transient app state but keep the users database and settings
    // 4. Reload the page to reset everything
    window.location.reload();
  };

  const handleUpdateMessages = (chatId: string, messages: ChatMessage[]) => {
    setAllChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        let title = chat.title;
        if ((title === 'محادثة جديدة' || !title) && messages.length > 0) {
          const firstUserMsg = messages.find(m => m.role === 'user');
          if (firstUserMsg) {
            title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
          }
        }
        return { ...chat, messages, title, timestamp: new Date().toISOString() };
      }
      return chat;
    }));
  };

  const handleUpdatePdf = (chatId: string, pdf: PDFData) => {
    setAllChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, pdf, title: pdf.name };
      }
      return chat;
    }));
  };

  const handleClearPdf = (chatId: string) => {
    if (window.confirm('متأكد تريد تسد هذا الملف؟')) {
      setAllChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return { ...chat, pdf: null };
        }
        return chat;
      }));
    }
  };

  const handleDeleteChat = (chatId: string) => {
    if (window.confirm('تريد تحذف هاي المحادثة نهائياً؟')) {
      const filtered = allChats.filter(c => c.id !== chatId);
      setAllChats(filtered);
      if (activeChatId === chatId) {
        if (filtered.length > 0) {
          setActiveChatId(filtered[0].id);
        } else {
          createNewChat();
        }
      }
    }
  };

  if (isAuthLoading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-black gap-4">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-blue-600 animate-pulse">جاري تحضير نبراس...</p>
    </div>
  );

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  const activeChat = allChats.find(c => c.id === activeChatId) || allChats[0];

  return (
    <Layout user={currentUser} onLogout={handleLogout} settings={settings}>
      <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden">
        <Sidebar 
          currentPdf={activeChat?.pdf || null} 
          onClear={() => handleClearPdf(activeChatId!)}
          history={allChats}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={createNewChat}
          onDeleteChat={handleDeleteChat}
          settings={settings}
        />
        {activeChat ? (
          <ChatInterface 
            key={activeChat.id}
            initialMessages={activeChat.messages}
            currentPdf={activeChat.pdf} 
            onPdfUpload={(pdf) => handleUpdatePdf(activeChat.id, pdf)} 
            currentUser={currentUser}
            settings={settings}
            onSettingsChange={setSettings}
            onMessagesChange={(msgs) => handleUpdateMessages(activeChat.id, msgs)}
            onPointsUpdate={(newPoints) => {
              const updated = { ...currentUser, points: newPoints };
              setCurrentUser(updated);
              localStorage.setItem('nebras_active_user', JSON.stringify(updated));
              const allUsers = JSON.parse(localStorage.getItem('nebras_users') || '[]');
              const updatedUsers = allUsers.map((u: any) => u.username === updated.username ? { ...u, points: newPoints } : u);
              localStorage.setItem('nebras_users', JSON.stringify(updatedUsers));
            }}
          />
        ) : (
          <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 font-bold">
            اختر محادثة أو ابدأ وحدة جديدة
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
