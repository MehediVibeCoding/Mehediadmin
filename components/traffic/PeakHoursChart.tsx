'use client';

import { useEffect, useRef } from 'react';
import type { PeakHourLabels } from '@/lib/traffic';

interface Props {
  hourCounts: number[];
  peakStart: number;
  labels: PeakHourLabels;
}

// legacy drawPeakHoursChart() — সাধারণ বার brand-light (#44A4FB, legacy-র
// হালকা ইন্ডিগো #a5b4fc-এর জায়গায় DESIGN_SYSTEM chart-color নিয়ম অনুযায়ী
// secondary token), শূন্য-ভ্যালু বার border-base (#E5E7EB, legacy hex-এর
// সাথেই exact মিল), পিক ৩-ঘণ্টার উইন্ডো warn (#F59E0B, legacy hex exact মিল)।
export default function PeakHoursChart({ hourCounts, peakStart, labels }: Props) {
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
  }, [hourCounts, peakStart]);

  function draw() {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = wrap.offsetWidth || 500;
    const H = 160;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { t: 14, r: 8, b: 22, l: 28 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b;
    const maxVal = Math.max(...hourCounts, 1);
    const barW = (chartW / 24) * 0.7;
    const gap = (chartW - barW * 24) / 24;
    ctx.clearRect(0, 0, W, H);

    const peakWindow = [peakStart, (peakStart + 1) % 24, (peakStart + 2) % 24];
    hourCounts.forEach((v, h) => {
      const x = pad.l + gap / 2 + (barW + gap) * h;
      const bh = Math.max(1, (v / maxVal) * chartH);
      const y = pad.t + chartH - bh;
      const isPeak = peakWindow.includes(h) && v > 0;
      ctx.fillStyle = v === 0 ? '#E5E7EB' : isPeak ? '#F59E0B' : '#44A4FB';
      ctx.beginPath();
      const r = Math.min(2, barW / 2);
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.arcTo(x + barW, y, x + barW, y + r, r);
      ctx.lineTo(x + barW, y + bh);
      ctx.lineTo(x, y + bh);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      ctx.fill();
      if (h % 3 === 0) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '8.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(h), x + barW / 2, H - pad.b + 11);
      }
    });
  }

  return (
    <div className="rounded-brand bg-brand-surface p-5 shadow-sh1">
      <div className="mb-3 text-sm font-bold text-ink">⏰ পিক ট্রাফিক আওয়ার</div>
      <div className="mb-3 rounded-[10px] bg-brand-bg px-3 py-2.5 text-[12.5px] font-semibold text-brand-primary">
        {labels.note}
      </div>
      <div ref={wrapRef} className="overflow-x-auto py-1">
        <canvas ref={canvasRef} height={160} className="block w-full max-w-full" />
      </div>
    </div>
  );
}
