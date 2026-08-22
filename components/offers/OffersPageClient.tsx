'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OfferConfig, OfferActiveModel, Product } from '@/types';
import {
  toggleActiveModel,
  saveOfferModel1,
  saveOfferModel2,
  saveOfferModel3,
  deleteOfferModel,
} from '@/app/actions/offers';
import { useToast } from '@/components/admin/Toast';

interface Props {
  config: OfferConfig;
  products: Product[];
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

const MODEL_TITLES: Record<ModelKey, string> = {
  model1: 'মডেল ১: টেক্সট নোটিশ অফার',
  model2: 'মডেল ২: অফার ব্যানার ইমেজ',
  model3: 'মডেল ৩: হট প্রোডাক্ট প্রোমোশন',
};

const MODEL_PILLS: { key: ModelKey; emoji: string; label: string; sub: string }[] = [
  { key: 'model1', emoji: '📝', label: 'মডেল ১: টেক্সট নোটিশ অফার', sub: 'Title + Description + Button' },
  { key: 'model2', emoji: '🖼️', label: 'মডেল ২: অফার ব্যানার ইমেজ', sub: 'Image + Link' },
  { key: 'model3', emoji: '🔥', label: 'মডেল ৩: হট প্রোডাক্ট প্রোমোশন', sub: 'Product Card' },
];

export default function OffersPageClient({ config, products }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [cfg, setCfg] = useState<OfferConfig>(config);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingModel, setTogglingModel] = useState<ModelKey | null>(null);

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

  function closeEditor() {
    setEditor(null);
  }

  // legacy handleOfferToggle() — একটা চালু করলে বাকি দুইটা স্বয়ংক্রিয়ভাবে বন্ধ
  async function handleToggle(model: ModelKey, checked: boolean) {
    setTogglingModel(model);
    const res = await toggleActiveModel(model, checked);
    setTogglingModel(null);
    if (!res.ok) {
      showToast(res.message || 'ব্যর্থ হয়েছে');
      return;
    }
    setCfg((prev) => ({ ...prev, active_model: checked ? model : 'none' }));
    showToast(checked ? `✅ ${model} লাইভ!` : '⛔ অফার বন্ধ করা হয়েছে');
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
    setSaving(false);
    if (!res.ok) {
      showToast(res.message || 'ব্যর্থ হয়েছে');
      return;
    }
    showToast('✅ অফার সেভ হয়েছে!');
    closeEditor();
    router.refresh();
  }

  async function handleDelete() {
    if (!editor) return;
    if (!confirm('এই মডেলের ডেটা মুছে ফেলবেন?')) return;
    const res = await deleteOfferModel(editor.model);
    if (!res.ok) {
      showToast(res.message || 'ব্যর্থ হয়েছে');
      return;
    }
    if (cfg.active_model === editor.model) {
      setCfg((prev) => ({ ...prev, active_model: 'none' }));
    }
    showToast('🗑️ মডেল ডেটা মুছে ফেলা হয়েছে');
    closeEditor();
    router.refresh();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-xl text-ink">📢 অফার পপআপ ম্যানেজমেন্ট</h1>
          <p className="mt-0.5 text-sm text-muted">ভিজিটরদের জন্য পপআপ ও অফার পেজ কনফিগার করুন</p>
        </div>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-brand border border-border-base px-3.5 py-2 text-sm font-medium text-ink transition-brand hover:border-brand-primary"
        >
          🔄 রিফ্রেশ
        </button>
      </div>

      <div className="mb-5 text-center">
        <div className="mb-1.5 text-[17px] font-extrabold text-ink">আপনার ওয়েবসাইটে অফার যুক্ত করুন</div>
        <div className="text-xs text-muted">একটি মডেল বেছে নিন, তথ্য সেট করুন এবং চালু করুন</div>
      </div>

      {/* Model Pill Buttons */}
      <div className="mx-auto mb-2.5 max-w-lg">
        {MODEL_PILLS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => openEditor(p.key)}
            className={`mb-2.5 block w-full rounded-full border-2 px-6 py-4 text-left text-sm font-bold transition-brand hover:translate-x-1 hover:border-ink hover:bg-surface-muted ${
              cfg.active_model === p.key ? 'border-success bg-[#F0FDF4] text-success' : 'border-border-base bg-white text-ink'
            }`}
          >
            <span className="mr-2.5">{p.emoji}</span>
            {p.label}
            <span className="float-right text-[11px] font-medium text-muted">{p.sub}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-auto my-5 flex max-w-lg items-center gap-3 text-[11.5px] font-bold uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-border-base" />
        প্রিভিউ
        <span className="h-px flex-1 bg-border-base" />
      </div>

      {/* Preview Grid */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {MODEL_PILLS.map((p, i) => {
          const isLive = cfg.active_model === p.key;
          return (
            <div
              key={p.key}
              className={`overflow-hidden rounded-2xl border-[1.5px] bg-white transition-brand ${
                isLive ? 'border-success shadow-[0_0_0_3px_rgba(16,185,129,.12)]' : 'border-border-base'
              }`}
            >
              <div className="flex items-center justify-between border-b border-border-base bg-[#FAFAFA] px-3.5 py-3">
                <span className="text-[13px] font-bold text-[#374151]">মডেল {i + 1}</span>
                <div className="flex items-center gap-2">
                  {isLive && (
                    <span className="rounded-full bg-success px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                      এখন লাইভ দেখাবে ✓
                    </span>
                  )}
                  <label className="relative inline-block h-6 w-[42px] shrink-0" title={`মডেল ${i + 1} চালু/বন্ধ`}>
                    <input
                      type="checkbox"
                      checked={isLive}
                      disabled={togglingModel === p.key}
                      onChange={(e) => handleToggle(p.key, e.target.checked)}
                      className="peer h-0 w-0 opacity-0"
                    />
                    <span className="absolute inset-0 cursor-pointer rounded-full bg-[#D1D5DB] transition-brand before:absolute before:bottom-[3px] before:left-[3px] before:h-[18px] before:w-[18px] before:rounded-full before:bg-white before:shadow-md before:transition-brand peer-checked:bg-success peer-checked:before:translate-x-[18px]" />
                  </label>
                </div>
              </div>
              <div className="min-h-[100px] p-3.5">
                <OfferPreview model={p.key} cfg={cfg} products={products} />
              </div>
            </div>
          );
        })}
      </div>

      {editor && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="fixed inset-0" onClick={closeEditor} aria-hidden="true" />
          <div className="relative my-6 w-full max-w-md rounded-brand bg-brand-surface p-5 shadow-sh3">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">{MODEL_TITLES[editor.model]}</h3>
              <button type="button" onClick={closeEditor} className="text-lg text-muted hover:text-ink">
                ✕
              </button>
            </div>

            {editor.model === 'model1' && (
              <div className="flex flex-col gap-3.5">
                <Field label="টাইটেল">
                  <input
                    type="text"
                    value={editor.title}
                    onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                    placeholder="যেমন: বিশেষ ঈদ অফার 🎉"
                    className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="বিবরণ / Body">
                  <textarea
                    rows={4}
                    value={editor.body}
                    onChange={(e) => setEditor({ ...editor, body: e.target.value })}
                    placeholder="অফারের বিস্তারিত লিখুন..."
                    className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="বাটন টেক্সট">
                  <input
                    type="text"
                    value={editor.btn_text}
                    onChange={(e) => setEditor({ ...editor, btn_text: e.target.value })}
                    placeholder="যেমন: অফার দেখুন"
                    className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="বাটন লিংক (URL)">
                  <input
                    type="text"
                    value={editor.btn_url}
                    onChange={(e) => setEditor({ ...editor, btn_url: e.target.value })}
                    placeholder="https://... বা #section"
                    className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  />
                </Field>
              </div>
            )}

            {editor.model === 'model2' && (
              <div className="flex flex-col gap-3.5">
                <Field label="ব্যানার ইমেজ URL">
                  <input
                    type="text"
                    value={editor.img}
                    onChange={(e) => setEditor({ ...editor, img: e.target.value })}
                    placeholder="https://res.cloudinary.com/..."
                    className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  />
                  {editor.img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editor.img}
                      alt="preview"
                      className="mt-2 max-h-[150px] w-full rounded-lg object-cover"
                    />
                  )}
                </Field>
                <Field label="ক্লিক করলে যাবে (URL)">
                  <input
                    type="text"
                    value={editor.url}
                    onChange={(e) => setEditor({ ...editor, url: e.target.value })}
                    placeholder="https://... বা /#section"
                    className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  />
                </Field>
              </div>
            )}

            {editor.model === 'model3' && (
              <div className="flex flex-col gap-3.5">
                <Field label="প্রোডাক্ট বেছে নিন">
                  <select
                    value={editor.product_id}
                    onChange={(e) => setEditor({ ...editor, product_id: e.target.value })}
                    className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  >
                    <option value="">— প্রোডাক্ট বেছে নিন —</option>
                    {products.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name} — ৳{Number(p.price || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="ব্যাজ টেক্সট (যেমন: HOT DEAL, ৩০% ছাড়)">
                  <input
                    type="text"
                    value={editor.badge_text}
                    onChange={(e) => setEditor({ ...editor, badge_text: e.target.value })}
                    placeholder="HOT DEAL"
                    className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  />
                </Field>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="rounded-brand bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'সেভ হচ্ছে...' : '💾 সেভ করুন'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-brand border border-[#FECACA] bg-[#FEE2E2] px-4 py-2.5 text-sm font-semibold text-[#991B1B] transition-brand hover:bg-[#FECACA]"
                >
                  🗑️ অফার মুছুন
                </button>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-brand border border-border-base px-4 py-2.5 text-sm font-medium text-ink transition-brand hover:border-brand-primary"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-ink">{label}</label>
      {children}
    </div>
  );
}

// legacy _renderOfferPreview() — মডেল অনুযায়ী ৩ রকম প্রিভিউ, ডেটা না থাকলে empty state
function OfferPreview({ model, cfg, products }: { model: ModelKey; cfg: OfferConfig; products: Product[] }) {
  if (model === 'model1') {
    const d = cfg.model1;
    if (!d.title && !d.body) {
      return <EmptyState hint="মডেল ১ বাটনে ক্লিক করে সেটআপ করুন" />;
    }
    return (
      <div>
        <div className="-mx-3.5 -mt-3.5 mb-3 h-[3px] bg-gradient-to-r from-gold via-danger to-info" />
        <div className="mb-1 text-sm font-extrabold leading-tight text-ink">{d.title}</div>
        <div className="mb-2 text-xs leading-relaxed text-muted">{d.body}</div>
        <span className="inline-block rounded-lg bg-ink px-3.5 py-1.5 text-xs font-bold text-white">
          {d.btn_text || 'অফার দেখুন'}
        </span>
      </div>
    );
  }

  if (model === 'model2') {
    const d = cfg.model2;
    if (!d.img) {
      return <EmptyState hint="মডেল ২ বাটনে ক্লিক করে সেটআপ করুন" />;
    }
    return (
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={d.img}
          alt="ব্যানার"
          className="block max-h-[120px] w-full rounded-lg object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="mt-1.5 break-all text-[11px] text-muted">{d.url}</div>
      </div>
    );
  }

  // model3
  const d = cfg.model3;
  if (!d.product_id) {
    return <EmptyState hint="মডেল ৩ বাটনে ক্লিক করে সেটআপ করুন" />;
  }
  const p = products.find((x) => String(x.id) === String(d.product_id));
  if (!p) return <div className="py-4.5 text-center text-xs text-muted">প্রোডাক্ট পাওয়া যাচ্ছে না</div>;
  const imgs = Array.isArray(p.imgs) ? p.imgs : p.imgs ? [p.imgs] : ['📦'];
  const imgSrc = imgs[0] && imgs[0].startsWith('http') ? imgs[0] : null;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-muted text-[26px]">
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <span>{imgs[0] || '📦'}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 inline-block rounded-full bg-danger px-2.5 py-0.5 text-[10px] font-bold text-white">
          {d.badge_text || 'HOT DEAL'}
        </div>
        <div className="mb-0.5 truncate text-[13px] font-bold leading-tight text-ink">{p.name}</div>
        <span className="text-[15px] font-bold text-ink">৳{Number(p.price || 0).toLocaleString()}</span>
        {p.old && p.old > p.price && (
          <span className="ml-1 text-[11px] text-muted line-through">৳{Number(p.old).toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hint }: { hint: string }) {
  return (
    <div className="py-4.5 text-center text-xs text-[#9CA3AF]">
      কোনো ডেটা নেই
      <br />
      <span className="text-[11px]">{hint}</span>
    </div>
  );
}
