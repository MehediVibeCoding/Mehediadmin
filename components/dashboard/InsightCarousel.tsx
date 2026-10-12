'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DashboardActionCounts, DashboardStats } from '@/app/actions/dashboard';
import type { DashboardInsights } from '@/lib/dashboardInsights';
import OrderStatusDonut from '@/components/dashboard/OrderStatusDonut';
import {
  ActionCenterCard,
  CustomersCard,
  FunnelCard,
  PerformanceCard,
  SourcesCard,
  TimingCard,
  TopProductsCard,
  VisitorsCard,
} from '@/components/dashboard/insights/slides';

// "অর্ডার অবস্থা" কার্ডটা হুবহু প্রথম স্লাইডে থাকে; তার পরে একই চেহারার বাকি কার্ডগুলো।
// ফোনে ডানে-বামে সোয়াইপ, ডেস্কটপে মাউস দিয়ে টেনে বা তীর/ডট ক্লিক করে একটার পর একটা দেখা যায়।

const DRAG_THRESHOLD = 6; // এর বেশি নড়লে ক্লিক নয়, ড্র্যাগ

export default function InsightCarousel({
  stats,
  insights,
  actions,
}: {
  stats: DashboardStats;
  insights: DashboardInsights;
  actions: DashboardActionCounts;
}) {
  const slides: { key: string; label: string; node: React.ReactNode }[] = [
    { key: 'status', label: 'অর্ডার অবস্থা', node: <OrderStatusDonut stats={stats} /> },
    { key: 'actions', label: 'করণীয় তালিকা', node: <ActionCenterCard actions={actions} /> },
    { key: 'visitors', label: 'ভিজিটর ট্র্যাকিং', node: <VisitorsCard /> },
    { key: 'funnel', label: 'কনভার্শন ফানেল', node: <FunnelCard /> },
    { key: 'sources', label: 'ট্রাফিক উৎস ও ডিভাইস', node: <SourcesCard /> },
    { key: 'performance', label: 'বিক্রয় পারফরম্যান্স', node: <PerformanceCard insights={insights} /> },
    { key: 'products', label: 'সেরা বিক্রিত প্রোডাক্ট', node: <TopProductsCard insights={insights} /> },
    { key: 'timing', label: 'অর্ডারের সময়', node: <TimingCard insights={insights} /> },
    { key: 'customers', label: 'কাস্টমার ও এলাকা', node: <CustomersCard insights={insights} /> },
  ];
  const count = slides.length;

  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const rafRef = useRef(0);
  const drag = useRef<{ startX: number; startLeft: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  // তীর/ডটে ক্লিকের স্মুথ-স্ক্রলের সময় মাঝের স্লাইডগুলো দিয়ে ইনডেক্স যেন লাফালাফি না করে
  const scrollTarget = useRef<{ index: number; timer: ReturnType<typeof setTimeout> } | null>(null);

  const slideStep = useCallback((): number => {
    const el = trackRef.current;
    if (!el || !el.firstElementChild) return 0;
    const first = el.children[0] as HTMLElement;
    const second = el.children[1] as HTMLElement | undefined;
    return second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el) return;
      const next = ((i % count) + count) % count; // শেষ থেকে সামনে গেলে শুরুতে ফেরে
      if (scrollTarget.current) clearTimeout(scrollTarget.current.timer);
      scrollTarget.current = {
        index: next,
        timer: setTimeout(() => (scrollTarget.current = null), 900),
      };
      el.scrollTo({ left: next * slideStep(), behavior: 'smooth' });
      indexRef.current = next;
      setIndex(next);
    },
    [count, slideStep],
  );

  // স্ক্রল (সোয়াইপ) থেকে বর্তমান স্লাইড বের করা
  const onScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = trackRef.current;
      const step = slideStep();
      if (!el || step <= 0) return;
      const target = scrollTarget.current;
      if (target) {
        if (Math.abs(el.scrollLeft - target.index * step) < 2) {
          clearTimeout(target.timer);
          scrollTarget.current = null;
        }
        return;
      }
      const i = Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / step)));
      if (i !== indexRef.current) {
        indexRef.current = i;
        setIndex(i);
      }
    });
  }, [count, slideStep]);

  // রিসাইজ/ঘোরালে বর্তমান স্লাইডেই থাকা
  useEffect(() => {
    const onResize = () => {
      const el = trackRef.current;
      if (!el) return;
      el.style.scrollBehavior = 'auto';
      el.scrollLeft = indexRef.current * slideStep();
      el.style.scrollBehavior = '';
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (scrollTarget.current) clearTimeout(scrollTarget.current.timer);
    };
  }, [slideStep]);

  /* ── মাউস দিয়ে টেনে সরানো (টাচে নেটিভ সোয়াইপ কাজ করে) ── */
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    drag.current = { startX: e.clientX, startLeft: el.scrollLeft, moved: false };

    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d || !el) return;
      const dx = ev.clientX - d.startX;
      if (!d.moved && Math.abs(dx) > DRAG_THRESHOLD) {
        d.moved = true;
        el.setAttribute('data-dragging', 'true');
      }
      if (d.moved) el.scrollLeft = d.startLeft - dx;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      const d = drag.current;
      drag.current = null;
      if (!d || !el) return;
      el.removeAttribute('data-dragging');
      if (d.moved) {
        suppressClick.current = true; // টানার শেষে ভেতরের লিংকে ভুল ক্লিক ঠেকাতে
        setTimeout(() => (suppressClick.current = false), 0);
        const step = slideStep();
        if (step > 0) goTo(Math.round(el.scrollLeft / step));
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function onClickCapture(e: React.MouseEvent) {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(indexRef.current + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(indexRef.current - 1);
    }
  }

  return (
    <section aria-roledescription="carousel" aria-label="ড্যাশবোর্ড ইনসাইট" className="flex h-full min-w-0 flex-col">
      <div
        ref={trackRef}
        tabIndex={0}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
        onDragStart={(e) => e.preventDefault()}
        className="insight-track no-scrollbar flex min-h-[348px] flex-1 cursor-grab gap-3 overflow-x-auto rounded-[24px] focus-visible:outline-none"
      >
        {slides.map((s, i) => (
          <div
            key={s.key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${count} — ${s.label}`}
            className="insight-slide w-full shrink-0 basis-full"
          >
            {s.node}
          </div>
        ))}
      </div>

      {/* নিয়ন্ত্রণ: ‹ ডট ›  — মোবাইলেও ≥৪৪px টাচ এরিয়া */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="আগের কার্ড"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-base/80 bg-white text-ink transition-all duration-brand hover:border-brand-light hover:text-brand-light active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="flex min-w-0 flex-col items-center gap-1.5">
          <span className="max-w-full truncate font-body text-[11.5px] font-extrabold text-ink" aria-live="polite">
            {slides[index].label}
            <span className="ml-1.5 font-bold text-muted">
              {index + 1}/{count}
            </span>
          </span>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="কার্ড বেছে নিন">
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={s.label}
                onClick={() => goTo(i)}
                className="flex h-5 items-center justify-center px-0.5"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? 'w-5 bg-brand-light' : 'w-1.5 bg-border-base hover:bg-brand-light/50'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="পরের কার্ড"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-base/80 bg-white text-ink transition-all duration-brand hover:border-brand-light hover:text-brand-light active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
