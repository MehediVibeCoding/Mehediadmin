'use client';

import { useEffect, useRef } from 'react';
import type { TrendSeries } from '@/lib/traffic';
import SectionHeading from '@/components/common/SectionHeading';

interface Props {
  series: TrendSeries;
}

// ক্যানভাস লাইন চার্ট — HiDPI-শার্প রেন্ডারিং। অ্যাডমিন UI-তে শুধু স্কাই-ব্লু
// (DESIGN_SYSTEM v2): লাইন/ফিল #44A7FC, ছোট লেখা গাঢ়-স্কাই #0F6FC6 (কনট্রাস্টের জন্য),
// গ্রিড border-base। গাঢ় নীল (#0058C7) আর ব্যবহার হয় না।
const BRAND = '#44A7FC';
const BRAND_DEEP = '#3C93DE';
const BRAND_TEXT = '#0F6FC6';

export default function TrafficTrendChart({ series }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    draw();
    // অডিট §১.৪: resize ডিবাউন্স (১৫০ms)
    let t: ReturnType<typeof setTimeout> | undefined;
    function onResize() {
      clearTimeout(t);
      t = setTimeout(draw, 150);
    }
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
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
      // লাইনের নিচের গ্রেডিয়েন্ট ফিল — স্কাই-ব্লু
      const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + chartH);
      grad.addColorStop(0, 'rgba(68,167,252,.30)');
      grad.addColorStop(1, 'rgba(68,167,252,0)');
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pad.t + chartH);
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, pad.t + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // লাইন — স্কাই-ব্লু গ্রেডিয়েন্ট
      const lineGrad = ctx.createLinearGradient(pad.l, 0, W - pad.r, 0);
      lineGrad.addColorStop(0, BRAND);
      lineGrad.addColorStop(1, BRAND_DEEP);
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
        ctx.strokeStyle = BRAND;
        ctx.stroke();
        if (values[i] > 0) {
          ctx.fillStyle = BRAND_TEXT;
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

  const maxVal = series.values.length ? Math.max(...series.values) : 0;
  const peakLabel = maxVal > 0 ? series.labels[series.values.indexOf(maxVal)] : '';

  return (
    <div className="mt-4 rounded-[24px] border border-white/90 bg-white p-4 shadow-sh1 sm:p-5">
      <SectionHeading hint={series.subtitle}>ভিজিটর ট্রেন্ড</SectionHeading>
      <div ref={wrapRef} className="sleek-scrollbar overflow-x-auto">
        <canvas ref={canvasRef} height={180} className="block w-full max-w-full" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="min-w-0 rounded-xl border border-border-base/70 px-3 py-2">
          <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">মোট</div>
          <div className="font-body text-[15px] font-black text-ink">{series.total.toLocaleString('en-US')}</div>
        </div>
        <div className="min-w-0 rounded-xl border border-border-base/70 px-3 py-2">
          <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">সর্বোচ্চ</div>
          <div className="font-body text-[15px] font-black text-ink">{maxVal.toLocaleString('en-US')}</div>
        </div>
        <div className="min-w-0 rounded-xl border border-border-base/70 px-3 py-2">
          <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">সেরা সময়</div>
          <div className="truncate font-body text-[15px] font-black text-ink">{peakLabel || '—'}</div>
        </div>
      </div>
    </div>
  );
}
