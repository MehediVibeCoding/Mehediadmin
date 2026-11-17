import localFont from 'next/font/local';

// আগে next/font/google ব্যবহার হতো, কিন্তু Vercel-এর বিল্ডের সময় Google Fonts থেকে
// ফন্ট আনতে গিয়ে বিল্ড ফেল করছিল ("Cannot read properties of null")। এখন ফন্টের
// ফাইল npm প্যাকেজ (@fontsource/*) থেকে সরাসরি লোড হয়, বিল্ডে ইন্টারনেট লাগে না।
// একই তিনটা ফন্ট, একই CSS variable নাম (--font-display/--font-dm-sans/--font-bengali),
// একই weight — মূল সাইট (vangcurweb)-এর সাথে মিল রাখা হয়েছে।
export const playfairDisplay = localFont({
  src: [
    {
      path: '../node_modules/@fontsource/playfair-display/files/playfair-display-latin-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-display',
  display: 'swap',
});

export const dmSans = localFont({
  src: [
    {
      path: '../node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const hindSiliguri = localFont({
  src: [
    {
      path: '../node_modules/@fontsource/hind-siliguri/files/hind-siliguri-bengali-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource/hind-siliguri/files/hind-siliguri-bengali-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource/hind-siliguri/files/hind-siliguri-bengali-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource/hind-siliguri/files/hind-siliguri-bengali-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-bengali',
  display: 'swap',
});
