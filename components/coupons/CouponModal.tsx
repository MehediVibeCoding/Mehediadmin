'use client';

import { useState } from 'react';
import type { Coupon } from '@/types';
import type { CouponFormInput } from '@/app/actions/coupons';
import { createCoupon, updateCoupon } from '@/app/actions/coupons';
import { sanitizeCouponCode } from '@/lib/coupons';
import { useToast } from '@/components/admin/Toast';

interface Props {
  editingCoupon?: Coupon;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_FORM: CouponFormInput = {
  code: '',
  discount_type: 'fixed',
  discount_value: 0,
  max_discount_amount: null,
  min_order_amount: 0,
  max_uses_total: null,
  max_uses_per_user: 1,
  expires_at: null,
  is_active: true,
};

// Supabase-এ `timestamptz` কলাম, কিন্তু `<input type="datetime-local">`
// লোকাল সময় স্ট্রিং দেয়/নেয় (কোনো টাইমজোন সাফিক্স ছাড়া) — তাই সেভের আগে
// ISO-তে আর এডিট মোডে দেখানোর আগে আবার লোকাল ফরম্যাটে কনভার্ট করা লাগে।
function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function couponToForm(c: Coupon): CouponFormInput {
  return {
    code: c.code,
    discount_type: c.discount_type,
    discount_value: c.discount_type === 'free_shipping' ? 0 : c.discount_value,
    max_discount_amount: c.max_discount_amount,
    min_order_amount: c.min_order_amount,
    max_uses_total: c.max_uses_total,
    max_uses_per_user: c.max_uses_per_user,
    expires_at: c.expires_at,
    is_active: c.is_active,
  };
}

export default function CouponModal({ editingCoupon, onClose, onSaved }: Props) {
  const [form, setForm] = useState<CouponFormInput>(editingCoupon ? couponToForm(editingCoupon) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  function set<K extends keyof CouponFormInput>(key: K, val: CouponFormInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const result = editingCoupon
        ? await updateCoupon(editingCoupon.id, form)
        : await createCoupon(form);

      if (result.status === 'duplicate') {
        setError(result.message || 'এই কোডে ইতিমধ্যে একটা কুপন আছে');
        return;
      }
      if (result.status === 'error') {
        setError(result.message || 'সেভ ব্যর্থ হয়েছে');
        return;
      }
      showToast(editingCoupon ? '✅ কুপন আপডেট হয়েছে' : '✅ নতুন কুপন তৈরি হয়েছে');
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-brand bg-brand-surface p-6 shadow-sh3">
        <h3 className="mb-4 font-bold text-lg text-ink">
          {editingCoupon ? '✎ কুপন এডিট করুন' : '+ নতুন কুপন তৈরি করুন'}
        </h3>

        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</div>}

        <div className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">কুপন কোড *</label>
            <input
              className="w-full rounded-lg border border-border-base px-3 py-2 text-sm font-mono uppercase tracking-wider"
              placeholder="EID2026"
              maxLength={30}
              value={form.code}
              onChange={(e) => set('code', sanitizeCouponCode(e.target.value))}
            />
            <p className="mt-1 text-[11px] text-muted">শুধু বড় হাতের অক্ষর, সংখ্যা, - ও _ — নিজে থেকেই বড় হাতে বদলে যাবে</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">ছাড়ের ধরন *</label>
              <select
                className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                value={form.discount_type}
                onChange={(e) => {
                  const type = e.target.value as CouponFormInput['discount_type'];
                  set('discount_type', type);
                  if (type === 'free_shipping') set('max_discount_amount', null);
                }}
              >
                <option value="fixed">Fixed BDT ৳</option>
                <option value="percent">Percentage %</option>
                <option value="free_shipping">Free Delivery</option>
              </select>
            </div>
            {form.discount_type !== 'free_shipping' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">
                  ছাড়ের মান * {form.discount_type === 'percent' ? '(%)' : '(৳)'}
                </label>
                <input
                  type="number"
                  min={0}
                  step={form.discount_type === 'percent' ? 1 : 1}
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder={form.discount_type === 'percent' ? '15' : '100'}
                  value={form.discount_value || ''}
                  onChange={(e) => set('discount_value', Number(e.target.value))}
                />
              </div>
            )}
          </div>

          {form.discount_type === 'percent' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                সর্বোচ্চ ছাড় ক্যাপ (৳) <span className="text-[11px] font-normal text-muted">(খালি রাখলে কোনো ক্যাপ থাকবে না)</span>
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                placeholder="300"
                value={form.max_discount_amount ?? ''}
                onChange={(e) => set('max_discount_amount', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">সর্বনিম্ন অর্ডার মূল্য (৳)</label>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
              placeholder="০ = কোনো সর্বনিম্ন নেই"
              value={form.min_order_amount || ''}
              onChange={(e) => set('min_order_amount', Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                মোট ব্যবহারসীমা <span className="text-[11px] font-normal text-muted">(খালি = আনলিমিটেড)</span>
              </label>
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                placeholder="আনলিমিটেড"
                value={form.max_uses_total ?? ''}
                onChange={(e) => set('max_uses_total', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">প্রতি গ্রাহক ব্যবহারসীমা *</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                value={form.max_uses_per_user || ''}
                onChange={(e) => set('max_uses_per_user', Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              মেয়াদ শেষ হওয়ার তারিখ ও সময় <span className="text-[11px] font-normal text-muted">(খালি রাখলে কখনো শেষ হবে না)</span>
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
              value={isoToLocalInput(form.expires_at)}
              onChange={(e) => set('expires_at', localInputToIso(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-surface-muted px-3.5 py-3">
            <div>
              <div className="text-sm font-semibold text-ink">কুপন সক্রিয় রাখুন</div>
              <div className="text-[11px] text-muted">বন্ধ থাকলে কাস্টমাররা এই কোড ব্যবহার করতে পারবে না</div>
            </div>
            <label className="relative inline-block h-6 w-[42px] shrink-0">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)}
                className="peer h-0 w-0 opacity-0"
              />
              <span className="absolute inset-0 cursor-pointer rounded-full bg-[#D1D5DB] transition-brand before:absolute before:bottom-[3px] before:left-[3px] before:h-[18px] before:w-[18px] before:rounded-full before:bg-white before:shadow-md before:transition-brand peer-checked:bg-success peer-checked:before:translate-x-[18px]" />
            </label>
          </div>
        </div>

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-brand border border-border-base py-2.5 text-sm font-medium text-ink transition-brand hover:border-brand-primary disabled:opacity-60"
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex-[2] rounded-brand bg-ink py-2.5 text-sm font-semibold text-white transition-brand disabled:opacity-60"
          >
            {saving ? 'সেভ হচ্ছে...' : '💾 সেভ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
