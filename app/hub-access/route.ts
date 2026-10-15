import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { buildHubEntryUrl } from '@/lib/hubBridge';

export const dynamic = 'force-dynamic';

// সাইডবারের "রিকভারি হাব" আইটেম এখানে আসে। শুধু লগইন-করা আসল অ্যাডমিন (requireAdmin) —
// তার জন্য ৬০ সেকেন্ডের এক-বার-ব্যবহারযোগ্য সই করা টোকেন বানিয়ে হাবে পাঠানো হয়; হাব নিজে যাচাই করে কুকি বসায়।
// ইমেইল/পাসওয়ার্ড আবার দিতে হয় না। বাইরের কেউ এখানে এলে /login-এ ফেরত যায়।
export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const target = buildHubEntryUrl();
  if (!target) {
    return new NextResponse(
      'রিকভারি হাব সংযুক্ত নয়: Vercel-এ RECOVERY_HUB_BASE_URL (https://...) ও HUB_SSO_SECRET (কমপক্ষে ৩২ অক্ষর, হাবের সাথে হুবহু এক) বসান, তারপর রিডিপ্লয় করুন।',
      { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } }
    );
  }

  const res = NextResponse.redirect(target, 302);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}
