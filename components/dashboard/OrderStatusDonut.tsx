import type { DashboardStats } from '@/app/actions/dashboard';

interface Segment {
  label: string;
  value: number;
  color: string;
  dot: string;
}

// এই কম্পোনেন্টটা সম্পূর্ণ ভিজ্যুয়াল — dashboard.ts থেকে আগে থেকেই আসা stats
// (totalOrders/pendingCount/confirmedCount/deliveredCount) দিয়ে শুধু শতাংশ বের
// করে রিং আকারে দেখানো হয়, কোনো নতুন সার্ভার/ডাটা লজিক যোগ করা হয়নি।
export default function OrderStatusDonut({ stats }: { stats: DashboardStats }) {
  const total = Math.max(stats.totalOrders, 0);
  const delivered = stats.deliveredCount;
  const confirmed = stats.confirmedCount;
  const pending = stats.pendingCount;
  const other = Math.max(total - delivered - confirmed - pending, 0);

  const segments: Segment[] = [
    { label: 'ডেলিভার্ড', value: delivered, color: '#10B981', dot: 'bg-success' },
    { label: 'কনফার্মড', value: confirmed, color: '#44A7FC', dot: 'bg-brand-light' },
    { label: 'পেন্ডিং', value: pending, color: '#F59E0B', dot: 'bg-warn' },
    { label: 'অন্যান্য', value: other, color: '#E5E7EB', dot: 'bg-border-base' },
  ].filter((s) => s.value > 0);

  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  // SVG রিং — প্রতিটা সেগমেন্টের জন্য stroke-dasharray/offset বসানো
  const R = 54;
  const CIRC = 2 * Math.PI * R;
  let offsetAcc = 0;
  const arcs = (total > 0 ? segments : [{ label: '', value: 1, color: '#E5E7EB', dot: '' }]).map((s) => {
    const frac = total > 0 ? s.value / total : 1;
    const dash = frac * CIRC;
    const arc = { ...s, dash, offset: offsetAcc };
    offsetAcc += dash;
    return arc;
  });

  return (
    <div className="card-hover-glow flex h-full flex-col overflow-hidden rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-sh1 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center gap-2.5 border-b border-border-base/50 pb-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div>
          <h2 className="font-body text-[15px] font-black tracking-tight text-ink">অর্ডার অবস্থা</h2>
          <p className="font-body text-[11px] font-medium text-muted">মোট অর্ডারের বণ্টন</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
        <div className="relative h-[132px] w-[132px] shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#F3F4F6" strokeWidth="14" />
            {arcs.map((a, i) => (
              <circle
                key={i}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={a.color}
                strokeWidth="14"
                strokeDasharray={`${a.dash} ${CIRC - a.dash}`}
                strokeDashoffset={-a.offset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-body text-[24px] font-black tracking-tight text-ink">{deliveryRate}%</span>
            <span className="font-body text-[9.5px] font-bold uppercase tracking-wide text-muted">ডেলিভারি রেট</span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto">
          {segments.length === 0 ? (
            <span className="font-body text-[12.5px] font-semibold text-muted">কোনো অর্ডার নেই</span>
          ) : (
            segments.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
                <span className="font-body text-[12px] font-semibold text-ink/85">{s.label}</span>
                <span className="ml-auto font-body text-[12px] font-black text-ink">{s.value}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
