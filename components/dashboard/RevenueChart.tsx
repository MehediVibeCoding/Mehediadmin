'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  revenueByDate: Record<string, number>;
}

const PERIODS = [
  { value: 7, label: 'গত ৭ দিন' },
  { value: 14, label: 'গত ১৪ দিন' },
  { value: 30, label: 'গত ৩০ দিন' },
];

// legacy renderRevenueChart()-এর হুবহু রূপান্তর — নতুন কোনো charting
// লাইব্রেরি (recharts ইত্যাদি) যোগ না করে native Canvas দিয়ে করা হয়েছে,
// যাতে legacy-র exact HiDPI/Retina-sharp bar chart behavior অক্ষুণ্ণ থাকে।
// (owner চাইলে ভবিষ্যতে recharts-এ migrate করা যায় — সেটা suggestion
// হিসেবে থাকল, এখন implement করা হয়নি।)
export default function RevenueChart({ revenueByDate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [days, setDays] = useState(7);
  const [legend, setLegend] = useState({ total: 0, activeDays: 0 });

  useEffect(() => {
    draw();
    function onResize() {
      draw();
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, revenueByDate]);

  function draw() {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels: string[] = [];
    const values: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      labels.push(d.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' }));
      values.push(revenueByDate[key] || 0);
    }

    const maxVal = Math.max(...values, 1);

    const dpr = window.devicePixelRatio || 1;
    const W = wrap.offsetWidth || 600;
    const H = 160;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { t: 20, r: 16, b: 36, l: 60 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b;
    const barW = Math.min(30, Math.max(8, Math.floor((chartW / labels.length) * 0.6)));
    const gap = (chartW - barW * labels.length) / (labels.length + 1);

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + chartH * (1 - i / 4);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      const gridVal = (maxVal * (i / 4)) / 1000;
      ctx.fillText('৳' + gridVal.toFixed(maxVal >= 10000 ? 1 : 0) + (maxVal >= 1000 ? 'k' : ''), pad.l - 4, y + 3);
    }

    labels.forEach((lbl, i) => {
      const x = pad.l + gap + (barW + gap) * i;
      const bh = Math.max(2, (values[i] / maxVal) * chartH);
      const y = pad.t + chartH - bh;
      const grad = ctx.createLinearGradient(0, y, 0, y + bh);
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#a5b4fc');
      ctx.fillStyle = values[i] > 0 ? grad : '#e5e7eb';

      ctx.beginPath();
      const r = Math.min(4, barW / 2);
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.arcTo(x + barW, y, x + barW, y + r, r);
      ctx.lineTo(x + barW, y + bh);
      ctx.lineTo(x, y + bh);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#6b7280';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lbl, x + barW / 2, H - pad.b + 12);

      if (values[i] > 0) {
        ctx.fillStyle = '#3730a3';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('৳' + (values[i] >= 1000 ? (values[i] / 1000).toFixed(1) + 'k' : values[i]), x + barW / 2, y - 5);
      }
    });

    const total = values.reduce((s, v) => s + v, 0);
    const activeDays = values.filter((v) => v > 0).length;
    setLegend({ total, activeDays });
  }

  return (
    <div className="glass-card-strong mt-4 rounded-brand p-4 shadow-glass md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-ink">📈 রেভিনিউ ট্রেন্ড</span>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-brand border border-border-base bg-brand-surface px-2.5 py-1 text-xs text-ink outline-none transition-brand focus:border-brand-primary"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div ref={wrapRef} className="overflow-x-auto py-2">
        <canvas ref={canvasRef} height={160} className="block w-full max-w-full" />
      </div>
      <div className="flex flex-wrap gap-4 px-1 pt-1.5 text-[11px] text-muted">
        <span className="font-semibold text-[#6366f1]">● নিশ্চিত রেভিনিউ</span>
        <span>মোট: ৳{legend.total.toLocaleString()}</span>
        <span>{legend.activeDays}টি দিনে অর্ডার</span>
      </div>
    </div>
  );
}
