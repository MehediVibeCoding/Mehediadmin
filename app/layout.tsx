import type { Metadata, Viewport } from 'next';
import './globals.css';
import { playfairDisplay, dmSans, hindSiliguri } from './fonts';

export const metadata: Metadata = {
  title: 'Vangcur Admin',
  description: 'Vangcur — Admin Panel',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`${playfairDisplay.variable} ${dmSans.variable} ${hindSiliguri.variable}`}>
      <head>
        {/*
          ডিজিট-অনলি ফন্ট ওভাররাইড (মূল সাইটের হুবহু কৌশল)।
          Noto Sans Bengali-কে text= প্যারামিটার দিয়ে শুধু বাংলা সংখ্যা
          (০-৯)-এ subset করা হয়েছে, ফলে @font-face-এর unicode-range শুধু ঐ
          দশটা ক্যারেক্টারেই সীমাবদ্ধ থাকে — এটা next/font দিয়ে করা যায় না
          বলেই এককভাবে <link>-এ রাখা, বাকি দুটো ফন্ট এখন next/font দিয়ে
          সেলফ-হোস্টেড (উপরের html className দ্রষ্টব্য)।
        */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&text=%E0%A7%A6%E0%A7%A7%E0%A7%A8%E0%A7%A9%E0%A7%AA%E0%A7%AB%E0%A7%AC%E0%A7%AD%E0%A7%AE%E0%A7%AF&display=swap"
        />
      </head>
      <body className="min-h-screen bg-transparent font-body text-ink antialiased">
        {/* মেইন সাইটের হুবহু প্রাণবন্ত ট্রাই-কালার স্কাই-ব্লু ক্যানভাস (ফ্যাকাসে সাদা ভাব দূরীকরণ) */}
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white"
        />
        {children}
      </body>
    </html>
  );
}
