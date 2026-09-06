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
  const [summary, setSummary] = useState({ total: 0, activeDays: 0 });

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
    const H = 175;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { t: 24, r: 16, b: 36, l: 58 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b;
    const barW = Math.min(26, Math.max(6, Math.floor((chartW / labels.length) * 0.58)));
    const gap = (chartW - barW * labels.length) / (labels.length + 1);

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = '#E5E7EB';
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
      ctx.fillText(`৳${gridVal.toFixed(maxVal >= 10000 ? 1 : 0)}${maxVal >= 1000 ? 'k' : ''}`, pad.l - 6, y + 3);
    }

    labels.forEach((lbl, i) => {
      const x = pad.l + gap + (barW + gap) * i;
      const bh = Math.max(3, (values[i] / maxVal) * chartH);
      const y = pad.t + chartH - bh;

      const grad = ctx.createLinearGradient(0, y, 0, y + bh);
      grad.addColorStop(0, '#44A7FC');
      grad.addColorStop(1, '#0058C7');
      ctx.fillStyle = values[i] > 0 ? grad : '#F3F4F6';

      ctx.beginPath();
      const r = Math.min(5, barW / 2);
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.arcTo(x + barW, y, x + barW, y + r, r);
      ctx.lineTo(x + barW, y + bh);
      ctx.lineTo(x, y + bh);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#6B7280';
      ctx.font = '9.5px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lbl, x + barW / 2, H - pad.b + 14);

      if (values[i] > 0) {
        ctx.fillStyle = '#0058C7';
        ctx.font = 'bold 10.5px "DM Sans", sans-serif';
        ctx.fillText(`৳${values[i] >= 1000 ? (values[i] / 1000).toFixed(1) + 'k' : values[i]}`, x + barW / 2, y - 6);
      }
    });

    const total = values.reduce((s, v) => s + v, 0);
    const activeDays = values.filter((v) => v > 0).length;
    setSummary({ total, activeDays });
  }

  return (
    <div className="card-hover-glow mt-5 overflow-hidden rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-sh1 backdrop-blur-xl sm:p-6">
      {/* হেডার ও ট্যাকটাইল টাইম-পিল সিলেক্টর (ইমেজ ৩ ইন্সপায়ারেশন) */}
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
            <p className="font-body text-[11px] font-medium text-muted">নিশ্চিত অর্ডারের দৈনিক আয় পরিসংখ্যান</p>
          </div>
        </div>

        {/* ট্যাকটাইল ক্যাপসুল পিল বাটন গ্রুপ */}
        <div className="flex items-center rounded-full border border-border-base/70 bg-surface-muted p-1 shadow-xs">
          {PERIODS.map((p) => {
            const active = days === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setDays(p.value)}
                className={`rounded-full px-3.5 py-1 font-body text-[11.5px] font-bold transition-all duration-brand ${
                  active
                    ? 'bg-white text-brand-primary shadow-xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ক্যানভাস চার্ট এরিয়া */}
      <div ref={wrapRef} className="sleek-scrollbar overflow-x-auto py-1">
        <canvas ref={canvasRef} height={175} className="block w-full min-w-[320px]" />
      </div>

      {/* ফুটার প্রিমিয়াম সামারি ক্যাপসুলস */}
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
            {summary.activeDays}টি দিনে বিক্রয়
          </span>
        </div>
      </div>
    </div>
  );
}
