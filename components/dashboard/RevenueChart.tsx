'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  revenueByDate: Record<string, number>;
}

const PERIODS = [
  { value: 7, label: '৭ দিন' },
  { value: 14, label: '১৪ দিন' },
  { value: 30, label: '৩০ দিন' },
];

export default function RevenueChart({ revenueByDate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState({ total: 0, activeDays: 0, peak: 0 });

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
    const H = 190;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { t: 26, r: 14, b: 34, l: 54 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b;

    ctx.clearRect(0, 0, W, H);

    // গ্রিডলাইন ও Y-অক্ষ লেবেল
    ctx.strokeStyle = '#EEF1F5';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + chartH * (1 - i / 4);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px "DM Sans", sans-serif';
      ctx.textAlign = 'right';
      const gridVal = (maxVal * (i / 4)) / 1000;
      ctx.fillText(`৳${gridVal.toFixed(maxVal >= 10000 ? 1 : 0)}${maxVal >= 1000 ? 'k' : ''}`, pad.l - 8, y + 3);
    }

    // পয়েন্ট কো-অর্ডিনেট বসানো (এখন লাইন/এরিয়া চার্ট, আগের বার চার্টের বদলে)
    const stepX = labels.length > 1 ? chartW / (labels.length - 1) : chartW;
    const points = values.map((v, i) => ({
      x: pad.l + stepX * i,
      y: pad.t + chartH - (v / maxVal) * chartH,
      v,
    }));

    function smoothPath() {
      ctx!.beginPath();
      ctx!.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const xMid = (points[i].x + points[i + 1].x) / 2;
        const yMid = (points[i].y + points[i + 1].y) / 2;
        ctx!.quadraticCurveTo(points[i].x, points[i].y, xMid, yMid);
      }
      const last = points[points.length - 1];
      const secondLast = points[points.length - 2] || last;
      ctx!.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
    }

    // গ্র্যাডিয়েন্ট এরিয়া ফিল
    if (points.length > 1) {
      smoothPath();
      ctx.lineTo(points[points.length - 1].x, pad.t + chartH);
      ctx.lineTo(points[0].x, pad.t + chartH);
      ctx.closePath();
      const areaGrad = ctx.createLinearGradient(0, pad.t, 0, pad.t + chartH);
      areaGrad.addColorStop(0, 'rgba(68,167,252,0.28)');
      areaGrad.addColorStop(1, 'rgba(68,167,252,0.02)');
      ctx.fillStyle = areaGrad;
      ctx.fill();
    }

    // মসৃণ লাইন স্ট্রোক
    smoothPath();
    const lineGrad = ctx.createLinearGradient(pad.l, 0, W - pad.r, 0);
    lineGrad.addColorStop(0, '#44A7FC');
    lineGrad.addColorStop(1, '#0058C7');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // পিক পয়েন্টে হাইলাইট ডট + মান
    const peakIdx = values.indexOf(maxVal);
    if (maxVal > 0 && points[peakIdx]) {
      const p = points[peakIdx];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0058C7';
      ctx.stroke();

      const label = `৳${maxVal >= 1000 ? (maxVal / 1000).toFixed(1) + 'k' : maxVal}`;
      ctx.font = 'bold 11px "DM Sans", sans-serif';
      const textW = ctx.measureText(label).width;
      const bubbleX = Math.min(Math.max(p.x, pad.l + textW / 2 + 8), W - pad.r - textW / 2 - 8);
      const bubbleY = Math.max(p.y - 22, pad.t - 4);
      ctx.fillStyle = '#0058C7';
      ctx.beginPath();
      const bw = textW + 16;
      const bh = 20;
      const bx = bubbleX - bw / 2;
      const by = bubbleY - bh / 2;
      const r = 8;
      ctx.moveTo(bx + r, by);
      ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
      ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
      ctx.arcTo(bx, by + bh, bx, by, r);
      ctx.arcTo(bx, by, bx + bw, by, r);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(label, bubbleX, bubbleY + 4);
    }

    // X-অক্ষ লেবেল (কম জায়গায় সব লেবেল না দেখিয়ে স্কিপ করে)
    const skip = labels.length > 10 ? Math.ceil(labels.length / 8) : 1;
    ctx.fillStyle = '#6B7280';
    ctx.font = '9.5px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((lbl, i) => {
      if (i % skip !== 0 && i !== labels.length - 1) return;
      ctx.fillText(lbl, points[i].x, H - pad.b + 16);
    });

    const total = values.reduce((s, v) => s + v, 0);
    const activeDays = values.filter((v) => v > 0).length;
    setSummary({ total, activeDays, peak: maxVal });
  }

  return (
    <div className="card-hover-glow overflow-hidden rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-sh1 backdrop-blur-xl sm:p-6">
      {/* হেডার ও ট্যাকটাইল টাইম-পিল সিলেক্টর */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border-base/50 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-bg/50 text-brand-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div>
            <h2 className="font-body text-[15px] font-black tracking-tight text-ink">রেভিনিউ ট্রেন্ড</h2>
            <p className="font-body text-[11px] font-medium text-muted">নিশ্চিত অর্ডারের দৈনিক আয় পরিসংখ্যান</p>
          </div>
        </div>

        <div className="flex items-center rounded-full border border-border-base/70 bg-surface-muted p-1 shadow-xs">
          {PERIODS.map((p) => {
            const active = days === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setDays(p.value)}
                className={`rounded-full px-3.5 py-1 font-body text-[11.5px] font-bold transition-all duration-brand ${
                  active ? 'bg-white text-brand-primary shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ক্যানভাস চার্ট এরিয়া */}
      <div ref={wrapRef} className="sleek-scrollbar overflow-x-auto py-1">
        <canvas ref={canvasRef} height={190} className="block w-full min-w-[320px]" />
      </div>

      {/* ফুটার সামারি ক্যাপসুলস */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-border-base/50 pt-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-brand-light to-brand-primary" />
          <span className="font-body text-[11.5px] font-semibold text-muted">নিশ্চিত রেভিনিউ</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-brand-bg/40 px-3 py-1 font-body text-[11.5px] font-black text-brand-primary">
            মোট: ৳{summary.total.toLocaleString('en-US')}
          </span>
          <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-1 font-body text-[11px] font-semibold text-muted">
            {summary.activeDays}টি দিনে বিক্রয়
          </span>
        </div>
      </div>
    </div>
  );
}
