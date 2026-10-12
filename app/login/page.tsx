'use client';

import { useRef, useState } from 'react';
import { login } from '@/app/actions/auth';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Field, FIELD_CLS } from '@/components/common/FormField';
import { AuthBackdrop } from '@/components/common/AuthBackdrop';
import TurnstileWidget, { type TurnstileHandle } from '@/components/auth/TurnstileWidget';

// 🔒 A1 ফিক্স — আগে এই পেজ নিজেই সরাসরি supabase.auth.signInWithPassword() ডাকত
// (ব্রাউজার থেকে, মাঝে কোনো সার্ভার কোড ছাড়াই)। এখন app/actions/auth.ts-এর
// login() Server Action দিয়ে যায় — সেখানে রেট-লিমিট, Turnstile ভেরিফাই ও সফল
// অ্যাডমিন-লগইনে Telegram এলার্ট হয়।
export default function LoginPage() {
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const turnstileConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // সাইট-কী কনফিগার না থাকলে widget-ই রেন্ডার হয় না (TurnstileWidget দেখুন),
    // তখন ১০ সেকেন্ড অকারণ অপেক্ষা না করে সরাসরি খালি টোকেন পাঠানো হয়
    // (server-এও সিক্রেট কী না থাকলে verify একইভাবে স্কিপ হয়)।
    const turnstileToken = turnstileConfigured
      ? await (turnstileRef.current?.waitForToken() ?? Promise.resolve(''))
      : '';

    // সফল হলে login() ভেতরেই redirect('/') কল করে — Next.js এই থ্রো-করা
    // রিডাইরেক্ট ধরে স্বয়ংক্রিয়ভাবে নেভিগেট করায়, তাই এর পরের লাইনে আসে না।
    const result = await login(email, password, turnstileToken);

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      turnstileRef.current?.reset();
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      {/* ── প্রিমিয়াম ফিক্সড পটভূমি (ঢেউ + গ্যাজেট টাইল + ডট-গ্রিড) ── */}
      <AuthBackdrop className="z-0" iconClass="hidden md:flex" />

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

          <div className="mt-4">
            <TurnstileWidget ref={turnstileRef} active={true} />
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
