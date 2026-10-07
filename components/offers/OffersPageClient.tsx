'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OfferConfig, OfferActiveModel } from '@/types';
import type { ProductPickerRow } from '@/app/actions/products';
import {
  toggleActiveModel,
  saveOfferModel1,
  saveOfferModel2,
  saveOfferModel3,
  deleteOfferModel,
} from '@/app/actions/offers';
import { useToast } from '@/components/admin/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Field, FIELD_CLS, TEXTAREA_CLS, SelectBox } from '@/components/common/FormField';
import { notifyCatalogSyncCheck } from '@/lib/catalogSyncEvent';

interface Props {
  config: OfferConfig;
  products: ProductPickerRow[];
}

type ModelKey = Exclude<OfferActiveModel, 'none'>;

interface EditorState {
  model: ModelKey;
  title: string;
  body: string;
  btn_text: string;
  btn_url: string;
  img: string;
  url: string;
  product_id: string;
  badge_text: string;
}

const MODEL_META: { key: ModelKey; title: string; subtitle: string; icon: React.ReactNode }[] = [
  {
    key: 'model1',
    title: 'মডেল ১: টেক্সট নোটিশ অফার',
    subtitle: 'টাইটেল + বিস্তারিত বিবরণ + অ্যাকশন বাটন',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    key: 'model2',
    title: 'মডেল ২: অফার ব্যানার ইমেজ',
    subtitle: 'ব্যানার ছবি + ক্লিকেবল টার্গেট লিংক',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    key: 'model3',
    title: 'মডেল ৩: হট প্রোডাক্ট প্রোমোশন',
    subtitle: 'প্রোডাক্ট কার্ড + স্পেশাল অফার ব্যাজ',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
  },
];

export default function OffersPageClient({ config, products }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [cfg, setCfg] = useState<OfferConfig>(config);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingModel, setTogglingModel] = useState<ModelKey | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModelKey | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ব্যাকগ্রাউন্ড স্ক্রল লক যখন এডিটর খোলা থাকে
  useEffect(() => {
    if (!editor) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) setEditor(null);
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [editor, saving]);

  function openEditor(model: ModelKey) {
    const d = cfg[model];
    setEditor({
      model,
      title: model === 'model1' ? (d as OfferConfig['model1']).title || '' : '',
      body: model === 'model1' ? (d as OfferConfig['model1']).body || '' : '',
      btn_text: model === 'model1' ? (d as OfferConfig['model1']).btn_text || '' : '',
      btn_url: model === 'model1' ? (d as OfferConfig['model1']).btn_url || '' : '',
      img: model === 'model2' ? (d as OfferConfig['model2']).img || '' : '',
      url: model === 'model2' ? (d as OfferConfig['model2']).url || '' : '',
      product_id: model === 'model3' ? (d as OfferConfig['model3']).product_id || '' : '',
      badge_text: model === 'model3' ? (d as OfferConfig['model3']).badge_text || 'HOT DEAL' : '',
    });
  }

  async function handleToggle(model: ModelKey, checked: boolean) {
    setTogglingModel(model);
    const res = await toggleActiveModel(model, checked);
    setTogglingModel(null);
    if (!res.ok) {
      showToast(res.message || '❌ টগল ব্যর্থ হয়েছে');
      return;
    }
    setCfg((prev) => ({ ...prev, active_model: checked ? model : 'none' }));
    showToast(checked ? `✅ ${model.toUpperCase()} এখন লাইভ!` : '⛔ অফার পপআপ বন্ধ করা হয়েছে');
    router.refresh();
  }

  async function handleSave() {
    if (!editor) return;
    setSaving(true);
    let res;
    if (editor.model === 'model1') {
      res = await saveOfferModel1({
        title: editor.title,
        body: editor.body,
        btn_text: editor.btn_text,
        btn_url: editor.btn_url,
      });
    } else if (editor.model === 'model2') {
      res = await saveOfferModel2({ img: editor.img, url: editor.url });
    } else {
      res = await saveOfferModel3({ product_id: editor.product_id, badge_text: editor.badge_text });
    }
    notifyCatalogSyncCheck();
    setSaving(false);

    if (!res.ok) {
      showToast(res.message || '❌ সেভ ব্যর্থ হয়েছে');
      return;
    }
    showToast('✅ অফার কনফিগারেশন সেভ হয়েছে');
    setEditor(null);
    router.refresh();
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteOfferModel(deleteTarget);
    setDeleting(false);

    if (!res.ok) {
      showToast(res.message || '❌ ডেটা মুছতে ব্যর্থ');
      return;
    }
    if (cfg.active_model === deleteTarget) {
      setCfg((prev) => ({ ...prev, active_model: 'none' }));
    }
    showToast('🗑️ মডেলের ডেটা রিসেট করা হয়েছে');
    setDeleteTarget(null);
    setEditor(null);
    router.refresh();
  }

  return (
    <div>
      {/* ══ ১. ইনফো বার ══ */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/90 bg-white p-4 shadow-sh1">
        <div>
          <div className="font-body text-[14px] font-black text-ink">ওয়েবসাইট অফার পপআপ</div>
          <div className="font-body text-[11.5px] font-medium text-muted">
            যেকোনো একটি মডেল বেছে নিন এবং টগল অন করে লাইভ করুন
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="flex h-10 items-center gap-1.5 rounded-full border border-border-base/80 bg-white px-4 font-body text-[12px] font-bold text-ink transition-all duration-brand hover:border-brand-light hover:text-brand-light active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-brand-light">
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v5h-5" />
          </svg>
          রিফ্রেশ
        </button>
      </div>

      {/* ══ ২. মডেল কার্ড গ্রিড (মোবাইলে ১ কলাম, ডেস্কটপে ৩ কলাম) ══ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {MODEL_META.map((m) => {
          const isLive = cfg.active_model === m.key;
          return (
            <div
              key={m.key}
              className={`flex flex-col justify-between overflow-hidden rounded-[24px] border bg-white p-4 shadow-sh1 transition-all duration-brand ${
                isLive ? 'border-emerald-500/80 ring-2 ring-emerald-500/20' : 'border-white/90'
              }`}
            >
              <div>
                {/* কার্ড হেডার: টাইটেল + লাইভ ব্যাজ + টগল সুইচ */}
                <div className="flex items-start justify-between gap-2 border-b border-border-base/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isLive ? 'bg-emerald-50 text-success' : 'bg-brand-light/15 text-brand-light'
                    }`}>
                      {m.icon}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-body text-[13px] font-black leading-tight text-ink">{m.title}</h4>
                      <p className="mt-0.5 truncate font-body text-[10.5px] font-medium text-muted">{m.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isLive && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-body text-[10px] font-extrabold text-success">
                        লাইভ
                      </span>
                    )}
                    <label className="relative inline-block h-6 w-[42px] shrink-0 cursor-pointer" title={`${m.title} চালু/বন্ধ`}>
                      <input
                        type="checkbox"
                        checked={isLive}
                        disabled={togglingModel === m.key}
                        onChange={(e) => handleToggle(m.key, e.target.checked)}
                        className="peer h-0 w-0 opacity-0"
                      />
                      <span className="absolute inset-0 rounded-full bg-border-base transition-all duration-brand before:absolute before:bottom-[3px] before:left-[3px] before:h-[18px] before:w-[18px] before:rounded-full before:bg-white before:shadow-md before:transition-all before:duration-brand peer-checked:bg-emerald-500 peer-checked:before:translate-x-[18px]" />
                    </label>
                  </div>
                </div>

                {/* লাইভ প্রিভিউ এলাকা */}
                <div className="min-h-[140px] py-3.5">
                  <ModelPreview model={m.key} cfg={cfg} products={products} />
                </div>
              </div>

              {/* কনফিগারেশন বাটন */}
              <button
                type="button"
                onClick={() => openEditor(m.key)}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-brand-light/40 bg-brand-light/10 font-body text-[12.5px] font-extrabold text-ink transition-all duration-brand hover:bg-brand-light hover:text-white active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                সেটআপ / এডিট করুন
              </button>
            </div>
          );
        })}
      </div>

      {/* ══ ৩. এডিটর মডাল (মোবাইলে বটম-শীট, ডেস্কটপে সেন্টার্ড) ══ */}
      {editor && (
        <div
          className="animate-soft-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
          onClick={(e) => e.target === e.currentTarget && !saving && setEditor(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="animate-sheet-up flex max-h-[94dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] md:max-h-[90dvh] md:rounded-[28px] md:shadow-[0_24px_70px_rgba(26,26,26,0.28)]"
            style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* হেডার */}
            <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.12] to-white px-5 pb-3.5 pt-2.5 md:pt-4">
              <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 md:hidden" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-body text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">
                    অফার এডিটর
                  </div>
                  <h3 className="mt-0.5 font-body text-[18px] font-black text-ink">
                    {MODEL_META.find((x) => x.key === editor.model)?.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  disabled={saving}
                  aria-label="বন্ধ করুন"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow-sh1 transition-all duration-brand hover:bg-border-base active:scale-90 disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ফর্ম বডি */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:space-y-4.5 sm:p-6">
              {editor.model === 'model1' && (
                <>
                  <Field label="টাইটেল" required>
                    <input
                      type="text"
                      value={editor.title}
                      onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                      placeholder="যেমন: বিশেষ অফার চলছে!"
                      className={FIELD_CLS}
                    />
                  </Field>
                  <Field label="বিবরণ / অফার বিস্তারিত">
                    <textarea
                      rows={3}
                      value={editor.body}
                      onChange={(e) => setEditor({ ...editor, body: e.target.value })}
                      placeholder="অফারের বিস্তারিত নিয়ম বা সুবিধা লিখুন..."
                      className={TEXTAREA_CLS}
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <Field label="বাটন টেক্সট">
                      <input
                        type="text"
                        value={editor.btn_text}
                        onChange={(e) => setEditor({ ...editor, btn_text: e.target.value })}
                        placeholder="অফার দেখুন"
                        className={FIELD_CLS}
                      />
                    </Field>
                    <Field label="বাটন লিংক (URL)">
                      <input
                        type="text"
                        value={editor.btn_url}
                        onChange={(e) => setEditor({ ...editor, btn_url: e.target.value })}
                        placeholder="https://... বা /offers"
                        className={FIELD_CLS}
                      />
                    </Field>
                  </div>
                </>
              )}

              {editor.model === 'model2' && (
                <>
                  <Field label="ব্যানার ইমেজ লিংক (URL)" required>
                    <input
                      type="text"
                      value={editor.img}
                      onChange={(e) => setEditor({ ...editor, img: e.target.value })}
                      placeholder="https://res.cloudinary.com/..."
                      className={FIELD_CLS}
                    />
                  </Field>
                  {editor.img && (
                    <div className="overflow-hidden rounded-2xl border border-border-base/80 bg-surface-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={editor.img} alt="ব্যানার প্রিভিউ" className="max-h-[160px] w-full object-cover" />
                    </div>
                  )}
                  <Field label="ক্লিক করলে কোথায় যাবে (URL)">
                    <input
                      type="text"
                      value={editor.url}
                      onChange={(e) => setEditor({ ...editor, url: e.target.value })}
                      placeholder="https://... বা /products"
                      className={FIELD_CLS}
                    />
                  </Field>
                </>
              )}

              {editor.model === 'model3' && (
                <>
                  <Field label="প্রোডাক্ট বেছে নিন" required>
                    <SelectBox
                      value={editor.product_id}
                      onChange={(v) => setEditor({ ...editor, product_id: v })}
                    >
                      <option value="">— যেকোনো একটি প্রোডাক্ট বাছুন —</option>
                      {products.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name} — ৳{Number(p.price || 0).toLocaleString('en-US')}
                        </option>
                      ))}
                    </SelectBox>
                  </Field>

                  <Field label="স্পেশাল ব্যাজ টেক্সট">
                    <input
                      type="text"
                      value={editor.badge_text}
                      onChange={(e) => setEditor({ ...editor, badge_text: e.target.value })}
                      placeholder="HOT DEAL / ২০% ছাড়"
                      className={FIELD_CLS}
                    />
                  </Field>
                </>
              )}
            </div>

            {/* ফুটার */}
            <div className="shrink-0 border-t border-border-base/70 px-5 pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(editor.model)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-danger transition-all duration-brand hover:bg-danger hover:text-white active:scale-95"
                  title="এই মডেলের ডেটা মুছুন"
                  aria-label="ডেটা মুছুন"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  disabled={saving}
                  className="h-12 flex-1 rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98] disabled:opacity-50"
                >
                  বাতিল
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-brand-light font-body text-[13.5px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ ৪. সেন্ট্রাল কনফার্মেশন ডায়ালগ ══ */}
      {deleteTarget && (
        <ConfirmDialog
          title="মডেলের তথ্য মুছে ফেলবেন?"
          message="এই মডেলের সেভ করা সমস্ত ডেটা মুছে যাবে এবং লাইভ থাকলে স্বয়ংক্রিয়ভাবে বন্ধ হয়ে যাবে।"
          confirmLabel="হ্যাঁ, মুছে ফেলুন"
          busyLabel="মুছে ফেলা হচ্ছে..."
          busy={deleting}
          tone="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

/* ── মডেল প্রিভিউ সাব-কম্পোনেন্ট ── */
function ModelPreview({
  model,
  cfg,
  products,
}: {
  model: ModelKey;
  cfg: OfferConfig;
  products: ProductPickerRow[];
}) {
  if (model === 'model1') {
    const d = cfg.model1;
    if (!d.title && !d.body) return <EmptyPreview hint="সেটআপ করে টেক্সট বসান" />;
    return (
      <div className="rounded-2xl border border-brand-light/30 bg-brand-light/[0.06] p-3.5">
        <h5 className="font-body text-[13.5px] font-black text-ink">{d.title || 'শিরোনাম নেই'}</h5>
        <p className="mt-1 line-clamp-3 font-body text-[12px] font-medium leading-relaxed text-muted">
          {d.body || 'কোনো বিবরণ নেই'}
        </p>
        <span className="mt-3 inline-flex items-center rounded-full bg-brand-light px-3 py-1 font-body text-[11px] font-black text-white">
          {d.btn_text || 'বাটন টেক্সট'}
        </span>
      </div>
    );
  }

  if (model === 'model2') {
    const d = cfg.model2;
    if (!d.img) return <EmptyPreview hint="ব্যানার ইমেজের URL বসান" />;
    return (
      <div className="overflow-hidden rounded-2xl border border-border-base/80 bg-surface-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={d.img}
          alt="অফার ব্যানার"
          className="max-h-[120px] w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {d.url && (
          <div className="truncate border-t border-border-base/60 bg-white px-3 py-1.5 font-mono text-[10.5px] font-medium text-muted">
            লিংক: {d.url}
          </div>
        )}
      </div>
    );
  }

  // model3
  const d = cfg.model3;
  if (!d.product_id) return <EmptyPreview hint="প্রোডাক্ট নির্বাচন করুন" />;
  const p = products.find((x) => String(x.id) === String(d.product_id));
  if (!p) return <EmptyPreview hint="প্রোডাক্টটি খুঁজে পাওয়া যায়নি" />;

  const imgs = Array.isArray(p.imgs) ? p.imgs : p.imgs ? [p.imgs] : ['📦'];
  const imgSrc = imgs[0] && (imgs[0].startsWith('http') || imgs[0].startsWith('/')) ? imgs[0] : null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border-base/80 bg-surface-muted/60 p-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-2xl">
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <span>{imgs[0] || '📦'}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="inline-block rounded-full bg-danger px-2 py-0.5 font-body text-[9.5px] font-extrabold text-white">
          {d.badge_text || 'HOT DEAL'}
        </span>
        <div className="mt-0.5 truncate font-body text-[13px] font-extrabold text-ink">{p.name}</div>
        <div className="mt-0.5 font-body text-[14px] font-black text-ink">
          ৳{Number(p.price || 0).toLocaleString('en-US')}
        </div>
      </div>
    </div>
  );
}

function EmptyPreview({ hint }: { hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-base/80 bg-surface-muted/40 p-6 text-center">
      <span className="font-body text-[12.5px] font-bold text-muted">কোনো তথ্য কনফিগার করা নেই</span>
      <span className="mt-0.5 font-body text-[11px] font-medium text-muted/70">{hint}</span>
    </div>
  );
}
