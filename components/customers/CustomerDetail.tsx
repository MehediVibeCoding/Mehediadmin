'use client';

import { useEffect, useRef, useState } from 'react';
import type { Customer, OrderStatus } from '@/types';
import { getCustomerDetail, type CustomerDetailResult } from '@/app/actions/customers';
import { useToast } from '@/components/admin/Toast';
import StatusPill from '@/components/admin/StatusPill';
import SectionHeading from '@/components/common/SectionHeading';
import { formatDateBn } from '@/lib/dateFormat';

interface Props {
  customer: Customer;
  onClose: () => void;
  /** কোনো অর্ডারে ট্যাপ করলে — অর্ডারের পূর্ণ ডিটেইল খোলার দায়িত্ব পেজের */
  onOpenOrder: (orderId: string) => void;
  /** অর্ডার ডিটেইল খোলা থাকলে Esc এখানে কাজ করবে না (শুধু উপরের মডাল বন্ধ হবে) */
  suspendEsc?: boolean;
  openingOrderId?: string | null;
  /** বাড়ালে ডিটেইল নীরবে আবার লোড হয় (যেমন অর্ডারের স্ট্যাটাস বদলের পর) */
  refreshKey?: number;
}

const money = (n: number) => '৳' + Math.round(n || 0).toLocaleString('en-US');
const ORDERS_PREVIEW = 8;

function Thumb({ emoji }: { emoji?: string }) {
  const val = emoji || '📦';
  const isImg = val.startsWith('http') || val.startsWith('/');
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-light/[0.12]">
      {isImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={val} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-[20px] leading-none">{val}</span>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border-base/80 bg-surface-muted/60 px-3 py-2.5">
      <div className="truncate font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 truncate font-body text-[17px] font-black leading-tight tracking-tight text-ink">{value}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-2xl bg-black/[.06]" />
      ))}
    </div>
  );
}

export default function CustomerDetail({ customer, onClose, onOpenOrder, suspendEsc = false, openingOrderId = null, refreshKey = 0 }: Props) {
  const { showToast } = useToast();
  const [detail, setDetail] = useState<CustomerDetailResult | null>(null);
  const [error, setError] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const suspendRef = useRef(suspendEsc);
  suspendRef.current = suspendEsc;

  // কাস্টমার বদলালে আগেরটা মুছে স্কেলিটন
  useEffect(() => {
    setDetail(null);
    setError(false);
    setShowAll(false);
  }, [customer.phone, customer.name]);

  // লোড (refreshKey বাড়লে নীরবে নতুন — স্কেলিটন ঝলকায় না)
  useEffect(() => {
    let cancelled = false;
    getCustomerDetail({ phone: customer.phone, name: customer.name })
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [customer.phone, customer.name, refreshKey]);

  // ব্যাকগ্রাউন্ড স্ক্রল লক + Esc (শুধু ডিটেইল/ভিউ মডাল — তাই Esc চলে)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !suspendRef.current) onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  async function copy(t: string) {
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      showToast('✅ কপি: ' + t);
    } catch {
      showToast('✅ কপি হয়েছে');
    }
  }

  const avg = customer.order_count > 0 ? customer.total_spent / customer.order_count : 0;
  const orders = detail?.orders ?? [];
  const visibleOrders = showAll ? orders : orders.slice(0, ORDERS_PREVIEW);
  const iconBtn =
    'flex h-11 w-11 items-center justify-center rounded-full transition-all duration-brand active:scale-90 lg:h-10 lg:w-10';

  return (
    <div
      className="animate-soft-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] lg:items-stretch lg:justify-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`কাস্টমার ${customer.name || customer.phone}`}
    >
      <div className="animate-sheet-up flex max-h-[94dvh] w-full max-w-[600px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] lg:h-full lg:max-h-none lg:max-w-[480px] lg:animate-none lg:rounded-none lg:rounded-l-[28px] lg:shadow-[0_24px_70px_rgba(26,26,26,0.28)]">
        {/* হেডার (আটকে থাকে) */}
        <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.14] to-white px-5 pb-4 pt-2.5 lg:pt-5">
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 lg:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-body text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">কাস্টমার</div>
              <div className="mt-2 flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-light/15 font-body text-[19px] font-black text-brand-light" aria-hidden="true">
                  {(customer.name || '?').trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-body text-[20px] font-black leading-tight tracking-tight text-ink">{customer.name || '—'}</div>
                  <div className="mt-0.5 font-body text-[13.5px] font-bold tracking-wide text-muted">{customer.phone || 'ফোন নেই'}</div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="বন্ধ করুন"
              title="বন্ধ করুন"
              className={`${iconBtn} shrink-0 bg-white text-ink shadow-sh1 hover:bg-border-base`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {customer.phone && (
            <div className="mt-3.5 grid grid-cols-2 gap-2">
              <a
                href={`tel:${customer.phone}`}
                className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand-light font-body text-[13px] font-black text-white transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
                </svg>
                কল করুন
              </a>
              <button
                type="button"
                onClick={() => copy(customer.phone)}
                className="flex h-11 items-center justify-center gap-2 rounded-full border border-brand-light/40 bg-brand-light/10 font-body text-[13px] font-extrabold text-ink transition-all duration-brand active:scale-[0.98]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                নম্বর কপি
              </button>
            </div>
          )}
        </div>

        {/* বডি (স্ক্রল হয়) */}
        <div
          className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 pt-5"
          style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* সারাংশ — তালিকার তথ্য থেকে সাথে সাথেই */}
          <section aria-label="সারাংশ">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="মোট অর্ডার" value={`${customer.order_count}টি`} />
              <Stat label="মোট খরচ" value={money(customer.total_spent)} />
              <Stat label="গড় অর্ডার" value={money(avg)} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Stat label="প্রথম অর্ডার" value={detail ? formatDateBn(detail.firstOrderAt) : '...'} />
              <Stat label="শেষ অর্ডার" value={formatDateBn(customer.last_order_date)} />
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-body text-[12.5px] font-bold text-red-700">
              বিস্তারিত লোড করা যায়নি — বন্ধ করে আবার খুলুন
            </div>
          )}

          {!detail && !error && <Skeleton />}

          {detail && (
            <>
              {/* যোগাযোগ ও ঠিকানা */}
              <section>
                <SectionHeading>যোগাযোগ ও ঠিকানা</SectionHeading>
                <div className="divide-y divide-border-base/60 overflow-hidden rounded-2xl border border-border-base/80 bg-white shadow-sh1">
                  {customer.email && (
                    <button
                      type="button"
                      onClick={() => copy(customer.email)}
                      className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors duration-brand active:bg-brand-bg/30"
                      title="কপি করতে ট্যাপ করুন"
                    >
                      <span className="w-[68px] shrink-0 pt-0.5 font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">ইমেইল</span>
                      <span className="min-w-0 flex-1 break-all font-body text-[13.5px] font-bold text-ink">{customer.email}</span>
                    </button>
                  )}
                  {detail.addresses.length === 0 && !customer.email && (
                    <div className="px-4 py-4 text-center font-body text-[12.5px] font-medium text-muted">কোনো তথ্য নেই</div>
                  )}
                  {detail.addresses.map((a, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => copy([a.address, a.district].filter(Boolean).join(', '))}
                      className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors duration-brand active:bg-brand-bg/30"
                      title="কপি করতে ট্যাপ করুন"
                    >
                      <span className="w-[68px] shrink-0 pt-0.5 font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">
                        {i === 0 ? 'ঠিকানা' : 'আগের'}
                      </span>
                      <span className="min-w-0 flex-1 break-words font-body text-[13.5px] font-bold leading-snug text-ink">
                        {a.address || '—'}
                        {a.district && <span className="mt-0.5 block text-[12px] font-semibold text-muted">{a.district}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* যা যা কিনেছে */}
              <section>
                <SectionHeading hint="বাতিল ও রিজেক্ট হওয়া অর্ডার বাদে">কী কী কিনেছে</SectionHeading>
                <div className="divide-y divide-border-base/70 overflow-hidden rounded-2xl border border-border-base/80 bg-white shadow-sh1">
                  {detail.products.length === 0 && (
                    <div className="px-4 py-5 text-center font-body text-[12.5px] font-medium text-muted">কোনো প্রোডাক্ট নেই</div>
                  )}
                  {detail.products.map((p) => (
                    <div key={p.name} className="flex items-center gap-3 px-3 py-2.5">
                      <Thumb emoji={p.emoji} />
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 font-body text-[13px] font-extrabold leading-snug text-ink">{p.name}</div>
                        <div className="mt-0.5 font-body text-[11.5px] font-semibold text-muted">{p.orders}টি অর্ডারে</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-brand-light/15 px-2.5 py-1 font-body text-[12px] font-black text-ink">{p.qty} পিস</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* অর্ডার তালিকা */}
              <section>
                <SectionHeading hint="অর্ডারে ট্যাপ করলে পূর্ণ বিস্তারিত খুলবে">অর্ডারসমূহ</SectionHeading>
                <div className="divide-y divide-border-base/70 overflow-hidden rounded-2xl border border-border-base/80 bg-white shadow-sh1">
                  {orders.length === 0 && (
                    <div className="px-4 py-5 text-center font-body text-[12.5px] font-medium text-muted">কোনো অর্ডার নেই</div>
                  )}
                  {visibleOrders.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => onOpenOrder(o.id)}
                      disabled={openingOrderId === o.id}
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors duration-brand active:bg-brand-bg/30 disabled:opacity-60"
                      aria-label={`${o.order_num} খুলুন`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-body text-[13.5px] font-black text-ink">{o.order_num}</span>
                          <StatusPill status={o.status as OrderStatus} />
                        </div>
                        <div className="mt-1 font-body text-[11.5px] font-semibold text-muted">
                          {formatDateBn(o.created_at)} · {o.itemCount} পিস
                        </div>
                      </div>
                      <span className="shrink-0 font-body text-[14px] font-black text-ink">{money(o.total)}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))}
                </div>
                {orders.length > ORDERS_PREVIEW && (
                  <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    className="mt-2.5 flex h-11 w-full items-center justify-center rounded-full border border-brand-light/40 bg-brand-light/10 font-body text-[13px] font-extrabold text-ink transition-all duration-brand active:scale-[0.98]"
                  >
                    {showAll ? 'কম দেখুন' : `আরও ${orders.length - ORDERS_PREVIEW}টা অর্ডার দেখুন`}
                  </button>
                )}
              </section>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-12 w-full rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98]"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
