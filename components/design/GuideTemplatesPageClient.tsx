// ফাইলের পাথ: components/design/GuideTemplatesPageClient.tsx
// গাইড টেমপ্লেট ম্যানেজার — নতুন টেমপ্লেট বানানো (key/name/scope/url_prefix) আর প্রতিটা
// টেমপ্লেটের block_skeleton এডিট করা (GuideBlockListEditor রি-ইউজ — GuideEditorModal-এও একই)।

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GuideBlock, GuidePageTemplate } from '@/types/guides';
import { guidePageUrlPath } from '@/types/guides';
import { createGuideTemplate, updateGuideTemplate, deleteGuideTemplate } from '@/app/actions/guideTemplates';
import { GuideBlockListEditor } from '@/components/guides/GuideBlockEditors';
import { useToast } from '@/components/admin/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Checkbox from '@/components/common/Checkbox';
import SectionHeading from '@/components/common/SectionHeading';
import { Field, SelectBox, FIELD_CLS } from '@/components/common/FormField';

type Filter = 'all' | 'category' | 'product' | 'inactive';

function Svg({ children, className = 'h-4 w-4', sw = 2.2 }: { children: React.ReactNode; className?: string; sw?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

// মডাল খোলা থাকলে ব্যাকগ্রাউন্ড স্ক্রল লক
function useBodyLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
}

const CloseBtn = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label="বন্ধ করুন"
    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sh1 transition-all duration-brand hover:bg-border-base active:scale-90 disabled:opacity-50"
  >
    <Svg className="h-3.5 w-3.5" sw={2.8}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  </button>
);

export default function GuideTemplatesPageClient({ initialTemplates }: { initialTemplates: GuidePageTemplate[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [editing, setEditing] = useState<GuidePageTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(
    () => ({
      all: templates.length,
      category: templates.filter((t) => t.scope === 'category').length,
      product: templates.filter((t) => t.scope === 'product').length,
      inactive: templates.filter((t) => !t.is_active).length,
    }),
    [templates]
  );

  const visible = templates.filter((t) => {
    if (filter === 'category') return t.scope === 'category';
    if (filter === 'product') return t.scope === 'product';
    if (filter === 'inactive') return !t.is_active;
    return true;
  });

  const chips: { id: Filter; label: string }[] = [
    { id: 'all', label: 'সব' },
    { id: 'category', label: 'ক্যাটাগরি-লেভেল' },
    { id: 'product', label: 'প্রোডাক্ট-লেভেল' },
    { id: 'inactive', label: 'নিষ্ক্রিয়' },
  ];

  return (
    <div>
      {/* ══ ১. টুলবার কার্ড + ফিল্টার চিপ ══ */}
      <div className="mb-4 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light/15 text-brand-light sm:h-10 sm:w-10">
              <Svg className="h-5 w-5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6M8 13h8M8 17h5" />
              </Svg>
            </span>
            <div className="min-w-0">
              <div className="font-body text-[14px] font-black text-ink">গাইড টেমপ্লেট</div>
              <div className="font-body text-[11px] font-semibold leading-snug text-muted">নতুন গাইড পেজের ধরন কোডে হাত না দিয়েই এখানে বানান</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-brand-light px-6 font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] sm:h-10 sm:w-auto sm:text-[12.5px]"
          >
            <Svg className="h-3.5 w-3.5" sw={3}>
              <path d="M12 5v14M5 12h14" />
            </Svg>
            নতুন টেমপ্লেট
          </button>
        </div>

        <div className="no-scrollbar -mx-3.5 mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 sm:-mx-4 sm:px-4">
          {chips.map((c) => {
            const active = filter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                className={`flex h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 font-body text-[12px] font-extrabold transition-all duration-brand active:scale-95 lg:h-9 ${
                  active
                    ? 'border-brand-light bg-brand-light text-white shadow-[0_4px_14px_rgba(68,167,252,0.36)]'
                    : 'border-border-base/80 bg-white text-ink hover:border-brand-light hover:text-brand-light'
                }`}
              >
                <span>{c.label}</span>
                <span className={`min-w-[22px] rounded-full px-1.5 text-center text-[10.5px] font-black leading-[18px] ${active ? 'bg-white/25 text-white' : 'bg-surface-muted text-muted'}`}>
                  {counts[c.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ ২. টেমপ্লেট তালিকা ══ */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] border border-white/90 bg-white px-6 py-16 text-center shadow-sh1">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/15 text-brand-light">
            <Svg className="h-6 w-6">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6" />
            </Svg>
          </span>
          <span className="font-body text-[14px] font-extrabold text-ink">{templates.length === 0 ? 'এখনো কোনো টেমপ্লেট নেই' : 'কিছু পাওয়া যায়নি'}</span>
          <span className="font-body text-[12px] font-medium text-muted">{templates.length === 0 ? 'উপরের বাটন থেকে প্রথম টেমপ্লেট বানান' : 'ফিল্টার বদলে দেখুন'}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {visible.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setEditing(t)}
              className="flex w-full items-center gap-3 rounded-[20px] border border-white/90 bg-white p-3.5 text-left shadow-sh1 transition-all duration-brand hover:shadow-sh2 active:scale-[0.99]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border-base/70 bg-brand-light/10 text-brand-light">
                <Svg className="h-5 w-5">
                  {t.scope === 'category' ? (
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  ) : (
                    <>
                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
                    </>
                  )}
                </Svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-body text-[14px] font-extrabold text-ink">{t.name_bn}</span>
                  <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 font-mono text-[10px] font-bold text-muted">{t.key}</span>
                </div>
                <div className="mt-1 truncate font-body text-[11px] font-semibold text-muted">
                  {t.scope === 'category' ? 'ক্যাটাগরি-লেভেল' : 'প্রোডাক্ট-লেভেল'} · {t.block_skeleton.length}টা ব্লক
                </div>
                <div className="mt-0.5 truncate font-mono text-[10.5px] font-semibold text-ink/50">{guidePageUrlPath('...', t.url_prefix)}</div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 font-body text-[10.5px] font-extrabold ${
                  t.is_active ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-surface-muted text-muted'
                }`}
              >
                {t.is_active ? 'অ্যাক্টিভ' : 'নিষ্ক্রিয়'}
              </span>
            </button>
          ))}
        </div>
      )}

      {creating && (
        <CreateTemplateModal
          onClose={() => setCreating(false)}
          onCreated={(t) => {
            setTemplates([...templates, t]);
            setCreating(false);
            setEditing(t);
          }}
        />
      )}

      {editing && (
        <EditTemplateModal
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={(t) => {
            setTemplates(templates.map((x) => (x.id === t.id ? t : x)));
            setEditing(null);
          }}
          onDeleted={() => {
            setTemplates(templates.filter((x) => x.id !== editing.id));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/* ────────────────────────────── নতুন টেমপ্লেট মডাল ────────────────────────────── */

function CreateTemplateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: GuidePageTemplate) => void }) {
  useBodyLock();
  const { showToast } = useToast();
  const [key, setKey] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [scope, setScope] = useState<'category' | 'product'>('category');
  const [urlPrefix, setUrlPrefix] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!key.trim() || !nameBn.trim()) {
      setError('key আর নাম (বাংলা) দিতে হবে');
      return;
    }
    setError('');
    setSaving(true);
    const res = await createGuideTemplate({ key, name_bn: nameBn, name_en: nameEn || nameBn, scope, url_prefix: urlPrefix });
    setSaving(false);
    if (!res.ok || !res.template) {
      setError(res.message || 'তৈরি ব্যর্থ হয়েছে');
      return;
    }
    showToast('✅ টেমপ্লেট তৈরি হয়েছে — এখন ব্লক-স্কেলিটন সাজান');
    onCreated(res.template);
  }

  return (
    <div
      className="animate-soft-fade-in fixed inset-0 z-[105] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="animate-sheet-up flex max-h-[94dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] md:max-h-[92dvh] md:rounded-[28px] md:shadow-[0_24px_70px_rgba(26,26,26,0.28)]">
        <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.12] to-white px-5 pb-3.5 pt-2.5 md:pt-5">
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 md:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-body text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">নতুন টেমপ্লেট</div>
              <h3 className="mt-0.5 font-body text-[22px] font-black leading-tight text-ink">গাইড টেমপ্লেট তৈরি</h3>
            </div>
            <CloseBtn onClick={onClose} disabled={saving} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
          <div className="space-y-8">
            <section>
              <SectionHeading>পরিচিতি</SectionHeading>
              <div className="space-y-3.5">
                <Field label="Key" required help="ইংরেজি ছোট হাতের অক্ষর, আন্ডারস্কোর দিয়ে — যেমন buying_guide। পরে বদলানো যায় না।">
                  <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="buying_guide" autoCapitalize="none" autoCorrect="off" className={FIELD_CLS} />
                </Field>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field label="নাম (বাংলা)" required>
                    <input value={nameBn} onChange={(e) => setNameBn(e.target.value)} className={FIELD_CLS} />
                  </Field>
                  <Field label="নাম (English)" hint="(ফাঁকা থাকলে বাংলাটাই)">
                    <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={FIELD_CLS} />
                  </Field>
                </div>
              </div>
            </section>

            <section>
              <SectionHeading>স্কোপ ও URL</SectionHeading>
              <div className="space-y-3.5">
                <Field label="স্কোপ">
                  <SelectBox value={scope} onChange={(v) => setScope(v as 'category' | 'product')}>
                    <option value="category">ক্যাটাগরি-লেভেল (প্রতি ক্যাটাগরিতে একবারই)</option>
                    <option value="product">প্রোডাক্ট-লেভেল (প্রতিটা প্রোডাক্টে আলাদা)</option>
                  </SelectBox>
                </Field>
                <Field label="URL Prefix" hint="(ফাঁকা রাখলে সরাসরি রুটে)">
                  <input value={urlPrefix} onChange={(e) => setUrlPrefix(e.target.value)} placeholder="buying-guide" autoCapitalize="none" autoCorrect="off" className={FIELD_CLS} />
                  <div className="mt-2 inline-flex max-w-full items-center truncate rounded-full bg-surface-muted px-3 py-1 font-mono text-[11px] font-semibold text-ink/70">
                    /{urlPrefix.trim() ? `${urlPrefix.trim()}/` : ''}[slug]
                  </div>
                </Field>
              </div>
            </section>

            {error && <div className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 font-body text-[12.5px] font-bold text-danger">{error}</div>}
          </div>
        </div>

        <div className="shrink-0 border-t border-border-base/70 bg-white px-5 pt-3.5" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="grid grid-cols-[1fr_2fr] gap-2.5">
            <button type="button" onClick={onClose} disabled={saving} className="h-12 rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98] disabled:opacity-60">
              বাতিল
            </button>
            <button type="button" disabled={saving} onClick={handleCreate} className="h-12 rounded-full bg-brand-light font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-60">
              {saving ? 'তৈরি হচ্ছে...' : 'তৈরি করুন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────── টেমপ্লেট এডিট মডাল ────────────────────────────── */

function EditTemplateModal({
  template,
  onClose,
  onSaved,
  onDeleted,
}: {
  template: GuidePageTemplate;
  onClose: () => void;
  onSaved: (t: GuidePageTemplate) => void;
  onDeleted: () => void;
}) {
  useBodyLock();
  const { showToast } = useToast();
  const [nameBn, setNameBn] = useState(template.name_bn);
  const [nameEn, setNameEn] = useState(template.name_en);
  const [urlPrefix, setUrlPrefix] = useState(template.url_prefix);
  const [isActive, setIsActive] = useState(template.is_active);
  const [blocks, setBlocks] = useState<GuideBlock[]>(template.block_skeleton);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await updateGuideTemplate({
      id: template.id,
      name_bn: nameBn,
      name_en: nameEn,
      url_prefix: urlPrefix,
      block_skeleton: blocks,
      is_active: isActive,
    });
    setSaving(false);
    if (!res.ok || !res.template) {
      showToast('❌ ' + (res.message || 'সেভ ব্যর্থ'));
      return;
    }
    showToast('✅ সেভ হয়েছে');
    onSaved(res.template);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await deleteGuideTemplate(template.id);
    setDeleting(false);
    if (!res.ok) {
      setConfirmDelete(false);
      showToast('❌ ' + (res.message || 'ডিলিট ব্যর্থ'));
      return;
    }
    showToast('🗑️ মুছে ফেলা হয়েছে');
    onDeleted();
  }

  const prefixChanged = urlPrefix !== template.url_prefix;

  return (
    <div
      className="animate-soft-fade-in fixed inset-0 z-[110] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="animate-sheet-up flex max-h-[94dvh] w-full max-w-[820px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] md:max-h-[92dvh] md:rounded-[28px] md:shadow-[0_24px_70px_rgba(26,26,26,0.28)]">
        <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.12] to-white px-5 pb-3.5 pt-2.5 md:pt-5">
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 md:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-body text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">টেমপ্লেট এডিটর</div>
              <h3 className="mt-0.5 flex items-center gap-2 font-body text-[22px] font-black leading-tight text-ink">
                <span className="truncate">{template.name_bn}</span>
                <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 font-mono text-[11px] font-bold text-muted">{template.key}</span>
              </h3>
            </div>
            <CloseBtn onClick={onClose} disabled={saving} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
          <div className="space-y-8">
            <section>
              <SectionHeading hint="key বদলানো যায় না — নতুন key লাগলে নতুন টেমপ্লেট বানাতে হবে">বেসিক তথ্য</SectionHeading>
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field label="নাম (বাংলা)">
                    <input value={nameBn} onChange={(e) => setNameBn(e.target.value)} className={FIELD_CLS} />
                  </Field>
                  <Field label="নাম (English)">
                    <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={FIELD_CLS} />
                  </Field>
                </div>
                <Field label="URL Prefix">
                  <input value={urlPrefix} onChange={(e) => setUrlPrefix(e.target.value)} autoCapitalize="none" autoCorrect="off" className={FIELD_CLS} />
                  <div className="mt-2 inline-flex max-w-full items-center truncate rounded-full bg-surface-muted px-3 py-1 font-mono text-[11px] font-semibold text-ink/70">
                    /{urlPrefix.trim() ? `${urlPrefix.trim()}/` : ''}[slug]
                  </div>
                  {prefixChanged && (
                    <div className="mt-2 rounded-2xl border border-amber-200/80 bg-amber-50 px-3.5 py-2.5 font-body text-[11.5px] font-bold leading-snug text-[#92400E]">
                      সেভ করলে এই টেমপ্লেটের সব existing পেজের লাইভ URL বদলে যাবে।
                    </div>
                  )}
                </Field>

                <div className="flex items-start gap-1 rounded-2xl border border-border-base/80 bg-surface-muted/60 px-2 py-1.5">
                  <Checkbox checked={isActive} onChange={setIsActive} label="অ্যাক্টিভ" />
                  <div className="min-w-0 py-1.5">
                    <div className="font-body text-[13px] font-extrabold text-ink">অ্যাক্টিভ</div>
                    <div className="font-body text-[11.5px] font-medium leading-snug text-muted">
                      বন্ধ করলে “নতুন পেজ তৈরি করুন”-এ আর দেখাবে না। existing পেজ কাজ করতেই থাকবে।
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <SectionHeading hint="নতুন পেজ এই টেমপ্লেট থেকে বানালে এই ব্লকগুলো দিয়েই শুরু হবে">ব্লক-স্কেলিটন</SectionHeading>
              <GuideBlockListEditor blocks={blocks} onChange={setBlocks} />
            </section>
          </div>
        </div>

        <div className="shrink-0 border-t border-border-base/70 bg-white px-5 pt-3.5" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="grid grid-cols-[auto_1fr_2fr] gap-2.5">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              title="টেমপ্লেট ডিলিট"
              aria-label="টেমপ্লেট ডিলিট"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-danger transition-all duration-brand active:scale-90 disabled:opacity-60"
            >
              <Svg className="h-[18px] w-[18px]">
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </Svg>
            </button>
            <button type="button" onClick={onClose} disabled={saving} className="h-12 rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98] disabled:opacity-60">
              বাতিল
            </button>
            <button type="button" disabled={saving} onClick={handleSave} className="h-12 rounded-full bg-brand-light font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-60">
              {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
            </button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="টেমপ্লেটটা মুছে দেবেন?"
          message={`“${template.name_bn}” টেমপ্লেট স্থায়ীভাবে মুছে যাবে।`}
          confirmLabel="হ্যাঁ, মুছুন"
          busyLabel="মুছছি..."
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
