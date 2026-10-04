'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProductQuestionWithAnswers } from '@/types';
import { answerQuestion, deleteQuestion, deleteAnswer } from '@/app/actions/product-qa';
import { useToast } from '@/components/admin/Toast';
import Pagination, { PAGE_SIZE } from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { formatDateBn } from '@/lib/dateFormat';

interface Props {
  questions: ProductQuestionWithAnswers[];
  onQuestionsChange: (updater: (prev: ProductQuestionWithAnswers[]) => ProductQuestionWithAnswers[]) => void;
}

type FilterTab = 'unanswered' | 'answered' | 'all';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'unanswered', label: 'উত্তরহীন' },
  { key: 'answered', label: 'উত্তর দেওয়া হয়েছে' },
  { key: 'all', label: 'সব প্রশ্ন' },
];

const formatDate = (d: string) => formatDateBn(d);

/* ── ইনলাইন্ড উত্তর দেওয়ার মডাল / বটম-শীট ── */
function AnswerQuestionModal({
  question,
  busy,
  onCancel,
  onConfirm,
}: {
  question: ProductQuestionWithAnswers;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (answer: string) => void;
}) {
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [busy, onCancel]);

  return (
    <div
      className="animate-soft-fade-in fixed inset-0 z-[70] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
      onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-sheet-up flex max-h-[92dvh] w-full max-w-[500px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] md:rounded-[26px] md:shadow-[0_24px_70px_rgba(26,26,26,0.28)]"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* হেডার */}
        <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.12] to-white px-5 pb-3.5 pt-2.5 md:pt-4">
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 md:hidden" />
          <div className="flex items-center justify-between">
            <h3 className="font-body text-[16px] font-black text-ink">প্রশ্নের উত্তর দিন</h3>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              aria-label="বন্ধ করুন"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-sh1 transition-all duration-brand hover:bg-border-base active:scale-90 disabled:opacity-50"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* বডি */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {/* মূল প্রশ্ন প্রিভিউ বক্স */}
          <div className="mb-3.5 rounded-2xl border border-border-base/80 bg-surface-muted/60 p-3.5">
            <div className="font-body text-[13px] font-extrabold text-brand-light">
              {question.product_name}
            </div>
            <div className="mt-1 font-body text-[11.5px] font-semibold text-muted">
              <span className="font-bold text-ink">{question.user_name || 'গ্রাহক'}</span> জিজ্ঞাসা করেছেন:
            </div>
            <p className="mt-1.5 font-body text-[13px] font-medium leading-relaxed text-ink">
              &ldquo;{question.question}&rdquo;
            </p>
          </div>

          <label className="mb-1.5 block font-body text-[12px] font-extrabold text-ink">
            অফিসিয়াল উত্তর লিখুন
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            placeholder="Vangcur টিমের পক্ষ থেকে সঠিক ও তথ্যবহুল উত্তর লিখুন..."
            autoFocus
            className="w-full rounded-2xl border border-border-base/90 bg-white p-3.5 font-body text-[13px] font-medium leading-relaxed text-ink transition-all duration-brand placeholder:text-muted/60"
          />
        </div>

        {/* ফুটার */}
        <div className="shrink-0 border-t border-border-base/70 px-5 pt-3">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="h-12 rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98] disabled:opacity-50"
            >
              বাতিল
            </button>
            <button
              type="button"
              disabled={busy || !answer.trim()}
              onClick={() => onConfirm(answer)}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-light font-body text-[13.5px] font-black text-white shadow-[0_4px_14px_rgba(68,167,252,0.4)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? (
                'সাবমিট হচ্ছে...'
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  উত্তর পোস্ট করুন
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   মূল প্রশ্নোত্তর প্যানেল কম্পোনেন্ট
   ══════════════════════════════════════════════════════════════ */
export default function QnAPanel({ questions, onQuestionsChange }: Props) {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterTab>('unanswered');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [answerTarget, setAnswerTarget] = useState<ProductQuestionWithAnswers | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<number | null>(null);
  const [deleteAnswerTarget, setDeleteAnswerTarget] = useState<{ questionId: number; answerId: number } | null>(null);

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = { all: questions.length, unanswered: 0, answered: 0 };
    questions.forEach((q) => {
      if (q.answers.length === 0) c.unanswered++;
      else c.answered++;
    });
    return c;
  }, [questions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return questions.filter((item) => {
      if (filter === 'unanswered' && item.answers.length > 0) return false;
      if (filter === 'answered' && item.answers.length === 0) return false;
      if (q) {
        const hay = `${item.product_name || ''} ${item.user_name || ''} ${item.question || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [questions, filter, search]);

  const paginated = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return filtered.slice(from, from + PAGE_SIZE);
  }, [filtered, page]);

  function changeFilter(f: FilterTab) {
    setFilter(f);
    setPage(1);
  }

  async function handleAnswerConfirm(answerText: string) {
    if (!answerTarget) return;
    const id = answerTarget.id;
    setBusyId(id);
    const res = await answerQuestion(id, answerText);
    setBusyId(null);
    if (!res.ok) {
      showToast(res.message || '❌ উত্তর প্রকাশ ব্যর্থ');
      return;
    }
    onQuestionsChange((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              answers: [
                ...q.answers,
                {
                  id: Date.now(),
                  question_id: id,
                  user_id: null,
                  author_name: 'Vangcur টিম',
                  is_admin: true,
                  answer: answerText.trim(),
                  created_at: new Date().toISOString(),
                },
              ],
            }
          : q
      )
    );
    showToast('✅ উত্তর সাবমিট হয়েছে');
    setAnswerTarget(null);
  }

  async function handleDeleteQuestionConfirm() {
    if (!deleteQuestionId) return;
    const id = deleteQuestionId;
    setBusyId(id);
    const res = await deleteQuestion(id);
    setBusyId(null);
    if (!res.ok) {
      showToast(res.message || '❌ মুছতে সমস্যা হয়েছে');
      return;
    }
    onQuestionsChange((prev) => prev.filter((q) => q.id !== id));
    showToast('🗑️ প্রশ্ন মুছে ফেলা হয়েছে');
    setDeleteQuestionId(null);
  }

  async function handleDeleteAnswerConfirm() {
    if (!deleteAnswerTarget) return;
    const { questionId, answerId } = deleteAnswerTarget;
    setBusyId(answerId);
    const res = await deleteAnswer(answerId);
    setBusyId(null);
    if (!res.ok) {
      showToast(res.message || '❌ উত্তর মুছতে ব্যর্থ');
      return;
    }
    onQuestionsChange((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, answers: q.answers.filter((a) => a.id !== answerId) } : q))
    );
    showToast('🗑️ উত্তর মুছে ফেলা হয়েছে');
    setDeleteAnswerTarget(null);
  }

  return (
    <div>
      {/* ══ টুলবার কার্ড: সার্চ + ফিল্টার চিপস ══ */}
      <div className="mb-4 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
        {/* সার্চ বার */}
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-light"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="প্রোডাক্টের নাম, গ্রাহক বা প্রশ্ন দিয়ে খুঁজুন..."
            className="h-11 w-full rounded-full border border-border-base/80 bg-surface-muted/50 pl-11 pr-10 font-body text-[13px] font-medium text-ink transition-all duration-brand placeholder:text-muted/70 focus:bg-white lg:h-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              aria-label="সার্চ মুছুন"
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-border-base/70 text-muted transition-colors hover:bg-brand-light hover:text-white"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ফিল্টার চিপস (কাউন্টসহ সাইড-স্ক্রল) */}
        <div className="no-scrollbar -mx-3.5 mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 sm:-mx-4 sm:px-4">
          {TABS.map((t) => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => changeFilter(t.key)}
                className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 font-body text-[12px] font-extrabold transition-all duration-brand active:scale-95 ${
                  active
                    ? 'border-brand-light bg-brand-light text-white shadow-[0_4px_14px_rgba(68,167,252,0.36)]'
                    : 'border-border-base/80 bg-white text-ink hover:border-brand-light hover:text-brand-light'
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`min-w-[22px] rounded-full px-1.5 text-center text-[10.5px] font-black leading-[18px] ${
                    active ? 'bg-white/25 text-white' : 'bg-surface-muted text-muted'
                  }`}
                >
                  {counts[t.key]}
                </span>
              </button>
            );
          })}

          {(search || filter !== 'unanswered') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilter('unanswered');
                setPage(1);
              }}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3.5 font-body text-[12px] font-extrabold text-danger transition-all duration-brand hover:bg-red-100 active:scale-95"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              রিসেট
            </button>
          )}
        </div>
      </div>

      {/* ══ প্রশ্নোত্তর তালিকা ও খালি অবস্থা ══ */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] border border-white/90 bg-white px-6 py-16 text-center shadow-sh1">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/15 text-brand-light">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span className="font-body text-[14px] font-extrabold text-ink">কোনো প্রশ্ন পাওয়া যায়নি</span>
          <span className="font-body text-[12px] font-medium text-muted">সার্চ বা ফিল্টার পরিবর্তন করে দেখুন</span>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((q) => {
            const hasAnswers = q.answers.length > 0;
            return (
              <article
                key={q.id}
                className="flex flex-col rounded-[22px] border border-white/90 bg-white p-4 shadow-sh1 transition-all duration-brand"
              >
                {/* হেডার: প্রোডাক্ট নাম + গ্রাহকের নাম + মুছুন বাটন */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-1 font-body text-[14px] font-extrabold text-ink">
                      {q.product_name}
                    </h4>
                    <div className="mt-1 font-body text-[11.5px] font-semibold text-muted">
                      <span className="font-bold text-ink">{q.user_name || 'অজ্ঞাত গ্রাহক'}</span> জিজ্ঞাসা করেছেন — {formatDate(q.created_at)}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={busyId === q.id}
                    onClick={() => setDeleteQuestionId(q.id)}
                    aria-label="প্রশ্ন মুছুন"
                    title="প্রশ্ন মুছুন"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-danger transition-all duration-brand hover:bg-danger hover:text-white active:scale-90 disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>

                {/* মূল প্রশ্ন */}
                <p className="mt-2.5 whitespace-pre-wrap font-body text-[13.5px] font-medium leading-relaxed text-ink">
                  {q.question}
                </p>

                {/* বিদ্যমান উত্তরসমূহ */}
                {hasAnswers && (
                  <div className="mt-3.5 space-y-2.5 border-t border-border-base/60 pt-3">
                    {q.answers.map((a) => (
                      <div
                        key={a.id}
                        className={`rounded-2xl p-3 font-body text-[12.5px] leading-relaxed ${
                          a.is_admin
                            ? 'border border-brand-light/30 bg-brand-light/[0.08]'
                            : 'border border-border-base/80 bg-surface-muted/70'
                        }`}
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1.5 font-body text-[11px] font-black ${a.is_admin ? 'text-brand-light' : 'text-ink'}`}>
                            {a.is_admin && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            {a.author_name}
                          </span>
                          <button
                            type="button"
                            disabled={busyId === a.id}
                            onClick={() => setDeleteAnswerTarget({ questionId: q.id, answerId: a.id })}
                            className="font-body text-[10.5px] font-extrabold text-muted transition-colors hover:text-danger disabled:opacity-50"
                          >
                            মুছুন
                          </button>
                        </div>
                        <p className="whitespace-pre-wrap text-ink/90">{a.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ফুটার: উত্তর যোগ বাটন */}
                <div className="mt-3.5 flex justify-end border-t border-border-base/60 pt-3">
                  <button
                    type="button"
                    onClick={() => setAnswerTarget(q)}
                    className="flex h-10 items-center gap-1.5 rounded-full bg-brand-light px-5 font-body text-[12.5px] font-black text-white shadow-[0_4px_14px_rgba(68,167,252,0.36)] transition-all duration-brand hover:bg-brand-light-hover active:scale-95"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    {hasAnswers ? 'আরেকটি উত্তর যোগ করুন' : 'উত্তর দিন'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* পেজিনেশন */}
      {filtered.length > 0 && (
        <div className="mt-4 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1">
          <Pagination page={page} total={filtered.length} onPageChange={setPage} bare />
        </div>
      )}

      {/* উত্তর দেওয়ার মডাল */}
      {answerTarget && (
        <AnswerQuestionModal
          question={answerTarget}
          busy={busyId === answerTarget.id}
          onCancel={() => setAnswerTarget(null)}
          onConfirm={handleAnswerConfirm}
        />
      )}

      {/* প্রশ্ন ডিলিট ডায়ালগ */}
      {deleteQuestionId && (
        <ConfirmDialog
          title="প্রশ্ন মুছে ফেলবেন?"
          message="এই প্রশ্ন এবং এর সাথে সম্পর্কিত সমস্ত উত্তর ডাটাবেজ থেকে মুছে যাবে।"
          confirmLabel="হ্যাঁ, মুছে ফেলুন"
          busyLabel="মুছে ফেলা হচ্ছে..."
          busy={busyId === deleteQuestionId}
          tone="danger"
          onConfirm={handleDeleteQuestionConfirm}
          onCancel={() => setDeleteQuestionId(null)}
        />
      )}

      {/* একক উত্তর ডিলিট ডায়ালগ */}
      {deleteAnswerTarget && (
        <ConfirmDialog
          title="উত্তরটি মুছে ফেলবেন?"
          message="এই নির্দিষ্ট উত্তরটি স্থায়ীভাবে মুছে যাবে।"
          confirmLabel="হ্যাঁ, মুছুন"
          busyLabel="মুছে ফেলা হচ্ছে..."
          busy={busyId === deleteAnswerTarget.answerId}
          tone="danger"
          onConfirm={handleDeleteAnswerConfirm}
          onCancel={() => setDeleteAnswerTarget(null)}
        />
      )}
    </div>
  );
}
