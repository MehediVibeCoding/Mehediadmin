'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import PendingOrdersBadge from '@/components/admin/PendingOrdersBadge';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  badge?: { text: string; bg: string };
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// legacy admin.html সাইডবারের ৩টা সেকশন (মূল / ডিজাইন / সেটিংস) থেকে হুবহু
// গ্রুপিং — যেসব রুট এখনো তৈরি হয়নি সেগুলো disabled রেখে "শীঘ্রই" ট্যাগ
// দেখানো হচ্ছে। NOTE: legacy sidebar-এ ট্রাফিক/প্রফিট কোনো নেভ আইটেম ছিল
// না — শুধু Dashboard-এর stat card থেকে ক্লিক করে যাওয়া যেত। এখানে সেগুলো
// রাখা হলো (আগের রিবিল্ডেও ছিল) যাতে কোনো ফিচার হারিয়ে না যায়, কিন্তু এটা
// owner-কে জানানো দরকার — legacy সাথে ১০০% same করতে চাইলে এই দুইটা এখান
// থেকে সরিয়ে শুধু dashboard stat card-এর মধ্যে সীমাবদ্ধ রাখা যেতে পারে।
const NAV_SECTIONS: NavSection[] = [
  {
    title: 'মূল',
    items: [
      { href: '/', label: 'ড্যাশবোর্ড', enabled: true, icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></> },
      { href: '/orders', label: 'অর্ডার', enabled: true, icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></> },
      { href: '/products', label: 'প্রোডাক্ট', enabled: true, icon: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></> },
      { href: '/products/parser', label: 'AI Planner', enabled: true, badge: { text: 'AUTO', bg: '#4CAF50' }, icon: <><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></> },
      { href: '/offers-mgmt', label: 'অফার পপআপ', enabled: true, icon: <><path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z" /><path d="M14 8a4 4 0 0 1 0 8" /><path d="M17.5 5a8 8 0 0 1 0 14" /></> },
      { href: '/customers', label: 'কাস্টমার', enabled: true, icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
      { href: '/reviews-qa', label: 'রিভিউ ও প্রশ্নোত্তর', enabled: true, icon: <><path d="M11 3a8 8 0 1 0 6.32 12.906L21 20l-1.094-3.68A8 8 0 0 0 11 3Z" /><path d="M8 10h6" /><path d="M8 13h4" /></> },
      { href: '/traffic', label: 'ট্রাফিক অ্যানালিটিক্স', enabled: true, icon: <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" /></> },
      { href: '/profit', label: 'নিট প্রফিট', enabled: true, icon: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></> },
    ],
  },
  {
    title: 'ডিজাইন',
    items: [
      { href: '/design/hero-cards', label: 'হিরো ক্যাটাগরি কার্ড', enabled: true, icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></> },
      { href: '/design/categories', label: 'ক্যাটাগরি', enabled: true, icon: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /> },
      { href: '/review-gallery', label: 'রিভিউ গ্যালারি', enabled: true, icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></> },
      { href: '/header-copy', label: 'হেডার টেক্সট', enabled: false, icon: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></> },
    ],
  },
];

// legacy .mob-tabbar-এর ৪টা শর্টকাট + মাঝের সার্কেল বাটন — হুবহু সেই সাবসেট,
// পুরো নেভ লিস্ট না (legacy নিজেও ফুল লিস্ট মোবাইল ট্যাববারে দেখায় না)
const TAB_ITEMS = [
  { href: '/orders', label: 'অর্ডার', icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></> },
  { href: '/products', label: 'প্রোডাক্ট', icon: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></> },
  { href: '/customers', label: 'কাস্টমার', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
];

function NavIcon({ children, className = 'h-[18px] w-[18px]' }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} shrink-0`}
    >
      {children}
    </svg>
  );
}

function LogoMark({ className = '' }: { className?: string }) {
  return (
    <div className={`font-display leading-none text-white ${className}`}>
      Vangcur
      <span className="mt-0.5 block text-[8.5px] font-body font-normal uppercase tracking-[2px] text-brand-accent">
        Admin Panel
      </span>
    </div>
  );
}

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
}

// legacy .nav-item লিস্ট — ডেস্কটপ রেইল আর মোবাইল bottom-sheet দুটোতেই
// একই markup পুনর্ব্যবহার করা হয় (legacy-ও একটাই .sidebar markup CSS দিয়ে
// দুই মোডে রূপান্তরিত করত)
function NavList({ onItemClick }: { onItemClick?: () => void }) {
  const isActive = useIsActive();
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-2">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="mb-1 mt-3.5 px-2 text-[9px] font-bold uppercase tracking-wider text-white/30 first:mt-0">
            {section.title}
          </div>
          {section.items.map((item) => {
            if (!item.enabled) {
              return (
                <div
                  key={item.href}
                  className="mb-0.5 flex cursor-not-allowed items-center gap-[9px] rounded-[9px] px-[11px] py-[9px] text-[12.5px] font-medium text-white/30"
                  title="শীঘ্রই আসছে"
                >
                  <NavIcon>{item.icon}</NavIcon>
                  <span className="flex-1">{item.label}</span>
                  <span className="rounded-lg bg-white/10 px-1.5 py-0.5 text-[9px] font-bold">শীঘ্রই</span>
                </div>
              );
            }
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={`mb-0.5 flex items-center gap-[9px] rounded-[9px] px-[11px] py-[9px] text-[12.5px] font-medium transition-brand ${
                  active
                    ? 'bg-brand-grad text-white shadow-[0_4px_14px_rgba(0,88,199,.45)]'
                    : 'text-white/60 hover:bg-white/[.08] hover:text-white'
                }`}
              >
                <NavIcon>{item.icon}</NavIcon>
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className="ml-auto rounded-lg px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                    style={{ background: item.badge.bg }}
                  >
                    {item.badge.text}
                  </span>
                )}
                {item.href === '/orders' && <PendingOrdersBadge active={active} />}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function LogoutButton({ onClick }: { onClick?: () => void }) {
  return (
    <div className="border-t border-white/[.08] p-3">
      <form action={logout} onClick={onClick}>
        <button
          type="submit"
          className="flex w-full items-center gap-[9px] rounded-[9px] px-[11px] py-[9px] text-[12.5px] font-medium text-white/60 transition-brand hover:bg-white/[.08] hover:text-white"
        >
          <NavIcon>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </NavIcon>
          লগআউট
        </button>
      </form>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isActive = useIsActive();

  // পেজ বদলালে মোবাইল শীট নিজে থেকে বন্ধ হয়ে যাবে (legacy showPage() একই কাজ করত)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ══ ডেস্কটপ রেইল — legacy .sidebar (≥768px) ══ */}
      <aside className="hidden h-screen w-[230px] shrink-0 flex-col overflow-y-auto bg-sidebar-grad shadow-[4px_0_24px_rgba(0,0,0,.18)] md:flex">
        <div className="px-4 pb-2 pt-6">
          <LogoMark className="px-2 text-lg font-bold" />
        </div>
        <NavList />
        <LogoutButton />
      </aside>

      {/* ══ মোবাইল টপবার — legacy .mob-topbar (<768px) ══ */}
      <div className="sticky top-0 z-[200] flex items-center justify-between bg-topbar-grad px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,.2)] md:hidden">
        <LogoMark className="text-base font-bold" />
        <button
          type="button"
          aria-label="মেনু"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex flex-col gap-[5px] rounded-md p-1.5"
        >
          <span className="block h-0.5 w-[22px] rounded bg-white" />
          <span className="block h-0.5 w-[22px] rounded bg-white" />
          <span className="block h-0.5 w-[22px] rounded bg-white" />
        </button>
      </div>

      {/* ══ মোবাইল ওভারলে + slide-up sheet — legacy .mob-overlay / .sidebar.mob-open ══ */}
      <div
        className={`fixed inset-0 z-[550] bg-black/50 transition-opacity md:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-[560] flex max-h-[82vh] flex-col overflow-hidden rounded-t-[26px] bg-sidebar-grad pt-3 shadow-[0_-20px_55px_rgba(0,0,0,.45)] transition-transform duration-[380ms] ease-[cubic-bezier(.32,.72,0,1)] md:hidden ${
          mobileOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto mb-2 h-1 w-[38px] shrink-0 rounded-full bg-white/25" />
        <NavList onItemClick={() => setMobileOpen(false)} />
        <LogoutButton onClick={() => setMobileOpen(false)} />
      </div>

      {/* ══ ফ্লোটিং বটম ট্যাব বার — legacy .mob-tabbar (<768px) ══ */}
      <div
        className="fixed bottom-2 left-1/2 z-[500] flex w-[calc(100%-28px)] max-w-[420px] -translate-x-1/2 items-center justify-between rounded-[26px] border border-white/10 bg-[#0a1830]/70 p-2 shadow-[0_14px_40px_rgba(0,18,41,.35),inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-xl md:hidden"
        style={{ bottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
      >
        {TAB_ITEMS.slice(0, 2).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-[14px] px-0.5 py-1.5 transition-brand ${
                active ? 'bg-brand-grad text-white shadow-[0_4px_14px_rgba(0,88,199,.55)]' : 'text-white/55'
              }`}
            >
              <NavIcon className="h-5 w-5">{item.icon}</NavIcon>
              <span className="whitespace-nowrap text-[9px] font-semibold">{item.label}</span>
            </Link>
          );
        })}

        <Link
          href="/products/parser"
          aria-label="AI Planner"
          className="-mt-6 flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full border-[3px] border-[#0a1830]/90 bg-brand-grad shadow-[0_8px_20px_rgba(0,61,143,.5),inset_0_1px_0_rgba(255,255,255,.25)] transition-transform active:scale-90"
        >
          <NavIcon className="h-[22px] w-[22px] text-white">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </NavIcon>
        </Link>

        {TAB_ITEMS.slice(2).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-[14px] px-0.5 py-1.5 transition-brand ${
                active ? 'bg-brand-grad text-white shadow-[0_4px_14px_rgba(0,88,199,.55)]' : 'text-white/55'
              }`}
            >
              <NavIcon className="h-5 w-5">{item.icon}</NavIcon>
              <span className="whitespace-nowrap text-[9px] font-semibold">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 rounded-[14px] px-0.5 py-1.5 text-white/55 transition-brand"
        >
          <NavIcon className="h-5 w-5">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </NavIcon>
          <span className="text-[9px] font-semibold">মেনু</span>
        </button>
      </div>
    </>
  );
}
