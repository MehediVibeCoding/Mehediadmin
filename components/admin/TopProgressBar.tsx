'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// ━ টপ প্রগ্রেস বার (NProgress স্টাইল, কোনো বাইরের লাইব্রেরি ছাড়া) ━
// অ্যাডমিনের ভেতরের কোনো লিংকে ক্লিক করলে স্ক্রিনের একদম উপরে সরু স্কাই-ব্লু বার চলে —
// বোঝায় যে পেছনে পেজ লোড হচ্ছে। রুট (pathname) বদলালেই ১০০% হয়ে মিলিয়ে যায়।
// ক্যাশ থেকে ইনস্ট্যান্ট খোলা পেজে বার ঝলকানি এড়াতে দেখানো শুরু হয় ১২০ms পরে।
const SHOW_DELAY_MS = 120;
const SAFETY_TIMEOUT_MS = 12000;

export default function TopProgressBar() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  const activeRef = useRef(false);
  const shownRef = useRef(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAll = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (trickle.current) clearInterval(trickle.current);
    if (safety.current) clearTimeout(safety.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = trickle.current = safety.current = hideTimer.current = null;
  }, []);

  const finish = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    if (showTimer.current) clearTimeout(showTimer.current);
    if (trickle.current) clearInterval(trickle.current);
    if (safety.current) clearTimeout(safety.current);
    if (!shownRef.current) return; // ১২০ms-এর আগেই লোড শেষ — বার দেখানোই হয়নি
    setWidth(100);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      shownRef.current = false;
      hideTimer.current = setTimeout(() => setWidth(0), 300);
    }, 220);
  }, []);

  const start = useCallback(() => {
    if (activeRef.current) return;
    clearAll();
    activeRef.current = true;
    showTimer.current = setTimeout(() => {
      shownRef.current = true;
      setWidth(12);
      setVisible(true);
      trickle.current = setInterval(() => {
        setWidth((w) => (w < 88 ? w + (90 - w) * 0.1 : w));
      }, 200);
    }, SHOW_DELAY_MS);
    safety.current = setTimeout(finish, SAFETY_TIMEOUT_MS);
  }, [clearAll, finish]);

  // পেজ বদলে গেছে → শেষ
  useEffect(() => {
    finish();
  }, [pathname, finish]);

  // অ্যাডমিনের ভেতরের লিংকে ক্লিক → শুরু
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      start();
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [start]);

  useEffect(() => clearAll, [clearAll]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[2px] bg-brand-light"
      style={{
        width: `${width}%`,
        opacity: visible ? 1 : 0,
        transition: 'width 200ms ease-out, opacity 250ms ease-out',
        boxShadow: visible ? '0 0 8px rgba(56,189,248,0.6)' : 'none',
      }}
    />
  );
}
