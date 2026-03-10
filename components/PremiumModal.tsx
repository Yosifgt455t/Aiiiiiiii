import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Check, Zap, Shield, Star } from 'lucide-react';

interface PremiumModalProps {
  onClose: () => void;
  onUpgrade: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ onClose, onUpgrade }) => {
  const features = [
    { icon: <Zap size={18} />, title: 'تحميل تقارير PDF', desc: 'حول محادثاتك لتقارير دراسية مرتبة' },
    { icon: <Star size={18} />, title: 'موديلات ذكاء اصطناعي متطورة', desc: 'وصول لأحدث الموديلات للشرح العميق' },
    { icon: <Shield size={18} />, title: 'بدون إعلانات أو حدود', desc: 'استخدم نبراس طول اليوم بدون توقف' },
    { icon: <Check size={18} />, title: 'دعم فني خاص', desc: 'أولوية في الرد على استفساراتك' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl"
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
              <Crown size={32} className="text-yellow-400 fill-yellow-400" />
            </div>
            <h2 className="text-2xl font-black mb-2">نبراس بريميوم</h2>
            <p className="text-blue-100 font-medium opacity-90">استثمر في مستقبلك الدراسي مع المدرس الخصوصي الأذكي في العراق</p>
          </div>
        </div>

        {/* Features List */}
        <div className="p-8">
          <div className="grid grid-cols-1 gap-6 mb-8">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">{f.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing & CTA */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 text-center">
            <div className="mb-4">
              <span className="text-3xl font-black text-slate-900 dark:text-white">$10.00</span>
              <span className="text-slate-500 text-sm font-bold"> / لمرة واحدة فقط</span>
              <p className="text-[10px] text-slate-400 mt-1">(تقريباً 13,000 دينار عراقي)</p>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onUpgrade}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
            >
              اشترك الآن <Zap size={18} fill="currentColor" />
            </motion.button>
            <p className="mt-3 text-[10px] text-slate-400 font-medium">دفع آمن عبر Stripe • وصول فوري لكل الميزات</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PremiumModal;
