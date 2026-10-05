'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Field, FIELD_CLS } from '@/components/common/FormField';

// ব্র্যান্ড কভারের মতো নরম সাদা ঢেউ — দুই কোণায়, স্থির (অ্যানিমেশন নেই)
function Waves({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 560 320"
      fill="none"
      stroke="#fff"
      strokeLinecap="round"
      className={`pointer-events-none absolute w-[78vw] max-w-[620px] ${className}`}
    >
      <path d="M-10 190C120 215 250 130 350 30S520-20 580-50" strokeWidth="1.8" opacity="0.9" />
      <path d="M-10 255C150 280 280 175 400 70S540 0 600-30" strokeWidth="1.4" opacity="0.65" />
      <path d="M-10 320C175 345 320 225 450 105S590 25 640-5" strokeWidth="1.1" opacity="0.45" />
    </svg>
  );
}

// ব্র্যান্ড কভারের গ্যাজেট আইকন — অতি হালকা স্কাই-ব্লু রেখা, শুধু বড় স্ক্রিনে
function GadgetIcon({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`pointer-events-none absolute hidden text-brand-light opacity-[0.30] md:block ${className}`}
    >
      {children}
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      // ইচ্ছাকৃতভাবে generic message — কোনো hint দেওয়া হচ্ছে না
      setError('ভুল ইমেইল বা পাসওয়ার্ড।');
      return;
    }

    // middleware.ts এখন real admin check করবে; মিলে গেলে redirect হবে,
    // না মিললে আবার /login-এ ফেরত পাঠাবে।
    router.push('/');
    router.refresh();
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      {/* ── পটভূমির সাজ ── */}
      <Waves className="left-0 top-0" />
      <Waves className="bottom-0 right-0 rotate-180" />
      <GadgetIcon className="left-[9%] top-[46%] h-24 w-24 -rotate-12">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </GadgetIcon>
      <GadgetIcon className="right-[10%] top-[14%] h-20 w-20 rotate-12">
        <circle cx="12" cy="12" r="7" />
        <polyline points="12 9 12 12 13.5 13.5" />
        <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83" />
      </GadgetIcon>
      <GadgetIcon className="right-[7%] top-[52%] h-24 w-24 rotate-6">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <circle cx="12" cy="14" r="4" />
        <line x1="12" y1="6" x2="12.01" y2="6" />
      </GadgetIcon>
      <GadgetIcon className="bottom-[10%] left-[14%] h-20 w-20 rotate-12">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <circle cx="12" cy="10" r="2.5" />
        <line x1="9" y1="18" x2="9.01" y2="18" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
        <line x1="15" y1="18" x2="15.01" y2="18" />
      </GadgetIcon>

      {/* ── লগইন কার্ড ── */}
      <div className="relative z-10 w-full max-w-[420px]">
        <form
          onSubmit={handleLogin}
          className="animate-sheet-up rounded-[28px] border border-white/90 bg-white p-6 shadow-[0_24px_70px_rgba(68,167,252,0.24)] sm:p-8"
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <BrandLogo className="h-[76px] w-auto" priority />
            <span className="mt-3 font-body text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#0F6FC6]">
              Admin Suite
            </span>
          </div>

          <h1 className="text-center font-body text-[22px] font-black tracking-tight text-ink">লগইন করুন</h1>
          <p className="mb-6 mt-1 text-center font-body text-[12.5px] font-medium text-muted">
            আপনার অ্যাডমিন অ্যাকাউন্ট দিয়ে প্রবেশ করুন
          </p>

          <div className="space-y-4">
            <Field label="ইমেইল" htmlFor="login-email">
              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-light"
                >
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <path d="m22 7-10 6L2 7" />
                </svg>
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`${FIELD_CLS} pl-11`}
                />
              </div>
            </Field>

            <Field label="পাসওয়ার্ড" htmlFor="login-password">
              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-light"
                >
                  <rect x="4" y="11" width="16" height="10" rx="3" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${FIELD_CLS} pl-11 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখান'}
                  aria-pressed={showPassword}
                  title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখান'}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-all duration-brand hover:text-brand-light active:scale-90"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </Field>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-red-200/80 bg-red-50 px-3.5 py-2.5 font-body text-[12.5px] font-bold text-danger"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-light font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-60"
          >
            {loading && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
            {loading ? 'লগইন হচ্ছে...' : 'লগইন'}
          </button>
        </form>

        <p className="mt-4 text-center font-body text-[11.5px] font-semibold text-ink/60">
          © Vangcur Gadgets · শুধু অনুমোদিত অ্যাডমিনদের জন্য
        </p>
      </div>
    </main>
  );
}
