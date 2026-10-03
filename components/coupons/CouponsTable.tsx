'use client';

import { useMemo, useState } from 'react';
import type { Coupon, CouponStatus } from '@/types';
import { toggleCouponActive, deleteCoupon } from '@/app/actions/coupons';
import {
  getCouponStatus,
  STATUS_LABEL,
  STATUS_BADGE_CLASS,
  formatDiscount,
  formatExpiryCountdown,
  TIER_LABEL,
} from '@/lib/coupons';
import { useToast } from '@/components/admin/Toast';
import Pagination, { PAGE_SIZE } from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';

interface Props {
  coupons: Coupon[];
  onEdit: (c: Coupon) => void;
  onAdd: () => void;
}

type FilterKey = 'all' | CouponStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'সব কুপন' },
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

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: coupons.length, active: 0, expired: 0, inactive: 0 };
    coupons.forEach((coupon) => {
      const st = getCouponStatus(coupon);
      c[st] = (c[st] || 0) + 1;
    });
    return c;
  }, [coupons]);

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

  const hasFilters = !!query || filter !== 'all';

  function onFilterChange(q: string, f: FilterKey) {
    setQuery(q);
    setFilter(f);
    setPage(1);
  }

  async function handleCopy(code: string, id: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      showToast(`কপিকৃত কোড: ${code}`);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
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
      showToast('❌ ডিলিট ব্যর্থ: ' + (res.message || 'ত্রুটি'));
      return;
    }
    showToast(`🗑️ ${deleteTarget.code} ডিলিট করা হয়েছে`);
    setDeleteTarget(null);
  }

  return (
    <div>
      {/* ══ ১. টুলবার কার্ড: সার্চ + অ্যাকশন বাটন + ফিল্টার চিপস ══ */}
      <div className="mb-4 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          {/* সার্চ ইনপুট */}
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
              onChange={(e) => onFilterChange(e.target.value, filter)}
              placeholder="কুপন কোড দিয়ে খুঁজুন..."
              className="h-11 w-full rounded-full border border-border-base/80 bg-surface-muted/50 pl-11 pr-10 font-body text-[13px] font-medium uppercase text-ink transition-all duration-brand placeholder:normal-case placeholder:text-muted/70 focus:bg-white lg:h-10"
            />
            {query && (
              <button
                type="button"
                onClick={() => onFilterChange('', filter)}
                aria-label="সার্চ মুছুন"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-border-base/70 text-muted transition-colors hover:bg-brand-light hover:text-white"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* নতুন কুপন বাটন */}
          <button
            type="button"
            onClick={onAdd}
            className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-brand-light px-6 font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.4)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] lg:h-10 lg:w-auto lg:text-[12.5px]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-3.5 w-3.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            নতুন কুপন
          </button>
        </div>

        {/* ফিল্টার চিপস (কাউন্টসহ সাইড-স্ক্রল) */}
        <div className="no-scrollbar -mx-3.5 mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 sm:-mx-4 sm:px-4">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count = counts[f.key] || 0;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => onFilterChange(query, f.key)}
                className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 font-body text-[12px] font-extrabold transition-all duration-brand active:scale-95 ${
                  active
                    ? 'border-brand-light bg-brand-light text-white shadow-[0_4px_14px_rgba(68,167,252,0.36)]'
                    : 'border-border-base/80 bg-white text-ink hover:border-brand-light hover:text-brand-light'
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`min-w-[22px] rounded-full px-1.5 text-center text-[10.5px] font-black leading-[18px] ${
                    active ? 'bg-white/25 text-white' : 'bg-surface-muted text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {hasFilters && (
            <button
              type="button"
              onClick={() => onFilterChange('', 'all')}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3.5 font-body text-[12px] font-extrabold text-danger transition-all duration-brand hover:bg-red-100 active:scale-95"
              title="ফিল্টার রিসেট করুন"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              রিসেট
            </button>
          )}
        </div>
      </div>

      {/* ══ ২. কুপন তালিকা: মোবাইলে কার্ড (<1024px), ডেস্কটপে টেবিল (≥1024px) ══ */}
      <div className="lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-white/90 lg:bg-white lg:shadow-sh1">
        {pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] border border-white/90 bg-white px-6 py-16 text-center shadow-sh1 lg:rounded-none lg:border-0 lg:shadow-none">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/15 text-brand-light">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <rect x="3" y="6" width="18" height="12" rx="3" />
                <path d="M3 10h18" strokeDasharray="3 3" />
              </svg>
            </span>
            <span className="font-body text-[14px] font-extrabold text-ink">কোনো কুপন পাওয়া যায়নি</span>
            <span className="font-body text-[12px] font-medium text-muted">সার্চ বা ফিল্টার পরিবর্তন করে দেখুন</span>
          </div>
        ) : (
          <>
            {/* ── মোবাইল কার্ড গ্রিড (<1024px) ── */}
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:hidden">
              {pageItems.map((c) => {
                const status = getCouponStatus(c);
                const isCopied = copiedId === c.id;
                const expiryLabel = formatExpiryCountdown(c.expires_at);
                const isExpiringSoon =
                  status === 'active' && !!c.expires_at && new Date(c.expires_at).getTime() - Date.now() < 86_400_000 * 3;
                const usageLabel =
                  c.max_uses_total != null ? `${c.used_count}/${c.max_uses_total} ব্যবহৃত` : `${c.used_count} বার`;

                return (
                  <article
                    key={c.id}
                    className="flex flex-col rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1 transition-all duration-brand"
                  >
                    {/* হেডার: কোড + কপি + স্ট্যাটাস পিল + টগল সুইচ */}
                    <div className="flex items-center justify-between gap-2 border-b border-border-base/60 pb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-xl border border-brand-light/30 bg-brand-light/10 px-2.5 py-1 font-mono text-[13px] font-black tracking-wider text-brand-light">
                          {c.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(c.code, c.id)}
                          title="কোড কপি করুন"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-surface-muted text-muted transition-all duration-brand hover:border-brand-light hover:text-brand-light active:scale-90"
                        >
                          {isCopied ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-success">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                              <rect x="9" y="9" width="13" height="13" rx="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 font-body text-[10.5px] font-extrabold ${STATUS_BADGE_CLASS[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                        <label
                          className={`relative inline-block h-6 w-[42px] shrink-0 cursor-pointer ${
                            status === 'expired' ? 'cursor-not-allowed opacity-40' : ''
                          }`}
                          title={status === 'expired' ? 'মেয়াদ শেষ হওয়া কুপন সক্রিয় করা যায় না' : 'সক্রিয়/নিষ্ক্রিয়'}
                        >
                          <input
                            type="checkbox"
                            checked={c.is_active}
                            disabled={togglingId === c.id || status === 'expired'}
                            onChange={(e) => handleToggle(c, e.target.checked)}
                            className="peer h-0 w-0 opacity-0"
                          />
                          <span className="absolute inset-0 rounded-full bg-border-base transition-all duration-brand before:absolute before:bottom-[3px] before:left-[3px] before:h-[18px] before:w-[18px] before:rounded-full before:bg-white before:shadow-md before:transition-all before:duration-brand peer-checked:bg-brand-light peer-checked:before:translate-x-[18px]" />
                        </label>
                      </div>
                    </div>

                    {/* ছাড়ের সুবিধা ও মেম্বারশিপ ট্যাগ */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="font-body text-[15px] font-black text-ink">{formatDiscount(c)}</span>
                      {c.required_tier && (
                        <span className="rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 font-body text-[10.5px] font-extrabold text-amber-800">
                          🔒 {TIER_LABEL[c.required_tier]}+ মেম্বার
                        </span>
                      )}
                    </div>

                    {/* ৩টি মেটা টাইল */}
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="min-w-0 rounded-xl border border-border-base/70 px-2 py-2 text-center">
                        <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">সর্বনিম্ন</div>
                        <div className="mt-0.5 truncate font-body text-[12px] font-extrabold text-ink">
                          {c.min_order_amount > 0 ? `৳${c.min_order_amount.toLocaleString('en-US')}` : 'সীমাহীন'}
                        </div>
                      </div>
                      <div className="min-w-0 rounded-xl border border-border-base/70 px-2 py-2 text-center">
                        <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">ব্যবহার</div>
                        <div className="mt-0.5 truncate font-body text-[12px] font-extrabold text-ink">{usageLabel}</div>
                      </div>
                      <div className="min-w-0 rounded-xl border border-border-base/70 px-2 py-2 text-center">
                        <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">মেয়াদ</div>
                        <div
                          className={`mt-0.5 truncate font-body text-[11.5px] font-extrabold ${
                            status === 'expired' ? 'text-danger' : isExpiringSoon ? 'text-[#92400E]' : 'text-muted'
                          }`}
                        >
                          {expiryLabel}
                        </div>
                      </div>
                    </div>

                    {/* মোবাইল অ্যাকশন বাটন সারি */}
                    <div className="mt-3.5 flex items-center gap-2 border-t border-border-base/60 pt-3">
                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-brand-light/40 bg-brand-light/10 font-body text-[13px] font-extrabold text-ink transition-all duration-brand active:scale-[0.98]"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-brand-light">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                        এডিট করুন
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(c)}
                        aria-label="কুপন মুছুন"
                        title="কুপন মুছুন"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-danger transition-all duration-brand active:scale-90"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* ── ডেস্কটপ টেবিল (≥1024px) ── */}
            <div className="hidden lg:block">
              <div className="sleek-scrollbar overflow-x-auto">
                <table className="w-full min-w-[920px] text-left">
                  <thead>
                    <tr className="border-b border-border-base/60 bg-brand-bg/30 font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
                      <th className="py-3.5 pl-5 pr-3">কুপন কোড</th>
                      <th className="px-3 py-3.5">ছাড়ের ধরন ও মান</th>
                      <th className="px-3 py-3.5">সর্বনিম্ন অর্ডার</th>
                      <th className="px-3 py-3.5">ব্যবহারসীমা</th>
                      <th className="px-3 py-3.5">মেয়াদ</th>
                      <th className="px-3 py-3.5">স্ট্যাটাস</th>
                      <th className="py-3.5 pl-3 pr-5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
                    {pageItems.map((c) => {
                      const status = getCouponStatus(c);
                      const isCopied = copiedId === c.id;
                      const expiryLabel = formatExpiryCountdown(c.expires_at);
                      const isExpiringSoon =
                        status === 'active' && !!c.expires_at && new Date(c.expires_at).getTime() - Date.now() < 86_400_000 * 3;
                      const usageLabel =
                        c.max_uses_total != null ? `${c.used_count} / ${c.max_uses_total}` : `${c.used_count} বার`;

                      return (
                        <tr key={c.id} className="transition-colors duration-brand hover:bg-brand-bg/25">
                          {/* কোড + কপি বাটন */}
                          <td className="py-3 pl-5 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="rounded-xl border border-brand-light/30 bg-brand-light/10 px-2.5 py-1 font-mono text-[12px] font-black tracking-wider text-brand-light">
                                {c.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(c.code, c.id)}
                                title="কপি করতে ক্লিক করুন"
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-base/80 bg-white text-muted transition-colors hover:border-brand-light hover:text-brand-light active:scale-90"
                              >
                                {isCopied ? (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-success">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                    <rect x="9" y="9" width="13" height="13" rx="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            {c.required_tier && (
                              <div className="mt-1">
                                <span className="rounded-full border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                                  🔒 {TIER_LABEL[c.required_tier]}+ মেম্বার
                                </span>
                              </div>
                            )}
                          </td>

                          {/* ছাড় */}
                          <td className="whitespace-nowrap px-3 py-3 font-extrabold text-ink">{formatDiscount(c)}</td>

                          {/* সর্বনিম্ন অর্ডার */}
                          <td className="whitespace-nowrap px-3 py-3 font-semibold text-muted">
                            {c.min_order_amount > 0 ? `৳${c.min_order_amount.toLocaleString('en-US')}` : 'সীমাহীন'}
                          </td>

                          {/* ব্যবহার */}
                          <td className="whitespace-nowrap px-3 py-3 font-bold text-ink">{usageLabel}</td>

                          {/* মেয়াদ */}
                          <td className="whitespace-nowrap px-3 py-3 font-medium">
                            <span className={status === 'expired' ? 'font-bold text-danger' : isExpiringSoon ? 'font-bold text-[#92400E]' : 'text-muted'}>
                              {expiryLabel}
                            </span>
                          </td>

                          {/* স্ট্যাটাস ও টগল */}
                          <td className="whitespace-nowrap px-3 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold ${STATUS_BADGE_CLASS[status]}`}>
                                {STATUS_LABEL[status]}
                              </span>
                              <label
                                className={`relative inline-block h-5 w-[38px] shrink-0 cursor-pointer ${
                                  status === 'expired' ? 'cursor-not-allowed opacity-40' : ''
                                }`}
                                title={status === 'expired' ? 'মেয়াদ শেষ হওয়া কুপন সক্রিয় করা যায় না' : 'সক্রিয়/নিষ্ক্রিয়'}
                              >
                                <input
                                  type="checkbox"
                                  checked={c.is_active}
                                  disabled={togglingId === c.id || status === 'expired'}
                                  onChange={(e) => handleToggle(c, e.target.checked)}
                                  className="peer h-0 w-0 opacity-0"
                                />
                                <span className="absolute inset-0 rounded-full bg-border-base transition-all duration-brand before:absolute before:bottom-[2px] before:left-[2px] before:h-[16px] before:w-[16px] before:rounded-full before:bg-white before:shadow-md before:transition-all before:duration-brand peer-checked:bg-brand-light peer-checked:before:translate-x-[18px]" />
                              </label>
                            </div>
                          </td>

                          {/* অ্যাকশন বাটন */}
                          <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onEdit(c)}
                                title="এডিট করুন"
                                aria-label="এডিট করুন"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-white shadow-[0_3px_10px_rgba(68,167,252,0.36)] transition-all duration-brand hover:bg-brand-light-hover active:scale-90"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(c)}
                                title="মুছে ফেলুন"
                                aria-label="মুছে ফেলুন"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-danger transition-all duration-brand hover:bg-danger hover:text-white active:scale-90"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                </svg>
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

        {/* পেজিনেশন */}
        {filtered.length > 0 && (
          <div className="mt-3 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1 lg:mt-0 lg:rounded-none lg:border-0 lg:border-t lg:border-border-base/60 lg:px-5 lg:shadow-none">
            <Pagination page={pageSafe} total={filtered.length} onPageChange={setPage} bare />
          </div>
        )}
      </div>

      {/* ══ ৩. সেন্ট্রাল কনফার্মেশন ডায়ালগ ══ */}
      {deleteTarget && (
        <ConfirmDialog
          title="কুপন ডিলিট করবেন?"
          message={
            <>
              <span className="font-extrabold text-ink">&ldquo;{deleteTarget.code}&rdquo;</span> কুপনটি স্থায়ীভাবে মুছে যাবে — এই কাজ আর ফিরিয়ে আনা যাবে না।
            </>
          }
          confirmLabel="হ্যাঁ, ডিলিট করুন"
          busyLabel="ডিলিট হচ্ছে..."
          busy={deleting}
          tone="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
