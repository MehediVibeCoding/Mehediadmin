import 'server-only';

// IP থেকে শহর/দেশ — শুধু Telegram লগইন-এলার্ট লাইটলি দেখানোর জন্য, best-effort।
// কোনো সিক্রেট কী লাগে না (ipwho.is ফ্রি, কী ছাড়া)। ব্যর্থ/টাইমআউট হলে খালি
// স্ট্রিং ফেরত দেয় — কলার (lib/telegramAlert.ts) তখন শুধু লোকেশন-অংশটা বাদ
// দিয়ে বাকি এলার্ট পাঠায়, পুরো এলার্টই আটকে যায় না।
export async function lookupIpLocation(ip: string): Promise<string> {
  if (!ip || ip === '127.0.0.1' || ip.startsWith('::') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return '';
  }

  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    if (!res.ok) return '';
    const data = await res.json();
    if (!data?.success) return '';
    const city = (data.city || '').toString().trim();
    const country = (data.country || '').toString().trim();
    return [city, country].filter(Boolean).join(', ');
  } catch {
    return '';
  }
}
