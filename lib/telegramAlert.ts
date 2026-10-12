import 'server-only';
import { lookupIpLocation } from './ipGeo';

// এডমিন প্যানেলে সফল লগইনের Telegram এলার্ট। মূল সাইটের (Vangcur) lib/telegram.ts-এর
// escape/ফরম্যাট-কনভেনশন অনুসরণ করা হয়েছে, কিন্তু এটা এডমিনের নিজস্ব আলাদা ফাইল —
// মূল সাইটের অর্ডার-নোটিফিকেশন কোডের সাথে কোনো নির্ভরতা নেই।
//
// একই TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID (owner নিশ্চিত করেছেন রিইউজ করা হবে) —
// Vercel-এর Mehediadmin প্রজেক্টে এই দুটো এনভ বসাতে হবে (.env.example-এ যোগ করা আছে)।
// সেট করা না থাকলে silently স্কিপ করে — লগইন কখনো এর ওপর নির্ভর করে আটকাবে না।
function escapeTelegramHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface AdminLoginAlertInfo {
  ip: string;
  userAgent: string;
  email: string;
}

export async function sendAdminLoginAlert(info: AdminLoginAlertInfo): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const e = escapeTelegramHtml;

  // best-effort — ব্যর্থ হলে খালি স্ট্রিং, এলার্ট তাও পাঠানো হবে
  const location = await lookupIpLocation(info.ip).catch(() => '');

  const now = new Date().toLocaleString('bn-BD', {
    timeZone: 'Asia/Dhaka',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const message =
    `<b>এডমিন প্যানেলে লগইন হয়েছে</b>\n` +
    `সময়: ${e(now)}\n` +
    `ইমেইল: <code>${e(info.email)}</code>\n` +
    `IP: <code>${e(info.ip)}</code>${location ? ` (${e(location)})` : ''}\n` +
    `ডিভাইস: ${e(info.userAgent || 'অজানা')}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.text()).slice(0, 300); } catch { /* ignore */ }
      console.warn('[Telegram] admin login alert failed:', res.status, detail);
    }
  } catch (err) {
    console.warn('[Telegram] admin login alert error:', err);
  }
}
