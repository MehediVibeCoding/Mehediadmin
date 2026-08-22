'use client';

import { useState } from 'react';
import type { Order, OrderStatus } from '@/types';
import { ORDER_STATUS_META, ORDER_STATUS_ORDER, ORDER_ADVANCE } from '@/lib/orders';
import { useToast } from '@/components/admin/Toast';

interface Props {
  order: Order;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>;
}

function ItemThumb({ emoji }: { emoji?: string }) {
  const val = emoji || '📦';
  const isImg = val.startsWith('http') || val.startsWith('/');
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-brand-bg">
      {isImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={val} alt="" className="h-[18px] w-[18px] rounded object-cover" />
      ) : (
        <span className="text-base leading-none">{val}</span>
      )}
    </div>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="mb-2 mt-4.5 flex items-center gap-[7px] text-[10.5px] font-bold uppercase tracking-wide text-muted first:mt-0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[13px] w-[13px] text-brand-accent">
        {icon}
      </svg>
      {children}
    </div>
  );
}

export default function OrderDetailModal({ order, onClose, onStatusChange }: Props) {
  const { showToast } = useToast();
  const [changingTo, setChangingTo] = useState<OrderStatus | null>(null);

  const stMeta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.pending;
  const payTxt = order.payment_txn
    ? 'TXN: ' + order.payment_txn
    : order.payment_last4
      ? 'শেষ ৪ ডিজিট: ' + order.payment_last4
      : '—';
  const due = Math.max(0, (order.total || 0) - ORDER_ADVANCE);

  async function copyTxt(t: string) {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#001229]/[.45] p-4 backdrop-blur-[4px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[92vh] w-full max-w-[700px] overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(0,18,41,.3)]">
        {/* odm-head */}
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-border-base pb-4">
          <div>
            <div className="text-[19px] font-extrabold tracking-tight text-brand-dark">{order.order_num}</div>
            <div className="mt-[3px] flex items-center gap-1.5 text-[11.5px] text-muted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
                <path d="M3 9.5h18" />
                <path d="M8 2.5v4M16 2.5v4" />
              </svg>
              {new Date(order.created_at || Date.now()).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <span
            className="flex shrink-0 items-center gap-1.5 rounded-full px-[13px] py-1.5 text-xs font-bold"
            style={{ background: stMeta.dot + '1A', color: stMeta.dot }}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: stMeta.dot }} />
            {stMeta.label}
          </span>
        </div>

        {/* গ্রাহকের তথ্য */}
        <SectionTitle icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>}>
          গ্রাহকের তথ্য
        </SectionTitle>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <InfoCard
            label="গ্রাহক"
            value={order.customer_name || '—'}
            onClick={() => copyTxt(order.customer_name || '')}
            icon={<><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></>}
          />
          <InfoCard
            label="ফোন"
            value={order.customer_phone || '—'}
            onClick={() => copyTxt(order.customer_phone || '')}
            icon={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />}
          />
          <InfoCard
            label="জেলা"
            value={order.customer_district || '—'}
            icon={<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>}
          />
          <InfoCard
            label="পেমেন্ট তথ্য"
            value={payTxt}
            icon={<><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20" /></>}
          />
          <InfoCard
            label="ঠিকানা"
            value={order.customer_address || '—'}
            onClick={() => copyTxt(order.customer_address || '')}
            icon={<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />}
            full
          />
        </div>

        {/* প্রোডাক্ট তালিকা */}
        <SectionTitle icon={<><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /></>}>
          প্রোডাক্ট তালিকা
        </SectionTitle>
        <div className="divide-y divide-border-base overflow-hidden rounded-[10px] border border-border-base">
          {(order.items || []).map((it, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-[9px] text-[12.5px]">
              <ItemThumb emoji={it.emoji} />
              <div className="min-w-0 flex-1 font-semibold text-ink">{it.name}</div>
              <div className="shrink-0 font-medium text-muted">× {it.qty}</div>
              <div className="shrink-0 whitespace-nowrap font-bold text-ink">৳{(it.price * it.qty).toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* সামারি */}
        <div className="mt-2.5 rounded-xl border border-border-base bg-white px-4">
          <Row label="শিপিং চার্জ" value={`৳${(order.shipping_cost || 0).toLocaleString()}`} />
          <Row label="সর্বমোট" value={`৳${(order.total || 0).toLocaleString()}`} bold />
          <Row label="পরিশোধিত অ্যাডভান্স" value={`৳${ORDER_ADVANCE.toLocaleString()}`} tone="success" />
          <Row label="বাকি (ডেলিভারিতে)" value={`৳${due.toLocaleString()}`} tone="danger" last />
        </div>

        {/* স্ট্যাটাস পরিবর্তন */}
        <div className="mt-[22px] border-t border-border-base pt-[18px] text-center text-[10.5px] font-bold uppercase tracking-wide text-muted">
          স্ট্যাটাস পরিবর্তন করুন
        </div>
        <div className="mt-3 flex flex-wrap gap-[7px]">
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
                style={active ? { background: m.dot, borderColor: m.dot } : undefined}
                className={`flex min-w-[120px] flex-1 items-center justify-center gap-[7px] rounded-[10px] border-[1.5px] px-2.5 py-[9px] text-xs font-bold transition-brand disabled:opacity-60 ${
                  active ? 'text-white' : 'border-border-base bg-white text-[#374151] hover:border-brand-accent'
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={active ? { background: '#fff', boxShadow: '0 0 0 2px rgba(255,255,255,.4)' } : { background: m.dot }}
                />
                {busy ? '...' : m.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-2.5 w-full rounded-[9px] border-[1.5px] border-border-base bg-white/50 py-2 text-xs font-semibold text-ink transition-brand hover:border-brand-accent hover:bg-brand-bg"
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  onClick,
  icon,
  full,
}: {
  label: string;
  value: string;
  onClick?: () => void;
  icon: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`flex items-start gap-[9px] rounded-[10px] border border-border-base bg-surface-muted p-2.5 ${full ? 'sm:col-span-2' : ''}`}>
      <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] bg-brand-bg text-brand-accent">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[13px] w-[13px]">
          {icon}
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">{label}</div>
        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="-m-0.5 rounded-md p-0.5 text-left text-[13px] font-semibold text-ink transition-brand hover:bg-brand-bg hover:text-brand-dark"
          >
            {value}
          </button>
        ) : (
          <div className="break-words text-[13px] font-semibold text-ink">{value}</div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold, tone, last }: { label: string; value: string; bold?: boolean; tone?: 'success' | 'danger'; last?: boolean }) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-ink';
  return (
    <div className={`flex items-center justify-between py-2.5 text-[12.5px] font-medium text-muted ${last ? '' : 'border-b border-border-base'}`}>
      <span className={bold ? 'font-bold text-brand-dark' : ''}>{label}</span>
      <span className={bold ? 'text-[15px] font-extrabold text-brand-dark' : `font-bold ${toneClass}`}>{value}</span>
    </div>
  );
}
