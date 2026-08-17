'use client';

import { useMemo, useRef, useState } from 'react';
import type { Product } from '@/types';
import { getCleanIcon, type CategoryOption } from '@/lib/constants/categories';
import { deleteProduct, updateBadge, updateProductOrder, updateStock } from '@/app/actions/products';
import QuickEditPopover from './QuickEditPopover';

const PG_SIZE = 14;

interface Props {
  products: Product[];
  categories: CategoryOption[];
  onEdit: (p: Product) => void;
  onAdd: () => void;
  onChanged: () => void; // পেরেন্টকে বলে products রিফ্রেশ করতে (server action-এর revalidatePath এমনিতেই করবে, তবে optimistic UX-এর জন্য)
}

export default function ProductsTable({ products, categories, onEdit, onAdd, onChanged }: Props) {
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [popover, setPopover] = useState<{ product: Product; kind: 'stock' | 'badge' } | null>(null);
  const [dragOrder, setDragOrder] = useState<number[] | null>(null); // বর্তমান পেজের rows-এর id, ড্র্যাগ চলাকালীন লাইভ অর্ডার
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PG_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const basePageItems = filtered.slice((pageSafe - 1) * PG_SIZE, pageSafe * PG_SIZE);
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

  function onFilterChange(q: string, cat: string) {
    setQuery(q);
    setCatFilter(cat);
    setPage(1);
  }

  async function handleDelete(p: Product) {
    if (!confirm(`"${p.name}" ডিলিট করবেন? এই কাজ ফিরিয়ে আনা যাবে না।`)) return;
    const res = await deleteProduct(p.id);
    if (!res.ok) {
      alert('❌ ডিলিট ব্যর্থ: ' + (res.message || 'error'));
      return;
    }
    onChanged();
  }

  async function handleQuickSave(value: string | number) {
    if (!popover) return;
    const res =
      popover.kind === 'stock'
        ? await updateStock(popover.product.id, Number(value))
        : await updateBadge(popover.product.id, String(value));
    if (!res.ok) {
      alert('❌ সেভ ব্যর্থ: ' + (res.message || 'error'));
      return;
    }
    setPopover(null);
    onChanged();
  }

  // ── Drag-sort (pointer events — mouse + touch দুটোতেই কাজ করে) ──
  // legacy initDragSort()-এর মতোই: শুধু বর্তমান পেজে দৃশ্যমান row-গুলোর
  // মধ্যে reorder হয়; সেই সাব-অর্ডার সার্ভারে পাঠালে updateProductOrder
  // পুরো লিস্টের বাকি id-গুলোর পজিশন অক্ষত রেখে merge করে।
  function handlePointerDown(id: number, e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { id };
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
      return;
    }
    dragState.current = null;
    await updateProductOrder(dragOrder);
    setDragOrder(null);
    onChanged();
  }

  return (
    <div>
      {/* Row 1: search + add */}
      <div className="mb-2.5 flex flex-wrap gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            className="w-full rounded-brand border border-border-base py-2.5 pl-9 pr-3 text-sm"
            placeholder="প্রোডাক্টের নাম..."
            value={query}
            onChange={(e) => onFilterChange(e.target.value, catFilter)}
          />
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-brand bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" className="h-3.5 w-3.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          প্রোডাক্ট যোগ করুন
        </button>
      </div>

      {/* Row 2: category filter + clear */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <select
          className="rounded-brand border border-border-base px-3 py-2 text-sm font-semibold"
          value={catFilter}
          onChange={(e) => onFilterChange(query, e.target.value)}
        >
          <option value="all">সব ক্যাটাগরি</option>
          {categories
            .filter((c) => c.id !== 'all')
            .map((c) => (
              <option key={c.id} value={c.id}>
                {getCleanIcon(c)} {c.name}
              </option>
            ))}
        </select>
        <button
          type="button"
          onClick={() => onFilterChange('', 'all')}
          className="flex items-center gap-1.5 rounded-brand border border-border-base px-3 py-2 text-sm font-medium text-ink transition-brand hover:border-brand-primary"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" className="h-3 w-3">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          পরিষ্কার করুন
        </button>
      </div>

      <div className="rounded-brand bg-brand-surface p-4 shadow-sh1">
        {/* Category count badges */}
        <div className="mb-3.5 flex flex-wrap gap-1.5">
          {categories
            .filter((c) => c.id !== 'all')
            .map((c) => {
              const n = counts[c.id] || 0;
              const isActive = catFilter === c.id;
              const cls = isActive
                ? 'bg-brand-primary text-white border-brand-primary'
                : n === 0
                  ? 'bg-surface-muted text-muted border-border-base'
                  : 'bg-blue-50 text-brand-primary border-blue-200';
              return (
                <button
                  key={c.id}
                  onClick={() => onFilterChange(query, c.id)}
                  className={`rounded-full border px-2.5 py-1 text-[11.5px] font-bold transition-brand ${cls}`}
                >
                  {c.name}: {n}টি
                </button>
              );
            })}
        </div>

        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11.5px] text-muted">≡ ধরে টেনে যেকোনো প্রোডাক্ট সাজান — ওয়েবসাইটে সাথে সাথে দেখাবে</span>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-brand-primary">
            মোট {products.length}টি প্রোডাক্ট
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-base text-left text-xs uppercase text-muted">
                <th className="w-6"></th>
                <th className="py-2">ছবি</th>
                <th>নাম</th>
                <th>ব্যাজ</th>
                <th>ক্যাট</th>
                <th>মূল্য</th>
                <th>স্টক</th>
                <th>ওয়ারেন্টি</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-muted">
                    কোনো প্রোডাক্ট পাওয়া যায়নি
                  </td>
                </tr>
              )}
              {pageItems.map((p) => {
                const stock = p.stock ?? 0;
                const stockPillCls =
                  stock === 0
                    ? 'bg-red-50 text-danger'
                    : stock <= 5
                      ? 'bg-amber-50 text-[#92400E]'
                      : 'bg-green-50 text-[#065F46]';
                const stockLabel = stock === 0 ? 'Sold Out' : `${stock} পিস${stock <= 5 ? ' ⚠️' : ''}`;
                const cats = p.cats && p.cats.length ? p.cats : [p.cat];
                const firstImg = (p.imgs && p.imgs[0]) || '📦';
                const isImgUrl = typeof firstImg === 'string' && (firstImg.startsWith('http') || firstImg.startsWith('/'));

                return (
                  <tr key={p.id} data-prod-row={p.id} className="border-b border-border-base hover:bg-surface-muted">
                    <td
                      className="cursor-grab select-none py-2 text-lg text-muted"
                      onPointerDown={(e) => handlePointerDown(p.id, e)}
                      title="ধরে টানুন"
                    >
                      ≡
                    </td>
                    <td className="py-1.5 pr-2">
                      {isImgUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={firstImg} alt="" className="h-10 w-10 rounded-md border border-border-base object-cover" />
                      ) : (
                        <span className="text-xl">{firstImg}</span>
                      )}
                    </td>
                    <td className="max-w-[180px] py-1.5 text-xs font-semibold">{p.name}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {p.badge ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-[#92400E]">
                            {p.badge}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted">নেই</span>
                        )}
                        <button
                          onClick={() => setPopover({ product: p, kind: 'badge' })}
                          className="rounded-md border border-border-base p-1 text-muted hover:border-brand-primary"
                          title="ব্যাজ সম্পাদনা"
                        >
                          ✎
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {cats.map((c) => (
                          <span key={c} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                            {catNameMap[c] || c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-xs">
                      ৳{(p.price || 0).toLocaleString()}
                      <br />
                      <span className="text-[10px] text-muted line-through">৳{(p.old || 0).toLocaleString()}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${stockPillCls}`}>{stockLabel}</span>
                        <button
                          onClick={() => setPopover({ product: p, kind: 'stock' })}
                          className="rounded-md border border-border-base p-1 text-muted hover:border-brand-primary"
                          title="স্টক সম্পাদনা"
                        >
                          ✎
                        </button>
                      </div>
                    </td>
                    <td className="text-[11px]">{p.warranty || '-'}</td>
                    <td>
                      <div className="flex gap-1.5">
                        <button onClick={() => onEdit(p)} className="rounded-md border border-border-base p-1.5 hover:border-brand-primary" title="এডিট করুন">
                          ✎
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="rounded-md border border-red-200 p-1.5 text-danger hover:bg-red-50"
                          title="ডিলিট করুন"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <button
              disabled={pageSafe <= 1}
              onClick={() => setPage(pageSafe - 1)}
              className="rounded-lg border border-border-base px-3 py-1.5 text-sm disabled:opacity-40"
            >
              আগে
            </button>
            <span className="text-sm text-muted">
              {pageSafe} / {totalPages}
            </span>
            <button
              disabled={pageSafe >= totalPages}
              onClick={() => setPage(pageSafe + 1)}
              className="rounded-lg border border-border-base px-3 py-1.5 text-sm disabled:opacity-40"
            >
              পরে
            </button>
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
    </div>
  );
}
