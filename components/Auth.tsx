import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, AlertCircle, Settings } from 'lucide-react';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.session) {
          // User is logged in immediately (Email confirmation is disabled in Supabase)
          return;
        } else {
          // User needs to confirm email (Email confirmation is enabled in Supabase)
          alert('تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب، أو قم بتعطيل "Confirm Email" من لوحة تحكم Supabase لتسجيل الدخول المباشر.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0] p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center border border-black/5"
        >
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#5A5A40] mb-4">تكوين Supabase مطلوب</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            لتفعيل نظام المصادقة الحقيقي، يرجى إضافة مفاتيح Supabase في إعدادات البيئة (Environment Variables):
          </p>
          <div className="bg-gray-50 p-4 rounded-xl text-left font-mono text-sm mb-8 space-y-2 border border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-400">VITE_SUPABASE_URL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">VITE_SUPABASE_ANON_KEY</span>
            </div>
          </div>
          
          <button
            onClick={() => {
              localStorage.removeItem('nebras_guest_logged_out');
              window.location.reload();
            }}
            className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all mb-4"
          >
            الاستمرار كضيف (بدون حفظ دائم)
          </button>

          <p className="text-sm text-gray-400 italic">
            سيتم نقلك تلقائياً بمجرد إضافة المفاتيح.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-black/5"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-[#5A5A40] mb-2">
              {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </h1>
            <p className="text-gray-500 font-sans">
              {isSignUp ? 'انضم إلى نبراس وابدأ رحلتك التعليمية' : 'مرحباً بك مجدداً في نبراس'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mr-1">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mr-1">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A5A40] text-white py-3 rounded-xl font-medium hover:bg-[#4A4A30] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  <span>{isSignUp ? 'إنشاء حساب' : 'دخول'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#5A5A40] hover:underline text-sm font-medium"
            >
              {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ أنشئ حساباً جديداً'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
