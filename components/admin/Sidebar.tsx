'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import PendingOrdersBadge from '@/components/admin/PendingOrdersBadge';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
}

// legacy admin.html-এর সাইডবার নেভ আইটেম লিস্ট থেকে হুবহু (লেবেল/অর্ডার) —
// যেসব মডিউল এখনো তৈরি হয়নি সেগুলো disabled রেখে "শীঘ্রই" ট্যাগ দেখানো
// হচ্ছে, যাতে পুরো নেভিগেশন কাঠামোটা শুরু থেকেই চেনা যায়।
const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'ড্যাশবোর্ড', enabled: true, icon: <line x1="18" y1="20" x2="18" y2="10" /> },
  { href: '/orders', label: 'অর্ডার', enabled: true, icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /> },
  { href: '/products', label: 'প্রোডাক্ট', enabled: true, icon: <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /> },
  { href: '/products/parser', label: 'AI Planner', enabled: true, icon: <rect x="4" y="4" width="16" height="16" rx="2" /> },
  { href: '/offers-mgmt', label: 'অফার পপআপ', enabled: false, icon: <path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z" /> },
  { href: '/customers', label: 'কাস্টমার', enabled: false, icon: <circle cx="9" cy="7" r="4" /> },
  { href: '/design/hero-cards', label: 'হিরো ক্যাটাগরি কার্ড', enabled: false, icon: <rect x="3" y="3" width="18" height="18" rx="2" /> },
  { href: '/design/categories', label: 'ক্যাটাগরি', enabled: false, icon: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /> },
  { href: '/design/footer', label: 'Footer ও লোগো', enabled: false, icon: <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /> },
  { href: '/review-gallery', label: 'রিভিউ গ্যালারি', enabled: false, icon: <rect x="3" y="3" width="18" height="18" rx="2" /> },
  { href: '/header-copy', label: 'হেডার টেক্সট', enabled: false, icon: <path d="M12 20h9" /> },
  { href: '/settings', label: 'সাধারণ', enabled: false, icon: <circle cx="12" cy="12" r="3" /> },
  { href: '/shipping-settings', label: 'শিপিং', enabled: false, icon: <rect x="1" y="3" width="15" height="13" /> },
  { href: '/faq-settings', label: 'FAQ', enabled: false, icon: <circle cx="12" cy="12" r="10" /> },
];

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px] shrink-0"
    >
      {children}
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[230px] shrink-0 flex-col border-r border-border-base bg-brand-surface">
      <div className="px-5 py-6">
        <div className="font-display text-lg text-brand-primary">Vangcur Admin</div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.enabled && (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)));
          if (!item.enabled) {
            return (
              <div
                key={item.href}
                className="flex cursor-not-allowed items-center gap-3 rounded-brand px-3 py-2 text-sm text-muted opacity-50"
                title="শীঘ্রই আসছে"
              >
                <NavIcon>{item.icon}</NavIcon>
                <span className="flex-1">{item.label}</span>
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold">শীঘ্রই</span>
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-brand px-3 py-2 text-sm font-medium transition-brand ${
                isActive
                  ? 'bg-brand-primary text-white'
                  : 'text-ink hover:bg-surface-muted'
              }`}
            >
              <NavIcon>{item.icon}</NavIcon>
              <span>{item.label}</span>
              {item.href === '/orders' && <PendingOrdersBadge />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-base p-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-brand px-3 py-2 text-sm font-medium text-ink transition-brand hover:bg-surface-muted"
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
    </aside>
  );
}
