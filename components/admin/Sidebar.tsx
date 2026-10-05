'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
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
  'group relative flex h-[44px] w-full items-center overflow-hidden rounded-[14px] transition-[background-color,color,box-shadow] duration-200';

function labelCls(expanded: boolean) {
  return `shrink-0 whitespace-nowrap font-body text-[13px] font-bold tracking-tight transition-[opacity,transform] ease-out ${
    expanded ? 'translate-x-0 opacity-100 delay-100 duration-200' : '-translate-x-2 opacity-0 duration-100'
  }`;
}

function fadeCls(expanded: boolean) {
  return `transition-opacity duration-150 ${expanded ? 'opacity-100 delay-100' : 'opacity-0'}`;
}

function DesktopNavItem({ item, active, expanded }: { item: NavItem; active: boolean; expanded: boolean }) {
  if (!item.enabled) {
    return (
      <div aria-disabled="true" className={`${ITEM_BASE} cursor-not-allowed text-muted/45`}>
        <span className={ICON_BOX}>
          <NavIcon className="h-5 w-5">{item.icon}</NavIcon>
        </span>
        <span className={labelCls(expanded)}>{item.label}</span>
        <span
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
          ? 'bg-brand-light text-white shadow-[0_4px_16px_rgba(68,167,252,0.35)]'
          : 'text-ink/75 hover:bg-brand-light/10 hover:text-ink'
      }`}
    >
      <span className={ICON_BOX}>
        <NavIcon className={`h-5 w-5 group-hover:scale-110 ${active ? '' : 'group-hover:text-brand-light'}`}>
          {item.icon}
        </NavIcon>
      </span>

      <span className={labelCls(expanded)}>{item.label}</span>

      {item.badge && (
        <span
          className={`ml-auto mr-3 shrink-0 rounded-full px-2 py-0.5 font-body text-[9.5px] font-extrabold text-white ${fadeCls(expanded)}`}
          style={{ background: item.badge.bg }}
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
        className={`absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center transition-opacity duration-150 ${
          expanded ? 'opacity-0' : 'opacity-100 delay-100'
        }`}
      >
        <span className="h-px w-6 rounded-full bg-border-base" />
      </span>
      <span
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 whitespace-nowrap font-body text-[9.5px] font-extrabold uppercase tracking-wider text-muted transition-opacity duration-200 ${
          expanded ? 'opacity-100 delay-100' : 'opacity-0'
        }`}
      >
        {title}
      </span>
    </div>
  );
}

function DesktopSidebar({ activeHref }: { activeHref: string }) {
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
        onFocusCapture={open}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
        }}
        className={`fixed bottom-3 left-3 top-3 z-50 flex flex-col overflow-hidden rounded-[26px] border border-white/80 backdrop-blur-2xl transition-[width,box-shadow,background-color] duration-[380ms] ease-[cubic-bezier(.22,1,.36,1)] will-change-[width] ${
          expanded
            ? 'w-[260px] bg-white/95 shadow-[0_14px_45px_rgba(68,167,252,0.20)]'
            : 'w-[72px] bg-white/80 shadow-[0_8px_32px_rgba(68,167,252,0.12)]'
        }`}
      >
        {/* লোগো: সরু অবস্থায় V মার্ক, চওড়া অবস্থায় পুরো লোগো — একই বক্সে ক্রস-ফেড */}
        <div className="relative h-[76px] shrink-0">
          <span
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[opacity,transform] duration-200 ease-out ${
              expanded ? 'scale-90 opacity-0' : 'scale-100 opacity-100 delay-100'
            }`}
          >
            <BrandMark className="h-[30px] w-auto" />
          </span>
          <span
            className={`absolute left-[22px] top-1/2 -translate-y-1/2 transition-[opacity,transform] duration-200 ease-out ${
              expanded ? 'translate-x-0 opacity-100 delay-100' : 'pointer-events-none -translate-x-2 opacity-0'
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
        </nav>

        <div className="shrink-0 border-t border-border-base/60 p-[9px]">
          <form action={logout}>
            <button
              type="submit"
              aria-label="লগআউট"
              className="group flex h-[44px] w-full items-center overflow-hidden rounded-[14px] text-danger/80 transition-colors duration-200 hover:bg-red-50 hover:text-danger"
            >
              <span className={ICON_BOX}>
                <NavIcon className="h-5 w-5 group-hover:scale-110">
                  <LogoutIcon />
                </NavIcon>
              </span>
              <span className={labelCls(expanded)}>লগআউট</span>
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   মোবাইল লিকুইড গ্লাস ডক বার (<768px)
   ──────────────────────────────────────────────────────────────────────
   - ৫টা সমান কলাম; সক্রিয় ট্যাবের নিচে স্কাই-ব্লু "লেন্স" ফোঁটা স্প্রিং-এর মতো সরে যায়।
   - মাঝের "+" = কাঁচের অর্ব (AI Planner); সক্রিয় হলে সলিড স্কাই।
   - মেনু ড্রয়ার খোলা থাকলে লেন্স "মেনু"-তে যায়।
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
  const activeSlot = menuOpen ? MENU_SLOT : routeSlot;
  const lensVisible = activeSlot >= 0 && activeSlot !== ORB_SLOT;

  // লেন্স শেষ দৃশ্যমান অবস্থানে থাকে — লুকানো অবস্থায় বাম কোণে ছুটে যায় না
  const [lens, setLens] = useState(() => (lensVisible ? activeSlot : 0));
  useEffect(() => {
    if (activeSlot >= 0 && activeSlot !== ORB_SLOT) setLens(activeSlot);
  }, [activeSlot]);

  const tabCls = (active: boolean) =>
    `relative z-10 flex h-[54px] flex-col items-center justify-center gap-[3px] rounded-full transition-[color,transform] duration-300 active:scale-90 ${
      active ? 'text-white' : 'text-ink/70'
    }`;

  return (
    <nav
      aria-label="নিচের মেনু"
      className="liquid-glass-bar fixed left-1/2 z-40 w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 rounded-full p-1.5 md:hidden"
      style={{ bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="relative grid grid-cols-5 items-center">
        <span
          aria-hidden="true"
          className={`liquid-glass-lens pointer-events-none inset-y-0 left-0 rounded-full transition-[transform,opacity] duration-[520ms] ease-[cubic-bezier(.34,1.45,.5,1)] ${
            lensVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ width: 'calc(100% / 5)', transform: `translateX(${lens * 100}%)` }}
        />

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
                <NavIcon className="h-[22px] w-[22px]">{slot.icon}</NavIcon>
                <span className="font-body text-[10px] font-extrabold leading-none">{slot.label}</span>
              </button>
            );
          }

          const active = i === routeSlot && !menuOpen;

          if (slot.kind === 'orb') {
            return (
              <Link
                key="orb"
                href={slot.href as string}
                aria-label={slot.label}
                aria-current={active ? 'page' : undefined}
                className="relative z-10 flex h-[54px] items-center justify-center transition-transform duration-200 active:scale-90"
              >
                <span
                  data-active={active}
                  className="liquid-glass-orb flex h-[48px] w-[48px] items-center justify-center rounded-full transition-all duration-300"
                >
                  <NavIcon className={`h-[22px] w-[22px] ${active ? 'text-white' : 'text-brand-light'}`}>{slot.icon}</NavIcon>
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={slot.href}
              href={slot.href as string}
              aria-current={active ? 'page' : undefined}
              className={tabCls(active)}
            >
              <NavIcon className="h-[22px] w-[22px]">{slot.icon}</NavIcon>
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
function MobileDrawer({ open, onClose, activeHref }: { open: boolean; onClose: () => void; activeHref: string }) {
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
        role="dialog"
        aria-modal="true"
        aria-label="মেনু"
        inert={!open}
        className={`liquid-glass-sheet fixed inset-x-0 bottom-0 z-[560] flex max-h-[86dvh] flex-col overflow-hidden rounded-t-[32px] px-4 pt-3 transition-transform duration-[420ms] ease-[cubic-bezier(.32,.72,0,1)] md:hidden ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 shrink-0 rounded-full bg-ink/15" />

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
        </nav>

        <div className="shrink-0 border-t border-border-base/50 pt-3">
          <form action={logout}>
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-red-200/80 bg-red-50 font-body text-[13.5px] font-extrabold text-danger transition-all duration-brand active:scale-[0.98]"
            >
              <NavIcon className="h-[18px] w-[18px]">
                <LogoutIcon />
              </NavIcon>
              লগআউট
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const activeHref = useActiveHref();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <DesktopSidebar activeHref={activeHref} />
      <MobileDock activeHref={activeHref} menuOpen={mobileOpen} onOpenMenu={() => setMobileOpen(true)} />
      <MobileDrawer open={mobileOpen} onClose={closeMobile} activeHref={activeHref} />
    </>
  );
}
