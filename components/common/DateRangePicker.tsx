'use client';

import { useRef, useState } from 'react';

export interface DateRange {
  start: Date;
  end: Date;
}

interface Props {
  /** ফিল্টার এখন সক্রিয় কিনা (allowClear=true হলে false-ও হতে পারে, তখন range আসলে ব্যবহার হয় না) */
  active: boolean;
  range: DateRange | null;
  onApply: (range: DateRange | null) => void;
  minDaysBack?: number; // কতদিন পেছন পর্যন্ত সিলেক্ট করা যাবে (legacy CAL_MIN_DAYS)
  allowClear?: boolean; // "সব তারিখ দেখাও" বাটন দেখাবে কিনা (Orders-এ true)
  inactiveLabel?: string; // ফিল্টার নিষ্ক্রিয় থাকলে বাটনে যা দেখাবে
  applyLabel?: string; // "ওকে" বাটনের টেক্সট (CSV কাস্টম-রেঞ্জে ভিন্ন লেবেল লাগে)
  /** 'button' (ডিফল্ট) — pill-style trigger, ফিল্টারের জন্য।
   *  'menu-item' — CSV ড্রপডাউনের মেনু-আইটেমের মতো ট্রিগার, one-shot range-pick অ্যাকশনের জন্য (legacy ordCsv namespace) */
  variant?: 'button' | 'menu-item';
  menuItemLabel?: string;
  menuItemSubLabel?: string;
  menuItemIcon?: React.ReactNode;
  /** ট্রিগারের wrapper div-এ অতিরিক্ত ক্লাস (যেমন মোবাইলে ফুল-উইডথ) */
  className?: string;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function todayDate(): Date {
  return startOfDay(new Date());
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}
function dateKey(d: Date): string {
  return d.toLocaleDateString('en-CA');
}

const DOW = ['র', 'সো', 'ম', 'বু', 'বৃ', 'শু', 'শ'];

export default function DateRangePicker({
  active,
  range,
  onApply,
  minDaysBack = 89,
  allowClear = false,
  inactiveLabel = 'সব সময়',
  applyLabel = 'ওকে',
  variant = 'button',
  menuItemLabel,
  menuItemSubLabel,
  menuItemIcon,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const today = todayDate();
  const minDate = addDays(today, -minDaysBack);

  const [pendStart, setPendStart] = useState<Date>(range?.start || today);
  const [pendEnd, setPendEnd] = useState<Date>(range?.end || today);
  const [picking, setPicking] = useState(false);
  const [viewMonth, setViewMonth] = useState(
    new Date((range?.end || today).getFullYear(), (range?.end || today).getMonth(), 1)
  );
  const wrapRef = useRef<HTMLDivElement>(null);

  function openPicker() {
    const base = range || { start: today, end: today };
    setPendStart(base.start);
    setPendEnd(base.end);
    setPicking(false);
    setViewMonth(new Date(base.end.getFullYear(), base.end.getMonth(), 1));
    setOpen(true);
  }

  // প্রথম ক্লিকে নতুন রেঞ্জ শুরু (একক দিন), দ্বিতীয় ক্লিকে রেঞ্জ শেষ — legacy calSelectDay()
  function selectDay(d: Date) {
    if (!picking) {
      setPendStart(d);
      setPendEnd(d);
      setPicking(true);
    } else {
      if (d < pendStart) {
        setPendEnd(pendStart);
        setPendStart(d);
      } else {
        setPendEnd(d);
      }
      setPicking(false);
    }
  }

  // দ্রুত বাছাই: এই মাস / গত মাস (সিলেক্ট করা যায় এমন সীমার ভেতরে ছেঁটে)
  const presets = [
    { label: 'এই মাস', start: new Date(today.getFullYear(), today.getMonth(), 1), end: today },
    { label: 'গত মাস', start: new Date(today.getFullYear(), today.getMonth() - 1, 1), end: new Date(today.getFullYear(), today.getMonth(), 0) },
  ]
    .map((p) => ({ ...p, start: p.start < minDate ? minDate : p.start }))
    .filter((p) => p.start <= p.end);

  function pickPreset(p: { start: Date; end: Date }) {
    setPendStart(p.start);
    setPendEnd(p.end);
    setPicking(false);
    setViewMonth(new Date(p.end.getFullYear(), p.end.getMonth(), 1));
  }

  function apply() {
    onApply({ start: pendStart, end: pendEnd });
    setOpen(false);
  }

  function clear() {
    onApply(null);
    setOpen(false);
  }

  function navMonth(dir: number) {
    setViewMonth((v) => new Date(v.getFullYear(), v.getMonth() + dir, 1));
  }

  const label = (() => {
    if (!active || !range) return inactiveLabel;
    const yesterday = addDays(today, -1);
    const isSameDay = sameDay(range.start, range.end);
    if (isSameDay && sameDay(range.start, today)) return 'আজকে';
    if (isSameDay && sameDay(range.start, yesterday)) return 'গতকাল';
    if (isSameDay) return range.start.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
    return `${range.start.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })} – ${range.end.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}`;
  })();

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(firstDow).fill(null)];
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));

  const firstOfMinMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const firstOfMaxMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const prevDisabled = viewMonth <= firstOfMinMonth;
  const nextDisabled = viewMonth >= firstOfMaxMonth;

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      {variant === 'menu-item' ? (
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openPicker())}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-body text-[12.5px] font-bold text-ink transition-brand hover:bg-brand-bg/40 hover:text-brand-light"
        >
          {menuItemIcon}
          <span>
            <span className="block">{menuItemLabel}</span>
            {menuItemSubLabel && <span className="mt-0.5 block text-[10.5px] font-medium text-muted">{menuItemSubLabel}</span>}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openPicker())}
          className={`flex h-11 w-full items-center justify-center gap-2 rounded-full border px-4 font-body text-[12.5px] font-bold transition-all duration-brand active:scale-95 lg:h-10 ${
            active
              ? 'border-brand-light bg-brand-light/10 text-ink'
              : 'border-border-base/80 bg-white text-ink hover:border-brand-light hover:text-brand-light'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-brand-light">
            <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
            <path d="M3 9.5h18" />
            <path d="M8 2.5v4M16 2.5v4" />
          </svg>
          <span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
        </button>
      )}

      {/* legacy .trf-cal-pop — anchored popover না, ফুল-স্ক্রিন সেন্টার্ড মোডাল
          (backdrop blur সহ) — মোবাইলে anchored dropdown কাটা পড়ার সমস্যা এড়াতে
          legacy ইচ্ছাকৃতভাবে এভাবেই বানিয়েছিল, তাই এখানেও একই প্যাটার্ন */}
      {open && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-ink/40 p-5 backdrop-blur-[3px]"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[88dvh] w-full max-w-[330px] overflow-y-auto rounded-[26px] bg-white p-4 shadow-[0_24px_60px_rgba(26,26,26,0.22)]"
            onClick={(e) => e.stopPropagation()}
          >
            {presets.length > 0 && (
              <div className="mb-3 flex gap-2">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => pickPreset(p)}
                    className="h-8 flex-1 rounded-full bg-surface-muted font-body text-[12px] font-extrabold text-ink transition-brand hover:bg-brand-bg/60 active:scale-95"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                disabled={prevDisabled}
                onClick={() => navMonth(-1)}
                aria-label="আগের মাস"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-ink transition-brand hover:bg-brand-bg/60 disabled:opacity-30"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span className="font-body text-[14px] font-black text-ink">
                {viewMonth.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' })}
              </span>
              <button
                type="button"
                disabled={nextDisabled}
                onClick={() => navMonth(1)}
                aria-label="পরের মাস"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-ink transition-brand hover:bg-brand-bg/60 disabled:opacity-30"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
            <div className="mb-1.5 grid grid-cols-7 text-center font-body text-[10.5px] font-extrabold text-muted">
              {DOW.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-[2px]">
              {cells.map((d, i) => {
                if (!d) return <span key={`empty${i}`} className="aspect-square" />;
                const disabled = d < minDate || d > today;
                const isToday = sameDay(d, today);
                const isStart = sameDay(d, pendStart);
                const isEnd = sameDay(d, pendEnd);
                const isSingle = isStart && isEnd;
                const inRange = d > pendStart && d < pendEnd;

                let cls = 'aspect-square flex items-center justify-center font-body text-[12.5px] font-semibold transition-brand';
                if (disabled) {
                  cls += ' cursor-not-allowed text-border-base';
                } else if (isSingle) {
                  cls += ' rounded-xl bg-brand-light font-extrabold text-white';
                } else if (isStart) {
                  cls += ' rounded-l-xl bg-brand-light font-extrabold text-white';
                } else if (isEnd) {
                  cls += ' rounded-r-xl bg-brand-light font-extrabold text-white';
                } else if (inRange) {
                  cls += ' rounded-none bg-brand-light/15 text-ink';
                } else {
                  cls += ' rounded-xl text-ink hover:bg-brand-bg/60';
                }
                if (isToday && !isStart && !isEnd && !inRange) cls += ' font-black text-brand-light';

                return (
                  <button key={dateKey(d)} type="button" disabled={disabled} onClick={() => selectDay(d)} className={cls}>
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={apply}
              className="mt-3.5 h-11 w-full rounded-full bg-brand-light font-body text-[13px] font-extrabold text-white shadow-[0_4px_14px_rgba(68,167,252,0.38)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98]"
            >
              {applyLabel}
            </button>
            {allowClear && (
              <button
                type="button"
                onClick={clear}
                className="mt-2 h-10 w-full rounded-full bg-surface-muted font-body text-[12.5px] font-bold text-muted transition-brand hover:bg-border-base active:scale-[0.98]"
              >
                সব তারিখ দেখাও
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
