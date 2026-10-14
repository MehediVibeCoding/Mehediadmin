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
import SectionHeading from '@/components/common/SectionHeading';
import { RISK_META } from '@/components/orders/RiskBadge';
import OrderNotes from '@/components/orders/OrderNotes';
import ConfirmDialog from '@/components/common/ConfirmDialog';

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
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-light/[0.12]">
      {isImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={val} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-[22px] leading-none">{val}</span>
      )}
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
  // স্ট্যাটাস বদলের আগে নিশ্চিতকরণ: কোন স্ট্যাটাসে যেতে চাওয়া হয়েছে (null = ডায়ালগ বন্ধ)
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  // থ্রি-ডট মেনু (বাকি স্ট্যাটাসগুলো) খোলা কি না
  const [moreOpen, setMoreOpen] = useState(false);
  // ট্রাস্ট স্কোরের বিস্তারিত খোলা কি না (ডিফল্টে শুধু প্রথম সারি)
  const [riskOpen, setRiskOpen] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // কীবোর্ড শর্টকাট সবসময় সর্বশেষ order/স্ট্যাটাস দিয়ে কাজ করে (effect-এর [] deps-এর stale closure এড়াতে)
  const requestStatusRef = useRef<(s: OrderStatus) => void>(() => {});
  const pendingStatusRef = useRef<OrderStatus | null>(null);
  pendingStatusRef.current = pendingStatus;
  const closeConfirmRef = useRef<() => void>(() => {});

  const orderDate = new Date(order.created_at || Date.now());
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
      if (e.key === 'Escape') {
        // নিশ্চিতকরণ ডায়ালগ খোলা থাকলে Esc শুধু ডায়ালগ বন্ধ করে, মডাল নয়
        if (pendingStatusRef.current) {
          e.preventDefault();
          closeConfirmRef.current();
          return;
        }
        // নোটের ঘরে লেখা অসেভ লেখা থাকলে Esc শুধু ঘর থেকে বেরোয়, মডাল বন্ধ করে না — লেখা হারানো ঠেকাতে
        const t = e.target as HTMLElement | null;
        if (t && t.tagName === 'TEXTAREA' && (t as HTMLTextAreaElement).value.trim()) {
          (t as HTMLTextAreaElement).blur();
          return;
        }
        onCloseRef.current();
        return;
      }
      // Shift+C = কনফার্ম, Shift+X = রিজেক্ট (বাংলা কীবোর্ডেও কাজ করতে অক্ষর নয়, ফিজিক্যাল কী কোড)
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      if (typing) return;
      // ডায়ালগ খোলা থাকলে শর্টকাট চলবে না; নইলে শর্টকাটও আগে নিশ্চিতকরণ চাইবে (ভুল চাপে সরাসরি বদলায় না)
      if (pendingStatusRef.current) return;
      if (e.code === 'KeyC') {
        e.preventDefault();
        requestStatusRef.current('confirmed');
      } else if (e.code === 'KeyX') {
        e.preventDefault();
        requestStatusRef.current('rejected');
      }
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

  // কোনো স্ট্যাটাস বাছলে সরাসরি বদলায় না — আগে "নিশ্চিত?" ডায়ালগ আসে
  function requestStatusChange(status: OrderStatus) {
    if (status === order.status || changingTo || pendingStatus) return;
    setMoreOpen(false);
    setPendingStatus(status);
  }

  function closeConfirm() {
    if (changingTo) return;
    setPendingStatus(null);
  }

  async function confirmStatusChange() {
    const status = pendingStatus;
    if (!status || status === order.status || changingTo) return;
    setChangingTo(status);
    try {
      await onStatusChange(order.id, status);
    } finally {
      setChangingTo(null);
      setPendingStatus(null);
    }
  }

  requestStatusRef.current = requestStatusChange;
  closeConfirmRef.current = closeConfirm;

  const FLOW: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];
  const flowIdx = FLOW.indexOf(order.status);
  const isPending = order.status === 'pending';
  const cur = ORDER_STATUS_META[order.status];

  return (
    // z-[60] > নিচের ট্যাব বার (z-40) — তাই বার আর কখনো মোডালের উপরে/বোতামের উপরে আসে না
    <div
      className="animate-soft-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`অর্ডার ${order.order_num}`}
    >
      <div className="animate-sheet-up flex max-h-[94dvh] w-full max-w-[720px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] md:max-h-[90dvh] md:rounded-[28px] md:shadow-[0_24px_70px_rgba(26,26,26,0.28)] lg:max-w-[1040px]">
        {/* ══ হেডার (আটকে থাকে): অর্ডার নং · স্ট্যাটাস · তারিখ-সময় · ক্লোজ ══ */}
        <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.14] to-white px-5 pb-3.5 pt-2.5 md:pt-5">
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 md:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-body text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">অর্ডার ডিটেইলস</div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-body text-[28px] font-black leading-none tracking-tight text-ink">{order.order_num}</span>
                <StatusPill status={order.status} verification={order.payment_verified ? order.verification_method : null} />
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12.5px] font-bold text-ink">
                <span>{orderDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="h-1 w-1 rounded-full bg-brand-light" />
                <span className="text-muted">{orderDate.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="বন্ধ করুন"
              title="বন্ধ করুন"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sh1 transition-all duration-brand hover:bg-border-base active:scale-90 lg:h-10 lg:w-10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ══ বডি (স্ক্রল হয়): পড়ার ক্রম = টাকা → কে/কোথায় → কী কিনেছে → পেমেন্ট → নোট → সবশেষে স্ট্যাটাস ══ */}
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5"
          style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.2fr_1fr] lg:gap-x-8">
            {/* ─────────── বাম কলাম ─────────── */}
            <div className="min-w-0 space-y-7">
              {/* ডায়মন্ড মেম্বার */}
              {order.member_tier === 'diamond' && (
                <div className={`rounded-2xl border px-4 py-3.5 ${diamondPending ? 'border-brand-light/40 bg-brand-light/10' : 'border-border-base bg-surface-muted'}`}>
                  <div className="font-body text-[13.5px] font-black text-ink">ডায়মন্ড মেম্বার</div>
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

              {/* টাকার হিসাব — তিনটা বড় সংখ্যা */}
              <section aria-label="টাকার হিসাব">
                <div className="grid grid-cols-3 gap-2">
                  <MoneyTile label="মোট বিল" value={money(order.total || 0)} tone="ink" />
                  <MoneyTile label="অ্যাডভান্স" value={money(advancePaid)} tone="success" badge={tier2 ? '5%' : undefined} />
                  <MoneyTile label="বাকি (COD)" value={money(due)} tone="danger" />
                </div>
              </section>

              {/* গ্রাহক */}
              <section>
                <SectionHeading>গ্রাহকের তথ্য</SectionHeading>
                <div className="overflow-hidden rounded-2xl border border-border-base/80 bg-white shadow-sh1">
                  <div className="flex items-center gap-3 p-3.5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-light/15 font-body text-[19px] font-black text-brand-light" aria-hidden="true">
                      {(order.customer_name || '?').trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-body text-[16px] font-black leading-tight text-ink">{order.customer_name || '—'}</div>
                      <div className="mt-1 font-body text-[14px] font-bold tracking-wide text-muted">{order.customer_phone || '—'}</div>
                    </div>
                    {order.customer_phone && (
                      <div className="flex shrink-0 items-center gap-2">
                        <a
                          href={`tel:${order.customer_phone}`}
                          aria-label="কল করুন"
                          title="কল করুন"
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-white transition-all duration-brand active:scale-90 lg:h-10 lg:w-10"
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
                          </svg>
                        </a>
                        <button
                          type="button"
                          onClick={() => copyTxt(order.customer_phone)}
                          aria-label="ফোন নম্বর কপি করুন"
                          title="ফোন নম্বর কপি করুন"
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-light/40 bg-brand-light/10 text-ink transition-all duration-brand active:scale-90 lg:h-10 lg:w-10"
                        >
                          <CopyGlyph />
                        </button>
                      </div>
                    )}
                  </div>
                  <DetailRow label="জেলা" value={order.customer_district || '—'} />
                  <DetailRow label="ঠিকানা" value={order.customer_address || '—'} onCopy={order.customer_address ? () => copyTxt(order.customer_address) : undefined} />
                  {order.customer_email && <DetailRow label="ইমেইল" value={order.customer_email} onCopy={() => copyTxt(order.customer_email)} />}
                  <DetailRow label="পেমেন্ট তথ্য" value={payTxt} last />
                </div>
              </section>

              {/* প্রোডাক্ট তালিকা + হিসাব */}
              <section>
                <SectionHeading>প্রোডাক্ট তালিকা</SectionHeading>
                <div className="divide-y divide-border-base/70 overflow-hidden rounded-2xl border border-border-base/80 bg-white shadow-sh1">
                  {(order.items || []).length === 0 && (
                    <div className="px-4 py-5 text-center font-body text-[12.5px] font-medium text-muted">কোনো প্রোডাক্ট নেই</div>
                  )}
                  {(order.items || []).map((it, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-3">
                      <ItemThumb emoji={it.emoji} />
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 font-body text-[13px] font-extrabold leading-snug text-ink">{it.name}</div>
                        <div className="mt-1 flex items-center gap-1.5 font-body text-[11.5px] font-semibold text-muted">
                          <span>{money(it.price)}</span>
                          <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10.5px] font-extrabold text-ink">× {it.qty}</span>
                        </div>
                      </div>
                      <div className="shrink-0 whitespace-nowrap font-body text-[14px] font-black text-ink">{money(it.price * it.qty)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-2xl border border-border-base/80 bg-surface-muted/50 px-4">
                  <Row label="সাবটোটাল" value={money(order.subtotal || 0)} />
                  {hasDiscount && (
                    <Row
                      label={`কুপন ছাড়${order.coupon_code ? ` (${order.coupon_code})` : ''}`}
                      value={`-${money(order.discount_amount || 0)}`}
                      tone="success"
                    />
                  )}
                  <Row label="শিপিং চার্জ" value={order.shipping_cost ? money(order.shipping_cost) : 'ফ্রি'} />
                  <Row label="সর্বমোট" value={money(order.total || 0)} bold last={!tier2} />
                  {tier2 && (
                    <div className="pb-3 pt-0.5 text-right font-body text-[11px] font-medium italic leading-snug text-muted">
                      5% ডায়নামিক অ্যাডভান্স + 1.5% bKash ট্রানজেকশন ফি প্রযোজ্য হয়েছে
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* ─────────── ডান কলাম ─────────── */}
            <div className="min-w-0 space-y-7">
              {/* পেমেন্ট ভেরিফিকেশন */}
              <section>
                <SectionHeading>পেমেন্ট ভেরিফিকেশন</SectionHeading>
                <div className="space-y-2.5">
                  <VerifyBox label="bKash TXN ID" value={order.payment_txn} onCopy={copyTxt} />
                  <VerifyBox label="সেন্ডারের শেষ ৪ ডিজিট" value={order.payment_last4} onCopy={copyTxt} />
                  {order.verified_sender && <VerifyBox label="প্রেরকের পূর্ণ নম্বর (এসএমএস থেকে)" value={order.verified_sender} onCopy={copyTxt} />}
                  <VerifyBox label="ডিভাইস ফিঙ্গারপ্রিন্ট" value={order.fingerprint_id} onCopy={copyTxt} />
                  {(order.overpaid_amount || 0) > 0 && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 font-body text-[12.5px] font-bold text-emerald-800">
                      এই কাস্টমার {money(order.overpaid_amount || 0)} এক্সট্রা পাঠিয়েছে
                    </div>
                  )}
                </div>
              </section>

              {/* ট্রাস্ট স্কোর: ডিফল্টে শুধু প্রথম সারি; তীরে ক্লিক করলে বাকিটা খোলে (পুরনো অর্ডারে দেখায় না) */}
              {order.risk && (
                <section>
                  <SectionHeading>ট্রাস্ট স্কোর</SectionHeading>
                  <div className="rounded-2xl border border-border-base bg-white shadow-sh1">
                    <button
                      type="button"
                      onClick={() => setRiskOpen((v) => !v)}
                      aria-expanded={riskOpen}
                      aria-label={riskOpen ? 'ট্রাস্ট স্কোরের বিস্তারিত বন্ধ করুন' : 'ট্রাস্ট স্কোরের বিস্তারিত দেখুন'}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl p-3.5 text-left transition-all duration-brand active:scale-[0.99]"
                    >
                      <span className={`flex min-w-0 items-center gap-2 font-body text-[15px] font-black ${RISK_META[order.risk.level].text}`}>
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${RISK_META[order.risk.level].dot}`} />
                        {RISK_META[order.risk.level].label}
                      </span>
                      <span className="flex shrink-0 items-center gap-2.5 font-body">
                        <span>
                          <span className="text-[22px] font-black leading-none tracking-tight text-ink">{order.risk.score}</span>
                          <span className="text-[12px] font-bold text-muted">/100</span>
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`text-muted transition-transform duration-brand ${riskOpen ? 'rotate-180' : ''}`}
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </button>

                    {riskOpen && (
                      <div className="border-t border-border-base/50 px-3.5 pb-3.5 pt-3">
                        <p className="font-body text-[12px] font-semibold leading-snug text-muted">{RISK_META[order.risk.level].hint}</p>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                          <div className={`h-full rounded-full ${RISK_META[order.risk.level].bar}`} style={{ width: `${Math.max(2, Math.min(100, order.risk.score))}%` }} />
                        </div>

                        {order.risk.hard_limit && (
                          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-body text-[12px] font-bold leading-snug text-red-700">
                            লিমিট ভাঙার রেকর্ড আছে — স্কোর যাই হোক, এই অর্ডার সরাসরি লাল ধরা হয়েছে।
                          </div>
                        )}

                        {order.risk.breakdown.length > 0 && (
                          <ul className="mt-3 divide-y divide-border-base/50">
                            {order.risk.breakdown.map((f) => (
                              <li key={f.key} className="flex items-start gap-2.5 py-2">
                                <span className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${f.tone === 'good' ? 'bg-success' : f.tone === 'warn' ? 'bg-warn' : 'bg-danger'}`} />
                                <div className="min-w-0 flex-1">
                                  <div className="font-body text-[12.5px] font-extrabold text-ink">{f.label}</div>
                                  <div className="font-body text-[11.5px] font-medium leading-snug text-muted">{f.note}</div>
                                </div>
                                <span className="shrink-0 font-body text-[12px] font-black text-ink/80">
                                  {f.points}/{f.max}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {(order.ip || order.risk.ip_city) && (
                          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 border-t border-border-base/50 pt-2.5 font-body text-[11.5px] font-semibold text-muted">
                            {order.ip && <span>আইপি: {order.ip}</span>}
                            {order.risk.ip_city && <span>আইপি লোকেশন: {order.risk.ip_city}</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* অ্যাডমিন নোট (শুধু এখানেই দেখায়; অর্ডার বদলালে নতুন করে লোড হয়) */}
              <OrderNotes key={order.id} orderId={order.id} />
            </div>

            {/* ─────────── সবশেষে, পুরো প্রস্থে: স্ট্যাটাস ───────────
                স্ট্যাটাস সবসময় একদম নিচে — আগে কে/কীভাবে/কোথায় অর্ডার করেছে পড়ে তবেই বদলাতে হয়। */}
            <section className="lg:col-span-2 lg:border-t lg:border-border-base/60 lg:pt-6">
              <SectionHeading hint="উপরের সব তথ্য দেখে নিশ্চিত হয়ে তারপর স্ট্যাটাস বদলান। প্রতিটা বদলের আগে আরেকবার নিশ্চিত করতে বলবে।">
                স্ট্যাটাস পরিবর্তন
              </SectionHeading>

              {/* ধাপ-রেখা: Pending → Confirmed → Shipped → Delivered */}
              {flowIdx >= 0 ? (
                <ol className="mb-4 flex items-center" aria-label="অর্ডারের ধাপ">
                  {FLOW.map((st, k) => {
                    const done = k <= flowIdx;
                    const m = ORDER_STATUS_META[st];
                    return (
                      <li key={st} className="flex min-w-0 flex-1 items-center last:flex-none">
                        <span className="flex flex-col items-center gap-1">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${done ? 'border-brand-light bg-brand-light text-white' : 'border-border-base bg-white text-transparent'} ${k === flowIdx ? 'ring-4 ring-brand-light/20' : ''}`}
                            aria-current={k === flowIdx ? 'step' : undefined}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                          <span className={`font-body text-[10.5px] font-extrabold ${k === flowIdx ? 'text-ink' : 'text-muted'}`}>{m.label}</span>
                        </span>
                        {k < FLOW.length - 1 && <span className={`mx-1.5 mb-4 h-0.5 min-w-[12px] flex-1 rounded-full ${k < flowIdx ? 'bg-brand-light' : 'bg-border-base'}`} />}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="mb-4 rounded-2xl border px-4 py-3 font-body text-[13px] font-extrabold" style={{ background: cur.bg, borderColor: cur.dot, color: cur.text }}>
                  {order.status === 'cancelled' ? 'এই অর্ডার বাতিল (Cancelled) করা হয়েছে' : 'এই অর্ডার রিজেক্ট (Rejected) করা হয়েছে'}
                </div>
              )}

              {isPending ? (
                /* কোনো স্ট্যাটাস এখনো বাছা হয়নি — সবগুলো একসাথে দেখায় */
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ORDER_STATUS_ORDER.map((st) => {
                    const m = ORDER_STATUS_META[st];
                    const isCur = st === order.status;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => requestStatusChange(st)}
                        disabled={isCur || !!changingTo}
                        aria-current={isCur ? 'true' : undefined}
                        style={isCur ? { background: m.bg, borderColor: m.dot, color: m.text } : undefined}
                        className={`flex h-12 items-center justify-center gap-2 rounded-2xl border-[1.5px] px-3 font-body text-[13px] font-extrabold transition-all duration-brand active:scale-95 disabled:cursor-default ${
                          isCur ? '' : 'border-border-base bg-white text-ink hover:border-brand-light disabled:opacity-60'
                        }`}
                      >
                        {isCur ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.dot }} />
                        )}
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* একটা স্ট্যাটাস বাছা হয়ে গেছে — বাছাইটা বড়, বাকিগুলো থ্রি-ডটের পেছনে (ভুল ক্লিক ঠেকাতে) */
                <>
                  <div className="flex items-stretch gap-2.5">
                    <div
                      style={{ background: cur.bg, borderColor: cur.dot, color: cur.text }}
                      className="flex h-14 min-w-0 flex-1 items-center justify-center gap-2.5 rounded-2xl border-[1.5px] px-4 font-body text-[15px] font-black"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {cur.label}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMoreOpen((v) => !v)}
                      disabled={!!changingTo}
                      aria-label="অন্য স্ট্যাটাস দেখুন"
                      title="অন্য স্ট্যাটাস দেখুন"
                      aria-expanded={moreOpen}
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[1.5px] transition-all duration-brand active:scale-95 disabled:opacity-60 ${
                        moreOpen ? 'border-brand-light bg-brand-light/10 text-brand-light' : 'border-border-base bg-white text-ink hover:border-brand-light'
                      }`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="5" cy="12" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                      </svg>
                    </button>
                  </div>

                  {moreOpen && (
                    <div className="animate-soft-fade-in mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {ORDER_STATUS_ORDER.filter((st) => st !== order.status).map((st) => {
                        const m = ORDER_STATUS_META[st];
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => requestStatusChange(st)}
                            className="flex h-12 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-border-base bg-white px-3 font-body text-[13px] font-extrabold text-ink transition-all duration-brand hover:border-brand-light active:scale-95"
                          >
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.dot }} />
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              <p className="mt-3 hidden font-body text-[11px] font-semibold text-muted md:block">
                কীবোর্ড: Shift+C কনফার্ম · Shift+X রিজেক্ট (আগে নিশ্চিত করতে বলবে) · J / K পরের / আগের অর্ডার · Esc বন্ধ
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-4 h-12 w-full rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98]"
              >
                বন্ধ করুন
              </button>
            </section>
          </div>
        </div>
      </div>

      {pendingStatus && (
        <ConfirmDialog
          title="স্ট্যাটাস বদলাবেন?"
          message={
            <>
              এই অর্ডারের স্ট্যাটাস <b>{ORDER_STATUS_META[order.status].label}</b> থেকে <b>{ORDER_STATUS_META[pendingStatus].label}</b> করতে চান? এটা কি সত্যিই করবেন?
            </>
          }
          confirmLabel="হ্যাঁ, বদলান"
          busyLabel="বদলাচ্ছে..."
          busy={!!changingTo}
          tone={pendingStatus === 'rejected' || pendingStatus === 'cancelled' ? 'danger' : 'brand'}
          onConfirm={confirmStatusChange}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}

function MoneyTile({ label, value, tone, badge }: { label: string; value: string; tone: 'ink' | 'success' | 'danger'; badge?: string }) {
  const box =
    tone === 'success'
      ? 'border-emerald-200/80 bg-emerald-50/70'
      : tone === 'danger'
        ? 'border-red-200/80 bg-red-50/70'
        : 'border-border-base/80 bg-surface-muted/70';
  const txt = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-ink';
  return (
    <div className={`min-w-0 rounded-2xl border px-3 py-3 ${box}`}>
      <div className="flex items-center gap-1 font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">
        <span className="truncate">{label}</span>
        {badge && <span className="rounded-full bg-purple-100 px-1.5 text-[9px] font-black leading-[14px] text-purple-700">{badge}</span>}
      </div>
      <div className={`mt-1 truncate font-body text-[19px] font-black leading-tight tracking-tight sm:text-[22px] ${txt}`}>{value}</div>
    </div>
  );
}

function DetailRow({ label, value, onCopy, last }: { label: string; value: string; onCopy?: () => void; last?: boolean }) {
  const inner = (
    <>
      <span className="w-[68px] shrink-0 pt-0.5 font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">{label}</span>
      <span className="min-w-0 flex-1 break-words font-body text-[14px] font-bold leading-snug text-ink">{value}</span>
      {onCopy && <CopyGlyph />}
    </>
  );
  const cls = `flex w-full items-start gap-3 border-t border-border-base/60 px-3.5 py-3 text-left ${last ? '' : ''}`;
  return onCopy ? (
    <button type="button" onClick={onCopy} className={`${cls} transition-colors duration-brand active:bg-brand-bg/30`} title="কপি করতে ট্যাপ করুন">
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function VerifyBox({ label, value, onCopy }: { label: string; value?: string | null; onCopy: (t: string) => void }) {
  const has = !!value;
  return (
    <div className="rounded-2xl border border-border-base/80 bg-white p-2.5 shadow-sh1">
      <div className="mb-1.5 px-1 font-body text-[10.5px] font-extrabold uppercase tracking-wide text-muted">{label}</div>
      {has ? (
        <button
          type="button"
          onClick={() => onCopy(value!)}
          className="flex w-full items-center justify-between gap-2 rounded-xl bg-surface-muted/70 px-3 py-2.5 text-left font-mono text-[12.5px] font-semibold text-ink transition-all duration-brand active:bg-brand-bg/40"
          title="কপি করতে ট্যাপ করুন"
        >
          <span className="min-w-0 break-all">{value}</span>
          <CopyGlyph />
        </button>
      ) : (
        <div className="rounded-xl bg-surface-muted/50 px-3 py-2.5 font-mono text-[12.5px] text-muted">N/A</div>
      )}
    </div>
  );
}

function Row({ label, value, bold, tone, last }: { label: string; value: string; bold?: boolean; tone?: 'success' | 'danger'; last?: boolean }) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-ink';
  return (
    <div className={`flex items-center justify-between gap-3 py-3 font-body ${last ? '' : 'border-b border-border-base/70'}`}>
      <span className={`text-[13px] ${bold ? 'font-black text-ink' : 'font-semibold text-muted'}`}>{label}</span>
      <span className={bold ? 'text-[17px] font-black text-ink' : `text-[14px] font-extrabold ${toneClass}`}>{value}</span>
    </div>
  );
}
