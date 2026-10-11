'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SHOWCASE_LIMITS as L,
  type ShowcaseCard,
  type ShowcaseConfig,
  type ShowcaseSpotlight,
  type SpotlightLinkType,
} from '@/lib/constants/homeShowcase';
import type { CategoryOption } from '@/lib/constants/categories';
import type { HeroProductOption } from '@/lib/constants/heroCards';
import { saveHomeShowcase, resetHomeShowcaseToDefault, uploadHomeShowcaseImage } from '@/app/actions/home-showcase';
import { useToast } from '@/components/admin/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import SectionHeading from '@/components/common/SectionHeading';
import { Field, SelectBox, FIELD_CLS, TEXTAREA_CLS } from '@/components/common/FormField';
import { notifyCatalogSyncCheck } from '@/lib/catalogSyncEvent';

interface Props {
  config: ShowcaseConfig;
  categories: CategoryOption[];
  products: HeroProductOption[];
}

const CARD = 'rounded-[24px] border border-white/90 bg-white shadow-sh1';
const TILE = 'rounded-[22px] border border-white/90 bg-white shadow-sh1';

const isImgSrc = (v: string) => !!v && (v.startsWith('http') || v.startsWith('/'));

function Svg({ children, className = 'h-4 w-4', sw = 2.2 }: { children: React.ReactNode; className?: string; sw?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

const ImgPlaceholder = () => (
  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40">
    <Svg className="h-8 w-8" sw={1.6}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </Svg>
  </span>
);

// ── ছোট UI অংশ ───────────────────────────────────────────────────────────────

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-brand ${checked ? 'bg-brand-light' : 'bg-border-base'}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sh1 transition-all duration-brand ${checked ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );
}

// বাংলা + ইংরেজি দুই ভাষার টেক্সট ইনপুট জোড়া (সাথে অক্ষর গণনা)
function BnEn({
  label, bn, en, onBn, onEn, max, placeholderBn, placeholderEn, multiline = false,
}: {
  label: string;
  bn: string;
  en: string;
  onBn: (v: string) => void;
  onEn: (v: string) => void;
  max: number;
  placeholderBn?: string;
  placeholderEn?: string;
  multiline?: boolean;
}) {
  const counter = (v: string) => (
    <span className={`font-body text-[10.5px] font-bold ${v.length >= max ? 'text-danger' : 'text-muted'}`}>
      {v.length}/{max}
    </span>
  );
  return (
    <Field label={label}>
      <div className="space-y-2">
        <div>
          <div className="mb-1 flex items-center justify-between font-body text-[10.5px] font-extrabold uppercase tracking-wide text-muted">
            <span>বাংলা</span>
            {counter(bn)}
          </div>
          {multiline ? (
            <textarea rows={3} maxLength={max} value={bn} onChange={(e) => onBn(e.target.value)} placeholder={placeholderBn} className={TEXTAREA_CLS} />
          ) : (
            <input type="text" maxLength={max} value={bn} onChange={(e) => onBn(e.target.value)} placeholder={placeholderBn} className={FIELD_CLS} />
          )}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between font-body text-[10.5px] font-extrabold uppercase tracking-wide text-muted">
            <span>English</span>
            {counter(en)}
          </div>
          {multiline ? (
            <textarea rows={3} maxLength={max} value={en} onChange={(e) => onEn(e.target.value)} placeholder={placeholderEn} className={TEXTAREA_CLS} />
          ) : (
            <input type="text" maxLength={max} value={en} onChange={(e) => onEn(e.target.value)} placeholder={placeholderEn} className={FIELD_CLS} />
          )}
        </div>
      </div>
    </Field>
  );
}

// ছবির URL + আপলোড বাটন
function ImageField({
  value, onChange, onUploading, hint,
}: {
  value: string;
  onChange: (url: string) => void;
  onUploading: (delta: 1 | -1) => void;
  hint?: string;
}) {
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    onUploading(1);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadHomeShowcaseImage(fd);
      if (!res.ok || !res.url) {
        showToast(res.message || '❌ আপলোড ব্যর্থ হয়েছে');
        return;
      }
      onChange(res.url);
    } catch {
      showToast('❌ আপলোড ব্যর্থ হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setBusy(false);
      onUploading(-1);
    }
  }

  return (
    <Field label="ছবি" help={hint || 'URL পেস্ট করুন অথবা আপলোড করুন — যেকোনো মাপের ছবি দিলে সাইটে নিজে থেকে ক্রপ হয়ে বসবে'}>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://res.cloudinary.com/..."
          className={FIELD_CLS}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-brand-light/40 bg-brand-light/10 px-4 font-body text-[12.5px] font-extrabold text-ink transition-all duration-brand active:scale-95 disabled:opacity-50"
        >
          <Svg className="h-4 w-4 text-brand-light">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m17 8-5-5-5 5M12 3v12" />
          </Svg>
          {busy ? 'আপলোড...' : 'আপলোড'}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFile} />
      </div>
    </Field>
  );
}

function ProductPicker({
  products, productId, productName, onPick, onClear,
}: {
  products: HeroProductOption[];
  productId?: number;
  productName?: string;
  onPick: (p: HeroProductOption) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = products.filter((p) => !q || p.name.toLowerCase().includes(q) || String(p.id) === q).slice(0, 40);

  return (
    <Field label="কোন প্রোডাক্ট?" required>
      {productId ? (
        <div className="mb-2.5 flex items-center justify-between gap-2 rounded-2xl border border-brand-light/40 bg-brand-light/10 px-3.5 py-2.5">
          <span className="min-w-0 truncate font-body text-[12.5px] font-extrabold text-ink">
            {productName} <span className="font-semibold text-muted">#{productId}</span>
          </span>
          <button
            type="button"
            onClick={onClear}
            aria-label="প্রোডাক্ট সরান"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-muted shadow-sh1 active:scale-90"
          >
            <Svg className="h-3 w-3" sw={2.8}>
              <path d="M18 6 6 18M6 6l12 12" />
            </Svg>
          </button>
        </div>
      ) : null}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="প্রোডাক্টের নাম বা আইডি লিখে খুঁজুন..."
        className={`${FIELD_CLS} mb-2`}
      />
      <div className="max-h-52 overflow-y-auto overscroll-contain rounded-2xl border border-border-base/80">
        {filtered.map((p) => {
          const selected = productId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p)}
              className={`flex min-h-12 w-full items-center gap-2.5 border-b border-border-base/50 px-3 py-2 text-left transition-colors duration-brand last:border-b-0 active:bg-brand-bg/40 ${
                selected ? 'bg-brand-light/10' : 'hover:bg-brand-bg/25'
              }`}
            >
              {p.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.img} alt="" className="h-9 w-9 shrink-0 rounded-xl border border-border-base/70 object-cover" />
              ) : (
                <span className="h-9 w-9 shrink-0 rounded-xl bg-surface-muted" />
              )}
              <span className="min-w-0 flex-1 truncate font-body text-[12.5px] font-bold text-ink">{p.name}</span>
              <span className="shrink-0 font-body text-[10.5px] font-semibold text-muted">#{p.id}</span>
              {selected && (
                <Svg className="h-4 w-4 shrink-0 text-brand-light" sw={3}>
                  <polyline points="20 6 9 17 4 12" />
                </Svg>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && <div className="p-4 text-center font-body text-[12px] font-semibold text-muted">কোনো প্রোডাক্ট পাওয়া যায়নি</div>}
      </div>
    </Field>
  );
}

// ── মূল পেজ ──────────────────────────────────────────────────────────────────

export default function HomeShowcasePageClient({ config, categories, products }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [cfg, setCfg] = useState<ShowcaseConfig>(config);
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  const onUploading = (d: 1 | -1) => setUploads((n) => Math.max(0, n + d));

  const patchHeading = (patch: Partial<ShowcaseConfig['heading']>) => setCfg((c) => ({ ...c, heading: { ...c.heading, ...patch } }));
  const patchCard = (i: number, patch: Partial<ShowcaseCard>) =>
    setCfg((c) => ({ ...c, cards: c.cards.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) }));
  const patchSpot = (i: number, patch: Partial<ShowcaseSpotlight>) =>
    setCfg((c) => ({ ...c, spotlights: c.spotlights.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) }));

  async function handleSave() {
    setSaving(true);
    try {
      const res = await saveHomeShowcase(cfg);
      notifyCatalogSyncCheck();
      if (!res.ok) {
        showToast(res.message || '❌ ব্যর্থ হয়েছে');
        return;
      }
      showToast('✅ হোম শোকেস সেভ হয়েছে — লাইভ সাইটে আপডেট হচ্ছে');
      router.refresh();
    } catch {
      showToast('❌ ব্যর্থ হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setBusy(true);
    try {
      const res = await resetHomeShowcaseToDefault();
      notifyCatalogSyncCheck();
      if (!res.ok) {
        showToast(res.message || '❌ ব্যর্থ হয়েছে');
        return;
      }
      showToast('✅ ডিফল্টে রিসেট হয়েছে');
      setConfirmReset(false);
      router.refresh();
      // রিসেটের পর ফর্মেও ডিফল্ট দেখাতে সার্ভারের রিফ্রেশ-করা ডেটা আসা পর্যন্ত পেজ নতুন করে লোড
      window.location.reload();
    } catch {
      showToast('❌ ব্যর্থ হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setBusy(false);
    }
  }

  const catSelect = (value: string, onChange: (v: string) => void) => (
    <Field label="কোন ক্যাটাগরিতে যাবে?">
      <SelectBox value={value} onChange={onChange}>
        <option value="">সব পণ্য দেখাবে (ফাঁকা)</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectBox>
    </Field>
  );

  const saveDisabled = saving || uploads > 0;

  return (
    <div className="pb-6">
      {/* ══ ১. টুলবার ══ */}
      <div className={`mb-4 ${CARD} p-3.5 sm:p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light/15 text-brand-light sm:h-10 sm:w-10">
              <Svg className="h-5 w-5">
                <rect x="3" y="3" width="8" height="8" />
                <rect x="13" y="3" width="8" height="8" />
                <rect x="3" y="13" width="18" height="8" />
              </Svg>
            </span>
            <div className="min-w-0">
              <div className="font-body text-[14px] font-black text-ink">হোম শোকেস</div>
              <div className="font-body text-[11px] font-semibold text-muted">৪টি ক্যাটাগরি কার্ড ও ২টি স্পটলাইট প্রোডাক্ট ম্যানেজ করুন</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border-base/80 bg-white px-4 font-body text-[13px] font-extrabold text-ink transition-all duration-brand hover:border-brand-light active:scale-[0.98] sm:flex-none"
            >
              <Svg className="h-3.5 w-3.5">
                <path d="M3 12a9 9 0 1 0 2.6-6.4" />
                <path d="M3 3v6h6" />
              </Svg>
              ডিফল্টে রিসেট
            </button>
            <button
              type="button"
              disabled={saveDisabled}
              onClick={handleSave}
              className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-brand-light px-6 font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-60 sm:flex-none"
            >
              {saving ? 'সেভ হচ্ছে...' : uploads > 0 ? 'আপলোড চলছে...' : 'সব সেভ করুন'}
            </button>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-3 rounded-2xl bg-surface-muted px-3.5 py-2.5">
          <div className="min-w-0">
            <div className="font-body text-[12.5px] font-extrabold text-ink">পুরো সেকশন লাইভ সাইটে দেখাবে</div>
            <div className="font-body text-[11px] font-medium text-muted">বন্ধ করলে কার্ড ও স্পটলাইট দুটোই হোম পেজ থেকে লুকিয়ে যাবে</div>
          </div>
          <Switch checked={cfg.enabled} onChange={(v) => setCfg((c) => ({ ...c, enabled: v }))} label="পুরো সেকশন চালু/বন্ধ" />
        </div>
      </div>

      {/* ══ ২. হেডিং ══ */}
      <div className={`mb-4 ${CARD} p-4 sm:p-5`}>
        <SectionHeading hint="ক্যাটাগরি কার্ডের উপরের শিরোনাম — প্রথম লাইন ধূসর, দ্বিতীয় লাইনের শব্দটা ইটালিক হাইলাইট">সেকশনের হেডিং</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          <BnEn
            label="প্রথম লাইন"
            bn={cfg.heading.lead}
            en={cfg.heading.leadEn}
            onBn={(v) => patchHeading({ lead: v })}
            onEn={(v) => patchHeading({ leadEn: v })}
            max={L.headingLead}
          />
          <BnEn
            label="হাইলাইট শব্দ (ইটালিক)"
            bn={cfg.heading.hl}
            en={cfg.heading.hlEn}
            onBn={(v) => patchHeading({ hl: v })}
            onEn={(v) => patchHeading({ hlEn: v })}
            max={L.headingHl}
          />
        </div>
      </div>

      {/* ══ ৩. ক্যাটাগরি কার্ড ══ */}
      <div className="mb-4">
        <div className="px-1">
          <SectionHeading hint="মোবাইলে ২×২, ল্যাপটপে এক সারিতে ৪টা। কার্ডে ক্লিক করলে ওই ক্যাটাগরির আলাদা পেজে যাবে">ক্যাটাগরি কার্ড (৪টি)</SectionHeading>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {cfg.cards.map((c, i) => (
            <div key={i} className={`${TILE} p-3.5 sm:p-4`}>
              <div className="mb-3 flex items-center gap-2 font-body text-[12px] font-black uppercase tracking-wide text-brand-light">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-light/15 text-[11px]">{i + 1}</span>
                কার্ড #{i + 1}
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                {/* লাইভ প্রিভিউ — মূল সাইটের কার্ডের মতো সোজা কোণা */}
                <div className="mx-auto w-32 shrink-0 sm:mx-0">
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-800">
                    {isImgSrc(c.img) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <ImgPlaceholder />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-1.5 pb-2.5 text-center text-white">
                      <span className="text-[9px] font-medium leading-tight text-white/90">{c.lead}</span>
                      <span className="line-clamp-2 text-[12px] font-bold italic leading-tight">{c.title || '—'}</span>
                      <span className="mt-1.5 rounded-full bg-white px-2 py-0.5 text-[8px] font-bold text-ink">{c.btn || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <ImageField value={c.img} onChange={(url) => patchCard(i, { img: url })} onUploading={onUploading} />
                  <BnEn label="ছোট প্রথম লাইন" bn={c.lead} en={c.leadEn} onBn={(v) => patchCard(i, { lead: v })} onEn={(v) => patchCard(i, { leadEn: v })} max={L.cardLead} placeholderBn="দেখুন" placeholderEn="Explore" />
                  <BnEn label="শিরোনাম (ইটালিক)" bn={c.title} en={c.titleEn} onBn={(v) => patchCard(i, { title: v })} onEn={(v) => patchCard(i, { titleEn: v })} max={L.cardTitle} placeholderBn="টি ডব্লিউ এস" placeholderEn="TWS Earbuds" />
                  <BnEn label="বাটনের লেখা" bn={c.btn} en={c.btnEn} onBn={(v) => patchCard(i, { btn: v })} onEn={(v) => patchCard(i, { btnEn: v })} max={L.cardBtn} placeholderBn="এখনই কিনুন" placeholderEn="Shop" />
                  {catSelect(c.catId, (v) => patchCard(i, { catId: v }))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ ৪. স্পটলাইট ══ */}
      <div className="mb-4">
        <div className="px-1">
          <SectionHeading hint="প্রথমটায় বামে ছবি-ডানে লেখা, দ্বিতীয়টায় বামে লেখা-ডানে ছবি। মোবাইলেও ডান-বাম থাকে, তাই লেখা ছোট রাখুন">স্পটলাইট প্রোডাক্ট (২টি)</SectionHeading>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {cfg.spotlights.map((s, i) => (
            <div key={i} className={`${TILE} p-3.5 sm:p-4`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-body text-[12px] font-black uppercase tracking-wide text-brand-light">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-light/15 text-[11px]">{i + 1}</span>
                  স্পটলাইট #{i + 1}
                  <span className="font-semibold normal-case tracking-normal text-muted">({i === 0 ? 'ছবি বামে' : 'ছবি ডানে'})</span>
                </div>
                <Switch checked={s.enabled} onChange={(v) => patchSpot(i, { enabled: v })} label={`স্পটলাইট ${i + 1} চালু/বন্ধ`} />
              </div>

              <div className={`space-y-4 transition-opacity duration-brand ${s.enabled ? '' : 'opacity-50'}`}>
                {/* প্রিভিউ — মোবাইলের ডান-বাম লেআউটের ছোট নমুনা */}
                <div className={`grid overflow-hidden bg-[#F0F8FF] ${i === 1 ? 'grid-cols-[1fr_44%]' : 'grid-cols-[44%_1fr]'}`}>
                  <div className={`relative min-h-[120px] bg-slate-800 ${i === 1 ? 'order-2' : 'order-1'}`}>
                    {isImgSrc(s.img) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <ImgPlaceholder />
                    )}
                  </div>
                  <div className={`flex flex-col justify-center gap-1 p-2.5 ${i === 1 ? 'order-1' : 'order-2'}`}>
                    <span className="w-fit rounded-full border border-brand-light/40 bg-white px-1.5 py-px text-[7px] font-bold uppercase text-brand-light">{s.badge || '—'}</span>
                    <span className="line-clamp-3 text-[11px] font-bold leading-snug text-ink">{s.title || '—'}</span>
                    <span className="line-clamp-3 text-[8.5px] leading-snug text-muted">{s.desc}</span>
                    {s.price > 0 && <span className="text-[10px] font-bold text-ink">৳{s.price.toLocaleString('en-US')}</span>}
                    <span className="mt-0.5 w-fit rounded-full bg-brand-light px-2 py-0.5 text-[8px] font-bold text-white">{s.btn || '—'}</span>
                  </div>
                </div>

                <ImageField value={s.img} onChange={(url) => patchSpot(i, { img: url })} onUploading={onUploading} hint="ছবির ফ্রেম মোটামুটি চৌকো/৪:৫ হলে সবচেয়ে ভালো দেখায়, তবে যেকোনো মাপ চলবে" />
                <BnEn label="ব্যাজ" bn={s.badge} en={s.badgeEn} onBn={(v) => patchSpot(i, { badge: v })} onEn={(v) => patchSpot(i, { badgeEn: v })} max={L.badge} placeholderBn="হট সেলিং" placeholderEn="Hot Selling" />
                <BnEn label="শিরোনাম" bn={s.title} en={s.titleEn} onBn={(v) => patchSpot(i, { title: v })} onEn={(v) => patchSpot(i, { titleEn: v })} max={L.title} />
                <BnEn label="ছোট বিবরণ" bn={s.desc} en={s.descEn} onBn={(v) => patchSpot(i, { desc: v })} onEn={(v) => patchSpot(i, { descEn: v })} max={L.desc} multiline />

                <Field label="দাম (ঐচ্ছিক)" help="০ বা ফাঁকা রাখলে সাইটে দাম দেখাবে না">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={s.price || ''}
                    onChange={(e) => patchSpot(i, { price: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                    placeholder="যেমন: 1250"
                    className={FIELD_CLS}
                  />
                </Field>

                <BnEn label="বাটনের লেখা" bn={s.btn} en={s.btnEn} onBn={(v) => patchSpot(i, { btn: v })} onEn={(v) => patchSpot(i, { btnEn: v })} max={L.spotBtn} placeholderBn="এখনই অর্ডার করুন" placeholderEn="Order now" />

                <div>
                  <div className="mb-2 font-body text-[12.5px] font-extrabold text-ink">ক্লিক করলে কোথায় যাবে</div>
                  <div className="mb-3 flex rounded-full bg-surface-muted p-1">
                    {([
                      { id: 'product', title: 'প্রোডাক্ট পেজ' },
                      { id: 'category', title: 'ক্যাটাগরি' },
                    ] as { id: SpotlightLinkType; title: string }[]).map((lt) => {
                      const active = s.linkType === lt.id;
                      return (
                        <button
                          key={lt.id}
                          type="button"
                          onClick={() => patchSpot(i, { linkType: lt.id })}
                          className={`h-10 flex-1 rounded-full font-body text-[12px] font-extrabold transition-all duration-brand active:scale-[0.98] ${
                            active ? 'bg-brand-light text-white shadow-[0_4px_12px_rgba(68,167,252,0.4)]' : 'text-ink'
                          }`}
                        >
                          {lt.title}
                        </button>
                      );
                    })}
                  </div>
                  {s.linkType === 'product' ? (
                    <ProductPicker
                      products={products}
                      productId={s.productId}
                      productName={s.productName}
                      onPick={(p) => patchSpot(i, { productId: p.id, productName: p.name })}
                      onClear={() => patchSpot(i, { productId: undefined, productName: undefined })}
                    />
                  ) : (
                    catSelect(s.catId, (v) => patchSpot(i, { catId: v }))
                  )}
                  {s.linkType === 'product' && !s.productId && (
                    <p className="mt-2 font-body text-[11px] font-semibold text-danger">প্রোডাক্ট না বাছলে সাইটে এটা ক্যাটাগরি লিংক হিসেবে কাজ করবে</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ ৫. নিচের সেভ বাটন ══ */}
      <button
        type="button"
        disabled={saveDisabled}
        onClick={handleSave}
        className="flex h-[52px] w-full items-center justify-center rounded-full bg-brand-light font-body text-[15px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? 'সেভ হচ্ছে...' : uploads > 0 ? 'আপলোড চলছে...' : 'সব সেভ করুন'}
      </button>

      {confirmReset && (
        <ConfirmDialog
          title="ডিফল্টে রিসেট করবেন?"
          message="কার্ড ও স্পটলাইটের সব লেখা, ছবি ও লিংক ডিফল্ট ডেমোতে ফিরে যাবে। বর্তমান সব পরিবর্তন মুছে যাবে।"
          confirmLabel="হ্যাঁ, রিসেট করুন"
          busyLabel="রিসেট হচ্ছে..."
          busy={busy}
          onConfirm={handleReset}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
