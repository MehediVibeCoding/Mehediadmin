'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CategoryOption } from '@/lib/constants/categories';
import { smartParse, SMART_PARSER_EXAMPLE } from '@/lib/smart-parser';
import { parsedToFormState } from '@/lib/product-form';
import ImageManager from '@/components/products/ImageManager';
import ProductModal from '@/components/products/ProductModal';
import SectionHeading from '@/components/common/SectionHeading';
import { TEXTAREA_CLS } from '@/components/common/FormField';
import { useToast } from '@/components/admin/Toast';

const STATUS_MESSAGES = ['তথ্য পড়ছি...', 'নাম ও দাম বের করছি...', 'Features ও Specs সাজাচ্ছি...', 'FAQ ও বর্ণনা গোছাচ্ছি...'];

export default function ParserPageClient({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [error, setError] = useState('');
  const [modalState, setModalState] = useState<ReturnType<typeof parsedToFormState> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    []
  );

  async function handleParse() {
    const raw = text.trim();
    if (!raw) {
      showToast('❌ আগে প্রোডাক্টের তথ্য পেস্ট করুন');
      return;
    }
    setError('');
    setLoading(true);
    let i = 0;
    setStatusIdx(0);
    intervalRef.current = setInterval(() => {
      if (i < STATUS_MESSAGES.length - 1) setStatusIdx(++i);
    }, 600);

    await new Promise((r) => setTimeout(r, 2200));
    if (intervalRef.current) clearInterval(intervalRef.current);

    try {
      const parsed = smartParse(raw, categories);
      const formState = parsedToFormState(parsed, images.filter(Boolean));
      setModalState(formState);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : 'অজানা এরর');
    }
  }

  function handleSaved() {
    setModalState(null);
    router.push('/products');
    router.refresh();
  }

  const charCount = text.trim().length;

  return (
    <div>
      {/* ══ ২. মূল ফর্ম ══ */}
      <div className="rounded-[24px] border border-white/90 bg-white p-4 shadow-sh1 sm:p-5">
        <div className="space-y-8">
          <section>
            <SectionHeading hint="নাম, দাম, ফিচার, স্পেক, FAQ — যা আছে সব একসাথে পেস্ট করুন">ধাপ ১ — প্রোডাক্টের তথ্য</SectionHeading>

            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span className="font-body text-[11px] font-semibold text-muted">{charCount > 0 ? `${charCount.toLocaleString('en-US')} অক্ষর` : 'এখনো কিছু লেখা হয়নি'}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setText(SMART_PARSER_EXAMPLE)}
                  className="flex h-11 items-center gap-1.5 rounded-full border border-brand-light/40 bg-brand-light/10 px-4 font-body text-[12px] font-extrabold text-ink transition-all duration-brand active:scale-95 lg:h-9"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-brand-light">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  উদাহরণ
                </button>
                <button
                  type="button"
                  onClick={() => setText('')}
                  disabled={!text}
                  className="flex h-11 items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-4 font-body text-[12px] font-extrabold text-danger transition-all duration-brand active:scale-95 disabled:opacity-40 lg:h-9"
                >
                  মুছুন
                </button>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="এখানে প্রোডাক্টের সমস্ত তথ্য পেস্ট করুন..."
              className={`${TEXTAREA_CLS} min-h-[260px] resize-y`}
            />
          </section>

          <section>
            <SectionHeading hint="ঐচ্ছিক — ছবি দিলে ফর্মে আগেই বসে থাকবে">ধাপ ২ — প্রোডাক্টের ছবি</SectionHeading>
            <ImageManager images={images} onChange={setImages} />
          </section>
        </div>
      </div>

      {/* ══ ৩. লোডিং / এরর ══ */}
      {loading && (
        <div className="animate-soft-fade-in mt-4 rounded-[24px] border border-white/90 bg-white px-5 py-8 text-center shadow-sh1">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-brand-light/20 border-t-brand-light" />
          <div className="font-body text-[15px] font-black text-ink">তথ্য বিশ্লেষণ করছি...</div>
          <ul className="mx-auto mt-4 max-w-[300px] space-y-2 text-left">
            {STATUS_MESSAGES.map((m, i) => {
              const done = i < statusIdx;
              const current = i === statusIdx;
              return (
                <li key={m} className={`flex items-center gap-2.5 font-body text-[12.5px] font-bold transition-colors duration-brand ${done || current ? 'text-ink' : 'text-muted/50'}`}>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      done ? 'bg-success text-white' : current ? 'bg-brand-light/20 text-brand-light' : 'bg-surface-muted text-transparent'
                    }`}
                  >
                    {done ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className={`h-1.5 w-1.5 rounded-full ${current ? 'animate-pulse bg-brand-light' : 'bg-transparent'}`} />
                    )}
                  </span>
                  {m}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && (
        <div className="animate-soft-fade-in mt-4 rounded-[24px] border border-red-200/80 bg-red-50 p-5 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-danger shadow-sh1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </span>
          <div className="font-body text-[15px] font-black text-danger">Parse করতে সমস্যা হয়েছে</div>
          <div className="mx-auto mt-1 max-w-[420px] font-body text-[12.5px] font-medium leading-relaxed text-muted">{error}</div>
          <button
            type="button"
            onClick={() => setError('')}
            className="mt-4 h-11 rounded-full bg-white px-6 font-body text-[13px] font-extrabold text-ink shadow-sh1 transition-all duration-brand active:scale-95"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      )}

      {/* ══ ৪. Parse বাটন ══ */}
      <button
        type="button"
        onClick={handleParse}
        disabled={loading}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-light font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? (
          STATUS_MESSAGES[statusIdx]
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Parse করুন — ফর্ম খুলবে, এডিট করে সেভ করুন
          </>
        )}
      </button>

      {modalState && (
        <ProductModal
          categories={categories}
          initialState={modalState}
          titleOverride="AI Parse — প্রোডাক্ট যোগ করুন"
          onClose={() => setModalState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
