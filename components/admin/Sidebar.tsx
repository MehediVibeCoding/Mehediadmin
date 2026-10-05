'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import PendingOrdersBadge from '@/components/admin/PendingOrdersBadge';
import { BrandLogo, BrandMark } from '@/components/common/BrandLogo';

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

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'মূল মেনু',
    items: [
      {
        href: '/',
        label: 'ড্যাশবোর্ড',
        enabled: true,
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="14" width="7" height="7" rx="2" />
            <rect x="3" y="14" width="7" height="7" rx="2" />
          </>
        ),
      },
      {
        href: '/orders',
        label: 'অর্ডার',
        enabled: true,
        icon: (
          <>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </>
        ),
      },
      {
        href: '/products',
        label: 'প্রোডাক্ট',
        enabled: true,
        icon: (
          <>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </>
        ),
      },
      {
        href: '/products/parser',
        label: 'AI Planner',
        enabled: true,
        badge: { text: 'AUTO', bg: '#44A7FC' },
        icon: (
          <>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            <circle cx="12" cy="12" r="3" />
          </>
        ),
      },
      {
        href: '/offers-mgmt',
        label: 'অফার পপআপ',
        enabled: true,
        icon: (
          <>
            <path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z" />
            <path d="M14 8a4 4 0 0 1 0 8" />
            <path d="M17.5 5a8 8 0 0 1 0 14" />
          </>
        ),
      },
      {
        href: '/coupons',
        label: 'কুপন',
        enabled: true,
        icon: (
          <>
            <path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82Z" />
            <circle cx="7.5" cy="7.5" r="1.5" />
          </>
        ),
      },
      {
        href: '/customers',
        label: 'কাস্টমার',
        enabled: true,
        icon: (
          <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        ),
      },
      {
        href: '/reviews-qa',
        label: 'রিভিউ ও প্রশ্নোত্তর',
        enabled: true,
        icon: (
          <>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </>
        ),
      },
      {
        href: '/traffic',
        label: 'ট্রাফিক অ্যানালিটিক্স',
        enabled: true,
        icon: (
          <>
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        ),
      },
      {
        href: '/profit',
        label: 'নিট প্রফিট',
        enabled: true,
        icon: (
          <>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </>
        ),
      },
    ],
  },
  {
    title: 'ডিজাইন কাস্টমাইজেশন',
    items: [
      {
        href: '/design/hero-cards',
        label: 'হিরো ক্যাটাগরি কার্ড',
        enabled: true,
        icon: (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </>
        ),
      },
      {
        href: '/design/categories',
        label: 'ক্যাটাগরি',
        enabled: true,
        icon: (
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        ),
      },
      {
        href: '/design/guide-templates',
        label: 'গাইড টেমপ্লেট',
        enabled: true,
        icon: (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </>
        ),
      },
      {
        href: '/review-gallery',
        label: 'রিভিউ গ্যালারি',
        enabled: true,
        icon: (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </>
        ),
      },
      {
        href: '/header-copy',
        label: 'হেডার টেক্সট',
        enabled: false,
        icon: (
          <>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </>
        ),
      },
    ],
  },
];

// মোবাইল নিচের ডকের ৫টা স্লট (বাম → ডান)। index ২ = মাঝের "+" অর্ব (AI Planner), index ৪ = মেনু ড্রয়ার।
interface DockSlot {
  kind: 'tab' | 'orb' | 'menu';
  href?: string;
  label: string;
  icon: React.ReactNode;
}

const DOCK_SLOTS: DockSlot[] = [
  {
    kind: 'tab',
    href: '/orders',
    label: 'অর্ডার',
    icon: (
      <>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      </>
    ),
  },
  {
    kind: 'tab',
    href: '/products',
    label: 'প্রোডাক্ট',
    icon: (
      <>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
      </>
    ),
  },
  {
    kind: 'orb',
    href: '/products/parser',
    label: 'AI Planner',
    icon: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
  },
  {
    kind: 'tab',
    href: '/customers',
    label: 'কাস্টমার',
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </>
    ),
  },
  {
    kind: 'menu',
    label: 'মেনু',
    icon: (
      <>
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </>
    ),
  },
];

const ORB_SLOT = 2;
const MENU_SLOT = 4;

function NavIcon({ children, className = 'h-[18px] w-[18px]' }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} shrink-0 transition-transform duration-brand`}
    >
      {children}
    </svg>
  );
}

// সবচেয়ে নির্দিষ্ট (লম্বা) href-ই সক্রিয় — নইলে /products/parser-এ "প্রোডাক্ট" ও "AI Planner" দুটোই জ্বলত।
const ENABLED_HREFS = NAV_SECTIONS.flatMap((s) => s.items.filter((i) => i.enabled).map((i) => i.href));

function useActiveHref() {
  const pathname = usePathname();
  let best = '';
  for (const href of ENABLED_HREFS) {
    const match = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
    if (match && href.length > best.length) best = href;
  }
  return best;
}

function LogoutIcon() {
  return (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ডেস্কটপ সাইডবার (≥768px)
   ──────────────────────────────────────────────────────────────────────
   "ঝাঁকুনি-মুক্ত" নিয়ম: হোভারে কোনো আইটেমের জ্যামিতি (উচ্চতা, আইকনের অবস্থান) বদলায় না।
   শুধু ১) সাইডবারের প্রস্থ বাড়ে, ২) লেখা ফেড-ইন হয়।
   - আইকন সবসময় ৫২px-এর বক্সে (সরু অবস্থায় ঠিক মাঝে), তাই কখনো নড়ে না।
   - লেবেল সবসময় DOM-এ; opacity/translate দিয়ে লুকানো (width/height 0→auto নয়)।
   - সেকশন টাইটেলের সারির উচ্চতা স্থির; সরু অবস্থায় ছোট দাগ, বড় অবস্থায় লেখা (ক্রস-ফেড)।
   - লোগো দুটো একই বক্সে ক্রস-ফেড (V মার্ক ↔ পুরো লোগো)।
   ══════════════════════════════════════════════════════════════════════ */
const ICON_BOX = 'flex w-[52px] shrink-0 items-center justify-center';
const ITEM_BASE =
  'group relative flex h-[44px] w-full items-center overflow-hidden rounded-[14px] transition-[background-color,color,box-shadow] duration-200 [contain:layout_paint]';

// প্রতিটা আইটেমের লেবেল একটু একটু দেরিতে ফোটে (stagger) — শুধু opacity/transform, জ্যামিতি অপরিবর্তিত।
// বন্ধ হওয়ার সময় দেরি ০, তাই সাইডবার গুটোনোর সাথে লেখা আগেই মিলিয়ে যায়।
const ALL_HREFS = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.href));
const STAGGER_BASE = 120;
const STAGGER_STEP = 16;

function staggerStyle(expanded: boolean, index: number): React.CSSProperties {
  return { transitionDelay: expanded ? `${STAGGER_BASE + index * STAGGER_STEP}ms` : '0ms' };
}

function labelCls(expanded: boolean) {
  return `shrink-0 whitespace-nowrap font-body text-[13px] font-bold tracking-tight transition-[opacity,transform] ease-out motion-reduce:transition-none ${
    expanded ? 'translate-x-0 opacity-100 duration-300' : '-translate-x-2 opacity-0 duration-100'
  }`;
}

function fadeCls(expanded: boolean) {
  return `transition-opacity motion-reduce:transition-none ${expanded ? 'opacity-100 duration-300' : 'opacity-0 duration-100'}`;
}

function DesktopNavItem({ item, active, expanded }: { item: NavItem; active: boolean; expanded: boolean }) {
  const index = ALL_HREFS.indexOf(item.href);
  const delay = staggerStyle(expanded, index);
  if (!item.enabled) {
    return (
      <div aria-disabled="true" className={`${ITEM_BASE} cursor-not-allowed text-muted/45`}>
        <span className={ICON_BOX}>
          <NavIcon className="h-5 w-5">{item.icon}</NavIcon>
        </span>
        <span className={labelCls(expanded)} style={delay}>
          {item.label}
        </span>
        <span
          style={delay}
          className={`ml-auto mr-3 shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 font-body text-[9px] font-semibold text-muted ${fadeCls(expanded)}`}
        >
          শীঘ্রই
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      className={`${ITEM_BASE} ${
        active
          ? 'bg-brand-light text-white shadow-[0_3px_10px_rgba(68,167,252,0.35)]'
          : 'text-ink/75 hover:bg-brand-light/10 hover:text-ink'
      }`}
    >
      <span className={ICON_BOX}>
        <NavIcon className={`h-5 w-5 group-hover:scale-110 ${active ? '' : 'group-hover:text-brand-light'}`}>
          {item.icon}
        </NavIcon>
      </span>

      <span className={labelCls(expanded)} style={delay}>
          {item.label}
        </span>

      {item.badge && (
        <span
          className={`ml-auto mr-3 shrink-0 rounded-full px-2 py-0.5 font-body text-[9.5px] font-extrabold text-white ${fadeCls(expanded)}`}
          style={{ background: item.badge.bg, ...delay }}
        >
          {item.badge.text}
        </span>
      )}

      {/* পেন্ডিং ব্যাজ সবসময় আইকনের কোণায় — হোভারে জায়গা বদলায় না */}
      {item.href === '/orders' && (
        <span className="absolute left-[29px] top-[3px]">
          <PendingOrdersBadge active={false} className="ring-2 ring-white" />
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ title, expanded }: { title: string; expanded: boolean }) {
  return (
    <div className="relative h-7 shrink-0" aria-hidden="true">
      <span
        className={`absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center transition-opacity motion-reduce:transition-none ${
          expanded ? 'opacity-0 duration-100' : 'opacity-100 delay-150 duration-200'
        }`}
      >
        <span className="h-px w-6 rounded-full bg-border-base" />
      </span>
      <span
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 whitespace-nowrap font-body text-[9.5px] font-extrabold uppercase tracking-wider text-muted transition-opacity motion-reduce:transition-none ${
          expanded ? 'opacity-100 delay-100 duration-300' : 'opacity-0 duration-100'
        }`}
      >
        {title}
      </span>
    </div>
  );
}

function DesktopSidebar({ activeHref, onLogout }: { activeHref: string; onLogout: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setExpanded(true);
  }, []);

  // মাউস কিনারায় দ্রুত ঢুকে-বেরোলে ঝিরঝির না করতে বন্ধ হওয়ায় সামান্য দেরি
  const close = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setExpanded(false), 140);
  }, []);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    []
  );

  return (
    <div className="relative hidden md:block md:w-[76px] md:shrink-0">
      <aside
        aria-label="প্রধান মেনু"
        onMouseEnter={open}
        onMouseLeave={close}
        onFocusCapture={(e) => {
          // মাউস ক্লিকের ফোকাসে নয়, শুধু কীবোর্ড ফোকাসে খুলবে (নইলে ক্লিকের পর আটকে থাকত)
          if ((e.target as HTMLElement).matches(':focus-visible')) open();
        }}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
        }}
        className={`desktop-glass-rail fixed bottom-3 left-3 top-3 z-50 flex flex-col overflow-hidden rounded-[26px] border border-white/80 backdrop-blur-xl backdrop-saturate-150 transition-[width,box-shadow,background-color] duration-[440ms] ease-[cubic-bezier(.32,.72,0,1)] will-change-[width] [contain:layout_style] motion-reduce:transition-none ${
          expanded
            ? 'w-[260px] bg-white/95 shadow-[0_16px_48px_rgba(68,167,252,0.22)]'
            : 'w-[72px] bg-white/80 shadow-[0_8px_28px_rgba(68,167,252,0.12)]'
        }`}
      >
        {/* লোগো: সরু অবস্থায় V মার্ক, চওড়া অবস্থায় পুরো লোগো — একই বক্সে ক্রস-ফেড */}
        <div className="relative h-[76px] shrink-0">
          <span
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[opacity,transform] ease-out motion-reduce:transition-none ${
              expanded ? 'scale-90 opacity-0 duration-100' : 'scale-100 opacity-100 delay-150 duration-200'
            }`}
          >
            <BrandMark className="h-[30px] w-auto" />
          </span>
          <span
            className={`absolute left-[22px] top-1/2 -translate-y-1/2 transition-[opacity,transform] ease-out motion-reduce:transition-none ${
              expanded ? 'translate-x-0 opacity-100 delay-100 duration-300' : 'pointer-events-none -translate-x-2 opacity-0 duration-100'
            }`}
          >
            <BrandLogo className="h-[38px] w-auto" priority />
            <span className="mt-0.5 block pl-0.5 font-body text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#0F6FC6]">
              Admin Suite
            </span>
          </span>
        </div>

        {/* স্ক্রলবার লুকানো — নইলে সরু অবস্থায় ৪px জায়গা নিয়ে আইকন সরিয়ে দেয় */}
        <nav className="no-scrollbar flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-[9px] pb-2">
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.title} className={si > 0 ? 'mt-1' : ''}>
              <SectionLabel title={section.title} expanded={expanded} />
              <div className="space-y-1">
                {section.items.map((item) => (
                  <DesktopNavItem key={item.href} item={item} active={item.href === activeHref} expanded={expanded} />
                ))}
              </div>
            </div>
          ))}
          {/* লগআউট: আলাদা হাইলাইট ছাড়া মেনুর একদম শেষে — লাল রঙেই; ক্লিক করলে কনফার্মেশন আসে */}
          <div className="mt-1 pb-1">
            <button
              type="button"
              onClick={onLogout}
              aria-label="লগআউট"
              className="group flex h-[44px] w-full items-center overflow-hidden rounded-[14px] text-danger/80 transition-colors duration-200 hover:bg-red-50 hover:text-danger"
            >
              <span className={ICON_BOX}>
                <NavIcon className="h-5 w-5 group-hover:scale-110">
                  <LogoutIcon />
                </NavIcon>
              </span>
              <span className={labelCls(expanded)} style={staggerStyle(expanded, ALL_HREFS.length)}>
                লগআউট
              </span>
            </button>
          </div>
        </nav>
      </aside>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   মোবাইল লিকুইড গ্লাস ডক বার (<768px)
   ──────────────────────────────────────────────────────────────────────
   - ভাসমান কাঁচের ক্যাপসুল: ঝাপসা পেছন + গ্রেডিয়েন্ট রিম + উপরে স্পেকুলার শিন (globals.css)।
   - সক্রিয় ট্যাবের নিচে স্কাই-ব্লু কাঁচের "লেন্স" স্প্রিং-এ সরে; সরার সময় টানা-চ্যাপ্টা (squash & stretch)।
   - ট্যাবে চাপ দেওয়ার সাথে সাথেই লেন্স সরে যায় (পেজ লোডের অপেক্ষা করে না)।
   - মাঝের "+" = একটু উঁচুতে ভাসা কাঁচের গোলক (AI Planner)।
   ══════════════════════════════════════════════════════════════════════ */
function MobileDock({
  activeHref,
  menuOpen,
  onOpenMenu,
}: {
  activeHref: string;
  menuOpen: boolean;
  onOpenMenu: () => void;
}) {
  const routeSlot = DOCK_SLOTS.findIndex((s) => s.kind !== 'menu' && s.href === activeHref);

  // ট্যাপ করার মুহূর্তেই লেন্স সরানোর জন্য "আশাবাদী" স্লট; রুট বদলালে বা ১.৫ সেকেন্ড পর মুছে যায়
  const [pending, setPending] = useState<number | null>(null);
  useEffect(() => {
    setPending(null);
  }, [routeSlot]);
  useEffect(() => {
    if (pending === null) return;
    const t = setTimeout(() => setPending(null), 1500);
    return () => clearTimeout(t);
  }, [pending]);

  const activeSlot = menuOpen ? MENU_SLOT : pending ?? routeSlot;
  const lensVisible = activeSlot >= 0 && activeSlot !== ORB_SLOT;

  // লেন্স শেষ দৃশ্যমান অবস্থানে থাকে — লুকানো অবস্থায় বাম কোণে ছুটে যায় না
  const [lens, setLens] = useState(() => (lensVisible ? activeSlot : 0));
  const [moves, setMoves] = useState(0);
  const lensRef = useRef(lens);
  useEffect(() => {
    if (activeSlot >= 0 && activeSlot !== ORB_SLOT && activeSlot !== lensRef.current) {
      lensRef.current = activeSlot;
      setLens(activeSlot);
      setMoves((m) => m + 1);
    }
  }, [activeSlot]);

  const tabCls = (active: boolean) =>
    `relative z-10 flex h-[54px] flex-col items-center justify-center gap-[3px] rounded-full transition-[color,transform] duration-300 active:scale-90 motion-reduce:transition-none ${
      active ? 'text-white' : 'text-ink/60'
    }`;

  const iconCls = (active: boolean) =>
    `h-[22px] w-[22px] transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${active ? '-translate-y-px scale-105' : ''}`;

  return (
    <nav
      aria-label="নিচের মেনু"
      className="liquid-glass-bar fixed left-1/2 z-40 w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 rounded-full p-1.5 md:hidden"
      style={{ bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="relative z-10 grid grid-cols-5 items-center">
        {/* লেন্স: বাইরের স্তর সরে (স্প্রিং), ভেতরের স্তর সরার সময় টানা-চ্যাপ্টা হয় */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 transition-[transform,opacity] duration-[560ms] ease-[cubic-bezier(.34,1.4,.5,1)] motion-reduce:transition-none ${
            lensVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ width: 'calc(100% / 5)', transform: `translateX(${lens * 100}%)` }}
        >
          <span
            key={moves}
            data-moved={moves > 0}
            className="liquid-glass-lens absolute inset-y-0 inset-x-[3px] rounded-full"
          />
        </span>

        {DOCK_SLOTS.map((slot, i) => {
          if (slot.kind === 'menu') {
            return (
              <button
                key="menu"
                type="button"
                onClick={onOpenMenu}
                aria-label="মেনু খুলুন"
                aria-haspopup="dialog"
                aria-expanded={menuOpen}
                className={tabCls(menuOpen)}
              >
                <NavIcon className={iconCls(menuOpen)}>{slot.icon}</NavIcon>
                <span className="font-body text-[10px] font-extrabold leading-none">{slot.label}</span>
              </button>
            );
          }

          const active = i === (pending ?? routeSlot) && !menuOpen;

          if (slot.kind === 'orb') {
            return (
              <Link
                key="orb"
                href={slot.href as string}
                aria-label={slot.label}
                aria-current={i === routeSlot ? 'page' : undefined}
                onClick={() => i !== routeSlot && setPending(i)}
                className="relative z-10 flex h-[54px] items-center justify-center"
              >
                <span
                  data-active={active}
                  className="liquid-glass-orb flex h-[54px] w-[54px] -translate-y-[11px] items-center justify-center rounded-full transition-[transform,background,box-shadow] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] active:-translate-y-[8px] active:scale-90 motion-reduce:transition-none"
                >
                  <NavIcon className={`h-[24px] w-[24px] ${active ? 'text-white' : 'text-brand-light'}`}>{slot.icon}</NavIcon>
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={slot.href}
              href={slot.href as string}
              aria-current={i === routeSlot ? 'page' : undefined}
              onClick={() => i !== routeSlot && setPending(i)}
              className={tabCls(active)}
            >
              <NavIcon className={iconCls(active)}>{slot.icon}</NavIcon>
              <span className="font-body text-[10px] font-extrabold leading-none">{slot.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   মোবাইল মেনু ড্রয়ার — লিকুইড গ্লাস বটম শীট (z-[550]/[560])
   ══════════════════════════════════════════════════════════════════════ */
function MobileDrawer({
  open,
  onClose,
  activeHref,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  activeHref: string;
  onLogout: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; dy: number } | null>(null);

  // খোলা থাকলে পেছনের পেজ স্ক্রল লক + Esc দিয়ে বন্ধ
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // হ্যান্ডেল ধরে নিচে টেনে শিট বন্ধ (আঙুলের সাথে সাথে নামে; ১১০px পেরোলে বন্ধ, নইলে স্প্রিং-এ ফেরত)
  function onDragStart(e: React.PointerEvent<HTMLDivElement>) {
    const el = sheetRef.current;
    if (!el) return;
    drag.current = { startY: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    el.style.transition = 'none';
  }
  function onDragMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = sheetRef.current;
    if (!drag.current || !el) return;
    const dy = Math.max(0, e.clientY - drag.current.startY);
    drag.current.dy = dy;
    el.style.transform = `translateY(${dy}px)`;
  }
  function onDragEnd() {
    const el = sheetRef.current;
    if (!drag.current || !el) return;
    const { dy } = drag.current;
    drag.current = null;
    el.style.transition = '';
    if (dy > 110) {
      el.style.transform = 'translateY(100%)';
      onClose();
      setTimeout(() => {
        if (sheetRef.current) sheetRef.current.style.transform = '';
      }, 480);
    } else {
      el.style.transform = '';
    }
  }

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[550] bg-ink/35 backdrop-blur-[3px] transition-opacity duration-300 md:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="মেনু"
        inert={!open}
        className={`liquid-glass-sheet fixed inset-x-0 bottom-0 z-[560] flex max-h-[86dvh] flex-col overflow-hidden rounded-t-[32px] px-4 pt-3 transition-transform duration-[420ms] ease-[cubic-bezier(.32,.72,0,1)] md:hidden ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          className="-mt-3 flex h-8 shrink-0 cursor-grab touch-none items-center justify-center"
          aria-hidden="true"
        >
          <div className="h-1.5 w-12 rounded-full bg-ink/20" />
        </div>

        <div className="mb-2 flex shrink-0 items-center justify-between border-b border-border-base/50 px-1.5 pb-3">
          <div>
            <BrandLogo className="h-9 w-auto" />
            <span className="mt-0.5 block pl-0.5 font-body text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#0F6FC6]">
              Admin Suite
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="মেনু বন্ধ করুন"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/70 text-ink/70 shadow-sh1 transition-all duration-brand active:scale-90"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="sleek-scrollbar flex-1 overflow-y-auto overscroll-contain pb-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-3">
              <div className="mb-1.5 px-2.5 font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  if (!item.enabled) return null;
                  const active = item.href === activeHref;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-[48px] items-center gap-3 rounded-2xl px-2.5 py-1.5 font-body text-[13.5px] font-bold transition-all duration-brand active:scale-[0.98] ${
                        active
                          ? 'bg-brand-light text-white shadow-[0_6px_18px_rgba(68,167,252,0.38)]'
                          : 'text-ink/85 hover:bg-brand-light/10'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          active ? 'bg-white/25 text-white' : 'bg-brand-light/10 text-brand-light'
                        }`}
                      >
                        <NavIcon className="h-[19px] w-[19px]">{item.icon}</NavIcon>
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white"
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
            </div>
          ))}

          {/* লগআউট: আলাদা পিল নয়, মেনুর শেষে সাধারণ সারির মতো — লাল রঙে; ক্লিকে কনফার্মেশন */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="mb-1 flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-2.5 py-1.5 text-left font-body text-[13.5px] font-bold text-danger transition-all duration-brand hover:bg-red-50 active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-danger">
              <NavIcon className="h-[19px] w-[19px]">
                <LogoutIcon />
              </NavIcon>
            </span>
            <span className="flex-1">লগআউট</span>
          </button>
        </nav>

      </div>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const activeHref = useActiveHref();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutFormRef = useRef<HTMLFormElement>(null);
  const askLogout = useCallback(() => setConfirmLogout(true), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <DesktopSidebar activeHref={activeHref} onLogout={askLogout} />
      <MobileDock activeHref={activeHref} menuOpen={mobileOpen} onOpenMenu={() => setMobileOpen(true)} />
      <MobileDrawer open={mobileOpen} onClose={closeMobile} activeHref={activeHref} onLogout={askLogout} />

      {/* লুকানো ফর্ম — কনফার্ম করলে সার্ভার অ্যাকশন logout চলে */}
      <form ref={logoutFormRef} action={logout} className="hidden" />
      {confirmLogout && (
        <ConfirmDialog
          title="লগআউট করবেন?"
          message="আপনি এডমিন প্যানেল থেকে বেরিয়ে যাবেন। আবার ঢুকতে ইমেইল ও পাসওয়ার্ড লাগবে।"
          confirmLabel="হ্যাঁ, লগআউট"
          busyLabel="লগআউট হচ্ছে..."
          busy={loggingOut}
          tone="danger"
          onConfirm={() => {
            setLoggingOut(true);
            logoutFormRef.current?.requestSubmit();
          }}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
    </>
  );
}
