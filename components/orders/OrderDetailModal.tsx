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
  if (val.startsWith('http') || val.startsWith('/')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={val} alt="" className="h-[18px] w-[18px] shrink-0 rounded object-cover" />;
  }
  return <span className="text-base leading-none">{val}</span>;
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[92vh] w-full max-w-[700px] overflow-y-auto rounded-brand bg-brand-surface p-6 shadow-sh3">
        {/* Head */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-lg text-ink">{order.order_num}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
                <path d="M3 9.5h18" />
                <path d="M8 2.5v4M16 2.5v4" />
              </svg>
              {new Date(order.created_at || Date.now()).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <span
            className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: stMeta.dot + '1A', color: stMeta.dot }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: stMeta.dot }} />
            {stMeta.label}
          </span>
        </div>

        {/* গ্রাহকের তথ্য */}
        <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          গ্রাহকের তথ্য
        </div>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <InfoCard label="গ্রাহক" value={order.customer_name || '—'} onClick={() => copyTxt(order.customer_name || '')} />
          <InfoCard label="ফোন" value={order.customer_phone || '—'} onClick={() => copyTxt(order.customer_phone || '')} />
          <InfoCard label="জেলা" value={order.customer_district || '—'} />
          <InfoCard label="পেমেন্ট তথ্য" value={payTxt} />
          <InfoCard
            label="ঠিকানা"
            value={order.customer_address || '—'}
            onClick={() => copyTxt(order.customer_address || '')}
            full
          />
        </div>

        {/* প্রোডাক্ট তালিকা */}
        <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M21 8 12 3 3 8l9 5 9-5Z" />
            <path d="M3 8v8l9 5 9-5V8" />
          </svg>
          প্রোডাক্ট তালিকা
        </div>
        <div className="mb-4 divide-y divide-border-base rounded-brand border border-border-base">
          {(order.items || []).map((it, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2 text-sm">
              <ItemThumb emoji={it.emoji} />
              <div className="flex-1 text-ink">{it.name}</div>
              <div className="text-muted">× {it.qty}</div>
              <div className="font-semibold text-ink">৳{(it.price * it.qty).toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* সামারি */}
        <div className="mb-5 space-y-1.5 rounded-brand bg-surface-muted p-3.5 text-sm">
          <Row label="শিপিং চার্জ" value={`৳${(order.shipping_cost || 0).toLocaleString()}`} />
          <Row label="সর্বমোট" value={`৳${(order.total || 0).toLocaleString()}`} bold />
          <Row label="পরিশোধিত অ্যাডভান্স" value={`৳${ORDER_ADVANCE.toLocaleString()}`} tone="success" />
          <Row label="বাকি (ডেলিভারিতে)" value={`৳${due.toLocaleString()}`} tone="warn" />
        </div>

        {/* স্ট্যাটাস পরিবর্তন */}
        <div className="mb-2 text-sm font-bold text-ink">স্ট্যাটাস পরিবর্তন করুন</div>
        <div className="mb-5 flex flex-wrap gap-2">
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
                className={`flex items-center gap-1.5 rounded-brand border px-3 py-1.5 text-xs font-semibold transition-brand disabled:opacity-60 ${
                  active ? 'text-white' : 'border-border-base text-ink hover:bg-surface-muted'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: active ? '#fff' : m.dot }} />
                {busy ? '...' : m.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-brand border border-border-base py-2.5 text-sm font-semibold text-ink transition-brand hover:bg-surface-muted"
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
}

function InfoCard({ label, value, onClick, full }: { label: string; value: string; onClick?: () => void; full?: boolean }) {
  return (
    <div className={`rounded-brand border border-border-base p-3 ${full ? 'sm:col-span-2' : ''}`}>
      <div className="mb-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      {onClick ? (
        <button type="button" onClick={onClick} className="text-left text-[13px] font-medium text-ink underline decoration-dotted underline-offset-2">
          {value}
        </button>
      ) : (
        <div className="text-[13px] font-medium text-ink">{value}</div>
      )}
    </div>
  );
}

function Row({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: 'success' | 'warn' }) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'warn' ? 'text-warn' : 'text-ink';
  return (
    <div className={`flex items-center justify-between ${bold ? 'border-t border-border-base pt-1.5 font-bold' : ''}`}>
      <span className="text-muted">{label}</span>
      <span className={bold ? 'text-ink' : toneClass}>{value}</span>
    </div>
  );
}
