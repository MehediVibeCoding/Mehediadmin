'use client';

import { useEffect, useRef, useState } from 'react';
import { deleteOrderNote, getOrderNote, saveOrderNote, type OrderNote } from '@/app/actions/orderNotes';
import { useToast } from '@/components/admin/Toast';
import SectionHeading from '@/components/common/SectionHeading';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { TEXTAREA_CLS } from '@/components/common/FormField';

const NOTE_MAX = 1000;

// অর্ডার ডিটেইল মডালের ভেতরের "অ্যাডমিন নোট" — শুধু এখানেই দেখায়, আর কোথাও নয়।
// প্রতি অর্ডারে একটাই নোট: না থাকলে শুধু ছোট একটা "+"; থাকলে নোটটা আর ✏️ এডিট / 🗑 ডিলিট আইকন।
// এডিট করলে ৩০ দিনের মেয়াদ আবার নতুন করে গোনা শুরু হয়।
export default function OrderNotes({ orderId }: { orderId: string }) {
  const { showToast } = useToast();
  const [note, setNote] = useState<OrderNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    setNote(null);
    setEditing(false);
    setText('');
    getOrderNote(orderId)
      .then((row) => {
        if (!cancelled) setNote(row);
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

  useEffect(() => {
    if (editing) areaRef.current?.focus();
  }, [editing]);

  function startAdd() {
    setText('');
    setEditing(true);
  }

  function startEdit() {
    if (!note) return;
    setText(note.note);
    setEditing(true);
  }

  function cancelEdit() {
    if (saving) return;
    setEditing(false);
    setText('');
  }

  async function handleSave() {
    const value = text.trim();
    if (!value || saving) return;
    setSaving(true);
    try {
      const res = await saveOrderNote(orderId, value);
      if (res.status === 'ok') {
        setNote(res.note);
        setEditing(false);
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
    if (!note || deleting) return;
    setDeleting(true);
    try {
      const res = await deleteOrderNote(orderId);
      if (res.status === 'ok') {
        setNote(null);
        showToast('✅ নোট মুছে ফেলা হয়েছে');
      } else {
        showToast('❌ ' + (res.message || 'নোট মোছা যায়নি'));
      }
    } catch {
      showToast('❌ নোট মোছা যায়নি, আবার চেষ্টা করুন');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const iconBtn =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-all duration-brand active:scale-90';

  return (
    <section>
      {/* হেডিং + (নোট না থাকলে) ছোট "+" — কোনো ব্যাখ্যা/hint নেই */}
      <div className="flex items-center gap-2">
        <SectionHeading className="!mb-0">অ্যাডমিন নোট</SectionHeading>
        {!loading && !loadFailed && !note && !editing && (
          <button
            type="button"
            onClick={startAdd}
            aria-label="নোট যোগ করুন"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-light/12 text-brand-light transition-all duration-brand hover:bg-brand-light/20 active:scale-90"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>

      {loadFailed && (
        <p className="mt-2 font-body text-[12px] font-bold text-red-700">নোট লোড হয়নি</p>
      )}

      {editing && (
        <div className="mt-3">
          <textarea
            ref={areaRef}
            rows={3}
            maxLength={NOTE_MAX}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={TEXTAREA_CLS + ' resize-none focus:border-brand-light focus:outline-none'}
            disabled={saving}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="font-body text-[11px] font-semibold text-muted">
              {text.length}/{NOTE_MAX}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="h-10 rounded-full bg-surface-muted px-4 font-body text-[13px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-95 disabled:opacity-60"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !text.trim()}
                className="h-10 rounded-full bg-brand-light px-5 font-body text-[13px] font-extrabold text-white transition-all duration-brand hover:bg-brand-light-hover active:scale-95 disabled:opacity-50"
              >
                {saving ? '...' : 'সেভ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!editing && note && (
        <div
          className="mt-3 rounded-2xl border border-border-base/80 border-l-[3.5px] border-l-brand-light bg-surface-muted/60 py-3 pl-4 pr-2"
          title="৩০ দিন পরে নিজে মুছে যাবে (এডিট করলে আবার ৩০ দিন)"
        >
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 whitespace-pre-wrap break-words pt-1 font-body text-[13.5px] font-semibold leading-relaxed text-ink">
              {note.note}
            </p>
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={startEdit}
                aria-label="নোট এডিট করুন"
                className={iconBtn + ' hover:bg-brand-light/12 hover:text-brand-light'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="নোট মুছুন"
                className={iconBtn + ' hover:bg-red-50 hover:text-danger'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="নোটটি মুছবেন?"
          message="মুছে ফেললে নোটটি আর ফেরত পাওয়া যাবে না।"
          confirmLabel="হ্যাঁ, মুছুন"
          busyLabel="মুছছে..."
          busy={deleting}
          tone="danger"
          onConfirm={handleDelete}
          onCancel={() => !deleting && setConfirmDelete(false)}
        />
      )}
    </section>
  );
}
