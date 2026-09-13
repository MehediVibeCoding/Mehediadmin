// ফাইলের পাথ: components/design/GuideTemplatesPageClient.tsx
// [NEW] গাইড টেমপ্লেট ম্যানেজার — নতুন টেমপ্লেট বানানো (key/name/scope/url_prefix),
// আর প্রতিটা টেমপ্লেটের block_skeleton এডিট করা (GuideBlockListEditor রি-ইউজ করে,
// যেটা GuideEditorModal-এও ব্যবহার হয় — তাই "টেমপ্লেট বানানো" আর "পেজ এডিট করা"
// একদম একই রকম অভিজ্ঞতা)।

'use client';

import { useState } from 'react';
import type { GuideBlock, GuidePageTemplate } from '@/types/guides';
import { guidePageUrlPath } from '@/types/guides';
import { createGuideTemplate, updateGuideTemplate, deleteGuideTemplate } from '@/app/actions/guideTemplates';
import { GuideBlockListEditor } from '@/components/guides/GuideBlockEditors';
import { useToast } from '@/components/admin/Toast';

export default function GuideTemplatesPageClient({ initialTemplates }: { initialTemplates: GuidePageTemplate[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [editing, setEditing] = useState<GuidePageTemplate | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-ink">গাইড টেমপ্লেট</h1>
          <p className="text-[12px] text-muted">
            প্রতিটা “গাইড পেজের ধরন” (pillar/comparison/ইনস্টলেশন গাইড/...) এখান থেকে ম্যানেজ হয় — নতুন ধরন
            লাগলে কোডে হাত না দিয়ে এখানেই নতুন টেমপ্লেট বানানো যায়।
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="shrink-0 rounded-brand bg-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          + নতুন টেমপ্লেট
        </button>
      </div>

      <div className="space-y-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setEditing(t)}
            className="flex w-full items-center justify-between rounded-lg border border-border-base bg-white p-3 text-left transition-brand hover:border-brand-primary"
          >
            <div>
              <div className="text-[13px] font-semibold text-ink">{t.name_bn} <span className="font-normal text-muted">({t.key})</span></div>
              <div className="text-[11px] text-muted">
                {t.scope === 'category' ? 'ক্যাটাগরি-লেভেল' : 'প্রোডাক্ট-লেভেল'} · {guidePageUrlPath('...', t.url_prefix)} · {t.block_skeleton.length}টা ব্লক দিয়ে শুরু
              </div>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${t.is_active ? 'bg-green-50 text-[#065F46]' : 'bg-gray-100 text-gray-500'}`}>
              {t.is_active ? 'অ্যাক্টিভ' : 'নিষ্ক্রিয়'}
            </span>
          </button>
        ))}
        {templates.length === 0 && (
          <div className="rounded-lg border border-dashed border-border-base p-6 text-center text-[12.5px] text-muted">এখনো কোনো টেমপ্লেট নেই</div>
        )}
      </div>

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

function CreateTemplateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: GuidePageTemplate) => void }) {
  const { showToast } = useToast();
  const [key, setKey] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [scope, setScope] = useState<'category' | 'product'>('category');
  const [urlPrefix, setUrlPrefix] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!key.trim() || !nameBn.trim()) {
      showToast('key আর নাম (বাংলা) দিতে হবে');
      return;
    }
    setSaving(true);
    const res = await createGuideTemplate({ key, name_bn: nameBn, name_en: nameEn || nameBn, scope, url_prefix: urlPrefix });
    setSaving(false);
    if (!res.ok || !res.template) {
      showToast('❌ ' + (res.message || 'তৈরি ব্যর্থ'));
      return;
    }
    showToast('✅ টেমপ্লেট তৈরি হয়েছে — এখন এর ব্লক-স্কেলিটন সাজান');
    onCreated(res.template);
  }

  return (
    <div className="fixed inset-0 z-[105] flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:items-center sm:p-6">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative my-4 w-full max-w-md rounded-brand bg-brand-surface p-5 shadow-sh3">
        <div className="mb-4 text-sm font-bold text-ink">নতুন গাইড টেমপ্লেট</div>

        <div className="mb-2.5">
          <label className="mb-1 block text-[11px] font-semibold text-ink">Key (ইংরেজি, আন্ডারস্কোর দিয়ে — যেমন buying_guide)</label>
          <input value={key} onChange={(e) => setKey(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
        </div>
        <div className="mb-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink">নাম (বাংলা)</label>
            <input value={nameBn} onChange={(e) => setNameBn(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink">নাম (English)</label>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
          </div>
        </div>
        <div className="mb-2.5">
          <label className="mb-1 block text-[11px] font-semibold text-ink">স্কোপ</label>
          <select value={scope} onChange={(e) => setScope(e.target.value as 'category' | 'product')} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]">
            <option value="category">ক্যাটাগরি-লেভেল (একবারই লাগে প্রতি ক্যাটাগরিতে)</option>
            <option value="product">প্রোডাক্ট-লেভেল (প্রতিটা প্রোডাক্টে আলাদা)</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-[11px] font-semibold text-ink">URL Prefix (খালি রাখলে সরাসরি রুটে /[slug])</label>
          <input value={urlPrefix} onChange={(e) => setUrlPrefix(e.target.value)} placeholder="buying-guide" className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
          <div className="mt-1 text-[10.5px] text-muted">/{urlPrefix ? `${urlPrefix}/` : ''}[slug]</div>
        </div>

        <div className="flex gap-2">
          <button disabled={saving} onClick={handleCreate} className="flex-1 rounded-brand bg-ink py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {saving ? 'তৈরি হচ্ছে...' : 'তৈরি করুন'}
          </button>
          <button onClick={onClose} className="rounded-brand border border-border-base px-4 py-2 text-sm">বাতিল</button>
        </div>
      </div>
    </div>
  );
}

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
  const { showToast } = useToast();
  const [nameBn, setNameBn] = useState(template.name_bn);
  const [nameEn, setNameEn] = useState(template.name_en);
  const [urlPrefix, setUrlPrefix] = useState(template.url_prefix);
  const [isActive, setIsActive] = useState(template.is_active);
  const [blocks, setBlocks] = useState<GuideBlock[]>(template.block_skeleton);
  const [saving, setSaving] = useState(false);

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
    if (!confirm('এই টেমপ্লেটটা মুছে দেবেন?')) return;
    const res = await deleteGuideTemplate(template.id);
    if (!res.ok) {
      showToast('❌ ' + (res.message || 'ডিলিট ব্যর্থ'));
      return;
    }
    showToast('🗑 মুছে ফেলা হয়েছে');
    onDeleted();
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:p-6">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative my-2 w-full max-w-3xl rounded-brand bg-brand-surface p-5 shadow-sh3">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-ink">{template.name_bn} <span className="font-normal text-muted">({template.key})</span></div>
            <div className="text-[11px] text-muted">key বদলানো যায় না — নতুন key লাগলে নতুন টেমপ্লেট বানাতে হবে</div>
          </div>
          <button onClick={onClose} className="rounded-md border border-border-base bg-white px-2.5 py-1.5 text-xs">বন্ধ করুন</button>
        </div>

        <div className="mb-4 rounded-lg border border-border-base bg-white p-3">
          <div className="mb-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink">নাম (বাংলা)</label>
              <input value={nameBn} onChange={(e) => setNameBn(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink">নাম (English)</label>
              <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
            </div>
          </div>
          <div className="mb-2.5">
            <label className="mb-1 block text-[11px] font-semibold text-ink">URL Prefix</label>
            <input value={urlPrefix} onChange={(e) => setUrlPrefix(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
            <div className="mt-1 text-[10.5px] text-amber-700">⚠️ বদলালে এই টেমপ্লেটের সব existing পেজের লাইভ URL বদলে যাবে</div>
          </div>
          <label className="flex items-center gap-2 text-[12px] text-ink">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            অ্যাক্টিভ (বন্ধ করলে “নতুন পেজ তৈরি করুন”-এ আর দেখাবে না, existing পেজ কাজ করতেই থাকবে)
          </label>
        </div>

        <div className="mb-3 text-[11px] font-bold text-ink">ব্লক-স্কেলিটন — নতুন পেজ এই টেমপ্লেট থেকে বানালে এই ব্লকগুলো দিয়েই শুরু হবে</div>
        <GuideBlockListEditor blocks={blocks} onChange={setBlocks} />

        <div className="mt-5 flex flex-wrap gap-2">
          <button disabled={saving} onClick={handleSave} className="flex-1 rounded-brand bg-ink py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90 disabled:opacity-50">
            {saving ? 'সেভ হচ্ছে...' : '💾 সেভ করুন'}
          </button>
          <button onClick={handleDelete} className="rounded-brand border border-[#FECACA] bg-[#FEE2E2] px-4 py-2.5 text-sm font-semibold text-[#991B1B] hover:bg-[#FECACA]">
            টেমপ্লেট ডিলিট
          </button>
        </div>
      </div>
    </div>
  );
}
