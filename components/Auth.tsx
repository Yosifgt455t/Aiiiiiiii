
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Give it a tiny delay for better UX
    setTimeout(() => {
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();

      if (!trimmedUsername || !trimmedPassword) {
        setError('يرجى ملء جميع الحقول عيني.');
        setIsLoading(false);
        return;
      }

      let storedUsers = [];
      try {
        storedUsers = JSON.parse(localStorage.getItem('nebras_users') || '[]');
      } catch (e) {
        storedUsers = [];
      }

      if (isLogin) {
        const user = storedUsers.find((u: any) => 
          u.username === trimmedUsername && 
          u.password === trimmedPassword
        );
        
        if (user) {
          onLogin({ username: user.username, points: user.points, joinedAt: user.joinedAt });
        } else {
          setError('اسم المستخدم أو كلمة المرور غير صحيحة. تأكد منها يا بطل.');
        }
      } else {
        if (storedUsers.find((u: any) => u.username === trimmedUsername)) {
          setError('اسم المستخدم هذا محجوز مسبقاً، جرب غيره عيوني.');
          setIsLoading(false);
          return;
        }
        
        const newUser = {
          username: trimmedUsername,
          password: trimmedPassword,
          points: 100,
          joinedAt: new Date().toISOString()
        };
        
        const updatedUsers = [...storedUsers, newUser];
        localStorage.setItem('nebras_users', JSON.stringify(updatedUsers));
        onLogin({ username: newUser.username, points: newUser.points, joinedAt: newUser.joinedAt });
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 p-4 font-['Tajawal']">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-12 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-xl mx-auto mb-6 rotate-3">
            ن
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">نبراس</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold">مشوار النجاح يبدأ بكلمة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-r-4 border-red-500 p-4 text-red-700 dark:text-red-400 text-sm font-bold rounded-xl animate-shake">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-black mb-2 px-1">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 dark:text-white transition-all font-bold"
              placeholder="مثلاً: احمد البطل"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-black mb-2 px-1">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 dark:text-white transition-all font-bold"
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 dark:shadow-none hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                جاري التحميل...
              </>
            ) : (
              isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            disabled={isLoading}
            className="text-blue-600 dark:text-blue-400 font-black hover:underline disabled:opacity-50"
          >
            {isLogin ? 'ما عندك حساب؟ سجل هسة' : 'عندك حساب؟ سجل دخولك'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
