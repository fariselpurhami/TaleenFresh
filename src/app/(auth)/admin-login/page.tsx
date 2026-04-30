// src/app/(auth)/admin-login/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldAlert, KeyRound } from 'lucide-react';
import { verifyAdminPin } from '@/app/actions/auth';

export default function AdminLogin() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const formData = new FormData();
      formData.append('pin', pin);

      const result = await verifyAdminPin(formData);

      if (result?.error) {
        setError(true);
        setPin('');
        setTimeout(() => setError(false), 2000);
      } else if (result?.success) {
        router.refresh();
        router.push('/admin');
      }
    });
  };

  return (
    <main dir="rtl" className="min-h-[100dvh] bg-[#f8f9fa] flex items-center justify-center p-4 relative overflow-hidden">
      {/* خلفية جمالية مستوحاة من ألوان المتجر */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#22c55e]/20 via-[#22c55e]/5 to-transparent -z-10" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#22c55e]/10 rounded-full blur-3xl -z-10" />

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden relative">
        
        {/* الهيدر الفخم مع اللوجو */}
        <div className="pt-12 pb-6 px-8 text-center flex flex-col items-center">
          {/* دائرة الأيقونة (بديلة للوجو حالياً) */}
          <div className="relative w-20 h-20 rounded-[1.5rem] overflow-hidden border-[3px] border-white shadow-xl bg-white flex items-center justify-center mb-6 transform rotate-3">
            <img src="/icon-512x512.png" alt="Taleen Fresh Logo" className="w-full h-full object-contain" />
          </div>

          {/* اللوجو النصي - تالين بالأسود، فريش بالأخضر */}
          <h1 className="text-3xl font-black tracking-tight mb-2">
            <span className="text-gray-900">Taleen</span>
            <span className="text-[#22c55e]">Fresh</span>
          </h1>
          <p className="text-sm font-bold text-gray-400 tracking-wide uppercase">
            Command Center
          </p>
        </div>

        {/* فورم الدخول */}
        <form onSubmit={handleLogin} className="px-8 pb-10">
          <div className="space-y-8">
            <div className="relative">
              <label htmlFor="pin" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                <KeyRound size={16} className="text-[#22c55e]" />
                <span>رمز الدخول السري (PIN)</span>
              </label>
              
              <div className="relative">
                <input
                  id="pin"
                  type="password" // إخفاء الأرقام للسرية
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  disabled={isPending}
                  className={`w-full text-center tracking-[1em] text-4xl p-5 border-2 rounded-2xl bg-gray-50 focus:bg-white focus:ring-0 focus:outline-none transition-all duration-300 ${
                    error
                      ? 'border-red-500 bg-red-50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                      : 'border-transparent focus:border-[#22c55e] focus:shadow-[0_8px_30px_rgba(34,197,94,0.15)] text-gray-900'
                  } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="••••"
                  maxLength={4}
                  autoFocus
                />
                
                {/* رسالة الخطأ المتحركة */}
                {error && (
                  <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-1.5 text-red-500 text-xs font-bold animate-bounce">
                    <ShieldAlert size={14} />
                    <span>رمز الدخول غير صحيح</span>
                  </div>
                )}
              </div>
            </div>

            {/* زر الدخول التفاعلي */}
            <button
              type="submit"
              disabled={isPending || pin.length !== 4}
              className="relative overflow-hidden w-full bg-gray-900 text-white p-4.5 rounded-2xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-[0.98]"
            >
              {/* تأثير اللمعان (Shine Effect) */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shimmer" />
              
              <span className="relative z-10">{isPending ? 'جاري التحقق...' : 'دخول للوحة التحكم'}</span>
              
              {!isPending && (
                <ArrowRight 
                  className="w-5 h-5 relative z-10 group-hover:-translate-x-1.5 transition-transform duration-300" 
                  strokeWidth={2.5} 
                />
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
