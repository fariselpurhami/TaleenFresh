// src/app/(auth)/admin-login/page.tsx

'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldAlert, LockKeyhole, Cpu } from 'lucide-react';
import { verifyAdminPin } from '@/app/actions/auth';
import { motion, AnimatePresence } from 'framer-motion';

const bgBlob1Animate = {
  scale: [1, 1.1, 1],
  opacity: [0.3, 0.5, 0.3],
  rotate: [0, 90, 0]
};

const bgBlob1Transition = { duration: 15, repeat: Infinity, ease: "linear" };

const bgBlob2Animate = {
  scale: [1, 1.2, 1],
  opacity: [0.2, 0.4, 0.2],
  translateY: [0, -50, 0]
};

const bgBlob2Transition = { duration: 10, repeat: Infinity, ease: "easeInOut" };

const cardInitial = { opacity: 0, y: 30, scale: 0.95 };
const cardAnimate = { opacity: 1, y: 0, scale: 1 };
const cardTransition = { duration: 0.6, type: "spring", bounce: 0.4 };

const iconInitial = { scale: 0 };
const iconAnimate = { scale: 1 };
const iconTransition = { delay: 0.2, type: "spring", stiffness: 200 };

const errorInitial = { opacity: 0, y: -10, filter: "blur(4px)" };
const errorAnimate = { opacity: 1, y: 0, filter: "blur(0px)" };
const errorExit = { opacity: 0, y: 10, filter: "blur(4px)" };

export default function AdminLogin() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const executeLogin = useCallback(() => {
    if (pin.length !== 4 || isPending) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('pin', pin);

      const result = await verifyAdminPin(formData);

      if (result?.error) {
        setError(true);
        setPin('');

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setError(false);
            inputRef.current?.focus();
        }, 2500);
      } else if (result?.success) {
        router.refresh();
        router.push('/admin');
      }
    });
  }, [pin, isPending, router]);

  useEffect(() => {
    if (pin.length === 4) {
      executeLogin();
    }
  }, [pin, executeLogin]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleLogin = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    executeLogin();
  }, [executeLogin]);

  const handlePinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 4) setPin(val);
  }, []);

  return (
    <main dir="rtl" className="min-h-[100dvh] bg-[#0A0F0D] flex items-center justify-center p-5 relative overflow-hidden font-sans selection:bg-[#22c55e]/30 selection:text-white">

      <motion.div
        animate={bgBlob1Animate}
        transition={bgBlob1Transition as any}
        className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-gradient-to-br from-[#22c55e]/20 to-transparent blur-[100px] rounded-full pointer-events-none"
      />
      <motion.div
        animate={bgBlob2Animate}
        transition={bgBlob2Transition as any}
        className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] bg-gradient-to-tr from-[#16a34a]/20 to-emerald-900/10 blur-[100px] rounded-full pointer-events-none"
      />

      <motion.div
        initial={cardInitial}
        animate={cardAnimate}
        transition={cardTransition as any}
        className="w-full max-w-[420px] bg-white/5 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden relative z-10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none"
      >

        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#22c55e] to-transparent opacity-70" />

        <div className="pt-14 pb-8 px-8 text-center flex flex-col items-center relative z-10">
          <motion.div
            initial={iconInitial}
            animate={iconAnimate}
            transition={iconTransition as any}
            className="w-16 h-16 bg-[#22c55e]/10 rounded-2xl flex items-center justify-center border border-[#22c55e]/20 mb-6 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
          >
            <Cpu className="text-[#22c55e] w-8 h-8" strokeWidth={1.5} />
          </motion.div>

          <h1 className="text-4xl font-black tracking-tight mb-4 text-white drop-shadow-md">
            Taleen<span className="text-[#22c55e]">Fresh</span>
          </h1>

          <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 rounded-full border border-white/5 shadow-inner">
            <LockKeyhole size={14} className="text-[#22c55e]" />
            <span className="text-xs font-bold text-gray-300 tracking-widest uppercase mt-0.5">
              غرفة العمليات المركزية
            </span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="px-8 pb-12 relative z-10" suppressHydrationWarning>
          <div className="space-y-6">
            <div className="relative flex flex-col items-center">

              <div className="relative w-full group">
                <input
                  ref={inputRef}
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={handlePinChange}
                  disabled={isPending}
                  autoComplete="off"
                  suppressHydrationWarning
                  className={`w-full text-center tracking-[0.7em] indent-[0.7em] text-[40px] font-black py-5 border-2 rounded-[1.5rem] bg-black/20 backdrop-blur-md focus:outline-none transition-all duration-500 font-mono ${
                    error
                      ? 'border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                      : 'border-white/10 focus:border-[#22c55e]/50 focus:bg-black/40 focus:shadow-[0_0_30px_rgba(34,197,94,0.15)] text-white placeholder-gray-600'
                  } ${isPending ? 'opacity-50 blur-[2px] scale-95' : 'scale-100'}`}
                  placeholder="••••"
                  maxLength={4}
                  autoFocus
                />

                <div className={`absolute -inset-1 bg-gradient-to-r from-[#22c55e] to-emerald-400 rounded-[1.7rem] blur opacity-0 group-focus-within:opacity-20 transition duration-500 -z-10 ${error ? 'hidden' : 'block'}`} />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={errorInitial}
                    animate={errorAnimate}
                    exit={errorExit}
                    className="absolute -bottom-8 flex items-center justify-center gap-1.5 text-red-400 text-sm font-bold bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20"
                  >
                    <ShieldAlert size={14} />
                    <span>الرمز غير صحيح</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              type="submit"
              disabled={isPending || pin.length !== 4}
              whileHover={pin.length === 4 && !isPending ? { scale: 1.02 } : {}}
              whileTap={pin.length === 4 && !isPending ? { scale: 0.98 } : {}}
              className={`relative overflow-hidden w-full p-4.5 rounded-2xl font-black text-lg transition-all duration-500 flex items-center justify-center gap-3 mt-4 ${
                isPending || pin.length !== 4
                  ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white shadow-[0_10px_30px_rgba(34,197,94,0.3)] border border-[#22c55e]/50 hover:shadow-[0_15px_40px_rgba(34,197,94,0.4)]'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {isPending ? (
                  <span className="animate-pulse">جاري فك التشفير...</span>
                ) : (
                  <>
                    تأكيد الدخول
                    <ArrowRight className="w-5 h-5" strokeWidth={3} />
                  </>
                )}
              </span>

              {pin.length === 4 && !isPending && (
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </main>
  );
}
