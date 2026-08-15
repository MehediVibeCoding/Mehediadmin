'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-brand bg-brand-surface p-8 shadow-sh3"
      >
        <h1 className="mb-6 text-center font-display text-2xl text-brand-primary">
          Vangcur Admin
        </h1>

        <label className="mb-1 block text-sm font-medium text-muted">
          ইমেইল
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-brand border border-border-base px-4 py-2.5 outline-none transition-brand focus:border-brand-primary"
        />

        <label className="mb-1 block text-sm font-medium text-muted">
          পাসওয়ার্ড
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-brand border border-border-base px-4 py-2.5 outline-none transition-brand focus:border-brand-primary"
        />

        {error && (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-brand bg-brand-primary py-2.5 font-medium text-white transition-brand hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'লগইন হচ্ছে...' : 'লগইন'}
        </button>
      </form>
    </div>
  );
}
