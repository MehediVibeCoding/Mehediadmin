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

const TAB_ITEMS = [
  {
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
    href: '/customers',
    label: 'কাস্টমার',
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </>
    ),
  },
];

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

function LogoMark({ isExpanded }: { isExpanded: boolean }) {
  return (
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-light to-brand-primary text-white shadow-[0_4px_14px_rgba(68,167,252,0.38)]">
        <span className="font-body text-[20px] font-black tracking-tight">V</span>
      </div>
      <div
        className={`min-w-0 transition-all duration-300 ${
          isExpanded ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-3 w-0 pointer-events-none'
        }`}
      >
        <span className="block font-body text-[16px] font-black tracking-tight text-ink leading-tight">
          Vangcur
        </span>
        <span className="block font-body text-[9px] font-bold uppercase tracking-[1.8px] text-brand-light">
          Admin Suite
        </span>
      </div>
    </div>
  );
}

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'));
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const isActive = useIsActive();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ══ ডেস্কটপ এক্সপ্যান্ডেবল গ্লাস সাইডবার (≥768px) — ইমেজ ১ ইন্সপায়ারেশন ══ */}
      <div className="relative hidden md:block md:w-[76px] md:shrink-0">
        <aside
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`fixed left-3 top-3 bottom-3 z-50 flex flex-col overflow-hidden rounded-[26px] border border-white/80 bg-white/80 shadow-[0_8px_32px_rgba(68,167,252,0.12)] backdrop-blur-2xl transition-[width,box-shadow] duration-300 ease-[cubic-bezier(.4,0,.2,1)] ${
            isHovered
              ? 'w-[260px] shadow-[0_14px_45px_rgba(0,42,110,0.14)] bg-white/95'
              : 'w-[72px]'
          }`}
        >
          {/* লোগো ও হেডার */}
          <div className="flex h-16 items-center px-4 pt-1">
            <LogoMark isExpanded={isHovered} />
          </div>

          {/* মেনু লিস্ট */}
          <nav className="sleek-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 py-3">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="mb-2">
                {/* সেকশন হেডিং (এক্সপ্যান্ডেড মোডে দেখাবে) */}
                <div
                  className={`px-3 py-1 font-body text-[9.5px] font-extrabold uppercase tracking-wider text-muted/70 transition-all duration-200 ${
                    isHovered ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden py-0'
                  }`}
                >
                  {section.title}
                </div>

                <div className="space-y-1">
                  {section.items.map((item) => {
                    if (!item.enabled) {
                      return (
                        <div
                          key={item.href}
                          className={`flex h-[44px] items-center rounded-[14px] px-3 font-body text-[13px] font-medium text-muted/40 cursor-not-allowed ${
                            isHovered ? 'justify-start gap-3' : 'justify-center'
                          }`}
                          title={item.label}
                        >
                          <NavIcon className="h-5 w-5">{item.icon}</NavIcon>
                          {isHovered && (
                            <>
                              <span className="truncate flex-1">{item.label}</span>
                              <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted">
                                শীঘ্রই
                              </span>
                            </>
                          )}
                        </div>
                      );
                    }

                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={!isHovered ? item.label : undefined}
                        className={`group relative flex h-[44px] items-center rounded-[14px] transition-all duration-brand ${
                          isHovered ? 'justify-start gap-3 px-3.5' : 'justify-center px-0'
                        } ${
                          active
                            ? 'bg-gradient-to-r from-brand-light to-brand-primary text-white shadow-[0_4px_16px_rgba(68,167,252,0.35)]'
                            : 'text-ink/75 hover:bg-brand-bg/35 hover:text-brand-primary'
                        }`}
                      >
                        <NavIcon className={`h-5 w-5 ${active ? 'text-white' : 'text-ink/70 group-hover:text-brand-primary'}`}>
                          {item.icon}
                        </NavIcon>

                        {/* টেক্সট লেবেল (হোভার এক্সপ্যান্ডেড মোড) */}
                        <span
                          className={`whitespace-nowrap font-body text-[13px] font-bold tracking-tight transition-all duration-200 ${
                            isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden pointer-events-none'
                          }`}
                        >
                          {item.label}
                        </span>

                        {/* ব্যাজসমূহ */}
                        {isHovered && item.badge && (
                          <span
                            className="ml-auto rounded-full px-2 py-0.5 font-body text-[9.5px] font-extrabold text-white shadow-xs"
                            style={{ background: item.badge.bg }}
                          >
                            {item.badge.text}
                          </span>
                        )}

                        {item.href === '/orders' && (
                          <div className={isHovered ? 'ml-auto' : 'absolute right-2 top-2'}>
                            <PendingOrdersBadge active={active} />
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* লগআউট বাটন */}
          <div className="border-t border-border-base/60 p-2.5">
            <form action={logout}>
              <button
                type="submit"
                className={`group flex h-[42px] w-full items-center rounded-[14px] font-body text-[12.5px] font-bold text-danger/80 transition-all duration-brand hover:bg-red-50 hover:text-danger ${
                  isHovered ? 'justify-start gap-3 px-3.5' : 'justify-center px-0'
                }`}
                title={!isHovered ? 'লগআউট' : undefined}
              >
                <NavIcon className="h-5 w-5 text-danger/70 group-hover:text-danger">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </NavIcon>
                <span
                  className={`whitespace-nowrap transition-all duration-200 ${
                    isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden pointer-events-none'
                  }`}
                >
                  লগআউট
                </span>
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* ══ মোবাইল ফ্রস্টেড বটম ক্যাপসুল বার (<768px) — ইমেজ ৪ ও ৫ ইন্সপায়ারেশন ══ */}
      <div
        className="fixed bottom-3 left-1/2 z-[500] flex w-[calc(100%-20px)] max-w-[420px] -translate-x-1/2 items-center justify-between rounded-full border border-white/80 bg-white/90 p-1.5 shadow-[0_10px_35px_rgba(68,167,252,0.22)] backdrop-blur-2xl md:hidden"
        style={{ bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}
      >
        {TAB_ITEMS.slice(0, 2).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 transition-all duration-brand ${
                active ? 'bg-gradient-to-r from-brand-light to-brand-primary text-white shadow-xs' : 'text-ink/65 hover:text-brand-light'
              }`}
            >
              <NavIcon className="h-[19px] w-[19px]">{item.icon}</NavIcon>
              <span className="font-body text-[9px] font-bold">{item.label}</span>
            </Link>
          );
        })}

        {/* মাঝের এলিভেটেড ৩D সার্কেল বাটন (AI Planner) */}
        <Link
          href="/products/parser"
          aria-label="AI Planner"
          className="relative -mt-5 flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full border-[3.5px] border-white bg-gradient-to-tr from-brand-primary to-brand-light shadow-[0_8px_20px_rgba(68,167,252,0.45)] transition-transform duration-brand active:scale-90"
        >
          <NavIcon className="h-5 w-5 text-white">
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
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 transition-all duration-brand ${
                active ? 'bg-gradient-to-r from-brand-light to-brand-primary text-white shadow-xs' : 'text-ink/65 hover:text-brand-light'
              }`}
            >
              <NavIcon className="h-[19px] w-[19px]">{item.icon}</NavIcon>
              <span className="font-body text-[9px] font-bold">{item.label}</span>
            </Link>
          );
        })}

        {/* মেনু ড্রয়ার ট্রিগার বাটন */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-ink/65 transition-all duration-brand hover:text-brand-light"
        >
          <NavIcon className="h-[19px] w-[19px]">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </NavIcon>
          <span className="font-body text-[9px] font-bold">মেনু</span>
        </button>
      </div>

      {/* ══ মোবাইল ব্যাকড্রপ ওভারলে ও ফ্রস্টেড স্লাইড-আপ ড্রয়ার ══ */}
      <div
        className={`fixed inset-0 z-[550] bg-ink/40 backdrop-blur-[3px] transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <div
        className={`fixed inset-x-0 bottom-0 z-[560] flex max-h-[85vh] flex-col overflow-hidden rounded-t-[32px] border-t border-white/80 bg-white/95 px-4 pt-3 pb-6 shadow-[0_-14px_45px_rgba(0,18,41,0.18)] backdrop-blur-2xl transition-transform duration-[380ms] ease-[cubic-bezier(.32,.72,0,1)] md:hidden ${
          mobileOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 shrink-0 rounded-full bg-muted/20" />

        <div className="mb-3 flex items-center justify-between px-2 pb-2 border-b border-border-base/50">
          <LogoMark isExpanded={true} />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-ink/70 hover:bg-border-base"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="sleek-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-1 pb-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-3">
              <div className="mb-1.5 px-3 font-body text-[10px] font-extrabold uppercase tracking-wider text-muted">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  if (!item.enabled) return null;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-body text-[13px] font-bold transition-all duration-brand ${
                        active
                          ? 'bg-gradient-to-r from-brand-light to-brand-primary text-white shadow-xs'
                          : 'text-ink/80 hover:bg-surface-muted'
                      }`}
                    >
                      <NavIcon className={`h-5 w-5 ${active ? 'text-white' : 'text-ink/65'}`}>
                        {item.icon}
                      </NavIcon>
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

        <div className="border-t border-border-base/60 pt-2">
          <form action={logout} onClick={() => setMobileOpen(false)}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 font-body text-[13px] font-bold text-danger transition-colors hover:bg-red-100"
            >
              <NavIcon className="h-4 w-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </NavIcon>
              লগআউট
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
