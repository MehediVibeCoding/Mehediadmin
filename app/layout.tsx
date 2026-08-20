import type { Metadata } from 'next';
import './globals.css';

// ⚠️ next/font/google-এ migrate করার চেষ্টা করা হয়েছিল (Custom-font
// লিন্ট warning ঠিক করতে), কিন্তু সেটা বাদ দেওয়া হলো — কারণ next/font
// build-time-এ সরাসরি fonts.googleapis.com থেকে ফন্ট ফাইল ডাউনলোড করার
// চেষ্টা করে, আর সেটা network-নির্ভর একটা ধাপ যেটা আমি নিজের sandbox-এ
// verify করতে পারিনি (network policy-তে block করা)। এটা যদি কোনো কারণে
// Vercel-এর build-এও ফেইল করত (যেমন সাময়িক নেটওয়ার্ক সমস্যা), পুরো
// deploy আটকে যেত — একটা নিরীহ lint warning-এর চেয়ে সেটা অনেক খারাপ।
// তাই এই <link>-ভিত্তিক পদ্ধতিই রাখা হলো, যেটা ইতিমধ্যে লাইভে কাজ করছে।
export const metadata: Metadata = {
  title: 'Vangcur Admin',
  description: 'Vangcur — Admin Panel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <head>
    
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white bg-fixed font-body text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
