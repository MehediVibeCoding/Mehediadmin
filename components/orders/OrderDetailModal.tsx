'use client';

import { useEffect, useRef, useState } from 'react';
import type { Order, OrderStatus } from '@/types';
import {
  ORDER_STATUS_META,
  ORDER_STATUS_ORDER,
  getOrderAdvance,
  getOrderDueCOD,
  isAdvanceTier2,
  needsDiamondAction,
} from '@/lib/orders';
import { useToast } from '@/components/admin/Toast';
import StatusPill from '@/components/admin/StatusPill';

interface Props {
  order: Order;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>;
}

const money = (n: number) => '৳' + (n || 0).toLocaleString('en-US');

function ItemThumb({ emoji }: { emoji?: string }) {
  const val = emoji || '📦';
  const isImg = val.startsWith('http') || val.startsWith('/');
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-light/12">
      {isImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={val} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-[22px] leading-none">{val}</span>
      )}
    </div>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-light/12 text-brand-light">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-[13px] w-[13px]">
          {icon}
        </svg>
      </span>
      {children}
    </div>
  );
}

function CopyGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted/60">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export default function OrderDetailModal({ order, onClose, onStatusChange }: Props) {
  const { showToast } = useToast();
  const [changingTo, setChangingTo] = useState<OrderStatus | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const payTxt = order.payment_txn
    ? 'TXN: ' + order.payment_txn
    : order.payment_last4
      ? 'শেষ ৪ ডিজিট: ' + order.payment_last4
      : '—';
  const advancePaid = getOrderAdvance(order);
  const due = getOrderDueCOD(order);
  const tier2 = isAdvanceTier2(order);
  const hasDiscount = (order.discount_amount || 0) > 0;
  const diamondPending = needsDiamondAction(order);

  // ব্যাকগ্রাউন্ড স্ক্রল লক + Esc দিয়ে বন্ধ
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  async function copyTxt(t: string) {
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      showToast('✅ কপি: ' + t);
    } catch {
      showToast('✅ কপি হয়েছে');
    }
  }

  async function handleStatusClick(status: OrderStatus) {
    if (status === order.status || changingTo) return;
    setChangingTo(status);
    try {
      await onStatusChange(order.id, status);
    } finally {
      setChangingTo(null);
    }
  }

  return (
    // z-[60] > নিচের ট্যাব বার (z-40) — তাই বার আর কখনো মোডালের উপরে/বোতামের উপরে আসে না
    <div
      className="animate-soft-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`অর্ডার ${order.order_num}`}
    >
      <div className="animate-sheet-up flex max-h-[94dvh] w-full max-w-[720px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] md:max-h-[90dvh] md:rounded-[28px] md:shadow-[0_24px_70px_rgba(26,26,26,0.28)]">
        {/* ══ হেডার (আটকে থাকে): হ্যান্ডেল · অর্ডার নং · স্ট্যাটাস · ক্লোজ ══ */}
        <div className="shrink-0 border-b border-border-base/70 px-5 pb-4 pt-2.5 md:pt-5">
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-border-base md:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-body text-[22px] font-black leading-tight tracking-tight text-ink">{order.order_num}</div>
              <div className="mt-1.5 flex items-center gap-1.5 font-body text-[12px] font-semibold text-muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
                  <path d="M3 9.5h18" />
                  <path d="M8 2.5v4M16 2.5v4" />
                </svg>
                {new Date(order.created_at || Date.now()).toLocaleDateString('bn-BD', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusPill status={order.status} />
              <button
                type="button"
                onClick={onClose}
                aria-label="বন্ধ করুন"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-ink transition-all duration-brand hover:bg-border-base active:scale-90"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ══ বডি (স্ক্রল হয়) ══ */}
        <div
          className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 pt-5"
          style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* ডায়মন্ড মেম্বার */}
          {order.member_tier === 'diamond' && (
            <div
              className={`rounded-2xl border px-4 py-3.5 ${
                diamondPending ? 'border-brand-light/40 bg-brand-light/10' : 'border-border-base bg-surface-muted'
              }`}
            >
              <div className="flex items-center gap-2 font-body text-[13.5px] font-black text-ink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] text-brand-light">
                  <path d="M6 3h12l4 6-10 12L2 9z" />
                  <path d="M2 9h20M12 21 8 9l4-6 4 6z" />
                </svg>
                ডায়মন্ড মেম্বার
              </div>
              {diamondPending ? (
                <ul className="mt-2 space-y-1 font-body text-[12.5px] font-semibold leading-snug text-ink/80">
                  <li>• সবার আগে ১ দিনের মধ্যে কুরিয়ারে হ্যান্ডওভার দিন</li>
                  <li>• পার্সেলে একটা সারপ্রাইজ গ্যাজেট গিফট ঢোকান</li>
                </ul>
              ) : (
                <p className="mt-1.5 font-body text-[12px] font-medium text-muted">এই অর্ডারের ডায়মন্ড সুবিধা দেওয়ার সময় পার হয়ে গেছে।</p>
              )}
            </div>
          )}

          {/* ── গ্রাহকের তথ্য ── */}
          <section>
            <SectionTitle icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>}>
              গ্রাহকের তথ্য
            </SectionTitle>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <InfoTile
                label="গ্রাহক"
                value={order.customer_name || '—'}
                onCopy={() => copyTxt(order.customer_name || '')}
                icon={<><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></>}
              />
              <InfoTile
                label="ফোন"
                value={order.customer_phone || '—'}
                onCopy={() => copyTxt(order.customer_phone || '')}
                icon={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />}
              />
              <InfoTile
                label="জেলা"
                value={order.customer_district || '—'}
                icon={<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>}
              />
              <InfoTile
                label="পেমেন্ট তথ্য"
                value={payTxt}
                icon={<><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20" /></>}
              />
              <InfoTile
                label="ঠিকানা"
                value={order.customer_address || '—'}
                onCopy={() => copyTxt(order.customer_address || '')}
                icon={<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />}
                full
              />
            </div>
          </section>

          {/* ── প্রোডাক্ট তালিকা ── */}
          <section>
            <SectionTitle icon={<><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /></>}>
              প্রোডাক্ট তালিকা
            </SectionTitle>
            <div className="divide-y divide-border-base/70 overflow-hidden rounded-2xl border border-border-base/80">
              {(order.items || []).length === 0 && (
                <div className="px-4 py-5 text-center font-body text-[12.5px] font-medium text-muted">কোনো প্রোডাক্ট নেই</div>
              )}
              {(order.items || []).map((it, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3">
                  <ItemThumb emoji={it.emoji} />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 font-body text-[13px] font-extrabold leading-snug text-ink">{it.name}</div>
                    <div className="mt-1 font-body text-[11.5px] font-semibold text-muted">
                      {money(it.price)} × {it.qty}
                    </div>
                  </div>
                  <div className="shrink-0 whitespace-nowrap font-body text-[14px] font-black text-ink">{money(it.price * it.qty)}</div>
                </div>
              ))}
            </div>

            {/* সামারি */}
            <div className="mt-3 rounded-2xl border border-border-base/80 bg-white px-4">
              <Row label="সাবটোটাল" value={money(order.subtotal || 0)} />
              {hasDiscount && (
                <Row
                  label={`কুপন ছাড়${order.coupon_code ? ` (${order.coupon_code})` : ''}`}
                  value={`-${money(order.discount_amount || 0)}`}
                  tone="success"
                />
              )}
              <Row label="শিপিং চার্জ" value={order.shipping_cost ? money(order.shipping_cost) : 'ফ্রি'} />
              <Row label="সর্বমোট" value={money(order.total || 0)} bold />
              <Row label="পরিশোধিত অ্যাডভান্স" value={money(advancePaid)} tone="success" />
              <Row label="বাকি (ডেলিভারিতে)" value={money(due)} tone="danger" last={!tier2} />
              {tier2 && (
                <div className="pb-3 pt-0.5 text-right font-body text-[11px] font-medium italic leading-snug text-muted">
                  5% ডায়নামিক অ্যাডভান্স + 1.5% bKash ট্রানজেকশন ফি প্রযোজ্য হয়েছে
                </div>
              )}
            </div>
          </section>

          {/* ── পেমেন্ট ভেরিফিকেশন ── */}
          <section>
            <SectionTitle icon={<><path d="M9 12l2 2 4-4" /><path d="M12 3c-2.5 2-5.5 3-9 3v6c0 5 3.5 8.5 9 10 5.5-1.5 9-5 9-10V6c-3.5 0-6.5-1-9-3Z" /></>}>
              পেমেন্ট ভেরিফিকেশন
            </SectionTitle>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <VerifyBox label="bKash TXN ID" value={order.payment_txn} onCopy={copyTxt} />
              <VerifyBox label="সেন্ডারের শেষ ৪ ডিজিট" value={order.payment_last4} onCopy={copyTxt} />
              <VerifyBox label="ডিভাইস ফিঙ্গারপ্রিন্ট" value={order.fingerprint_id} onCopy={copyTxt} />
            </div>
          </section>

          {/* ── স্ট্যাটাস পরিবর্তন ── */}
          <section className="border-t border-border-base/70 pt-5">
            <div className="mb-3 text-center font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
              স্ট্যাটাস পরিবর্তন করুন
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {ORDER_STATUS_ORDER.map((s) => {
                const m = ORDER_STATUS_META[s];
                const active = s === order.status;
                const busy = changingTo === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={busy}
                    onClick={() => handleStatusClick(s)}
                    style={active ? { background: m.bg, borderColor: m.dot, color: m.text } : undefined}
                    className={`flex h-12 items-center justify-center gap-2 rounded-2xl border-[1.5px] px-3 font-body text-[13px] font-extrabold transition-all duration-brand active:scale-95 disabled:opacity-60 ${
                      active ? '' : 'border-border-base bg-white text-ink hover:border-brand-light'
                    }`}
                  >
                    {active ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.dot }} />
                    )}
                    {busy ? '...' : m.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-3 h-12 w-full rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98]"
            >
              বন্ধ করুন
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  label,
  value,
  onCopy,
  icon,
  full,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  icon: React.ReactNode;
  full?: boolean;
}) {
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light/12 text-brand-light">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]">
          {icon}
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-body text-[10.5px] font-bold uppercase tracking-wide text-muted">{label}</span>
        <span className="mt-0.5 block break-words font-body text-[14px] font-extrabold leading-snug text-ink">{value}</span>
      </span>
      {onCopy && <CopyGlyph />}
    </>
  );
  const cls = `flex items-center gap-3 rounded-2xl border border-border-base/80 bg-surface-muted/60 p-3 text-left ${
    full ? 'sm:col-span-2' : ''
  }`;
  return onCopy ? (
    <button type="button" onClick={onCopy} className={`${cls} transition-all duration-brand active:scale-[0.99] active:bg-brand-bg/40`} title="কপি করতে ট্যাপ করুন">
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function VerifyBox({ label, value, onCopy }: { label: string; value?: string | null; onCopy: (t: string) => void }) {
  const has = !!value;
  return (
    <div className="rounded-2xl border border-border-base/80 bg-surface-muted/60 p-3">
      <div className="mb-1.5 font-body text-[10.5px] font-bold uppercase tracking-wide text-muted">{label}</div>
      {has ? (
        <button
          type="button"
          onClick={() => onCopy(value!)}
          className="flex w-full items-center justify-between gap-2 rounded-xl bg-white px-3 py-2.5 text-left font-mono text-[12.5px] font-semibold text-ink transition-all duration-brand active:bg-brand-bg/40"
          title="কপি করতে ট্যাপ করুন"
        >
          <span className="min-w-0 break-all">{value}</span>
          <CopyGlyph />
        </button>
      ) : (
        <div className="rounded-xl bg-white px-3 py-2.5 font-mono text-[12.5px] text-muted">N/A</div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
  last,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: 'success' | 'danger';
  last?: boolean;
}) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-ink';
  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 font-body ${last ? '' : 'border-b border-border-base/70'}`}
    >
      <span className={`text-[13px] ${bold ? 'font-black text-ink' : 'font-semibold text-muted'}`}>{label}</span>
      <span className={bold ? 'text-[17px] font-black text-ink' : `text-[14px] font-extrabold ${toneClass}`}>{value}</span>
    </div>
  );
}
