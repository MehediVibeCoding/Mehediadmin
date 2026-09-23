import { Playfair_Display, DM_Sans, Hind_Siliguri } from 'next/font/google';

// মূল সাইট (vangcurweb)-এর app/fonts.ts থেকে হুবহু কপি — একই তিনটা ফন্ট, একই
// CSS variable নাম (--font-display/--font-dm-sans/--font-bengali), একই weight।
// আগে admin.html-এ এই next/font সেটআপ ছাড়াই শুধু <link> ট্যাগে ফন্ট লোড করা
// হতো, কিন্তু tailwind.config.ts-এর fontFamily আগে থেকেই var(--font-dm-sans)
// ইত্যাদি রেফার করত — সেই ভ্যারিয়েবলগুলো কোথাও ডিফাইন না থাকায় পুরো
// font-family ভ্যালুটাই ইনভ্যালিড হয়ে ব্রাউজার ডিফল্ট ফন্টে ফলব্যাক করছিল।
export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali',
  display: 'swap',
});
