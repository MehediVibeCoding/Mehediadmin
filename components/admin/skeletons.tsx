// ══════════════════════════════════════════════════════════════════════
// প্রতিটি পেজের নিজস্ব স্কেলেটন — আসল পেজের মতো একই কার্ড-র‍্যাপার, একই প্যাডিং,
// একই গ্রিড, একই উচ্চতা। তাই ডাটা এলে কনটেন্ট লাফায় না (layout shift নেই)।
// শিমার `.sk` ক্লাস (globals.css) — শুধু transform দিয়ে চলে, তাই মোবাইলে হালকা।
// পেজের লেআউট বদলালে এখানকার ওই অংশটাও বদলাতে হবে।
// ══════════════════════════════════════════════════════════════════════

const CARD = 'rounded-[24px] border border-white/90 bg-white shadow-sh1';
const TILE = 'rounded-[20px] border border-white/90 bg-white shadow-sh1';

export function Sk({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden="true" style={style} className={`sk rounded-lg ${className}`} />;
}

const rep = (n: number) => Array.from({ length: n }, (_, i) => i);

/* ───────────────────────── সেকশন হেডিং (দাগ ছাড়া) ───────────────────────── */
function SkHeading({ hint = true, w = 'w-40' }: { hint?: boolean; w?: string }) {
  return (
    <div className="mb-3.5">
      <Sk className={`h-[22px] ${w}`} />
      {hint && <Sk className="mt-1.5 h-[15px] w-56 max-w-full" />}
    </div>
  );
}

/* ───────────────────────── টুলবার কার্ড ───────────────────────── */
// সার্চ বক্স (+ ডান পাশে তারিখ/বাটন) + ঐচ্ছিক ফিল্টার চিপ সারি
function SkSearchToolbar({
  right = 'none',
  chips = [],
  mb = 'mb-4',
}: {
  right?: 'date' | 'button' | 'none';
  chips?: string[];
  mb?: string;
}) {
  return (
    <div className={`${mb} ${CARD} p-3.5 sm:p-4`}>
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <Sk className="h-11 w-full flex-1 !rounded-full lg:h-10" />
        {right === 'date' && (
          <div className="flex items-center gap-2">
            <Sk className="h-11 min-w-0 flex-1 !rounded-full lg:h-10 lg:w-44 lg:flex-none" />
            <Sk className="h-11 w-11 shrink-0 !rounded-full lg:h-10 lg:w-10" />
          </div>
        )}
        {right === 'button' && <Sk className="h-12 w-full !rounded-full lg:h-10 lg:w-40" />}
      </div>
      {chips.length > 0 && (
        <div className="no-scrollbar -mx-3.5 mt-3 flex gap-2 overflow-hidden px-3.5 pb-0.5 sm:-mx-4 sm:px-4">
          {chips.map((w, i) => (
            <Sk key={i} className={`h-9 shrink-0 !rounded-full ${w}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// আইকন + দুই লাইন লেখা + ডানে বাটন/তারিখ — প্রফিট, ট্রাফিক, ডিজাইন পেজের হেডার কার্ড
function SkHeaderCard({
  right = 'none',
  progress = false,
  gap = 'gap-2.5',
}: {
  right?: 'date' | 'buttons' | 'none';
  progress?: boolean;
  gap?: string;
}) {
  return (
    <div className={`mb-4 ${CARD} p-3.5 sm:p-4`}>
      <div className={`flex flex-col ${gap} sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex items-center gap-2.5">
          <Sk className="h-9 w-9 shrink-0 !rounded-xl sm:h-10 sm:w-10" />
          <div className="space-y-1.5">
            <Sk className="h-[17px] w-44" />
            <Sk className="h-[14px] w-52 max-w-full" />
          </div>
        </div>
        {right === 'date' && (
          <div className="flex items-center gap-2">
            <Sk className="h-11 min-w-0 flex-1 !rounded-full sm:flex-none lg:h-10 sm:w-44" />
            <Sk className="h-11 w-11 shrink-0 !rounded-full lg:h-10 lg:w-10" />
          </div>
        )}
        {right === 'buttons' && (
          <div className="flex gap-2">
            <Sk className="h-10 flex-1 !rounded-full sm:w-28 sm:flex-none" />
            <Sk className="h-10 flex-1 !rounded-full sm:w-28 sm:flex-none" />
          </div>
        )}
      </div>
      {progress && (
        <div className="mt-3.5">
          <div className="mb-1.5 flex items-center justify-between">
            <Sk className="h-[15px] w-28" />
            <Sk className="h-[15px] w-10" />
          </div>
          <Sk className="h-2 w-full !rounded-full" />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── স্ট্যাট টাইল ───────────────────────── */
function SkStatTile({ className = '' }: { className?: string }) {
  return (
    <div className={`min-w-0 ${TILE} p-3.5 ${className}`}>
      <div className="flex items-center gap-2.5">
        <Sk className="h-9 w-9 shrink-0 !rounded-xl" />
        <Sk className="h-3.5 w-20" />
      </div>
      <Sk className="mt-2.5 h-[26px] w-28 max-w-full" />
      <Sk className="mt-0.5 h-4 w-32 max-w-full" />
    </div>
  );
}

function SkStatGrid4() {
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      <SkStatTile className="col-span-2 md:col-span-1" />
      <SkStatTile />
      <SkStatTile />
      <SkStatTile />
    </div>
  );
}

/* ───────────────────────── চার্ট কার্ড ───────────────────────── */
function SkChartCard({ canvas, stats = 3 }: { canvas: number; stats?: number }) {
  return (
    <div className={`mt-4 ${CARD} p-4 sm:p-5`}>
      <SkHeading w="w-36" />
      <Sk className="w-full !rounded-xl" style={{ height: canvas }} />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {rep(stats).map((i) => (
          <div key={i} className="min-w-0 rounded-xl border border-border-base/70 px-3 py-2">
            <Sk className="h-[13px] w-14" />
            <Sk className="mt-1 h-[20px] w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── তালিকা: মোবাইল কার্ড + ডেস্কটপ টেবিল ───────────────────────── */
// ডেস্কটপে (lg+) টেবিল, নিচে কার্ড — আসল পেজগুলোর মতোই `lg:hidden` / `hidden lg:block`
function SkTableList({
  cards,
  cols,
  rows = 8,
  rowH = 'h-[58px]',
  mobileGrid = 'grid grid-cols-1 gap-3 md:grid-cols-2',
  footer = 'pagination',
  checkbox = false,
}: {
  cards: React.ReactNode;
  cols: string[];
  rows?: number;
  rowH?: string;
  mobileGrid?: string;
  footer?: 'pagination' | 'total' | 'none';
  checkbox?: boolean;
}) {
  return (
    <div className="lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-white/90 lg:bg-white lg:shadow-sh1">
      <div className="lg:hidden">
        <div className={mobileGrid}>{cards}</div>
      </div>
      <div className="hidden lg:block">
        <div className="flex h-[46px] items-center gap-4 border-b border-border-base/60 bg-brand-bg/30 px-5">
          {checkbox && <Sk className="h-4 w-4 shrink-0 !rounded" />}
          {cols.map((w, i) => (
            <Sk key={i} className={`h-3 ${w}`} />
          ))}
        </div>
        <div className="divide-y divide-border-base/40">
          {rep(rows).map((r) => (
            <div key={r} className={`flex items-center gap-4 px-5 ${rowH}`}>
              {checkbox && <Sk className="h-4 w-4 shrink-0 !rounded" />}
              {cols.map((w, i) => (
                <Sk key={i} className={`h-3.5 ${w}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      {footer === 'pagination' && (
        <div className="mt-3 flex flex-col items-center justify-between gap-2.5 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:flex-row lg:mt-0 lg:rounded-none lg:border-0 lg:border-t lg:border-border-base/60 lg:px-5 lg:shadow-none">
          <Sk className="h-4 w-44" />
          <div className="flex items-center gap-1.5">
            {rep(5).map((i) => (
              <Sk key={i} className="h-9 w-9 !rounded-xl" />
            ))}
          </div>
        </div>
      )}
      {footer === 'total' && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[20px] border border-brand-light/30 bg-brand-light/[0.07] px-4 py-3 lg:mt-0 lg:rounded-none lg:border-0 lg:border-t lg:border-border-base/60">
          <Sk className="h-4 w-28" />
          <Sk className="h-5 w-20" />
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════ ১. অর্ডার ═════════════════════════ */
function OrderCardSk() {
  return (
    <div className="flex flex-col rounded-[22px] border border-white/90 bg-white p-3.5 shadow-sh1">
      <div className="flex items-center gap-1.5">
        <Sk className="h-5 w-5 !rounded-md" />
        <Sk className="h-5 w-20" />
        <Sk className="ml-auto h-6 w-24 !rounded-full" />
      </div>
      <div className="mt-2 flex items-center gap-2 pl-0.5">
        <Sk className="h-4 w-24" />
        <Sk className="h-4 w-28" />
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-surface-muted/70 p-2.5">
        <Sk className="h-10 w-10 shrink-0 !rounded-full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Sk className="h-[17px] w-32" />
          <Sk className="h-3.5 w-24" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {rep(3).map((i) => (
          <div key={i} className="rounded-xl border border-border-base/70 px-2.5 py-2">
            <Sk className="h-3 w-12" />
            <Sk className="mt-1 h-[18px] w-14" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Sk className="h-10 flex-1 !rounded-full" />
        <Sk className="h-10 w-10 !rounded-full" />
      </div>
    </div>
  );
}

export function OrdersSkeleton() {
  return (
    <div>
      <SkSearchToolbar right="date" chips={['w-16', 'w-28', 'w-28', 'w-28', 'w-28', 'w-28', 'w-28']} />
      <SkTableList
        checkbox
        cols={['w-24', 'w-36', 'w-24', 'w-20', 'w-20', 'w-24']}
        rowH="h-[64px]"
        cards={
          <>
            <div className="mb-0 flex h-11 items-center justify-between rounded-2xl border border-white/90 bg-white px-3 shadow-sh1 md:col-span-2">
              <Sk className="h-4 w-24" />
              <Sk className="h-4 w-16" />
            </div>
            {rep(4).map((i) => (
              <OrderCardSk key={i} />
            ))}
          </>
        }
      />
    </div>
  );
}

/* ═════════════════════════ ২. কাস্টমার ═════════════════════════ */
export function CustomersSkeleton() {
  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-2.5 sm:gap-3">
        {rep(3).map((i) => (
          <div key={i} className={`flex min-w-0 flex-col gap-2 ${TILE} p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4`}>
            <Sk className="h-9 w-9 shrink-0 !rounded-xl sm:h-10 sm:w-10" />
            <div className="min-w-0 space-y-1.5">
              <Sk className="h-3 w-14" />
              <Sk className="h-[22px] w-16" />
            </div>
          </div>
        ))}
      </div>
      <SkSearchToolbar />
      <SkTableList
        cols={['w-40', 'w-28', 'w-20', 'w-24', 'w-20']}
        rowH="h-[60px]"
        mobileGrid="grid grid-cols-1 gap-3 md:grid-cols-2"
        cards={rep(4).map((i) => (
          <div key={i} className="rounded-[22px] border border-white/90 bg-white p-3.5 shadow-sh1">
            <div className="flex items-center gap-3">
              <Sk className="h-11 w-11 shrink-0 !rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Sk className="h-[19px] w-36" />
                <Sk className="h-4 w-24" />
              </div>
            </div>
            <Sk className="mt-2.5 h-9 w-full !rounded-xl" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {rep(2).map((j) => (
                <div key={j} className="rounded-xl border border-border-base/70 px-3 py-2">
                  <Sk className="h-3 w-16" />
                  <Sk className="mt-1 h-[18px] w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      />
    </div>
  );
}

/* ═════════════════════════ ৩. প্রোডাক্ট ═════════════════════════ */
export function ProductsSkeleton() {
  return (
    <div>
      <SkSearchToolbar right="button" mb="mb-3.5" chips={['w-16', 'w-24', 'w-28', 'w-24', 'w-28', 'w-24']} />
      <div className="mb-3 flex items-center justify-between gap-x-3 px-1">
        <Sk className="h-4 w-36" />
        <Sk className="h-4 w-24" />
      </div>
      <SkTableList
        cols={['w-48', 'w-24', 'w-20', 'w-16', 'w-20', 'w-16']}
        rowH="h-[68px]"
        mobileGrid="grid grid-cols-1 gap-2.5 md:grid-cols-2"
        cards={rep(5).map((i) => (
          <div key={i} className="flex flex-col rounded-[20px] border border-white/90 bg-white p-3 shadow-sh1">
            <div className="flex items-start gap-2.5">
              <Sk className="h-14 w-14 shrink-0 !rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                <Sk className="h-4 w-4/5" />
                <Sk className="h-4 w-3/5" />
                <Sk className="h-3.5 w-1/2" />
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border-base/60 pt-2.5">
              <Sk className="h-6 w-28 !rounded-full" />
              <Sk className="h-8 w-8 !rounded-full" />
            </div>
          </div>
        ))}
      />
    </div>
  );
}

/* ═════════════════════════ ৪. স্মার্ট পার্সার ═════════════════════════ */
export function ParserSkeleton() {
  return (
    <div>
      <div className={`${CARD} p-4 sm:p-5`}>
        <div className="space-y-8">
          <section>
            <SkHeading w="w-56" />
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <Sk className="h-4 w-24" />
              <div className="flex gap-2">
                <Sk className="h-8 w-20 !rounded-full" />
                <Sk className="h-8 w-20 !rounded-full" />
              </div>
            </div>
            <Sk className="min-h-[260px] w-full !rounded-2xl" />
          </section>
          <section>
            <SkHeading w="w-44" />
            <Sk className="h-28 w-full !rounded-2xl" />
          </section>
        </div>
        <Sk className="mt-6 h-12 w-full !rounded-full" />
      </div>
    </div>
  );
}

/* ═════════════════════════ ৫. কুপন ═════════════════════════ */
export function CouponsSkeleton() {
  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {rep(4).map((i) => (
          <div key={i} className={`flex min-w-0 flex-col justify-between ${TILE} p-3.5 sm:p-4`}>
            <div className="flex items-center justify-between gap-2">
              <Sk className="h-3.5 w-16" />
              <Sk className="h-9 w-9 shrink-0 !rounded-xl" />
            </div>
            <Sk className="mt-2.5 h-[26px] w-20" />
          </div>
        ))}
      </div>
      <SkSearchToolbar right="button" chips={['w-16', 'w-24', 'w-24', 'w-24']} />
      <SkTableList
        cols={['w-28', 'w-32', 'w-24', 'w-24', 'w-24', 'w-20', 'w-16']}
        rowH="h-[62px]"
        footer="none"
        mobileGrid="grid grid-cols-1 gap-2.5 md:grid-cols-2"
        cards={rep(4).map((i) => (
          <div key={i} className="flex flex-col rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1">
            <div className="flex items-center justify-between gap-2 border-b border-border-base/60 pb-3">
              <Sk className="h-6 w-28" />
              <Sk className="h-6 w-11 !rounded-full" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Sk className="h-6 w-20 !rounded-full" />
              <Sk className="h-6 w-16 !rounded-full" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {rep(3).map((j) => (
                <div key={j} className="rounded-xl border border-border-base/70 px-2 py-2">
                  <Sk className="mx-auto h-3 w-12" />
                  <Sk className="mx-auto mt-0.5 h-4 w-14" />
                </div>
              ))}
            </div>
            <div className="mt-3.5 flex items-center gap-2 border-t border-border-base/60 pt-3">
              <Sk className="h-9 flex-1 !rounded-full" />
              <Sk className="h-9 w-9 !rounded-full" />
            </div>
          </div>
        ))}
      />
    </div>
  );
}

/* ═════════════════════════ ৬. প্রফিট ═════════════════════════ */
function SkDayTable({ colsDesktop }: { colsDesktop: string[] }) {
  return (
    <div className="mt-4">
      <SkHeading w="w-44" />
      <SkTableList
        cols={colsDesktop}
        rows={7}
        rowH="h-[46px]"
        footer="total"
        mobileGrid="grid grid-cols-1 gap-2.5 md:grid-cols-2"
        cards={rep(6).map((i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1">
            <div className="min-w-0 space-y-1.5">
              <Sk className="h-[17px] w-28" />
              <Sk className="h-3.5 w-36" />
            </div>
            <div className="shrink-0 space-y-1.5">
              <Sk className="ml-auto h-3 w-16" />
              <Sk className="ml-auto h-5 w-16" />
            </div>
          </div>
        ))}
      />
    </div>
  );
}

export function ProfitSkeleton() {
  return (
    <div>
      <SkHeaderCard right="date" gap="gap-2.5" />
      <SkStatGrid4 />
      <SkChartCard canvas={200} />
      <SkDayTable colsDesktop={['w-28', 'w-16', 'w-24', 'w-24']} />
    </div>
  );
}

/* ═════════════════════════ ৭. ট্রাফিক ═════════════════════════ */
export function TrafficSkeleton() {
  return (
    <div>
      <SkHeaderCard right="date" gap="gap-2.5" />
      <SkStatGrid4 />
      <SkChartCard canvas={180} />
      <SkDayTable colsDesktop={['w-28', 'w-20', 'w-24', 'w-24']} />
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`${CARD} p-4 sm:p-5`}>
          <SkHeading w="w-52" />
          <div className="flex flex-col gap-3.5">
            {rep(5).map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Sk className="h-10 w-10 shrink-0 !rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <Sk className="h-4 w-32" />
                    <Sk className="h-4 w-10" />
                  </div>
                  <Sk className="mt-1.5 h-2 w-full !rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`${CARD} p-4 sm:p-5`}>
          <SkHeading w="w-48" />
          <Sk className="mb-3 h-[42px] w-full !rounded-2xl" />
          <Sk className="h-[160px] w-full !rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════ ৮–১০. ডিজাইন ═════════════════════════ */
export function CategoriesSkeleton() {
  return (
    <div>
      <SkHeaderCard right="buttons" gap="gap-3" />
      <div className="space-y-2.5">
        {rep(7).map((i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-[22px] border border-white/90 bg-white p-3 shadow-sh1 sm:gap-3.5 sm:p-3.5">
            <Sk className="h-11 w-11 shrink-0 !rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Sk className="h-[18px] w-36" />
              <Sk className="h-3.5 w-24" />
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Sk className="h-9 w-9 !rounded-full" />
              <Sk className="h-9 w-9 !rounded-full" />
              <Sk className="h-9 w-9 !rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroCardsSkeleton() {
  return (
    <div>
      <SkHeaderCard right="buttons" gap="gap-3" progress />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {rep(10).map((i) => (
          <div key={i} className="overflow-hidden rounded-[22px] border border-white/90 bg-white shadow-sh1">
            <Sk className="h-40 w-full !rounded-none" />
            <div className="space-y-1.5 px-3 py-2.5">
              <Sk className="h-[17px] w-24" />
              <Sk className="h-3.5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GuideTemplatesSkeleton() {
  return (
    <div>
      <div className={`mb-4 ${CARD} p-3.5 sm:p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Sk className="h-9 w-9 shrink-0 !rounded-xl sm:h-10 sm:w-10" />
            <div className="space-y-1.5">
              <Sk className="h-[17px] w-32" />
              <Sk className="h-[14px] w-56 max-w-full" />
            </div>
          </div>
        </div>
        <div className="no-scrollbar -mx-3.5 mt-3 flex gap-2 overflow-hidden px-3.5 pb-0.5 sm:-mx-4 sm:px-4">
          {['w-16', 'w-28', 'w-28', 'w-24', 'w-28'].map((w, i) => (
            <Sk key={i} className={`h-9 shrink-0 !rounded-full ${w}`} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {rep(6).map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1">
            <Sk className="h-11 w-11 shrink-0 !rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Sk className="h-[18px] w-40" />
              <Sk className="h-3.5 w-28" />
            </div>
            <Sk className="h-5 w-5 shrink-0 !rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════════════════════════ ১১. অফার ═════════════════════════ */
export function OffersSkeleton() {
  return (
    <div>
      <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 ${CARD} p-4`}>
        <div className="space-y-1.5">
          <Sk className="h-[17px] w-44" />
          <Sk className="h-4 w-64 max-w-full" />
        </div>
        <Sk className="h-10 w-28 !rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {rep(3).map((i) => (
          <div key={i} className={`flex flex-col justify-between overflow-hidden ${CARD} p-4`}>
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-border-base/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <Sk className="h-10 w-10 shrink-0 !rounded-xl" />
                  <div className="space-y-1.5">
                    <Sk className="h-[17px] w-24" />
                    <Sk className="h-3.5 w-16" />
                  </div>
                </div>
                <Sk className="h-6 w-11 shrink-0 !rounded-full" />
              </div>
              <div className="min-h-[140px] space-y-2 py-3.5">
                <Sk className="h-4 w-full" />
                <Sk className="h-4 w-5/6" />
                <Sk className="h-4 w-2/3" />
              </div>
            </div>
            <Sk className="h-10 w-full !rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════════════════════════ ১২. রিভিউ গ্যালারি ═════════════════════════ */
export function ReviewGallerySkeleton() {
  return (
    <div>
      <SkHeaderCard right="buttons" gap="gap-3" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {rep(10).map((i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-[22px] border border-white/90 bg-white shadow-sh1">
            <Sk className="aspect-[4/3] w-full !rounded-none" />
            <div className="p-3">
              <Sk className="h-[15px] w-20" />
              <div className="mt-2.5 flex items-center gap-1.5">
                <Sk className="h-8 flex-1 !rounded-full" />
                <Sk className="h-8 w-8 !rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════════════════════════ ১৩. রিভিউ ও প্রশ্নোত্তর ═════════════════════════ */
export function ReviewsQnASkeleton() {
  return (
    <div>
      <div className={`mb-4 ${CARD} p-2`}>
        <div className="flex rounded-full bg-surface-muted p-1">
          <Sk className="h-10 flex-1 !rounded-full" />
          <div className="flex-1" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {rep(4).map((i) => (
          <article key={i} className="flex flex-col rounded-[22px] border border-white/90 bg-white p-4 shadow-sh1">
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0 flex-1 space-y-2">
                <Sk className="h-4 w-24" />
                <div className="flex items-center gap-2">
                  <Sk className="h-4 w-24" />
                  <Sk className="h-5 w-20 !rounded-full" />
                </div>
              </div>
              <Sk className="h-6 w-20 shrink-0 !rounded-full" />
            </div>
            <div className="mt-3 space-y-2">
              <Sk className="h-4 w-full" />
              <Sk className="h-4 w-4/5" />
            </div>
            <div className="mt-3.5 flex gap-2">
              <Sk className="h-10 flex-1 !rounded-full" />
              <Sk className="h-10 flex-1 !rounded-full" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
