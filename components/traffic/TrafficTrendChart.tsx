'use client';

import { useEffect, useRef } from 'react';
import type { TrendSeries } from '@/lib/traffic';

interface Props {
  series: TrendSeries;
}

// legacy drawTrafficTrendChart() — canvas-ভিত্তিক, RevenueChart.tsx-এর মতোই
// HiDPI-শার্প রেন্ডারিং। legacy-তে গ্রেডিয়েন্ট লাইন ছিল ইন্ডিগো→পার্পল→পিংক
// (নতুন hex), DESIGN_SYSTEM.md-এর "Chart colors: primary series brand-primary,
// secondary brand-accent/brand-light, gridline border-base — কোনো নতুন hex না"
// নিয়ম অনুযায়ী brand-primary/brand-light দিয়ে বদলানো হয়েছে।
export default function TrafficTrendChart({ series }: Props) {
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

    const pad = { t: 20, r: 16, b: 32, l: 36 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b;
    ctx.clearRect(0, 0, W, H);

    // Grid — border-base (#E5E7EB) / muted (#6B7280)
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + chartH * (1 - i / 4);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxVal * (i / 4))), pad.l - 6, y + 3);
    }

    const stepX = labels.length > 1 ? chartW / (labels.length - 1) : chartW;
    const pts = values.map((v, i) => ({ x: pad.l + stepX * i, y: pad.t + chartH - (v / maxVal) * chartH }));

    if (pts.length) {
      // Gradient fill under line — brand-primary (#0058C7)
      const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + chartH);
      grad.addColorStop(0, 'rgba(0,88,199,.30)');
      grad.addColorStop(1, 'rgba(0,88,199,0)');
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pad.t + chartH);
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, pad.t + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line — brand-primary → brand-light gradient (secondary series token)
      const lineGrad = ctx.createLinearGradient(pad.l, 0, W - pad.r, 0);
      lineGrad.addColorStop(0, '#0058C7');
      lineGrad.addColorStop(1, '#44A4FB');
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const midX = (pts[i - 1].x + pts[i].x) / 2;
        ctx.bezierCurveTo(midX, pts[i - 1].y, midX, pts[i].y, pts[i].x, pts[i].y);
      }
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Points
      pts.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0058C7';
        ctx.stroke();
        if (values[i] > 0) {
          ctx.fillStyle = '#0058C7';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(values[i]), p.x, p.y - 8);
        }
      });
    }

    // X labels (thin out if too many)
    ctx.fillStyle = '#6B7280';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    const labelEvery = Math.ceil(labels.length / 12);
    labels.forEach((lbl, i) => {
      if (i % labelEvery === 0) ctx.fillText(lbl, pad.l + stepX * i, H - pad.b + 14);
    });
  }

  return (
    <div className="mt-4 rounded-brand bg-brand-surface p-5 shadow-sh1">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-bold text-ink">📈 ভিজিটর ট্রেন্ড</span>
        <span className="text-[11px] text-muted">{series.subtitle}</span>
      </div>
      <div ref={wrapRef} className="overflow-x-auto py-2">
        <canvas ref={canvasRef} height={180} className="block w-full max-w-full" />
      </div>
      <div className="flex flex-wrap gap-4 px-1 pt-1.5 text-[11px] text-muted">
        <span className="font-semibold text-brand-primary">● ইউনিক ভিজিটর</span>
        <span>মোট: {series.total}</span>
      </div>
    </div>
  );
}
