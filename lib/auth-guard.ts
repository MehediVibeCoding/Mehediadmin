import { createClient } from '@/lib/supabase/server';

// অডিট §২.১ ফিক্স ────────────────────────────────────────────────
// middleware.ts আগে থেকেই admin email verify করে, কিন্তু এতদিন প্রতিটা
// 'use server' action পুরোপুরি সেই middleware-এর ওপর ভরসা করে
// createServiceRoleClient() (RLS bypass করা full-access client) সরাসরি
// কল করত — action file নিজে কোনো auth check করত না। middleware
// bypass হওয়ার মতো bug (Next.js-এ এই প্যাটার্নে আগে একাধিকবার CVE হয়েছে,
// যেমন CVE-2026-64642/44574) ঘটলে পুরো admin API খোলা থাকত।
//
// এখন থেকে প্রতিটা action নিজে থেকে requireAdmin() কল করবে — middleware
// কাজ না করলেও এটা independently আটকাবে। এই ফাংশন cookie-based
// createClient() ব্যবহার করে (service-role client না), তাই এটা RLS
// bypass করে না — শুধু বর্তমান session-এর user verify করে।
export class UnauthorizedError extends Error {
  constructor(message = 'অনুমতি নেই — এডমিন হিসেবে লগইন করা নেই।') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export async function requireAdmin(): Promise<{ email: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email || user.email !== process.env.ADMIN_EMAIL) {
    throw new UnauthorizedError();
  }

  return { email: user.email };
}
