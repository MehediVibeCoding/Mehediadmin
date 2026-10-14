'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SHOWCASE_LIMITS as L,
  type ShowcaseCard,
  type ShowcaseConfig,
  type ShowcaseSpotlight,
} from '@/lib/constants/homeShowcase';
import type { CategoryOption } from '@/lib/constants/categories';
import {
  saveHomeShowcase,
  resetHomeShowcaseToDefault,
  uploadHomeShowcaseImage,
  previewProductRef,
} from '@/app/actions/home-showcase';
import {
  getCollectionProducts,
  searchProductsForCollection,
  setProductInCollection,
  type CollectionProductItem,
} from '@/app/actions/collection-products';
import { useToast } from '@/components/admin/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import SectionHeading from '@/components/common/SectionHeading';
import { Field, SelectBox, FIELD_CLS, TEXTAREA_CLS } from '@/components/common/FormField';
import { notifyCatalogSyncCheck } from '@/lib/catalogSyncEvent';

interface Props {
  config: ShowcaseConfig;
  categories: CategoryOption[];
  /** প্রতিটা কালেকশনে কয়টা প্রোডাক্ট আছে; ready=false মানে ডাটাবেজে SQL (002_product_collections.sql) চালানো বাকি */
  collectionCounts: { counts: Record<string, number>; ready: boolean };
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

// ভাঁজ-করা অংশ — হেডারে ছোট থাম্বনেইল, নাম ও সারাংশ; ক্লিক করলে ভেতরে এডিট খোলে
function Accordion({
  open, onToggle, thumb, title, subtitle, right, children,
}: {
  open: boolean;
  onToggle: () => void;
  thumb: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`${TILE} overflow-hidden transition-shadow duration-brand ${open ? 'ring-1 ring-brand-light/50' : ''}`}>
      <div className="flex items-center gap-2 p-2 sm:p-2.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl p-1.5 text-left transition-colors duration-brand hover:bg-brand-bg/25 active:scale-[0.995]"
        >
          {thumb}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-body text-[13.5px] font-extrabold text-ink">{title}</span>
            {subtitle ? <span className="mt-0.5 block truncate font-body text-[11px] font-semibold text-muted">{subtitle}</span> : null}
          </span>
          <Svg className={`h-4 w-4 shrink-0 text-muted transition-transform duration-brand ${open ? 'rotate-180' : ''}`} sw={2.6}>
            <path d="m6 9 6 6 6-6" />
          </Svg>
        </button>
        {right}
      </div>
      {open && <div className="space-y-4 border-t border-border-base/60 p-3.5 sm:p-4">{children}</div>}
    </div>
  );
}

function Thumb({ src, className = 'h-11 w-11' }: { src: string; className?: string }) {
  return (
    <span className={`relative shrink-0 overflow-hidden bg-slate-800 ${className}`}>
      {isImgSrc(src) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <ImgPlaceholder />
      )}
    </span>
  );
}

const counterCls = (len: number, max: number, soft?: number) =>
  `font-body text-[10.5px] font-bold ${len >= max ? 'text-danger' : soft && len > soft ? 'text-amber-600' : 'text-muted'}`;

// বাংলা টেক্সট ইনপুট; "English" ভাঁজটা খুললে নিচে ইংরেজি ঘর আসে (ডিফল্টে বন্ধ — পেজ ছোট রাখতে)
function BnEn({
  label, bn, en, onBn, onEn, max, softMax, placeholderBn, placeholderEn, multiline = false, rows = 3, showEn, help,
}: {
  label: string;
  bn: string;
  en: string;
  onBn: (v: string) => void;
  onEn: (v: string) => void;
  max: number;
  softMax?: number;
  placeholderBn?: string;
  placeholderEn?: string;
  multiline?: boolean;
  rows?: number;
  showEn: boolean;
  help?: React.ReactNode;
}) {
  return (
    <Field label={label} help={help}>
      <div className="space-y-2">
        <div>
          <div className="mb-1 flex items-center justify-between font-body text-[10.5px] font-extrabold uppercase tracking-wide text-muted">
            <span>বাংলা</span>
            <span className={counterCls(bn.length, max, softMax)}>{bn.length}/{max}</span>
          </div>
          {multiline ? (
            <textarea rows={rows} maxLength={max} value={bn} onChange={(e) => onBn(e.target.value)} placeholder={placeholderBn} className={TEXTAREA_CLS} />
          ) : (
            <input type="text" maxLength={max} value={bn} onChange={(e) => onBn(e.target.value)} placeholder={placeholderBn} className={FIELD_CLS} />
          )}
        </div>
        {showEn && (
          <div>
            <div className="mb-1 flex items-center justify-between font-body text-[10.5px] font-extrabold uppercase tracking-wide text-muted">
              <span>English</span>
              <span className={counterCls(en.length, max, softMax)}>{en.length}/{max}</span>
            </div>
            {multiline ? (
              <textarea rows={rows} maxLength={max} value={en} onChange={(e) => onEn(e.target.value)} placeholder={placeholderEn} className={TEXTAREA_CLS} />
            ) : (
              <input type="text" maxLength={max} value={en} onChange={(e) => onEn(e.target.value)} placeholder={placeholderEn} className={FIELD_CLS} />
            )}
          </div>
        )}
      </div>
    </Field>
  );
}

function EnToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={show}
      className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 font-body text-[11.5px] font-extrabold transition-all duration-brand active:scale-95 ${
        show ? 'border-brand-light bg-brand-light/10 text-ink' : 'border-border-base/80 bg-white text-muted'
      }`}
    >
      <Svg className="h-3.5 w-3.5" sw={2.4}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
      </Svg>
      {show ? 'English ঘর লুকান' : 'English সংস্করণও লিখুন'}
    </button>
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

// প্রোডাক্টের লিংক বা আইডি — লেখার ০.৫ সেকেন্ড পর সার্ভার থেকে মিলিয়ে "✓ প্রোডাক্টের নাম" দেখায়
function ProductLinkField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [state, setState] = useState<{ kind: 'idle' | 'loading' | 'ok' | 'error'; text?: string }>({ kind: 'idle' });

  useEffect(() => {
    const ref = value.trim();
    if (!ref) {
      setState({ kind: 'idle' });
      return;
    }
    let cancelled = false;
    setState({ kind: 'loading' });
    const t = setTimeout(() => {
      previewProductRef(ref)
        .then((res) => {
          if (cancelled) return;
          if (res.ok && res.id) setState({ kind: 'ok', text: `${res.name || 'প্রোডাক্ট'}  (#${res.id})` });
          else setState({ kind: 'error', text: res.message || 'প্রোডাক্ট পাওয়া যায়নি' });
        })
        .catch(() => { if (!cancelled) setState({ kind: 'error', text: 'যাচাই করা যায়নি, আবার চেষ্টা করুন' }); });
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [value]);

  return (
    <Field
      label="প্রোডাক্টের লিংক বা আইডি"
      help="যেকোনো প্রোডাক্ট পেজের লিংক (vangcur.com/product/...) অথবা শুধু প্রোডাক্টের আইডি নম্বর লিখুন — বাটনে ক্লিক করলে সরাসরি ওই প্রোডাক্টের ডিটেলস পেজে যাবে। ফাঁকা রাখলে নিচের ক্যাটাগরি পেজে যাবে।"
    >
      <input
        type="text"
        inputMode="url"
        maxLength={L.link}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="যেমন: 12  অথবা  https://vangcur.com/product/নাম-12"
        className={FIELD_CLS}
      />
      {state.kind !== 'idle' && (
        <div
          className={`mt-2 flex items-center gap-2 rounded-2xl px-3.5 py-2.5 font-body text-[12px] font-bold ${
            state.kind === 'ok'
              ? 'border border-brand-light/40 bg-brand-light/10 text-ink'
              : state.kind === 'error'
                ? 'border border-red-200/80 bg-red-50 text-danger'
                : 'bg-surface-muted text-muted'
          }`}
        >
          {state.kind === 'ok' && (
            <Svg className="h-4 w-4 shrink-0 text-brand-light" sw={3}>
              <polyline points="20 6 9 17 4 12" />
            </Svg>
          )}
          <span className="min-w-0 break-words">{state.kind === 'loading' ? 'যাচাই হচ্ছে...' : state.text}</span>
        </div>
      )}
    </Field>
  );
}

// ── কালেকশনের প্রোডাক্ট ম্যানেজার ──────────────────────────────────────────────
// কার্ড খুললে তবেই লোড হয়। যোগ/বাদ দিলে সাথে সাথে সেভ হয় (উপরের "সব সেভ করুন"-এর অপেক্ষা করে না)
// — প্রোডাক্ট এডিট ফর্মের "কালেকশন" ড্রপডাউনের সাথে একই ডেটা।

function CollectionProductsManager({
  collectionId, ready, onChanged,
}: {
  collectionId: string;
  ready: boolean;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [items, setItems] = useState<CollectionProductItem[]>([]);
  const [loading, setLoading] = useState(ready);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CollectionProductItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getCollectionProducts(collectionId)
      .then((res) => {
        if (cancelled) return;
        if (res.ok) setItems(res.products);
        else setLoadError(res.message || 'তালিকা আনা যায়নি');
      })
      .catch(() => { if (!cancelled) setLoadError('তালিকা আনা যায়নি, আবার চেষ্টা করুন'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [collectionId, ready]);

  // লেখার ০.৪ সেকেন্ড পর খোঁজে (প্রতি অক্ষরে সার্ভারে যায় না)
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearchError('');
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      searchProductsForCollection(q, collectionId)
        .then((res) => {
          if (cancelled) return;
          setResults(res.products);
          setSearchError(res.ok ? '' : res.message || 'খুঁজতে সমস্যা হয়েছে');
        })
        .catch(() => { if (!cancelled) setSearchError('খুঁজতে সমস্যা হয়েছে, আবার চেষ্টা করুন'); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, collectionId]);

  async function change(p: CollectionProductItem, add: boolean) {
    if (busyId !== null) return;
    setBusyId(p.id);
    try {
      const res = await setProductInCollection(p.id, collectionId, add);
      notifyCatalogSyncCheck();
      if (!res.ok) {
        showToast(res.message || '❌ ব্যর্থ হয়েছে');
        return;
      }
      if (add) {
        setItems((cur) => (cur.some((x) => x.id === p.id) ? cur : [...cur, p]));
        setResults((cur) => cur.filter((x) => x.id !== p.id));
      } else {
        setItems((cur) => cur.filter((x) => x.id !== p.id));
      }
      showToast(add ? '✅ কালেকশনে যোগ হয়েছে' : '✅ কালেকশন থেকে বাদ দেওয়া হয়েছে');
      onChanged();
    } catch {
      showToast('❌ ব্যর্থ হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 font-body text-[12px] font-semibold leading-relaxed text-amber-800">
        প্রোডাক্ট যোগ করার আগে ডাটাবেজে SQL (002_product_collections.sql) একবার চালাতে হবে।
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="font-body text-[12.5px] font-extrabold text-ink">এই কালেকশনের প্রোডাক্ট</span>
          <span className="font-body text-[11px] font-bold text-muted">{loading ? '...' : `${items.length}টি`}</span>
        </div>

        <div className="max-h-64 overflow-y-auto overscroll-contain rounded-2xl border border-border-base/80">
          {loading && <div className="p-4 text-center font-body text-[12px] font-semibold text-muted">লোড হচ্ছে...</div>}
          {!loading && loadError && <div className="p-4 text-center font-body text-[12px] font-semibold text-danger">{loadError}</div>}
          {!loading && !loadError && items.length === 0 && (
            <div className="p-4 text-center font-body text-[12px] font-semibold text-muted">এখনো কোনো প্রোডাক্ট নেই — নিচ থেকে খুঁজে যোগ করুন</div>
          )}
          {items.map((p) => (
            <div key={p.id} className="flex min-h-12 items-center gap-2.5 border-b border-border-base/50 px-3 py-2 last:border-b-0">
              <Thumb src={p.img} className="h-9 w-9 rounded-xl" />
              <span className="min-w-0 flex-1 truncate font-body text-[12.5px] font-bold text-ink">{p.name}</span>
              <span className="shrink-0 font-body text-[10.5px] font-semibold text-muted">#{p.id}</span>
              <button
                type="button"
                disabled={busyId !== null}
                onClick={() => change(p, false)}
                aria-label={`${p.name} কালেকশন থেকে সরান`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-danger transition-all duration-brand active:scale-90 disabled:opacity-50"
              >
                <Svg className="h-3.5 w-3.5" sw={2.8}>
                  <path d="M18 6 6 18M6 6l12 12" />
                </Svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 font-body text-[12.5px] font-extrabold text-ink">প্রোডাক্ট যোগ করুন</div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="প্রোডাক্টের নাম বা আইডি লিখে খুঁজুন..."
          className={`${FIELD_CLS} mb-2`}
        />
        {query.trim() && (
          <div className="max-h-56 overflow-y-auto overscroll-contain rounded-2xl border border-border-base/80">
            {searching && <div className="p-3.5 text-center font-body text-[12px] font-semibold text-muted">খোঁজা হচ্ছে...</div>}
            {!searching && searchError && <div className="p-3.5 text-center font-body text-[12px] font-semibold text-danger">{searchError}</div>}
            {!searching && !searchError && results.length === 0 && (
              <div className="p-3.5 text-center font-body text-[12px] font-semibold text-muted">কোনো প্রোডাক্ট পাওয়া যায়নি (বা আগে থেকেই কালেকশনে আছে)</div>
            )}
            {!searching && results.map((p) => (
              <div key={p.id} className="flex min-h-12 items-center gap-2.5 border-b border-border-base/50 px-3 py-2 last:border-b-0">
                <Thumb src={p.img} className="h-9 w-9 rounded-xl" />
                <span className="min-w-0 flex-1 truncate font-body text-[12.5px] font-bold text-ink">{p.name}</span>
                <span className="shrink-0 font-body text-[10.5px] font-semibold text-muted">#{p.id}</span>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => change(p, true)}
                  className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-brand-light/40 bg-brand-light/10 px-3 font-body text-[11.5px] font-extrabold text-ink transition-all duration-brand active:scale-95 disabled:opacity-50"
                >
                  <Svg className="h-3 w-3 text-brand-light" sw={3}>
                    <path d="M12 5v14M5 12h14" />
                  </Svg>
                  যোগ
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 font-body text-[11px] font-medium leading-relaxed text-muted">
          এখানকার যোগ/বাদ সাথে সাথে সেভ হয়ে যায় (আলাদা সেভ লাগে না)। প্রোডাক্ট এডিট ফর্মের &quot;কালেকশন&quot; ঘর থেকেও একই কাজ করা যায়।
        </p>
      </div>
    </div>
  );
}

// ── কালেকশন কার্ড এডিটর ───────────────────────────────────────────────────────

function CardEditor({
  c, onPatch, onUploading, countReady, onProductsChanged,
}: {
  c: ShowcaseCard;
  onPatch: (p: Partial<ShowcaseCard>) => void;
  onUploading: (d: 1 | -1) => void;
  countReady: boolean;
  onProductsChanged: () => void;
}) {
  const [showEn, setShowEn] = useState(false);
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {/* লাইভ প্রিভিউ — সাইটের কার্ডের মতো লম্বা (২:৩), সোজা কোণা, নিচে গ্লাস বাটনে নাম */}
      <div className="mx-auto w-36 shrink-0 sm:mx-0">
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
          {isImgSrc(c.img) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <ImgPlaceholder />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />
          <div className="absolute inset-1.5 border border-white/30" />
          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <span className="flex min-h-8 items-center justify-between gap-1 border border-white/45 bg-white/[0.14] px-2 py-1 text-white backdrop-blur-sm">
              <span className="line-clamp-2 text-[10px] font-bold leading-tight">{c.title || '—'}</span>
              <span className="text-[10px]">→</span>
            </span>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-4">
        <ImageField
          value={c.img}
          onChange={(url) => onPatch({ img: url })}
          onUploading={onUploading}
          hint="লম্বা (২:৩ বা ৩:৪) ছবি সবচেয়ে ভালো দেখায় — যেকোনো মাপ দিলেও সাইটে নিজে থেকে ক্রপ হয়ে বসবে"
        />
        <BnEn
          label="কালেকশনের নাম (বাটনে বসবে)"
          bn={c.title}
          en={c.titleEn}
          onBn={(v) => onPatch({ title: v })}
          onEn={(v) => onPatch({ titleEn: v })}
          max={L.cardTitle}
          placeholderBn="যেমন: গিফট আইডিয়া"
          placeholderEn="e.g. Gift Ideas"
          showEn={showEn}
        />
        <EnToggle show={showEn} onToggle={() => setShowEn((v) => !v)} />

        <CollectionProductsManager collectionId={c.collectionId} ready={countReady} onChanged={onProductsChanged} />
      </div>
    </div>
  );
}

// ── স্পটলাইট এডিটর ──────────────────────────────────────────────────────────

// টিক-চিহ্নসহ ফিচার তালিকা: প্রতিটা সারিতে বাংলা (ও "English" খোলা থাকলে ইংরেজি) ঘর + ওঠা/নামা/মোছা।
// features ও featuresEn একই সূচকে (index) মেলানো থাকে — সারি সরালে/মুছলে দুটোতেই একসাথে।
function FeatureListEditor({
  bn, en, showEn, onChange,
}: {
  bn: string[];
  en: string[];
  showEn: boolean;
  onChange: (bn: string[], en: string[]) => void;
}) {
  const count = Math.max(bn.length, en.length);
  const rows = Array.from({ length: count }, (_, i) => ({ bn: bn[i] ?? '', en: en[i] ?? '' }));
  const commit = (next: { bn: string; en: string }[]) =>
    onChange(next.map((r) => r.bn), next.map((r) => r.en));
  const iconBtn =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-base/80 bg-white text-ink transition-all duration-brand active:scale-90 disabled:opacity-35 lg:h-9 lg:w-9';

  return (
    <Field
      label="ফিচার তালিকা (টিক-চিহ্নসহ)"
      help={`সর্বোচ্চ ${L.featureCount}টা, প্রতিটা ${L.feature} অক্ষর পর্যন্ত। সাইটে ছোট ছোট টিক-লাইন হয়ে দেখাবে। ফাঁকা সারি সেভের সময় বাদ যায়।`}
    >
      <div className="space-y-2.5">
        {rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border-base bg-surface-muted/50 px-4 py-4 text-center font-body text-[12px] font-semibold text-muted">
            কোনো ফিচার নেই — নিচের বাটনে চেপে যোগ করুন
          </div>
        )}
        {rows.map((r, i) => (
          <div key={i} className="rounded-2xl border border-border-base/80 bg-white p-2.5">
            <div className="flex items-start gap-2">
              <span className="mt-3 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-brand-light text-white" aria-hidden="true">
                <Svg className="h-[10px] w-[10px]" sw={3.4}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  type="text"
                  maxLength={L.feature}
                  value={r.bn}
                  onChange={(e) => commit(rows.map((x, k) => (k === i ? { ...x, bn: e.target.value } : x)))}
                  placeholder="বাংলা — যেমন: রিমোট + অ্যাপে কন্ট্রোল"
                  aria-label={`ফিচার ${i + 1} (বাংলা)`}
                  className={FIELD_CLS}
                />
                {showEn && (
                  <input
                    type="text"
                    maxLength={L.feature}
                    value={r.en}
                    onChange={(e) => commit(rows.map((x, k) => (k === i ? { ...x, en: e.target.value } : x)))}
                    placeholder="English — e.g. Remote + app control"
                    aria-label={`Feature ${i + 1} (English)`}
                    className={FIELD_CLS}
                  />
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-end gap-1.5">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => { const n = rows.slice(); [n[i - 1], n[i]] = [n[i], n[i - 1]]; commit(n); }}
                aria-label="উপরে তুলুন"
                title="উপরে তুলুন"
                className={iconBtn}
              >
                <Svg className="h-3.5 w-3.5" sw={2.6}><path d="m18 15-6-6-6 6" /></Svg>
              </button>
              <button
                type="button"
                disabled={i === rows.length - 1}
                onClick={() => { const n = rows.slice(); [n[i + 1], n[i]] = [n[i], n[i + 1]]; commit(n); }}
                aria-label="নিচে নামান"
                title="নিচে নামান"
                className={iconBtn}
              >
                <Svg className="h-3.5 w-3.5" sw={2.6}><path d="m6 9 6 6 6-6" /></Svg>
              </button>
              <button
                type="button"
                onClick={() => commit(rows.filter((_, k) => k !== i))}
                aria-label="এই ফিচার মুছুন"
                title="মুছুন"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-danger transition-all duration-brand active:scale-90 lg:h-9 lg:w-9"
              >
                <Svg className="h-3.5 w-3.5" sw={2.4}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></Svg>
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          disabled={rows.length >= L.featureCount}
          onClick={() => commit([...rows, { bn: '', en: '' }])}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-brand-light/40 bg-brand-light/10 font-body text-[13px] font-extrabold text-ink transition-all duration-brand active:scale-[0.98] disabled:opacity-50"
        >
          <Svg className="h-3.5 w-3.5" sw={2.8}><path d="M12 5v14M5 12h14" /></Svg>
          {rows.length >= L.featureCount ? `সর্বোচ্চ ${L.featureCount}টা হয়ে গেছে` : 'ফিচার যোগ করুন'}
        </button>
      </div>
    </Field>
  );
}

function SpotlightEditor({
  s, i, categories, onPatch, onUploading,
}: {
  s: ShowcaseSpotlight;
  i: number;
  categories: CategoryOption[];
  onPatch: (p: Partial<ShowcaseSpotlight>) => void;
  onUploading: (d: 1 | -1) => void;
}) {
  const [showEn, setShowEn] = useState(false);
  const reverse = i === 1;
  const descLen = s.desc.length;
  const chip = s.product || s.badge;
  const shown = s.features.filter(Boolean).slice(0, 4);

  return (
    <div className={`space-y-4 transition-opacity duration-brand ${s.enabled ? '' : 'opacity-50'}`}>
      {/* প্রিভিউ — সাইটের ডেস্কটপ লেআউটের ছোট নমুনা (ছবি এক পাশে, লেখা অন্য পাশে) */}
      <div className="overflow-hidden rounded-2xl border border-border-base/70">
        <div className={`grid bg-gradient-to-br from-[#F0F8FF] to-white ${reverse ? 'grid-cols-[1fr_40%]' : 'grid-cols-[40%_1fr]'}`}>
          <div className={`relative min-h-[150px] overflow-hidden bg-slate-200 ${reverse ? 'order-2' : 'order-1'}`}>
            {isImgSrc(s.img) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <ImgPlaceholder />
            )}
          </div>
          <div className={`flex min-w-0 flex-col justify-center gap-1.5 p-3 ${reverse ? 'order-1' : 'order-2'}`}>
            {chip && (
              <span className="inline-flex w-fit max-w-full items-center gap-1 rounded-full bg-brand-light/10 px-2 py-0.5 text-[8.5px] font-bold text-brand-light">
                <span className="h-1 w-1 shrink-0 rounded-full bg-brand-light" />
                <span className="truncate">{chip}</span>
              </span>
            )}
            <span className="break-words text-[12px] font-extrabold leading-snug text-ink">{s.title || '—'}</span>
            {s.desc && <span className="line-clamp-2 whitespace-pre-line break-words text-[9px] leading-snug text-muted">{s.desc}</span>}
            {shown.length > 0 && (
              <ul className="space-y-0.5">
                {shown.map((f, k) => (
                  <li key={k} className="flex items-start gap-1 text-[8.5px] font-medium leading-snug text-ink">
                    <span className="mt-[1px] flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-brand-light text-white">
                      <Svg className="h-[7px] w-[7px]" sw={3.6}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
                    </span>
                    <span className="min-w-0 break-words">{f}</span>
                  </li>
                ))}
                {s.features.filter(Boolean).length > shown.length && (
                  <li className="pl-4 text-[8px] font-bold text-muted">+ আরও {s.features.filter(Boolean).length - shown.length}টা</li>
                )}
              </ul>
            )}
            {s.note && <span className="border-l-2 border-brand-light/50 pl-1.5 text-[8.5px] italic leading-snug text-muted">{s.note}</span>}
            {s.price > 0 && <span className="text-[11px] font-extrabold text-ink">৳{s.price.toLocaleString('en-US')}</span>}
            <span className="mt-0.5 w-fit rounded-full bg-brand-light px-2.5 py-1 text-[9px] font-bold text-white">{s.btn || '—'} →</span>
          </div>
        </div>
      </div>
      <p className="font-body text-[11.5px] font-semibold leading-snug text-muted">
        এই সেকশন মূল সাইটে শুধু ডেস্কটপ ও ট্যাবলেটে দেখায় (মোবাইলে লুকানো)। ছবি সারির পুরো উচ্চতা জুড়ে ক্রপ হয়ে বসে।
      </p>

      <ImageField
        value={s.img}
        onChange={(url) => onPatch({ img: url })}
        onUploading={onUploading}
        hint="যেকোনো মাপের ছবি চলবে — সারির উচ্চতা অনুযায়ী নিজে থেকে ক্রপ হয়ে ভরে যায়। লম্বাটে/চৌকো ছবি সবচেয়ে ভালো দেখায়।"
      />

      <BnEn
        label="প্রোডাক্টের নাম (লেখার উপরের চিপে)"
        bn={s.product}
        en={s.productEn}
        onBn={(v) => onPatch({ product: v })}
        onEn={(v) => onPatch({ productEn: v })}
        max={L.product}
        placeholderBn="যেমন: RGB Neon Light – 16 Fit / 5 Meter"
        placeholderEn="e.g. RGB Neon Light – 16 Fit / 5 Meter"
        showEn={showEn}
        help="ফাঁকা রাখলে এর জায়গায় নিচের ছোট লেবেল দেখাবে।"
      />
      <BnEn label="ছোট লেবেল (প্রোডাক্টের নাম না থাকলে চিপে বসে)" bn={s.badge} en={s.badgeEn} onBn={(v) => onPatch({ badge: v })} onEn={(v) => onPatch({ badgeEn: v })} max={L.badge} placeholderBn="হট সেলিং" placeholderEn="Hot Selling" showEn={showEn} />
      <BnEn label="শিরোনাম (বড় হেডিং)" bn={s.title} en={s.titleEn} onBn={(v) => onPatch({ title: v })} onEn={(v) => onPatch({ titleEn: v })} max={L.title} showEn={showEn} />
      <BnEn
        label="প্রোডাক্ট সম্পর্কে ছোট বিবরণ"
        bn={s.desc}
        en={s.descEn}
        onBn={(v) => onPatch({ desc: v })}
        onEn={(v) => onPatch({ descEn: v })}
        max={L.desc}
        softMax={L.descRecommended}
        multiline
        rows={5}
        showEn={showEn}
        help={
          descLen > L.descRecommended
            ? `⚠️ ${L.descRecommended} অক্ষরের বেশি — সারি অনেক লম্বা হয়ে যাবে। ১৫০–২৫০ অক্ষর সবচেয়ে সুন্দর দেখায়।`
            : `সর্বোচ্চ ${L.desc} অক্ষর। ১৫০–২৫০ অক্ষর সবচেয়ে সুন্দর দেখায়। নতুন লাইনে লিখলে সাইটেও নতুন লাইনে দেখাবে।`
        }
      />

      <FeatureListEditor
        bn={s.features}
        en={s.featuresEn}
        showEn={showEn}
        onChange={(bn, en) => onPatch({ features: bn, featuresEn: en })}
      />

      <BnEn
        label="শেষ লাইন (তালিকার নিচে, ইটালিক)"
        bn={s.note}
        en={s.noteEn}
        onBn={(v) => onPatch({ note: v })}
        onEn={(v) => onPatch({ noteEn: v })}
        max={L.note}
        multiline
        rows={2}
        placeholderBn="যেমন: ঘর, গেমিং সেটআপ, ডেকোর—সবকিছুর জন্য পারফেক্ট।"
        placeholderEn="e.g. Perfect for your room, gaming setup and decor."
        showEn={showEn}
      />
      <EnToggle show={showEn} onToggle={() => setShowEn((v) => !v)} />

      <Field label="দাম (ঐচ্ছিক)" help="০ বা ফাঁকা রাখলে সাইটে দাম দেখাবে না">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={s.price || ''}
          onChange={(e) => onPatch({ price: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
          placeholder="যেমন: 1250"
          className={FIELD_CLS}
        />
      </Field>

      <BnEn label="বাটনের লেখা" bn={s.btn} en={s.btnEn} onBn={(v) => onPatch({ btn: v })} onEn={(v) => onPatch({ btnEn: v })} max={L.spotBtn} placeholderBn="বিস্তারিত দেখুন" placeholderEn="View details" showEn={showEn} />

      <ProductLinkField value={s.link} onChange={(v) => onPatch({ link: v })} />

      {!s.link.trim() && (
        <Field label="লিংক ফাঁকা থাকলে কোন ক্যাটাগরিতে যাবে?">
          <SelectBox value={s.catId} onChange={(v) => onPatch({ catId: v })}>
            <option value="">সব পণ্য দেখাবে</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectBox>
        </Field>
      )}
    </div>
  );
}

// ── মূল পেজ ──────────────────────────────────────────────────────────────────

type OpenId = 'heading' | `card-${number}` | `spot-${number}` | null;

// সার্ভার থেকে আসা কনফিগে স্পটলাইটের `link` ফাঁকা কিন্তু আগে প্রোডাক্ট বাছা থাকলে আইডি দিয়ে ভরে দেওয়া
function withLinks(c: ShowcaseConfig): ShowcaseConfig {
  return {
    ...c,
    spotlights: c.spotlights.map((s) => ({ ...s, link: s.link || (s.productId ? String(s.productId) : '') })),
  };
}

export default function HomeShowcasePageClient({ config, categories, collectionCounts }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [cfg, setCfg] = useState<ShowcaseConfig>(() => withLinks(config));
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(withLinks(config)));
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<OpenId>(null); // সবগুলো প্রথমে বন্ধ

  const dirty = JSON.stringify(cfg) !== savedSnapshot;
  const toggle = (id: Exclude<OpenId, null>) => setOpenId((cur) => (cur === id ? null : id));

  // সেভ না করে পেজ ছাড়তে গেলে ব্রাউজারের সতর্কবার্তা
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const onUploading = (d: 1 | -1) => setUploads((n) => Math.max(0, n + d));

  const patchHeading = (patch: Partial<ShowcaseConfig['heading']>) => setCfg((c) => ({ ...c, heading: { ...c.heading, ...patch } }));
  const patchCard = (i: number, patch: Partial<ShowcaseCard>) =>
    setCfg((c) => ({ ...c, cards: c.cards.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) }));
  const patchSpot = (i: number, patch: Partial<ShowcaseSpotlight>) =>
    setCfg((c) => ({ ...c, spotlights: c.spotlights.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) }));

  const [headingEn, setHeadingEn] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await saveHomeShowcase(cfg);
      notifyCatalogSyncCheck();
      if (!res.ok) {
        showToast(res.message || '❌ ব্যর্থ হয়েছে');
        return;
      }
      setSavedSnapshot(JSON.stringify(cfg));
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

  const saveDisabled = saving || uploads > 0 || !dirty;
  const { counts, ready } = collectionCounts;

  return (
    <div className="pb-4">
      {/* ══ ১. টুলবার ══ */}
      <div className={`mb-3 ${CARD} p-3.5 sm:p-4`}>
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
              <div className="font-body text-[11px] font-semibold text-muted">৪টি কালেকশন কার্ড ও ২টি স্পটলাইট প্রোডাক্ট ম্যানেজ করুন — যেটা এডিট করবেন সেটা ক্লিক করে খুলুন</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="flex h-11 items-center justify-center gap-2 self-start rounded-full border border-border-base/80 bg-white px-4 font-body text-[12.5px] font-extrabold text-ink transition-all duration-brand hover:border-brand-light active:scale-[0.98] sm:self-auto"
          >
            <Svg className="h-3.5 w-3.5">
              <path d="M3 12a9 9 0 1 0 2.6-6.4" />
              <path d="M3 3v6h6" />
            </Svg>
            ডিফল্টে রিসেট
          </button>
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
      <div className="mb-3">
        <Accordion
          open={openId === 'heading'}
          onToggle={() => toggle('heading')}
          thumb={
            <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-brand-light/15 text-brand-light">
              <Svg className="h-5 w-5">
                <path d="M4 7V5h16v2M12 5v14M9 19h6" />
              </Svg>
            </span>
          }
          title="সেকশনের হেডিং"
          subtitle={`${cfg.heading.lead} — ${cfg.heading.hl}`}
        >
          <p className="font-body text-[11.5px] font-medium text-muted">কালেকশন কার্ডের উপরের শিরোনাম — প্রথম লাইন ধূসর, দ্বিতীয় লাইনের শব্দটা ইটালিক হাইলাইট।</p>
          <div className="grid gap-4 md:grid-cols-2">
            <BnEn
              label="প্রথম লাইন"
              bn={cfg.heading.lead}
              en={cfg.heading.leadEn}
              onBn={(v) => patchHeading({ lead: v })}
              onEn={(v) => patchHeading({ leadEn: v })}
              max={L.headingLead}
              showEn={headingEn}
            />
            <BnEn
              label="হাইলাইট শব্দ (ইটালিক)"
              bn={cfg.heading.hl}
              en={cfg.heading.hlEn}
              onBn={(v) => patchHeading({ hl: v })}
              onEn={(v) => patchHeading({ hlEn: v })}
              max={L.headingHl}
              placeholderBn="যেমন: কিউরেটেড কালেকশন"
              showEn={headingEn}
            />
          </div>
          <EnToggle show={headingEn} onToggle={() => setHeadingEn((v) => !v)} />
        </Accordion>
      </div>

      {/* ══ ৩. কালেকশন কার্ড ══ */}
      <div className="mb-3">
        <div className="px-1">
          <SectionHeading hint="মোবাইলে ২×২, ল্যাপটপে এক সারিতে ৪টা। কার্ডে ক্লিক করলে ওই কালেকশনের আলাদা পেজে যাবে">কালেকশন কার্ড (৪টি)</SectionHeading>
        </div>
        {!ready && (
          <div className="mb-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 font-body text-[12px] font-semibold leading-relaxed text-amber-800">
            কালেকশনের জন্য ডাটাবেজে একটা নতুন কলাম লাগবে। Supabase → SQL Editor-এ <span className="font-extrabold">_migration_reference/002_product_collections.sql</span> একবার চালান, তারপর প্রোডাক্টে কালেকশন বাছা যাবে।
          </div>
        )}
        <div className="flex flex-col gap-2.5">
          {cfg.cards.map((c, i) => {
            const id = `card-${i}` as const;
            return (
              <Accordion
                key={c.collectionId}
                open={openId === id}
                onToggle={() => toggle(id)}
                thumb={<Thumb src={c.img} />}
                title={`কার্ড #${i + 1} — ${c.title || '—'}`}
                subtitle={ready ? `${counts[c.collectionId] ?? 0}টি প্রোডাক্ট` : 'গোনা যায়নি'}
              >
                <CardEditor
                  c={c}
                  onPatch={(p) => patchCard(i, p)}
                  onUploading={onUploading}
                  countReady={ready}
                  onProductsChanged={() => router.refresh()}
                />
              </Accordion>
            );
          })}
        </div>
      </div>

      {/* ══ ৪. স্পটলাইট ══ */}
      <div className="mb-3">
        <div className="px-1">
          <SectionHeading hint="শুধু ডেস্কটপ/ট্যাবলেটে দেখায়। ছবির পাশে প্রোডাক্টের নাম, বিবরণ ও ফিচার। প্রথমটায় বামে ছবি-ডানে লেখা, দ্বিতীয়টায় উল্টো">স্পটলাইট প্রোডাক্ট (২টি)</SectionHeading>
        </div>
        <div className="flex flex-col gap-2.5">
          {cfg.spotlights.map((s, i) => {
            const id = `spot-${i}` as const;
            const linkSummary = s.link.trim() ? `প্রোডাক্ট: ${s.link.trim()}` : 'লিংক দেওয়া নেই';
            return (
              <Accordion
                key={i}
                open={openId === id}
                onToggle={() => toggle(id)}
                thumb={<Thumb src={s.img} className="h-11 w-[25px] sm:w-[25px]" />}
                title={`স্পটলাইট #${i + 1} — ${s.title || '—'}`}
                subtitle={`${i === 0 ? 'ছবি বামে' : 'ছবি ডানে'} · ${linkSummary}`}
                right={
                  <span className="pr-2">
                    <Switch checked={s.enabled} onChange={(v) => patchSpot(i, { enabled: v })} label={`স্পটলাইট ${i + 1} চালু/বন্ধ`} />
                  </span>
                }
              >
                <SpotlightEditor s={s} i={i} categories={categories} onPatch={(p) => patchSpot(i, p)} onUploading={onUploading} />
              </Accordion>
            );
          })}
        </div>
      </div>

      {/* ══ ৫. স্থায়ী সেভ বার — স্ক্রল করলেও নিচে লেগে থাকে (মোবাইলে আঙুলের নাগালে) ══ */}
      <div className="sticky bottom-3 z-20 mt-4">
        <div className="flex items-center gap-3 rounded-full border border-white/90 bg-white/95 p-2 pl-4 shadow-sh2 backdrop-blur">
          <div className="min-w-0 flex-1 font-body text-[12px] font-extrabold">
            {uploads > 0 ? (
              <span className="text-muted">ছবি আপলোড চলছে...</span>
            ) : dirty ? (
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                সেভ না করা পরিবর্তন আছে
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted">
                <Svg className="h-3.5 w-3.5 text-brand-light" sw={3}>
                  <polyline points="20 6 9 17 4 12" />
                </Svg>
                সব সেভ করা আছে
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={saveDisabled}
            onClick={handleSave}
            className="flex h-11 shrink-0 items-center justify-center rounded-full bg-brand-light px-6 font-body text-[14px] font-black text-white transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
          >
            {saving ? 'সেভ হচ্ছে...' : 'সব সেভ করুন'}
          </button>
        </div>
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="ডিফল্টে রিসেট করবেন?"
          message="কালেকশন কার্ড ও স্পটলাইটের সব লেখা, ছবি ও লিংক ডিফল্ট ডেমোতে ফিরে যাবে। বর্তমান সব পরিবর্তন মুছে যাবে। (প্রোডাক্টের কালেকশন বাছাই অক্ষত থাকবে।)"
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
