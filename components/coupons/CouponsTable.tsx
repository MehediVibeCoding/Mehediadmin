'use client';

import { useMemo, useState } from 'react';
import type { Coupon, CouponStatus } from '@/types';
import { toggleCouponActive, deleteCoupon } from '@/app/actions/coupons';
import { getCouponStatus, STATUS_LABEL, STATUS_BADGE_CLASS, formatDiscount, formatExpiryCountdown } from '@/lib/coupons';
import { useToast } from '@/components/admin/Toast';
import Pagination, { PAGE_SIZE } from '@/components/common/Pagination';
import DeleteConfirmDialog from './DeleteConfirmDialog';

interface Props {
  coupons: Coupon[];
  onEdit: (c: Coupon) => void;
  onAdd: () => void;
}

type FilterKey = 'all' | CouponStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'সব' },
  { key: 'active', label: 'সক্রিয়' },
  { key: 'expired', label: 'মেয়াদ শেষ' },
  { key: 'inactive', label: 'নিষ্ক্রিয়' },
];

export default function CouponsTable({ coupons, onEdit, onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    return coupons.filter((c) => {
      const codeMatch = !q || c.code.includes(q);
      const statusMatch = filter === 'all' || getCouponStatus(c) === filter;
      return codeMatch && statusMatch;
    });
  }, [coupons, query, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  function onFilterChange(q: string, f: FilterKey) {
    setQuery(q);
    setFilter(f);
    setPage(1);
  }

  async function handleCopy(code: string, id: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    } catch {
      showToast('❌ কপি করা যায়নি');
    }
  }

  async function handleToggle(coupon: Coupon, checked: boolean) {
    setTogglingId(coupon.id);
    const res = await toggleCouponActive(coupon.id, checked);
    setTogglingId(null);
    if (res.status !== 'ok') {
      showToast('❌ ' + (res.message || 'আপডেট ব্যর্থ'));
      return;
    }
    showToast(checked ? `✅ ${coupon.code} চালু করা হয়েছে` : `⛔ ${coupon.code} বন্ধ করা হয়েছে`);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteCoupon(deleteTarget.id);
    setDeleting(false);
    if (res.status !== 'ok') {
      showToast('❌ ডিলিট ব্যর্থ: ' + (res.message || 'error'));
      return;
    }
    showToast(`🗑️ ${deleteTarget.code} ডিলিট করা হয়েছে`);
    setDeleteTarget(null);
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
            className="w-full rounded-brand border border-border-base py-2.5 pl-9 pr-3 text-sm uppercase"
            placeholder="কোড দিয়ে খুঁজুন..."
            value={query}
            onChange={(e) => onFilterChange(e.target.value, filter)}
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
          নতুন কুপন
        </button>
      </div>

      {/* Row 2: status filter pills */}
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(query, f.key)}
            className={`rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition-brand ${
              filter === f.key
                ? 'border-brand-primary bg-brand-primary text-white'
                : 'border-border-base bg-blue-50 text-brand-primary hover:border-brand-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-brand bg-brand-surface p-4 shadow-sh1">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11.5px] text-muted">রিয়েলটাইম সিঙ্ক চালু — অন্য ট্যাবে বদলালে এখানেও সাথে সাথে দেখাবে</span>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-brand-primary">
            মোট {coupons.length}টি কুপন
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-base text-left text-xs uppercase text-muted">
                <th className="py-2">কোড</th>
                <th>ধরন ও মান</th>
                <th>সর্বনিম্ন অর্ডার</th>
                <th>ব্যবহার</th>
                <th>মেয়াদ</th>
                <th>স্ট্যাটাস</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted">
                    কোনো কুপন পাওয়া যায়নি
                  </td>
                </tr>
              )}
              {pageItems.map((c) => {
                const status = getCouponStatus(c);
                const expiryLabel = formatExpiryCountdown(c.expires_at);
                const isExpiringSoon =
                  status === 'active' && !!c.expires_at && new Date(c.expires_at).getTime() - Date.now() < 86_400_000 * 3;
                const usageLabel = c.max_uses_total != null ? `${c.used_count} / ${c.max_uses_total} ব্যবহৃত` : `${c.used_count}× ব্যবহৃত`;

                return (
                  <tr key={c.id} className="border-b border-border-base hover:bg-surface-muted">
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-brand-bg/50 px-2.5 py-1 font-mono text-[11.5px] font-bold text-brand-dark">
                          {c.code}
                        </span>
                        <button
                          onClick={() => handleCopy(c.code, c.id)}
                          title="কোড কপি করুন"
                          className="rounded-md border border-border-base p-1 text-muted transition-brand hover:border-brand-primary hover:text-brand-primary"
                        >
                          {copiedId === c.id ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-success">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                              <rect x="9" y="9" width="13" height="13" rx="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="text-xs font-semibold text-ink">{formatDiscount(c)}</td>
                    <td className="text-xs text-muted">
                      {c.min_order_amount > 0 ? `৳${c.min_order_amount.toLocaleString()}+` : 'নেই'}
                    </td>
                    <td className="text-xs text-muted">{usageLabel}</td>
                    <td className={`text-xs ${status === 'expired' ? 'text-danger' : isExpiringSoon ? 'font-semibold text-warn' : 'text-muted'}`}>
                      {expiryLabel}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${STATUS_BADGE_CLASS[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                        <label
                          className={`relative inline-block h-5 w-[36px] shrink-0 ${status === 'expired' ? 'cursor-not-allowed opacity-40' : ''}`}
                          title={status === 'expired' ? 'মেয়াদ শেষ হওয়া কুপন চালু করা যায় না' : 'সক্রিয়/নিষ্ক্রিয়'}
                        >
                          <input
                            type="checkbox"
                            checked={c.is_active}
                            disabled={togglingId === c.id || status === 'expired'}
                            onChange={(e) => handleToggle(c, e.target.checked)}
                            className="peer h-0 w-0 opacity-0"
                          />
                          <span className="absolute inset-0 cursor-pointer rounded-full bg-[#D1D5DB] transition-brand before:absolute before:bottom-[2px] before:left-[2px] before:h-[16px] before:w-[16px] before:rounded-full before:bg-white before:shadow-md before:transition-brand peer-checked:bg-success peer-checked:before:translate-x-[16px]" />
                        </label>
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onEdit(c)}
                          className="rounded-md border border-border-base p-1.5 hover:border-brand-primary"
                          title="এডিট করুন"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
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

        <Pagination page={pageSafe} total={filtered.length} onPageChange={setPage} />
      </div>

      {deleteTarget && (
        <DeleteConfirmDialog
          code={deleteTarget.code}
          deleting={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
