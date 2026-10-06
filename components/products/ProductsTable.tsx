'use client';

import { useMemo, useRef, useState } from 'react';
import type { Product } from '@/types';
import type { CategoryOption } from '@/lib/constants/categories';
import { deleteProduct, updateBadge, updateProductOrder, updateStock } from '@/app/actions/products';
import QuickEditPopover from './QuickEditPopover';
import GuidePagesListModal from '@/components/guides/GuidePagesListModal';
import Pagination, { PAGE_SIZE } from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';
import { notifyCatalogSyncCheck } from '@/lib/catalogSyncEvent';

interface Props {
  products: Product[];
  categories: CategoryOption[];
  onEdit: (p: Product) => void;
  onAdd: () => void;
  onChanged: () => void; // পেরেন্টকে বলে products রিফ্রেশ করতে (server action-এর revalidatePath এমনিতেই করবে, তবে optimistic UX-এর জন্য)
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
    <span className="inline-flex whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 font-body text-[11px] font-extrabold leading-none text-[#92400E]">
      {badge}
    </span>
  ) : (
    <span className="font-body text-[12px] font-semibold text-muted">নেই</span>
  );
}

function EditDot({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-light/35 bg-brand-light/10 text-brand-light transition-all duration-brand hover:bg-brand-light hover:text-white active:scale-90"
    >
      <PencilIcon />
    </button>
  );
}

export default function ProductsTable({ products, categories, onEdit, onAdd, onChanged }: Props) {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [popover, setPopover] = useState<{ product: Product; kind: 'stock' | 'badge' } | null>(null);
  const [guidePagesFor, setGuidePagesFor] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<{ product: Product; busy: boolean } | null>(null);
  const [dragOrder, setDragOrder] = useState<number[] | null>(null); // বর্তমান পেজের rows-এর id, ড্র্যাগ চলাকালীন লাইভ অর্ডার
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set()); // মোবাইল কার্ডে "সবকিছু দেখুন" খোলা প্রোডাক্টগুলো
  const dragState = useRef<{ id: number } | null>(null);

  const catNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c) => (m[c.id] = c.name));
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return products.filter((p) => {
      const nameMatch = !q || p.name.toLowerCase().includes(q) || (p.name_bn || '').toLowerCase().includes(q);
      const cats = p.cats && p.cats.length ? p.cats : [p.cat];
      const catMatch = catFilter === 'all' || cats.includes(catFilter);
      return nameMatch && catMatch;
    });
  }, [products, query, catFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const basePageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  // ড্র্যাগ চলাকালীন dragOrder অনুযায়ী বর্তমান পেজের সারি সাজানো দেখানো হয়
  const pageItems = dragOrder ? (dragOrder.map((id) => productById.get(id)).filter(Boolean) as Product[]) : basePageItems;

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    products.forEach((p) => {
      const cats = p.cats && p.cats.length ? p.cats : [p.cat];
      cats.forEach((id) => id && (c[id] = (c[id] || 0) + 1));
    });
    return c;
  }, [products]);

  const hasFilters = !!query || catFilter !== 'all';

  function onFilterChange(q: string, cat: string) {
    setQuery(q);
    setCatFilter(cat);
    setPage(1);
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
    const res = await deleteProduct(deleting.product.id);
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
        ? await updateStock(popover.product.id, Number(value))
        : await updateBadge(popover.product.id, String(value));
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
  // legacy initDragSort()-এর মতোই: শুধু বর্তমান পেজে দৃশ্যমান row-গুলোর
  // মধ্যে reorder হয়; সেই সাব-অর্ডার সার্ভারে পাঠালে updateProductOrder
  // পুরো লিস্টের বাকি id-গুলোর পজিশন অক্ষত রেখে merge করে।
  function handlePointerDown(id: number, e: React.PointerEvent<HTMLElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { id };
    setDraggingId(id);
    setDragOrder(basePageItems.map((p) => p.id));
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
    await updateProductOrder(dragOrder);
    notifyCatalogSyncCheck();
    setDragOrder(null);
    onChanged();
  }

  // ব্রাউজার ড্র্যাগ বাতিল করলে (যেমন টাচ স্ক্রল) — সেভ না করে সাজানো ফিরিয়ে দাও
  function handlePointerCancel() {
    dragState.current = null;
    setDraggingId(null);
    setDragOrder(null);
  }

  const chips: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'সব', count: products.length },
    ...categories.filter((c) => c.id !== 'all').map((c) => ({ id: c.id, label: c.name, count: counts[c.id] || 0 })),
  ];

  return (
    <div>
      {/* ═══ টুলবার: সার্চ + যোগ করুন + ক্যাটাগরি চিপ ═══ */}
      <div className="mb-3.5 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
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
              onChange={(e) => onFilterChange(e.target.value, catFilter)}
              placeholder="প্রোডাক্টের নাম দিয়ে খুঁজুন..."
              className="h-11 w-full rounded-full border border-border-base/80 bg-surface-muted/50 pl-11 pr-10 font-body text-[13px] font-medium text-ink transition-all duration-brand placeholder:text-muted/70 focus:bg-white lg:h-10"
            />
            {query && (
              <button
                type="button"
                onClick={() => onFilterChange('', catFilter)}
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
            className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-brand-light px-6 font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.4)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] lg:h-10 lg:w-auto lg:text-[12.5px]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-3.5 w-3.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            প্রোডাক্ট যোগ করুন
          </button>
        </div>

        <div className="no-scrollbar -mx-3.5 mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 sm:-mx-4 sm:px-4">
          {chips.map((c) => {
            const active = catFilter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onFilterChange(query, c.id)}
                className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 font-body text-[12px] font-extrabold transition-all duration-brand active:scale-95 ${
                  active
                    ? 'border-brand-light bg-brand-light text-white shadow-[0_4px_14px_rgba(68,167,252,0.36)]'
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
              onClick={() => onFilterChange('', 'all')}
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
          মোট {products.length}টি প্রোডাক্ট
        </span>
        <span className="flex items-center gap-1.5 font-body text-[11.5px] font-semibold text-ink/60">
          <span className="text-brand-light">
            <GripIcon />
          </span>
          ধরে টেনে সাজান — ওয়েবসাইটে সাথে সাথে দেখাবে
        </span>
      </div>

      {/* ═══ তালিকা: মোবাইল/ট্যাবলেটে কার্ড (<1024px), ডেস্কটপে টেবিল ═══ */}
      <div className="lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-white/90 lg:bg-white lg:shadow-sh1">
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
            {/* ── কার্ড ── */}
            <div
              className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:hidden"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
            >
              {pageItems.map((p) => {
                const stock = p.stock ?? 0;
                const cats = p.cats && p.cats.length ? p.cats : [p.cat];
                const firstImg = (p.imgs && p.imgs[0]) || '📦';
                const isDragging = draggingId === p.id;
                const isOpen = expanded.has(p.id);
                return (
                  <article
                    key={p.id}
                    data-prod-row={p.id}
                    className={`flex flex-col rounded-[20px] border bg-white p-3 shadow-sh1 transition-all duration-brand ${
                      isDragging ? 'scale-[1.015] border-brand-light ring-2 ring-brand-light/30' : 'border-white/90'
                    }`}
                  >
                    {/* কম্প্যাক্ট অংশ: ছবি · নাম · ক্যাটাগরি (এক লাইন) · গ্রিপ */}
                    <div className="flex items-start gap-2.5">
                      <Thumb src={firstImg} size={52} />
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 font-body text-[13.5px] font-extrabold leading-snug text-ink">{p.name}</div>
                        <div className="mt-1 truncate font-body text-[11px] font-semibold text-muted">
                          <span className="font-bold text-ink/50">#{p.id}</span>
                          {' · '}
                          {cats.map((c) => catNameMap[c] || c).join(', ')}
                        </div>
                      </div>
                      <div
                        onPointerDown={(e) => handlePointerDown(p.id, e)}
                        title="ধরে টানুন"
                        className="-mr-1 -mt-0.5 flex h-11 w-11 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-xl text-muted active:bg-brand-light/10 active:text-brand-light"
                      >
                        <GripIcon />
                      </div>
                    </div>

                    {/* এক লাইনের সারাংশ: দাম · স্টক · "সবকিছু দেখুন" */}
                    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border-base/60 pt-2.5">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-body text-[15px] font-black leading-none text-ink">{money(p.price)}</span>
                        <StockPill stock={stock} />
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleExpand(p.id)}
                        aria-expanded={isOpen}
                        className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 font-body text-[12px] font-extrabold transition-all duration-brand active:scale-95 ${
                          isOpen
                            ? 'border-brand-light bg-brand-light text-white shadow-[0_3px_10px_rgba(68,167,252,0.36)]'
                            : 'border-brand-light/40 bg-brand-light/10 text-ink'
                        }`}
                      >
                        {isOpen ? 'লুকান' : 'সবকিছু দেখুন'}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`h-3 w-3 transition-transform duration-brand ${isOpen ? 'rotate-180' : ''}`}
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </div>

                    {/* এক্সপ্যান্ড অংশ: বিস্তারিত তথ্য + অ্যাকশন */}
                    {isOpen && (
                      <div className="animate-soft-fade-in">
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="min-w-0 rounded-xl border border-border-base/70 px-3 py-2">
                            <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">মূল্য</div>
                            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
                              <span className="font-body text-[15px] font-black text-ink">{money(p.price)}</span>
                              {!!p.old && <span className="font-body text-[11px] font-semibold text-muted line-through">{money(p.old)}</span>}
                            </div>
                          </div>
                          <div className="min-w-0 rounded-xl border border-border-base/70 px-3 py-2">
                            <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">স্টক</div>
                            <div className="mt-1 flex items-center justify-between gap-1.5">
                              <StockPill stock={stock} />
                              <EditDot onClick={() => setPopover({ product: p, kind: 'stock' })} title="স্টক সম্পাদনা" />
                            </div>
                          </div>
                          <div className="min-w-0 rounded-xl border border-border-base/70 px-3 py-2">
                            <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">ব্যাজ</div>
                            <div className="mt-1 flex items-center justify-between gap-1.5">
                              <BadgeChip badge={p.badge} />
                              <EditDot onClick={() => setPopover({ product: p, kind: 'badge' })} title="ব্যাজ সম্পাদনা" />
                            </div>
                          </div>
                          <div className="min-w-0 rounded-xl border border-border-base/70 px-3 py-2">
                            <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">ওয়ারেন্টি</div>
                            <div className="mt-0.5 line-clamp-2 font-body text-[12px] font-bold leading-snug text-ink">{p.warranty || '—'}</div>
                          </div>
                        </div>

                        <div className="mt-2.5 flex gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(p)}
                            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-light font-body text-[13px] font-extrabold text-white shadow-[0_4px_14px_rgba(68,167,252,0.36)] transition-all duration-brand active:scale-[0.98]"
                          >
                            <PencilIcon />
                            এডিট করুন
                          </button>
                          <button
                            type="button"
                            onClick={() => setGuidePagesFor(p)}
                            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-brand-light/40 bg-brand-light/10 font-body text-[13px] font-extrabold text-ink transition-all duration-brand active:scale-[0.98]"
                          >
                            <span className="text-brand-light">
                              <GuideIcon />
                            </span>
                            গাইড পেজ
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting({ product: p, busy: false })}
                            aria-label="ডিলিট করুন"
                            title="ডিলিট করুন"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-danger transition-all duration-brand active:scale-90"
                          >
                            <TrashIcon />
                          </button>
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
                <table className="w-full min-w-[980px] text-left">
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
                    {pageItems.map((p) => {
                      const stock = p.stock ?? 0;
                      const cats = p.cats && p.cats.length ? p.cats : [p.cat];
                      const firstImg = (p.imgs && p.imgs[0]) || '📦';
                      const isDragging = draggingId === p.id;
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
                                <div className="mt-0.5 text-[11px] font-bold text-muted">#{p.id}</div>
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
                            <div className="flex items-center gap-2">
                              <BadgeChip badge={p.badge} />
                              <EditDot onClick={() => setPopover({ product: p, kind: 'badge' })} title="ব্যাজ সম্পাদনা" />
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <div className="font-black text-ink">{money(p.price)}</div>
                            {!!p.old && <div className="text-[11px] font-semibold text-muted line-through">{money(p.old)}</div>}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <StockPill stock={stock} />
                              <EditDot onClick={() => setPopover({ product: p, kind: 'stock' })} title="স্টক সম্পাদনা" />
                            </div>
                          </td>
                          <td className="px-3 py-3 text-[12px] font-semibold text-ink">
                            <span className="line-clamp-2 block max-w-[150px]">{p.warranty || '—'}</span>
                          </td>
                          <td className="whitespace-nowrap py-3 pl-3 pr-5">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onEdit(p)}
                                title="এডিট করুন"
                                aria-label="এডিট করুন"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-white shadow-[0_3px_10px_rgba(68,167,252,0.36)] transition-all duration-brand hover:bg-brand-light-hover active:scale-90"
                              >
                                <PencilIcon />
                              </button>
                              <button
                                type="button"
                                onClick={() => setGuidePagesFor(p)}
                                title="গাইড পেজ (Installation/App-Remote SEO পেজ)"
                                aria-label="গাইড পেজ"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-light/40 bg-brand-light/10 text-brand-light transition-all duration-brand hover:bg-brand-light hover:text-white active:scale-90"
                              >
                                <GuideIcon />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleting({ product: p, busy: false })}
                                title="ডিলিট করুন"
                                aria-label="ডিলিট করুন"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-danger transition-all duration-brand hover:bg-danger hover:text-white active:scale-90"
                              >
                                <TrashIcon />
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

        {filtered.length > 0 && (
          <div className="mt-3 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1 lg:mt-0 lg:rounded-none lg:border-0 lg:border-t lg:border-border-base/60 lg:px-5 lg:shadow-none">
            <Pagination page={pageSafe} total={filtered.length} onPageChange={setPage} bare />
          </div>
        )}
      </div>

      {popover && (
        <QuickEditPopover
          productName={popover.product.name}
          kind={popover.kind}
          initialValue={popover.kind === 'stock' ? popover.product.stock ?? 0 : popover.product.badge || ''}
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
              <span className="font-extrabold text-ink">&ldquo;{deleting.product.name}&rdquo;</span> স্থায়ীভাবে মুছে যাবে — এই কাজ ফিরিয়ে আনা যাবে না।
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
