'use client';

import { useMemo, useState } from 'react';
import type { ProductQuestionWithAnswers } from '@/types';
import { answerQuestion, deleteQuestion, deleteAnswer } from '@/app/actions/product-qa';
import { useToast } from '@/components/admin/Toast';
import AnswerQuestionModal from '@/components/reviews/AnswerQuestionModal';
import Pagination, { PAGE_SIZE } from '@/components/common/Pagination';

interface Props {
  questions: ProductQuestionWithAnswers[];
  onQuestionsChange: (updater: (prev: ProductQuestionWithAnswers[]) => ProductQuestionWithAnswers[]) => void;
}

type FilterTab = 'all' | 'unanswered' | 'answered';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'unanswered', label: 'উত্তরহীন' },
  { key: 'answered', label: 'উত্তর দেওয়া হয়েছে' },
  { key: 'all', label: 'সবগুলো' },
];

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

export default function QnAPanel({ questions, onQuestionsChange }: Props) {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterTab>('unanswered');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [answerTarget, setAnswerTarget] = useState<ProductQuestionWithAnswers | null>(null);

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
      showToast(res.message || '❌ ব্যর্থ হয়েছে');
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
                  id: Date.now(), // সার্ভার থেকে আসল id না পাওয়া পর্যন্ত সাময়িক — router.refresh() ছাড়াই optimistic UI
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

  async function handleDeleteQuestion(id: number) {
    if (!confirm('এই প্রশ্ন ও এর সব উত্তর মুছে ফেলবেন?')) return;
    setBusyId(id);
    const res = await deleteQuestion(id);
    setBusyId(null);
    if (!res.ok) {
      showToast(res.message || '❌ মুছতে ব্যর্থ হয়েছে');
      return;
    }
    onQuestionsChange((prev) => prev.filter((q) => q.id !== id));
    showToast('✅ প্রশ্ন মুছে ফেলা হয়েছে');
  }

  async function handleDeleteAnswer(questionId: number, answerId: number) {
    if (!confirm('এই উত্তরটি মুছে ফেলবেন?')) return;
    setBusyId(answerId);
    const res = await deleteAnswer(answerId);
    setBusyId(null);
    if (!res.ok) {
      showToast(res.message || '❌ মুছতে ব্যর্থ হয়েছে');
      return;
    }
    onQuestionsChange((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, answers: q.answers.filter((a) => a.id !== answerId) } : q))
    );
    showToast('✅ উত্তর মুছে ফেলা হয়েছে');
  }

  return (
    <div>
      {/* ফিল্টার ট্যাব */}
      <div className="mb-3.5 flex flex-wrap justify-center gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => changeFilter(t.key)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-brand ${
              filter === t.key
                ? 'border-transparent bg-brand-grad text-white shadow-sh1'
                : 'border-border-base bg-brand-surface text-[#374151] hover:border-brand-accent'
            }`}
          >
            {t.label}
            <span
              className={`inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                filter === t.key ? 'bg-white/25' : 'bg-surface-muted text-muted'
              }`}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* সার্চ */}
      <div className="mx-auto mb-4 max-w-md">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-brand-accent">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="প্রোডাক্ট / গ্রাহকের নাম / প্রশ্ন..."
            className="h-[38px] w-full rounded-[10px] border border-border-base bg-brand-surface pl-9 pr-3 text-xs text-ink outline-none transition-brand placeholder:text-muted focus:border-brand-accent"
          />
        </div>
      </div>

      <div className="rounded-brand bg-brand-surface p-4 shadow-sh1">
        {paginated.length === 0 ? (
          <div className="p-10 text-center text-muted">
            <div className="mb-2.5 text-4xl">💬</div>
            <div className="text-sm font-semibold">এই ফিল্টারে কোনো প্রশ্ন নেই</div>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((q) => (
              <div key={q.id} className="rounded-xl border border-border-base bg-white p-3.5 shadow-sh1 transition-brand hover:shadow-sh2 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold text-brand-dark">{q.product_name}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      <span className="font-semibold text-ink">{q.user_name || 'অজ্ঞাত গ্রাহক'}</span> জিজ্ঞাসা করেছেন — {formatDate(q.created_at)}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === q.id}
                    onClick={() => handleDeleteQuestion(q.id)}
                    aria-label="প্রশ্ন মুছুন"
                    className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg border border-[#FECACA] bg-[#FEE2E2] text-[#991B1B] transition-brand hover:bg-[#FECACA] disabled:opacity-50"
                  >
                    🗑️
                  </button>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{q.question}</p>

                {q.answers.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-border-base pt-3">
                    {q.answers.map((a) => (
                      <div
                        key={a.id}
                        className={`rounded-lg border p-2.5 text-[12.5px] leading-relaxed ${
                          a.is_admin ? 'border-brand-accent/25 bg-brand-bg/30' : 'border-border-base bg-surface-muted'
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className={`flex items-center gap-1 text-[11px] font-bold ${a.is_admin ? 'text-brand-dark' : 'text-ink'}`}>
                            {a.is_admin && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            )}
                            {a.author_name}
                          </span>
                          <button
                            type="button"
                            disabled={busyId === a.id}
                            onClick={() => handleDeleteAnswer(q.id, a.id)}
                            aria-label="উত্তর মুছুন"
                            className="text-[11px] font-medium text-muted transition-brand hover:text-danger disabled:opacity-50"
                          >
                            মুছুন
                          </button>
                        </div>
                        <div className="text-ink">{a.answer}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setAnswerTarget(q)}
                    className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white transition-brand hover:opacity-90"
                  >
                    ✍️ {q.answers.length > 0 ? 'আরেকটি উত্তর যোগ করুন' : 'উত্তর দিন'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} total={filtered.length} onPageChange={setPage} />
      </div>

      {answerTarget && (
        <AnswerQuestionModal
          question={answerTarget}
          busy={busyId === answerTarget.id}
          onCancel={() => setAnswerTarget(null)}
          onConfirm={handleAnswerConfirm}
        />
      )}
    </div>
  );
}
