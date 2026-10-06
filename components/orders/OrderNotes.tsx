'use client';

import { useEffect, useState } from 'react';
import { addOrderNote, deleteOrderNote, listOrderNotes, type OrderNote } from '@/app/actions/orderNotes';
import { useToast } from '@/components/admin/Toast';
import SectionHeading from '@/components/common/SectionHeading';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { TEXTAREA_CLS } from '@/components/common/FormField';

const NOTE_MAX = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function daysLeft(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / DAY_MS));
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit', hour12: true })
  );
}

// অর্ডার ডিটেইল মডালের ভেতরের "অ্যাডমিন নোট" — শুধু এখানেই দেখায়, আর কোথাও নয়।
// প্রতিটা নোট আলাদা; ৩০ দিন পরে ডাটাবেজ নিজে মুছে ফেলে।
export default function OrderNotes({ orderId }: { orderId: string }) {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OrderNote | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    setNotes([]);
    setText('');
    listOrderNotes(orderId)
      .then((rows) => {
        if (!cancelled) setNotes(rows);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function handleSave() {
    const value = text.trim();
    if (!value || saving) return;
    setSaving(true);
    try {
      const res = await addOrderNote(orderId, value);
      if (res.status === 'ok') {
        setNotes((prev) => [res.note, ...prev]);
        setText('');
        showToast('✅ নোট সেভ হয়েছে');
      } else {
        showToast('❌ ' + (res.message || 'নোট সেভ হয়নি'));
      }
    } catch {
      showToast('❌ নোট সেভ হয়নি, আবার চেষ্টা করুন');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const res = await deleteOrderNote(deleteTarget.id);
      if (res.status === 'ok') {
        const gone = deleteTarget.id;
        setNotes((prev) => prev.filter((n) => n.id !== gone));
        showToast('✅ নোট মুছে ফেলা হয়েছে');
      } else {
        showToast('❌ ' + (res.message || 'নোট মোছা যায়নি'));
      }
    } catch {
      showToast('❌ নোট মোছা যায়নি, আবার চেষ্টা করুন');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <section>
      <SectionHeading hint="শুধু অ্যাডমিন প্যানেলে দেখা যায় — কাস্টমার বা মেইন সাইটে কখনো যায় না। প্রতিটা নোট ৩০ দিন পরে নিজে মুছে যায়।">
        অ্যাডমিন নোট
      </SectionHeading>

      <textarea
        rows={3}
        maxLength={NOTE_MAX}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="যেমন: পরশু ডেলিভারি দিতে বলেছে, দুইবার কল দিয়েছি ধরেনি..."
        className={TEXTAREA_CLS + ' resize-none focus:border-brand-light focus:outline-none'}
        disabled={saving}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="font-body text-[11px] font-semibold text-muted">
          {text.length}/{NOTE_MAX}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="h-10 rounded-full bg-brand-light px-5 font-body text-[13px] font-extrabold text-white transition-all duration-brand hover:bg-brand-light-hover active:scale-95 disabled:opacity-50"
        >
          {saving ? 'সেভ হচ্ছে...' : 'নোট যোগ করুন'}
        </button>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="rounded-2xl border border-border-base/80 bg-surface-muted/60 px-4 py-4 text-center font-body text-[12.5px] font-medium text-muted">
            নোট লোড হচ্ছে...
          </div>
        ) : loadFailed ? (
          <div className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-center font-body text-[12.5px] font-bold text-red-700">
            নোট লোড করা যায়নি। মডাল বন্ধ করে আবার খুলুন।
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-2xl border border-border-base/80 bg-surface-muted/60 px-4 py-4 text-center font-body text-[12.5px] font-medium text-muted">
            এই অর্ডারে এখনো কোনো নোট নেই
          </div>
        ) : (
          <ul className="space-y-2.5">
            {notes.map((n) => (
              <li
                key={n.id}
                className="rounded-2xl border border-border-base/80 border-l-[3.5px] border-l-brand-light bg-surface-muted/60 px-4 py-3"
              >
                <p className="whitespace-pre-wrap break-words font-body text-[13.5px] font-semibold leading-relaxed text-ink">
                  {n.note}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3 font-body text-[11px] font-semibold text-muted">
                  <span className="min-w-0">
                    {formatWhen(n.created_at)} · আর {daysLeft(n.expires_at).toLocaleString('bn-BD')} দিন থাকবে
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(n)}
                    aria-label="নোট মুছুন"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-all duration-brand hover:bg-red-50 hover:text-danger active:scale-90"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="নোটটি মুছবেন?"
          message="মুছে ফেললে নোটটি আর ফেরত পাওয়া যাবে না।"
          confirmLabel="হ্যাঁ, মুছুন"
          busyLabel="মুছছে..."
          busy={deleting}
          tone="danger"
          onConfirm={handleDelete}
          onCancel={() => !deleting && setDeleteTarget(null)}
        />
      )}
    </section>
  );
}
