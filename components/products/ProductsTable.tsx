'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ProductListRow } from '@/types';
import type { CategoryCounts } from '@/app/actions/products';
import type { CategoryOption } from '@/lib/constants/categories';
import { deleteProduct, moveProductToEdge, moveProductToPosition, reorderProducts, updateBadge, updateStock } from '@/app/actions/products';
import QuickEditPopover from './QuickEditPopover';
import GuidePagesListModal from '@/components/guides/GuidePagesListModal';
import Pagination from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';
import { notifyCatalogSyncCheck } from '@/lib/catalogSyncEvent';
import { badgeColorClass } from '@/lib/badgeStyle';

interface Props {
  rows: ProductListRow[]; // বর্তমান পেজের সারি — সার্ভার থেকে আগেই সার্চ/ক্যাটাগরি/পেজ করা
  total: number; // বর্তমান ফিল্টারে মোট প্রোডাক্ট (পেজিনেশনের জন্য)
  page: number;
  pageSize: number;
  loading: boolean;
  query: string;
  catFilter: string;
  counts: CategoryCounts; // ক্যাটাগরি চিপের সংখ্যা (সব প্রোডাক্ট থেকে, ফিল্টার-নিরপেক্ষ)
  categories: CategoryOption[];
  onQueryChange: (q: string) => void;
  onCatChange: (cat: string) => void;
  onPageChange: (p: number) => void;
  onEdit: (id: number) => void;
  onAdd: () => void;
  onReordered: (rows: ProductListRow[]) => void; // ড্র্যাগ-সর্ট সফল হলে, নতুন ক্রম
  onChanged: () => void; // কুইক-এডিট/ডিলিটের পর পেরেন্টকে পুরো পেজ+গণনা রিফ্রেশ করতে বলা
}

const money = (n: number) => '৳' + (n || 0).toLocaleString('en-US');

const ICON = {
  className: 'h-[17px] w-[17px]',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.1,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

function GripIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <circle cx="9" cy="6" r="1.7" />
      <circle cx="15" cy="6" r="1.7" />
      <circle cx="9" cy="12" r="1.7" />
      <circle cx="15" cy="12" r="1.7" />
      <circle cx="9" cy="18" r="1.7" />
      <circle cx="15" cy="18" r="1.7" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg {...ICON} className="h-[14px] w-[14px]">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg {...ICON}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

function GuideIcon() {
  return (
    <svg {...ICON}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  );
}

function Thumb({ src, size }: { src: string; size: number }) {
  const isImgUrl = typeof src === 'string' && (src.startsWith('http') || src.startsWith('/'));
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border-base/70 bg-brand-light/10"
      style={{ width: size, height: size }}
    >
      {isImgUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.5 }} className="leading-none">
          {src}
        </span>
      )}
    </div>
  );
}

function StockPill({ stock }: { stock: number }) {
  const cls =
    stock === 0
      ? 'bg-red-50 text-danger'
      : stock <= 5
        ? 'bg-amber-50 text-[#92400E]'
        : 'bg-emerald-50 text-[#065F46]';
  const dot = stock === 0 ? 'bg-danger' : stock <= 5 ? 'bg-amber-500' : 'bg-success';
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-body text-[11.5px] font-extrabold leading-none ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {stock === 0 ? 'Sold Out' : `${stock} পিস`}
    </span>
  );
}

function BadgeChip({ badge }: { badge?: string | null }) {
  return badge ? (
    <span className={`inline-flex whitespace-nowrap rounded-full ${badgeColorClass(badge)} px-2.5 py-1 font-body text-[11px] font-extrabold leading-none`}>
      {badge}
    </span>
  ) : (
    <span className="font-body text-[12px] font-semibold text-muted">নেই</span>
  );
}


const BADGE_OPTIONS = ['HOT', 'NEW', 'SALE', 'OFFER'];

function SmallChevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-[11px] w-[11px]">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <circle cx="5.5" cy="12" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="18.5" cy="12" r="1.9" />
    </svg>
  );
}

function MiniIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-[15px] w-[15px] shrink-0">
      {children}
    </svg>
  );
}

// চিপ + ছোট ▾ — পুরোটাই একটা বাটন, চাপলে ছোট মেনু খোলে
function ChipDropdown({ onClick, title, open, children }: { onClick: (el: HTMLElement) => void; title: string; open: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={(e) => onClick(e.currentTarget)}
      title={title}
      aria-label={title}
      aria-expanded={open}
      className="group/dd inline-flex items-center gap-1.5 rounded-full transition-all duration-brand active:scale-95"
    >
      {children}
      <span
        className={`flex h-[22px] w-[22px] items-center justify-center rounded-full transition-colors duration-brand ${
          open ? 'bg-brand-light text-white' : 'bg-surface-muted text-muted group-hover/dd:bg-brand-light/15 group-hover/dd:text-brand-light'
        }`}
      >
        <SmallChevron />
      </span>
    </button>
  );
}

const MENU_ROW = 'flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-left font-body text-[12.5px] font-extrabold transition-colors disabled:opacity-40';

function BadgeQuickMenu({ current, busy, onSave, onClear, onCancel }: { current: string; busy: boolean; onSave: (v: string) => void; onClear: () => void; onCancel: () => void }) {
  const cur = (current || '').toUpperCase();
  const [pick, setPick] = useState(BADGE_OPTIONS.includes(cur) ? cur : '');
  return (
    <>
      <div className="px-2.5 pb-1 pt-1.5 font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">ব্যাজ বাছুন</div>
      <div className="grid grid-cols-2 gap-1.5 px-1 pb-1">
        {BADGE_OPTIONS.map((b) => {
          const active = pick === b;
          return (
            <button
              key={b}
              type="button"
              onClick={() => setPick(b)}
              className={`flex h-9 items-center justify-center gap-1 rounded-xl font-body text-[12px] font-black transition-all duration-brand active:scale-95 ${
                active ? `${badgeColorClass(b)} shadow-sh1` : 'bg-surface-muted text-ink hover:bg-brand-light/10'
              }`}
            >
              {active && (
                <MiniIcon>
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </MiniIcon>
              )}
              {b}
            </button>
          );
        })}
      </div>
      <div className="my-1 h-px bg-border-base/60" />
      <button type="button" disabled={busy || !current} onClick={onClear} className={`${MENU_ROW} text-danger hover:bg-red-50`}>
        <MiniIcon>
          <path d="M18 6 6 18M6 6l12 12" />
        </MiniIcon>
        ব্যাজ মোচন
      </button>
      <button type="button" disabled={busy || !pick || pick === cur} onClick={() => onSave(pick)} className={`${MENU_ROW} text-brand-light hover:bg-brand-light/10`}>
        <MiniIcon>
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </MiniIcon>
        {busy ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
      </button>
      <button type="button" onClick={onCancel} className={`${MENU_ROW} text-muted hover:bg-surface-muted`}>
        <MiniIcon>
          <path d="M9 14 4 9l5-5" />
          <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
        </MiniIcon>
        বাতিল করুন
      </button>
    </>
  );
}

function StockQuickMenu({ current, busy, onSave, onCancel, onHistory }: { current: number; busy: boolean; onSave: (n: number) => void; onCancel: () => void; onHistory: () => void }) {
  const [v, setV] = useState(String(current));
  const [err, setErr] = useState('');
  const bump = (d: number) => {
    const n = parseInt(v);
    setV(String(Math.max(0, (isNaN(n) ? 0 : n) + d)));
    setErr('');
  };
  const submit = () => {
    const n = parseInt(v);
    if (isNaN(n) || n < 0) {
      setErr('সঠিক স্টক সংখ্যা দিন');
      return;
    }
    onSave(n);
  };
  return (
    <>
      <div className="flex items-center justify-between px-2.5 pb-1 pt-1.5 font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">
        <span>স্টক সংখ্যা</span>
        <span className="normal-case tracking-normal">এখন {current} পিস</span>
      </div>
      <div className="flex items-center gap-1.5 px-1 pb-1">
        <button type="button" onClick={() => bump(-1)} aria-label="স্টক কমান" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-base bg-white text-ink transition-all duration-brand active:scale-90">
          <MiniIcon>
            <path d="M5 12h14" />
          </MiniIcon>
        </button>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          autoFocus
          value={v}
          onChange={(e) => {
            setV(e.target.value);
            setErr('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          className="h-9 min-w-0 flex-1 rounded-full border border-border-base bg-white text-center font-body text-[14px] font-black text-ink outline-none focus:border-brand-light"
        />
        <button type="button" onClick={() => bump(1)} aria-label="স্টক বাড়ান" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-light/35 bg-brand-light/10 text-brand-light transition-all duration-brand active:scale-90">
          <MiniIcon>
            <path d="M12 5v14M5 12h14" />
          </MiniIcon>
        </button>
      </div>
      {err && <div className="px-2.5 pb-1 font-body text-[11px] font-bold text-danger">{err}</div>}
      <div className="my-1 h-px bg-border-base/60" />
      <button type="button" disabled={busy} onClick={submit} className={`${MENU_ROW} text-brand-light hover:bg-brand-light/10`}>
        <MiniIcon>
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </MiniIcon>
        {busy ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
      </button>
      <button type="button" onClick={onCancel} className={`${MENU_ROW} text-muted hover:bg-surface-muted`}>
        <MiniIcon>
          <path d="M9 14 4 9l5-5" />
          <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
        </MiniIcon>
        বাতিল করুন
      </button>
      <button type="button" onClick={onHistory} className={`${MENU_ROW} text-ink/70 hover:bg-surface-muted`}>
        <MiniIcon>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </MiniIcon>
        স্টক হিস্ট্রি দেখুন
      </button>
    </>
  );
}

type MenuState = { kind: 'badge' | 'stock' | 'actions'; row: ProductListRow; top?: number; bottom?: number; left?: number; right?: number };

function ChevronUpIcon() {
  return (
    <svg {...ICON} strokeWidth={2.6} className="h-[15px] w-[15px]">
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}

function ArrowEdgeIcon({ dir }: { dir: 'up' | 'down' }) {
  return (
    <svg {...ICON} className="h-[15px] w-[15px]">
      {dir === 'up' ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M19 12l-7 7-7-7" />}
    </svg>
  );
}

// স্টক/ব্যাজ পিল নিজেই বাটন — চাপলে কুইক-এডিট খোলে; ডেস্কটপে পেন্সিল শুধু হোভারে দেখা যায়
function ChipButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="group/chip inline-flex items-center gap-1 rounded-full transition-all duration-brand hover:ring-2 hover:ring-brand-light/30 active:scale-95"
    >
      {children}
      <span className="-ml-0.5 text-brand-light opacity-70 transition-opacity lg:opacity-0 lg:group-hover/chip:opacity-100 lg:group-hover/row:opacity-60 lg:group-hover/chip:group-hover/row:opacity-100">
        <PencilIcon />
      </span>
    </button>
  );
}

// 🆕 পেজ-নিরপেক্ষ reorder কন্ট্রোল — ড্র্যাগ শুধু বর্তমান পেজের মধ্যেই কাজ করে, তাই
// শেষ পেজের কোনো প্রোডাক্টকে একদম প্রথম পেজের শুরুতে আনতে এই বাটন/ইনপুট দরকার।
function PositionControls({
  busy,
  onEdge,
  onPosition,
}: {
  busy: boolean;
  onEdge: (edge: 'top' | 'bottom') => void;
  onPosition: (position: number) => void;
}) {
  const [posInput, setPosInput] = useState('');
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onEdge('top')}
        disabled={busy}
        title="একদম উপরে আনুন"
        className="flex h-8 items-center gap-1 rounded-full border border-border-base bg-white px-2.5 font-body text-[11px] font-extrabold text-ink transition-all duration-brand active:scale-95 disabled:opacity-40"
      >
        <ArrowEdgeIcon dir="up" /> উপরে
      </button>
      <button
        type="button"
        onClick={() => onEdge('bottom')}
        disabled={busy}
        title="একদম নিচে আনুন"
        className="flex h-8 items-center gap-1 rounded-full border border-border-base bg-white px-2.5 font-body text-[11px] font-extrabold text-ink transition-all duration-brand active:scale-95 disabled:opacity-40"
      >
        <ArrowEdgeIcon dir="down" /> নিচে
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(posInput);
          if (Number.isFinite(n) && n >= 1) {
            onPosition(n);
            setPosInput('');
          }
        }}
        className="flex items-center gap-1"
      >
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={posInput}
          onChange={(e) => setPosInput(e.target.value)}
          placeholder="পজিশন #"
          disabled={busy}
          className="h-8 w-[76px] rounded-full border border-border-base bg-white px-2.5 font-body text-[11.5px] font-bold text-ink outline-none focus:border-brand-light disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={busy || !posInput}
          title="এই পজিশনে বসান"
          className="flex h-8 items-center rounded-full bg-brand-light px-3 font-body text-[11px] font-extrabold text-white transition-all duration-brand active:scale-95 disabled:opacity-40"
        >
          বসান
        </button>
      </form>
    </div>
  );
}

function MenuPositionForm({ busy, onPosition }: { busy: boolean; onPosition: (position: number) => void }) {
  const [v, setV] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(v);
        if (Number.isFinite(n) && n >= 1) onPosition(n);
      }}
      className="flex items-center gap-1.5 px-1 pb-0.5 pt-1"
    >
      <input
        type="number"
        min={1}
        inputMode="numeric"
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="পজিশন #"
        disabled={busy}
        className="h-9 min-w-0 flex-1 rounded-full border border-border-base bg-white px-3.5 font-body text-[12px] font-bold text-ink outline-none focus:border-brand-light disabled:opacity-40"
      />
      <button
        type="submit"
        disabled={busy || !v}
        className="flex h-9 items-center rounded-full bg-brand-light px-3.5 font-body text-[12px] font-extrabold text-white transition-all duration-brand active:scale-95 disabled:opacity-40"
      >
        বসান
      </button>
    </form>
  );
}

export default function ProductsTable({
  rows,
  total,
  page,
  pageSize,
  loading,
  query,
  catFilter,
  counts,
  categories,
  onQueryChange,
  onCatChange,
  onPageChange,
  onEdit,
  onAdd,
  onReordered,
  onChanged,
}: Props) {
  const { showToast } = useToast();
  const [popover, setPopover] = useState<{ row: ProductListRow; kind: 'stock' | 'badge' } | null>(null);
  const [guidePagesFor, setGuidePagesFor] = useState<ProductListRow | null>(null);
  const [deleting, setDeleting] = useState<{ row: ProductListRow; busy: boolean } | null>(null);
  const [dragOrder, setDragOrder] = useState<number[] | null>(null); // বর্তমান পেজের rows-এর id, ড্র্যাগ চলাকালীন লাইভ অর্ডার
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set()); // মোবাইল কার্ডে "সবকিছু দেখুন" খোলা প্রোডাক্টগুলো
  const [movingId, setMovingId] = useState<number | null>(null); // 🆕 উপরে/নিচে/পজিশন — কোন প্রোডাক্টের অনুরোধ চলছে
  const dragState = useRef<{ id: number } | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null); // ডেস্কটপ: ব্যাজ/স্টক/⋯ ছোট মেনু
  const [menuBusy, setMenuBusy] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement | null)?.closest('[data-row-menu]')) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  function openMenu(kind: MenuState['kind'], row: ProductListRow, btn: HTMLElement) {
    if (menu && menu.kind === kind && menu.row.id === row.id) {
      setMenu(null);
      return;
    }
    const r = btn.getBoundingClientRect();
    const estHeight = kind === 'actions' ? 330 : kind === 'stock' ? 290 : 270;
    const up = r.bottom + estHeight > window.innerHeight;
    const vertical = up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 };
    if (kind === 'actions') setMenu({ kind, row, ...vertical, right: Math.max(8, window.innerWidth - r.right) });
    else setMenu({ kind, row, ...vertical, left: Math.min(Math.max(8, r.left - 6), window.innerWidth - 232) });
  }

  async function saveStockFromMenu(row: ProductListRow, n: number) {
    setMenuBusy(true);
    const res = await updateStock(row.id, n);
    notifyCatalogSyncCheck();
    setMenuBusy(false);
    if (!res.ok) {
      showToast('❌ সেভ ব্যর্থ: ' + (res.message || 'error'));
      return;
    }
    setMenu(null);
    showToast('✅ সেভ হয়েছে');
    onChanged();
  }

  async function saveBadgeFromMenu(row: ProductListRow, value: string) {
    setMenuBusy(true);
    const res = await updateBadge(row.id, value);
    notifyCatalogSyncCheck();
    setMenuBusy(false);
    if (!res.ok) {
      showToast('❌ সেভ ব্যর্থ: ' + (res.message || 'error'));
      return;
    }
    setMenu(null);
    showToast(value ? '✅ ব্যাজ সেভ হয়েছে' : '✅ ব্যাজ সরানো হয়েছে');
    onChanged();
  }

  const catNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c) => (m[c.id] = c.name));
    return m;
  }, [categories]);

  const rowById = useMemo(() => new Map(rows.map((p) => [p.id, p])), [rows]);
  // ড্র্যাগ চলাকালীন dragOrder অনুযায়ী বর্তমান পেজের সারি সাজানো দেখানো হয়
  const pageItems = dragOrder ? (dragOrder.map((id) => rowById.get(id)).filter(Boolean) as ProductListRow[]) : rows;

  const chips: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'সব', count: counts.all },
    ...categories.filter((c) => c.id !== 'all').map((c) => ({ id: c.id, label: c.name, count: counts.byCat[c.id] || 0 })),
  ];

  const hasFilters = !!query || catFilter !== 'all';

  function clearFilters() {
    onQueryChange('');
    onCatChange('all');
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleting({ ...deleting, busy: true });
    const res = await deleteProduct(deleting.row.id);
    notifyCatalogSyncCheck();
    if (!res.ok) {
      setDeleting(null);
      showToast('❌ ডিলিট ব্যর্থ: ' + (res.message || 'error'));
      return;
    }
    setDeleting(null);
    showToast('🗑 প্রোডাক্ট মুছে ফেলা হয়েছে');
    onChanged();
  }

  async function handleQuickSave(value: string | number) {
    if (!popover) return;
    const res =
      popover.kind === 'stock'
        ? await updateStock(popover.row.id, Number(value))
        : await updateBadge(popover.row.id, String(value));
    notifyCatalogSyncCheck();
    if (!res.ok) {
      showToast('❌ সেভ ব্যর্থ: ' + (res.message || 'error'));
      return;
    }
    setPopover(null);
    showToast('✅ সেভ হয়েছে');
    onChanged();
  }

  // ── Drag-sort (pointer events — mouse + touch দুটোতেই কাজ করে) ──
  // 🚀 (প্রোডাক্ট লিস্ট স্কেল ফিক্স): শুধু বর্তমান পেজে দৃশ্যমান row-গুলোর মধ্যে reorder হয়।
  // এই পেজের sort_order মানগুলো (যেগুলো আগে থেকেই আগের/পরের পেজের মানের মাঝে বসানো আছে)
  // নতুন ক্রমে পুনর্বিন্যাস করে পাঠানো হয় — তাই সার্ভারে শুধু এই কয়েকটা সারিই আপডেট হয়,
  // বাকি হাজার হাজার প্রোডাক্ট পুরোপুরি অক্ষত থাকে।
  function handlePointerDown(id: number, e: React.PointerEvent<HTMLElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { id };
    setDraggingId(id);
    setDragOrder(rows.map((p) => p.id));
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState.current || !dragOrder) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const row = el?.closest('[data-prod-row]') as HTMLElement | null;
    if (!row) return;
    const targetId = Number(row.dataset.prodRow);
    if (targetId === dragState.current.id) return;
    const srcIdx = dragOrder.indexOf(dragState.current.id);
    const targetIdx = dragOrder.indexOf(targetId);
    if (srcIdx < 0 || targetIdx < 0) return;
    const next = [...dragOrder];
    const [moved] = next.splice(srcIdx, 1);
    next.splice(targetIdx, 0, moved);
    setDragOrder(next);
  }

  async function handlePointerUp() {
    if (!dragState.current || !dragOrder) {
      dragState.current = null;
      setDraggingId(null);
      return;
    }
    dragState.current = null;
    setDraggingId(null);
    // এই পেজের বিদ্যমান sort_order মানগুলো (ছোট থেকে বড়) নতুন ক্রমে বসিয়ে দেওয়া —
    // মান নিজেই পুরনো, শুধু কোন id কোন মান পাচ্ছে সেটা বদলাচ্ছে
    const sortedValues = rows.map((p) => p.sort_order).sort((a, b) => a - b);
    const updates = dragOrder.map((id, i) => ({ id, sort_order: sortedValues[i] }));
    const res = await reorderProducts(updates);
    notifyCatalogSyncCheck();
    if (!res.ok) {
      showToast('❌ সাজানো সেভ ব্যর্থ: ' + (res.message || 'error'));
      setDragOrder(null);
      return;
    }
    const sortOrderById = new Map(updates.map((u) => [u.id, u.sort_order]));
    const newRows = dragOrder.map((id) => {
      const r = rowById.get(id)!;
      return { ...r, sort_order: sortOrderById.get(id) ?? r.sort_order };
    });
    setDragOrder(null);
    onReordered(newRows);
  }

  // ব্রাউজার ড্র্যাগ বাতিল করলে (যেমন টাচ স্ক্রল) — সেভ না করে সাজানো ফিরিয়ে দাও
  function handlePointerCancel() {
    dragState.current = null;
    setDraggingId(null);
    setDragOrder(null);
  }

  // 🆕 পেজ-নিরপেক্ষ reorder: একদম উপরে/নিচে আনা, অথবা নির্দিষ্ট পজিশন নম্বরে বসানো —
  // ড্র্যাগের মতো শুধু বর্তমান পেজে আটকে থাকে না, পুরো ক্যাটালগ জুড়ে কাজ করে।
  async function handleMoveToEdge(id: number, edge: 'top' | 'bottom') {
    setMovingId(id);
    const res = await moveProductToEdge(id, edge);
    notifyCatalogSyncCheck();
    setMovingId(null);
    if (!res.ok) {
      showToast('❌ সরানো ব্যর্থ: ' + (res.message || 'error'));
      return;
    }
    showToast(edge === 'top' ? '⬆️ একদম উপরে আনা হয়েছে' : '⬇️ একদম নিচে আনা হয়েছে');
    onChanged();
  }

  async function handleMoveToPosition(id: number, position: number) {
    setMovingId(id);
    const res = await moveProductToPosition(id, position);
    notifyCatalogSyncCheck();
    setMovingId(null);
    if (!res.ok) {
      showToast('❌ সরানো ব্যর্থ: ' + (res.message || 'error'));
      return;
    }
    showToast(`✅ পজিশন ${position}-এ বসানো হয়েছে`);
    onChanged();
  }

  return (
    <div>
      {/* ═══ টুলবার: সার্চ + যোগ করুন + ক্যাটাগরি চিপ ═══ */}
      <div className="mb-3.5 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-0 flex-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-light"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="প্রোডাক্টের নাম দিয়ে খুঁজুন..."
              className="h-11 w-full rounded-full border border-border-base/80 bg-surface-muted/50 pl-11 pr-10 font-body text-[13px] font-medium text-ink transition-all duration-brand placeholder:text-muted/70 focus:bg-white lg:h-10"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                aria-label="সার্চ মুছুন"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-border-base/70 text-muted transition-colors hover:bg-brand-light hover:text-white"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onAdd}
            aria-label="প্রোডাক্ট যোগ করুন"
            title="প্রোডাক্ট যোগ করুন"
            className="flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-light font-body text-[14px] font-black text-white transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] lg:h-10 lg:w-auto lg:px-6 lg:text-[12.5px]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-4 w-4 lg:h-3.5 lg:w-3.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden lg:inline">প্রোডাক্ট যোগ করুন</span>
          </button>
        </div>

        <div className="no-scrollbar -mx-3.5 mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 sm:-mx-4 sm:px-4">
          {chips.map((c) => {
            const active = catFilter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onCatChange(c.id)}
                className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 font-body text-[12px] font-extrabold transition-all duration-brand active:scale-95 ${
                  active
                    ? 'border-brand-light bg-brand-light text-white'
                    : c.count === 0 && c.id !== 'all'
                      ? 'border-border-base/70 bg-surface-muted/60 text-muted'
                      : 'border-border-base/80 bg-white text-ink hover:border-brand-light hover:text-brand-light'
                }`}
              >
                <span>{c.label}</span>
                <span
                  className={`min-w-[22px] rounded-full px-1.5 text-center text-[10.5px] font-black leading-[18px] ${
                    active ? 'bg-white/25 text-white' : 'bg-surface-muted text-muted'
                  }`}
                >
                  {c.count.toLocaleString('en-US')}
                </span>
              </button>
            );
          })}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3.5 font-body text-[12px] font-extrabold text-danger transition-all duration-brand hover:bg-red-100 active:scale-95"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              পরিষ্কার করুন
            </button>
          )}
        </div>
      </div>

      {/* মোট সংখ্যা + ড্র্যাগ হিন্ট */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-1">
        <span className="rounded-full bg-brand-light/15 px-3 py-1.5 font-body text-[12px] font-black text-ink">
          মোট {counts.all.toLocaleString('en-US')}টি প্রোডাক্ট
        </span>
        <span className="flex items-center gap-1.5 font-body text-[11.5px] font-semibold text-ink/60">
          <span className="text-brand-light">
            <GripIcon />
          </span>
          ধরে টেনে সাজান — ওয়েবসাইটে সাথে সাথে দেখাবে
        </span>
      </div>

      {/* ═══ তালিকা: মোবাইল/ট্যাবলেটে কার্ড (<1024px), ডেস্কটপে টেবিল ═══ */}
      <div className={`lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-white/90 lg:bg-white lg:shadow-sh1 ${loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}`}>
        {pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] border border-white/90 bg-white px-6 py-16 text-center shadow-sh1 lg:rounded-none lg:border-0 lg:shadow-none">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/[0.12] text-brand-light">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </span>
            <span className="font-body text-[14px] font-extrabold text-ink">কোনো প্রোডাক্ট পাওয়া যায়নি</span>
            <span className="font-body text-[12px] font-medium text-muted">সার্চ বা ক্যাটাগরি ফিল্টার বদলে দেখুন</span>
          </div>
        ) : (
          <>
            {/* ── কার্ড (মোবাইল): বন্ধ অবস্থায় দাম · স্টক · ব্যাজ সরাসরি এডিটযোগ্য ── */}
            <div
              className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:hidden"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
            >
              {pageItems.map((p) => {
                const stock = p.stock ?? 0;
                const cats = p.cats && p.cats.length ? p.cats : [p.cat];
                const firstImg = p.first_img || '📦';
                const isDragging = draggingId === p.id;
                const isOpen = expanded.has(p.id);
                return (
                  <article
                    key={p.id}
                    data-prod-row={p.id}
                    className={`flex flex-col rounded-[20px] border bg-white p-3 shadow-sh1 transition-all duration-brand ${
                      isDragging ? 'scale-[1.015] border-brand-light ring-2 ring-brand-light/30' : isOpen ? 'border-brand-light/60' : 'border-white/90'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Thumb src={firstImg} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 font-body text-[13.5px] font-extrabold leading-snug text-ink">{p.name}</div>
                        <div className="mt-0.5 truncate font-body text-[11px] font-semibold text-muted">
                          <span className="font-bold text-ink/50">#{p.id}</span>
                          {' · '}
                          {cats.map((c) => catNameMap[c] || c).join(', ')}
                        </div>
                      </div>
                      <div
                        onPointerDown={(e) => handlePointerDown(p.id, e)}
                        title="ধরে টানুন"
                        className="-mr-1.5 -mt-1 flex h-10 w-9 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-xl text-muted active:bg-brand-light/10 active:text-brand-light"
                      >
                        <GripIcon />
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-x-2 gap-y-1.5 border-t border-border-base/60 pt-2.5">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5">
                        <span className="whitespace-nowrap font-body text-[15px] font-black leading-none text-ink">
                          {money(p.price)}
                          {!!p.old && <span className="ml-1.5 text-[11px] font-semibold text-muted line-through">{money(p.old)}</span>}
                        </span>
                        <ChipButton onClick={() => setPopover({ row: p, kind: 'stock' })} title="স্টক সম্পাদনা">
                          <StockPill stock={stock} />
                        </ChipButton>
                        <ChipButton onClick={() => setPopover({ row: p, kind: 'badge' })} title="ব্যাজ সম্পাদনা">
                          <BadgeChip badge={p.badge} />
                        </ChipButton>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleExpand(p.id)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? 'লুকান' : 'আরও অপশন'}
                        title={isOpen ? 'লুকান' : 'আরও অপশন'}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-brand active:scale-90 ${
                          isOpen ? 'border-brand-light bg-brand-light text-white' : 'border-border-base bg-white text-ink'
                        }`}
                      >
                        {isOpen ? <ChevronUpIcon /> : <DotsIcon />}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="animate-soft-fade-in">
                        <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-surface-muted/70 px-3 py-2">
                          <span className="shrink-0 font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">ওয়ারেন্টি</span>
                          <span className="line-clamp-1 min-w-0 font-body text-[12px] font-bold text-ink">{p.warranty || '—'}</span>
                        </div>

                        <div className="mt-2.5 flex gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(p.id)}
                            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-light font-body text-[13px] font-extrabold text-white transition-all duration-brand active:scale-[0.98]"
                          >
                            <PencilIcon />
                            এডিট করুন
                          </button>
                          <button
                            type="button"
                            onClick={() => setGuidePagesFor(p)}
                            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-brand-light/40 bg-brand-light/10 font-body text-[13px] font-extrabold text-ink transition-all duration-brand active:scale-[0.98]"
                          >
                            <span className="text-brand-light">
                              <GuideIcon />
                            </span>
                            গাইড পেজ
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting({ row: p, busy: false })}
                            aria-label="ডিলিট করুন"
                            title="ডিলিট করুন"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-danger transition-all duration-brand active:scale-90"
                          >
                            <TrashIcon />
                          </button>
                        </div>

                        <div className="mt-2.5 flex items-center gap-2 border-t border-border-base/60 pt-2.5">
                          <span className="shrink-0 font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">ক্রম</span>
                          <PositionControls
                            busy={movingId === p.id}
                            onEdge={(edge) => handleMoveToEdge(p.id, edge)}
                            onPosition={(pos) => handleMoveToPosition(p.id, pos)}
                          />
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* ── টেবিল ── */}
            <div className="hidden lg:block">
              <div className="sleek-scrollbar overflow-x-auto">
                <table className="w-full min-w-[960px] text-left">
                  <thead>
                    <tr className="border-b border-border-base/60 bg-brand-bg/30 font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
                      <th className="w-12 py-3.5 pl-4" />
                      <th className="px-3 py-3.5">প্রোডাক্ট</th>
                      <th className="px-3 py-3.5">ক্যাটাগরি</th>
                      <th className="px-3 py-3.5">ব্যাজ</th>
                      <th className="px-3 py-3.5">মূল্য</th>
                      <th className="px-3 py-3.5">স্টক</th>
                      <th className="px-3 py-3.5">ওয়ারেন্টি</th>
                      <th className="py-3.5 pl-3 pr-5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody
                    className="divide-y divide-border-base/40 font-body text-[13px]"
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                  >
                    {pageItems.map((p, idx) => {
                      const stock = p.stock ?? 0;
                      const cats = p.cats && p.cats.length ? p.cats : [p.cat];
                      const firstImg = p.first_img || '📦';
                      const isDragging = draggingId === p.id;
                      // পজিশন = পুরো ক্যাটালগের ক্রম; ফিল্টার/সার্চ চালু থাকলে সঠিক পজিশন জানা যায় না, তাই তখন লুকানো থাকে
                      const position = hasFilters ? null : (page - 1) * pageSize + idx + 1;
                      return (
                        <tr
                          key={p.id}
                          data-prod-row={p.id}
                          className={`transition-colors duration-brand ${isDragging ? 'bg-brand-light/[0.12]' : 'hover:bg-brand-bg/25'}`}
                        >
                          <td className="py-2.5 pl-4">
                            <span
                              onPointerDown={(e) => handlePointerDown(p.id, e)}
                              title="ধরে টানুন"
                              className="flex h-11 w-11 cursor-grab touch-none select-none items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-light/10 hover:text-brand-light"
                            >
                              <GripIcon />
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <Thumb src={firstImg} size={48} />
                              <div className="min-w-0">
                                <div className="line-clamp-2 max-w-[280px] font-extrabold leading-snug text-ink">{p.name}</div>
                                <div className="mt-0.5 whitespace-nowrap text-[11px] font-bold text-muted">
                                  ID <span className="font-extrabold text-ink/70">{p.id}</span>
                                  {position !== null && (
                                    <>
                                      <span className="mx-1.5 text-border-base">|</span>
                                      Position <span className="font-extrabold text-brand-light">{position}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex max-w-[180px] flex-wrap gap-1">
                              {cats.map((c) => (
                                <span key={c} className="rounded-full bg-brand-light/[0.12] px-2 py-0.5 text-[10.5px] font-extrabold text-ink">
                                  {catNameMap[c] || c}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <ChipDropdown onClick={(el) => openMenu('badge', p, el)} title="ব্যাজ বদলান" open={menu?.kind === 'badge' && menu.row.id === p.id}>
                              <BadgeChip badge={p.badge} />
                            </ChipDropdown>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <div className="font-black text-ink">{money(p.price)}</div>
                            {!!p.old && <div className="text-[11px] font-semibold text-muted line-through">{money(p.old)}</div>}
                          </td>
                          <td className="px-3 py-3">
                            <ChipDropdown onClick={(el) => openMenu('stock', p, el)} title="স্টক বদলান" open={menu?.kind === 'stock' && menu.row.id === p.id}>
                              <StockPill stock={stock} />
                            </ChipDropdown>
                          </td>
                          <td className="px-3 py-3 text-[12px] font-semibold text-ink">
                            <span className="block max-w-[230px] truncate whitespace-nowrap" title={p.warranty || undefined}>
                              {p.warranty || '—'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-3 pl-3 pr-5">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={(e) => openMenu('actions', p, e.currentTarget)}
                                title="অ্যাকশন মেনু"
                                aria-label="অ্যাকশন মেনু"
                                aria-expanded={menu?.kind === 'actions' && menu.row.id === p.id}
                                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-brand active:scale-90 ${
                                  menu?.kind === 'actions' && menu.row.id === p.id
                                    ? 'border-brand-light bg-brand-light text-white'
                                    : 'border-border-base bg-white text-ink hover:border-brand-light hover:text-brand-light'
                                }`}
                              >
                                <DotsIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {total > 0 && (
          <div className="mt-3 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1 lg:mt-0 lg:rounded-none lg:border-0 lg:border-t lg:border-border-base/60 lg:px-5 lg:shadow-none">
            <Pagination page={page} total={total} pageSize={pageSize} onPageChange={onPageChange} bare />
          </div>
        )}
      </div>

      {menu &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            data-row-menu
            style={{ position: 'fixed', top: menu.top, bottom: menu.bottom, left: menu.left, right: menu.right }}
            className="z-[60] w-[228px] animate-soft-fade-in rounded-2xl border border-border-base/80 bg-white p-1.5 font-body shadow-sh3"
          >
            {menu.kind === 'badge' && (
              <BadgeQuickMenu
                current={menu.row.badge || ''}
                busy={menuBusy}
                onSave={(v) => saveBadgeFromMenu(menu.row, v)}
                onClear={() => saveBadgeFromMenu(menu.row, '')}
                onCancel={() => setMenu(null)}
              />
            )}
            {menu.kind === 'stock' && (
              <StockQuickMenu
                current={menu.row.stock ?? 0}
                busy={menuBusy}
                onSave={(n) => saveStockFromMenu(menu.row, n)}
                onCancel={() => setMenu(null)}
                onHistory={() => {
                  setPopover({ row: menu.row, kind: 'stock' });
                  setMenu(null);
                }}
              />
            )}
            {menu.kind === 'actions' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onEdit(menu.row.id);
                    setMenu(null);
                  }}
                  className={`${MENU_ROW} text-brand-light hover:bg-brand-light/10`}
                >
                  <PencilIcon />
                  এডিট করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGuidePagesFor(menu.row);
                    setMenu(null);
                  }}
                  className={`${MENU_ROW} text-ink hover:bg-brand-light/10`}
                >
                  <span className="text-brand-light">
                    <GuideIcon />
                  </span>
                  গাইড পেজ
                </button>
                <div className="my-1 h-px bg-border-base/60" />
                <button
                  type="button"
                  disabled={movingId === menu.row.id}
                  onClick={() => {
                    handleMoveToEdge(menu.row.id, 'top');
                    setMenu(null);
                  }}
                  className={`${MENU_ROW} text-ink hover:bg-brand-light/10`}
                >
                  <MiniIcon>
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </MiniIcon>
                  একদম উপরে আনুন
                </button>
                <button
                  type="button"
                  disabled={movingId === menu.row.id}
                  onClick={() => {
                    handleMoveToEdge(menu.row.id, 'bottom');
                    setMenu(null);
                  }}
                  className={`${MENU_ROW} text-ink hover:bg-brand-light/10`}
                >
                  <MiniIcon>
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                  </MiniIcon>
                  একদম নিচে নিন
                </button>
                <MenuPositionForm
                  busy={movingId === menu.row.id}
                  onPosition={(pos) => {
                    handleMoveToPosition(menu.row.id, pos);
                    setMenu(null);
                  }}
                />
                <div className="my-1 h-px bg-border-base/60" />
                <button
                  type="button"
                  onClick={() => {
                    setDeleting({ row: menu.row, busy: false });
                    setMenu(null);
                  }}
                  className={`${MENU_ROW} text-danger hover:bg-red-50`}
                >
                  <TrashIcon />
                  ডিলিট করুন
                </button>
              </>
            )}
          </div>,
          document.body,
        )}

      {popover && (
        <QuickEditPopover
          productName={popover.row.name}
          productId={popover.row.id}
          kind={popover.kind}
          initialValue={popover.kind === 'stock' ? popover.row.stock ?? 0 : popover.row.badge || ''}
          onSave={handleQuickSave}
          onClose={() => setPopover(null)}
        />
      )}

      {guidePagesFor && (
        <GuidePagesListModal
          scope="product"
          entityId={guidePagesFor.id}
          entityLabel={guidePagesFor.name}
          onClose={() => setGuidePagesFor(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="প্রোডাক্ট ডিলিট করবেন?"
          message={
            <>
              <span className="font-extrabold text-ink">&ldquo;{deleting.row.name}&rdquo;</span> স্থায়ীভাবে মুছে যাবে — এই কাজ ফিরিয়ে আনা যাবে না।
            </>
          }
          confirmLabel="হ্যাঁ, ডিলিট করুন"
          busyLabel="ডিলিট হচ্ছে..."
          busy={deleting.busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
