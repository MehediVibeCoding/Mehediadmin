'use client';

import { useEffect, useRef } from 'react';
import type { ProfitChartSeries } from '@/lib/profit';

interface Props {
  series: ProfitChartSeries;
}

// legacy renderProfitChart() — canvas bar chart, RevenueChart.tsx-এর হুবহু
// একই কাঠামো। রঙ: legacy-তে এই চার্ট সবুজ গ্রেডিয়েন্ট ছিল (#10B981→#6EE7B7),
// কিন্তু DESIGN_SYSTEM.md-এর "Admin-only Patterns" সেকশনে স্পষ্টভাবে লেখা
// আছে — "Chart colors (Revenue/Traffic/Profit): primary series brand-primary,
// ... কোনো নতুন hex না" — তাই Dashboard/Traffic-এর চার্টের সাথে ভিজ্যুয়াল
// সামঞ্জস্য রাখতে brand-primary/brand-light গ্রেডিয়েন্ট ব্যবহার করা হয়েছে
// (green বাদ)। "নিট প্রফিট" স্ট্যাট কার্ড ও টেবিলে green (success token)
// আগের মতোই আছে, শুধু চার্ট বার-এর রঙ এই নিয়ম মেনে বদলানো হয়েছে।
export default function ProfitChart({ series }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    draw();
    function onResize() {
      draw();
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series]);

  function draw() {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { labels, values } = series;
    const maxVal = Math.max(...values, 1);

    const dpr = window.devicePixelRatio || 1;
    const W = wrap.offsetWidth || 600;
    const H = 180;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { t: 20, r: 16, b: 36, l: 60 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b;
    const barW = Math.min(24, Math.max(4, Math.floor((chartW / labels.length) * 0.6)));
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
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      const gridVal = (maxVal * (i / 4)) / 1000;
      ctx.fillText('৳' + gridVal.toFixed(maxVal >= 10000 ? 1 : 0) + (maxVal >= 1000 ? 'k' : ''), pad.l - 4, y + 3);
    }

    const showLabels = labels.length <= 31;

    labels.forEach((lbl, i) => {
      const x = pad.l + gap + (barW + gap) * i;
      const bh = Math.max(2, (values[i] / maxVal) * chartH);
      const y = pad.t + chartH - bh;
      const grad = ctx.createLinearGradient(0, y, 0, y + bh);
      grad.addColorStop(0, '#0058C7');
      grad.addColorStop(1, '#44A4FB');
      ctx.fillStyle = values[i] > 0 ? grad : '#E5E7EB';

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

      if (showLabels) {
        ctx.fillStyle = '#6B7280';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lbl, x + barW / 2, H - pad.b + 12);
      }

      if (values[i] > 0 && showLabels) {
        ctx.fillStyle = '#0058C7';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          '৳' + (values[i] >= 1000 ? (values[i] / 1000).toFixed(1) + 'k' : Math.round(values[i])),
          x + barW / 2,
          y - 5
        );
      }
    });
  }

  const total = series.values.reduce((s, v) => s + v, 0);
  const activeDays = series.values.filter((v) => v > 0).length;

  return (
    <div className="mt-4 rounded-brand bg-brand-surface p-5 shadow-sh1">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-bold text-ink">📈 প্রফিট ট্রেন্ড</span>
        <span className="text-[11px] text-muted">{series.subtitle}</span>
      </div>
      <div ref={wrapRef} className="overflow-x-auto py-2">
        <canvas ref={canvasRef} height={180} className="block w-full max-w-full" />
      </div>
      <div className="flex flex-wrap gap-4 px-1 pt-1.5 text-[11px] text-muted">
        <span className="font-semibold text-brand-primary">● নিট প্রফিট</span>
        <span>মোট: ৳{Math.round(total).toLocaleString()}</span>
        <span>{activeDays}টি দিনে অর্ডার</span>
      </div>
    </div>
  );
}
