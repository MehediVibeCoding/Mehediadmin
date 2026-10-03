'use client';

import { useEffect, useState } from 'react';
import type { Coupon, CouponRequiredTier } from '@/types';
import type { CouponFormInput } from '@/app/actions/coupons';
import { createCoupon, updateCoupon } from '@/app/actions/coupons';
import { sanitizeCouponCode, TIER_LABEL, TIER_MIN_ORDERS } from '@/lib/coupons';
import { useToast } from '@/components/admin/Toast';
import { Field, FIELD_CLS, SelectBox } from '@/components/common/FormField';

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
  required_tier: null,
};

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
    required_tier: c.required_tier ?? null,
  };
}

export default function CouponModal({ editingCoupon, onClose, onSaved }: Props) {
  const [form, setForm] = useState<CouponFormInput>(editingCoupon ? couponToForm(editingCoupon) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  // ব্যাকগ্রাউন্ড স্ক্রল লক + Esc চাপলে বন্ধের ব্যবস্থা
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [saving, onClose]);

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
      className="animate-soft-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="animate-sheet-up flex max-h-[94dvh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] md:max-h-[92dvh] md:rounded-[28px] md:shadow-[0_24px_70px_rgba(26,26,26,0.28)]">
        {/* ══ হেডার (আটকে থাকে) ══ */}
        <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.12] to-white px-5 pb-3.5 pt-2.5 md:pt-5">
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 md:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-body text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">
                {editingCoupon ? 'কুপন এডিটর' : 'নতুন কুপন'}
              </div>
              <h3 className="mt-1 font-body text-[20px] font-black leading-tight tracking-tight text-ink sm:text-[22px]">
                {editingCoupon ? `কুপন এডিট করুন: ${editingCoupon.code}` : 'নতুন কুপন তৈরি করুন'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="বন্ধ করুন"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sh1 transition-all duration-brand hover:bg-border-base active:scale-90 disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ══ বডি (স্ক্রল হয়) ══ */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 sm:space-y-4.5 sm:px-6">
          {/* কুপন কোড */}
          <Field
            label="কুপন কোড"
            required
            hint="(বড় হাতের অক্ষর, সংখ্যা, - ও _)"
            help={
              form.required_tier ? (
                <span className="font-bold text-amber-700">
                  ⚠️ মেম্বারশিপ কুপনের কোড অবশ্যই &quot;VC-&quot; দিয়ে শুরু হতে হবে (যেমন VC-{form.required_tier.toUpperCase()}-100)
                </span>
              ) : form.code.startsWith('VC-') ? (
                <span className="font-bold text-danger">
                  ⚠️ &quot;VC-&quot; প্রিফিক্স শুধু মেম্বারশিপ কুপনের জন্য — নিচে মেম্বারশিপ লেভেল বেছে নিন
                </span>
              ) : undefined
            }
          >
            <input
              className={`${FIELD_CLS} font-mono uppercase tracking-wider`}
              placeholder="যেমন: EID2026 বা SAVE100"
              maxLength={30}
              value={form.code}
              onChange={(e) => set('code', sanitizeCouponCode(e.target.value))}
            />
          </Field>

          {/* ছাড়ের ধরন ও মান */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="ছাড়ের ধরন" required>
              <SelectBox
                value={form.discount_type}
                onChange={(val) => {
                  const type = val as CouponFormInput['discount_type'];
                  set('discount_type', type);
                  if (type === 'free_shipping') set('max_discount_amount', null);
                }}
              >
                <option value="fixed">Fixed BDT (৳ ফিক্সড)</option>
                <option value="percent">Percentage (% শতাংশ)</option>
                <option value="free_shipping">Free Delivery (ফ্রি ডেলিভারি)</option>
              </SelectBox>
            </Field>

            {form.discount_type !== 'free_shipping' ? (
              <Field
                label={`ছাড়ের পরিমাণ ${form.discount_type === 'percent' ? '(%)' : '(৳)'}`}
                required
              >
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className={FIELD_CLS}
                  placeholder={form.discount_type === 'percent' ? '15' : '100'}
                  value={form.discount_value || ''}
                  onChange={(e) => set('discount_value', Number(e.target.value))}
                />
              </Field>
            ) : (
              <Field label="ছাড়ের সুবিধা">
                <div className="flex h-12 items-center rounded-2xl border border-border-base/80 bg-surface-muted/60 px-4 font-body text-[13px] font-bold text-success">
                  সম্পূর্ণ ফ্রি শিপিং
                </div>
              </Field>
            )}
          </div>

          {/* পার্সেন্টেজ ক্যাপ ও সর্বনিম্ন অর্ডার */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {form.discount_type === 'percent' ? (
              <Field label="সর্বোচ্চ ছাড় ক্যাপ (৳)" hint="(খালি = আনলিমিটেড)">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className={FIELD_CLS}
                  placeholder="যেমন: 300"
                  value={form.max_discount_amount ?? ''}
                  onChange={(e) => set('max_discount_amount', e.target.value ? Number(e.target.value) : null)}
                />
              </Field>
            ) : null}

            <Field
              label="সর্বনিম্ন অর্ডার মূল্য (৳)"
              hint="(০ = কোনো সর্বনিম্ন সীমা নেই)"
              className={form.discount_type !== 'percent' ? 'sm:col-span-2' : ''}
            >
              <input
                type="number"
                inputMode="numeric"
                min={0}
                className={FIELD_CLS}
                placeholder="0"
                value={form.min_order_amount || ''}
                onChange={(e) => set('min_order_amount', Number(e.target.value))}
              />
            </Field>
          </div>

          {/* ব্যবহারসীমা */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="মোট ব্যবহারসীমা" hint="(খালি = আনলিমিটেড)">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                className={FIELD_CLS}
                placeholder="যেমন: 50"
                value={form.max_uses_total ?? ''}
                onChange={(e) => set('max_uses_total', e.target.value ? Number(e.target.value) : null)}
              />
            </Field>

            <Field label="প্রতি গ্রাহক ব্যবহারসীমা" required>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                className={FIELD_CLS}
                placeholder="1"
                value={form.max_uses_per_user || ''}
                onChange={(e) => set('max_uses_per_user', Number(e.target.value))}
              />
            </Field>
          </div>

          {/* মেয়াদ শেষ হওয়ার সময় */}
          <Field label="মেয়াদ শেষ হওয়ার তারিখ ও সময়" hint="(খালি = আজীবন সক্রিয়)">
            <input
              type="datetime-local"
              className={FIELD_CLS}
              value={isoToLocalInput(form.expires_at)}
              onChange={(e) => set('expires_at', localInputToIso(e.target.value))}
            />
          </Field>

          {/* মেম্বারশিপ টায়ার ফিল্টার */}
          <Field label="প্রয়োজনীয় মেম্বারশিপ লেভেল" hint="(ডেলিভার্ড অর্ডারের ভিত্তিতে যাচাই)">
            <SelectBox
              value={form.required_tier ?? ''}
              onChange={(v) => set('required_tier', (v || null) as CouponRequiredTier | null)}
            >
              <option value="">সবার জন্য উন্মুক্ত (কোনো লেভেল লাগবে না)</option>
              {(Object.keys(TIER_LABEL) as CouponRequiredTier[]).map((key) => (
                <option key={key} value={key}>
                  {TIER_LABEL[key]} ও উপরে ({TIER_MIN_ORDERS[key]}+ ডেলিভার্ড অর্ডার)
                </option>
              ))}
            </SelectBox>
          </Field>

          {/* কুপন স্ট্যাটাস সুইচ */}
          <div className="flex items-center justify-between rounded-2xl border border-border-base/80 bg-surface-muted/60 p-3.5 sm:p-4">
            <div className="min-w-0 pr-3">
              <div className="font-body text-[13px] font-extrabold text-ink">কুপন সক্রিয় রাখুন</div>
              <div className="font-body text-[11px] font-medium text-muted">
                বন্ধ থাকলে গ্রাহকরা চেকআউটে এই কোড প্রয়োগ করতে পারবে না
              </div>
            </div>
            <label className="relative inline-block h-6 w-[44px] shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)}
                className="peer h-0 w-0 opacity-0"
              />
              <span className="absolute inset-0 rounded-full bg-border-base transition-all duration-brand before:absolute before:bottom-[3px] before:left-[3px] before:h-[18px] before:w-[18px] before:rounded-full before:bg-white before:shadow-md before:transition-all before:duration-brand peer-checked:bg-brand-light peer-checked:before:translate-x-[20px]" />
            </label>
          </div>
        </div>

        {/* ══ ফুটার (আটকে থাকে) ══ */}
        <div
          className="shrink-0 border-t border-border-base/70 bg-white px-5 pt-3.5"
          style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
        >
          {error && (
            <div className="mb-3 rounded-2xl border border-red-200/80 bg-red-50 px-4 py-2.5 font-body text-[12.5px] font-bold text-danger">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-12 rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98] disabled:opacity-60"
            >
              বাতিল
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-light font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? (
                'সেভ হচ্ছে...'
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {editingCoupon ? 'আপডেট করুন' : 'তৈরি করুন'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
    }
