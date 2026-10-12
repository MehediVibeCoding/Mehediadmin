// ড্যাশবোর্ড ইনসাইট কার্ডের ছোট SVG/CSS চার্ট — কোনো লাইব্রেরি নেই, কোনো ব্লার/শ্যাডো নেই।

export const fmtNum = (n: number): string => Math.round(n).toLocaleString('en-US');
export const fmtTaka = (n: number): string => '৳' + Math.round(n).toLocaleString('en-US');

/** ছোট লাইন/এরিয়া চার্ট (স্পার্কলাইন) */
export function Sparkline({
  values,
  className = 'h-10 w-full',
  stroke = '#44A7FC',
  fill = true,
  strokeWidth = 2,
}: {
  values: number[];
  className?: string;
  stroke?: string;
  fill?: boolean;
  strokeWidth?: number;
}) {
  const W = 120;
  const H = 36;
  const pad = 3;
  if (values.length < 2) return <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden="true" />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = (W - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => [pad + i * step, H - pad - ((v - min) / span) * (H - pad * 2)] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      {fill && <path d={area} fill={stroke} opacity="0.14" />}
      <path d={line} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={stroke} />
    </svg>
  );
}

/** পরিবর্তনের পিল: ▲ সবুজ / ▼ লাল / — ধূসর */
export function DeltaPill({ value, suffix = '%', className = '' }: { value: number | null; suffix?: string; className?: string }) {
  if (value === null || !Number.isFinite(value)) {
    return (
      <span className={`inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 font-body text-[10.5px] font-extrabold text-muted ${className}`}>—</span>
    );
  }
  const up = value > 0;
  const flat = value === 0;
  const tone = flat ? 'bg-surface-muted text-muted' : up ? 'bg-emerald-50 text-[#065F46]' : 'bg-red-50 text-[#B91C1C]';
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-body text-[10.5px] font-extrabold ${tone} ${className}`}>
      {!flat && (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {up ? <path d="M12 4 22 20H2z" /> : <path d="M12 20 2 4h20z" />}
        </svg>
      )}
      {Math.abs(value)}
      {suffix}
    </span>
  );
}

/** শতকরা পরিবর্তন; আগের মান ০ হলে null */
export function pctChange(now: number, prev: number): number | null {
  if (prev <= 0) return now > 0 ? null : 0;
  return Math.round(((now - prev) / prev) * 100);
}

/** আনুভূমিক বার-সারি: লেবেল · বার · মান */
export function BarRow({
  label,
  value,
  max,
  display,
  color = '#44A7FC',
  sub,
  delay = 0,
}: {
  label: string;
  value: number;
  max: number;
  display?: string;
  color?: string;
  sub?: string;
  delay?: number;
}) {
  const pct = max > 0 ? Math.max(value > 0 ? 4 : 0, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="min-w-0 flex-1 truncate font-body text-[12.5px] font-bold text-ink">{label}</span>
        <span className="shrink-0 font-body text-[12.5px] font-black text-ink">{display ?? fmtNum(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className="bar-grow h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, animationDelay: `${delay}ms` }} />
      </div>
      {sub && <div className="mt-0.5 font-body text-[10.5px] font-semibold text-muted">{sub}</div>}
    </div>
  );
}

/** কলাম চার্ট (সপ্তাহের ৭ দিন ইত্যাদি) — সর্বোচ্চটা হাইলাইট */
export function ColumnChart({
  items,
  height = 96,
  color = '#44A7FC',
  muted = '#DCEBFD',
}: {
  items: { label: string; value: number }[];
  height?: number;
  color?: string;
  muted?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const top = items.reduce((b, it, i) => (it.value > items[b].value ? i : b), 0);
  return (
    <div className="flex items-end gap-1.5" style={{ height: height + 34 }}>
      {items.map((it, i) => {
        const h = Math.max(it.value > 0 ? 6 : 3, Math.round((it.value / max) * height));
        const isTop = i === top && it.value > 0;
        return (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className={`font-body text-[10.5px] font-black ${isTop ? 'text-ink' : 'text-muted'}`}>{it.value > 0 ? fmtNum(it.value) : ''}</span>
            <div className="col-grow w-full rounded-t-lg rounded-b-sm" style={{ height: h, backgroundColor: isTop ? color : muted, animationDelay: `${i * 40}ms` }} />
            <span className={`font-body text-[10.5px] font-extrabold ${isTop ? 'text-ink' : 'text-muted'}`}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** গেজ-রিং (০–১০০%) */
export function Ring({
  percent,
  size = 96,
  stroke = 11,
  color = '#44A7FC',
  track = '#F3F4F6',
  children,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(Math.max(percent, 0), 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(p / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
