'use client';

import { useEffect, useRef } from 'react';
import type { ProfitChartSeries } from '@/lib/profit';
import SectionHeading from '@/components/common/SectionHeading';

interface Props {
  series: ProfitChartSeries;
}

// ক্যানভাস বার চার্ট — অ্যাডমিন UI-তে শুধু স্কাই-ব্লু (#44A7FC) সিরিজ; লোকসানের দিন লাল (danger #E63946)।
// গ্রিড-লেবেল: ১০০০-এর নিচে হলে সরাসরি টাকা (আগে সব "৳0" দেখাত), এর উপরে 'k'।
const BRAND = '#44A7FC';
const BRAND_SOFT = '#9ACFFD';
const BRAND_TEXT = '#0F6FC6';
const DANGER = '#E63946';

function fmtAxis(v: number, maxVal: number) {
  if (maxVal >= 1000) {
    const k = v / 1000;
    return '৳' + (maxVal >= 10000 ? k.toFixed(1) : k.toFixed(k % 1 === 0 ? 0 : 1)) + 'k';
  }
  return '৳' + Math.round(v);
}

function fmtBar(v: number) {
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  return sign + '৳' + (a >= 1000 ? (a / 1000).toFixed(1) + 'k' : Math.round(a));
}

export default function ProfitChart({ series }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    draw();
    // resize ইভেন্ট ডিবাউন্স (১৫০ms) — ফোন ঘোরানোর সময় বারবার রি-ড্র বন্ধ
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
    const H = 200;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { t: 22, r: 10, b: 34, l: 48 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b;
    const n = Math.max(labels.length, 1);
    const barW = Math.min(26, Math.max(4, Math.floor((chartW / n) * 0.62)));
    const gap = (chartW - barW * n) / (n + 1);

    ctx.clearRect(0, 0, W, H);

    // গ্রিড লাইন + Y-অক্ষের লেবেল
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + chartH * (1 - i / 4);
      ctx.strokeStyle = i === 0 ? '#D1D5DB' : '#EEF0F3';
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
      ctx.fillStyle = '#6B7280';
      ctx.font = '600 10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(fmtAxis(maxVal * (i / 4), maxVal), pad.l - 6, y + 3);
    }

    const showLabels = labels.length <= 31;
    const showValues = labels.length <= 14;
    const bestIdx = values.reduce((bi, v, i) => (v > values[bi] ? i : bi), 0);

    labels.forEach((lbl, i) => {
      const v = values[i];
      const x = pad.l + gap + (barW + gap) * i;
      const bh = Math.max(3, (Math.max(v, 0) / maxVal) * chartH);
      const y = pad.t + chartH - bh;

      if (v > 0) {
        const grad = ctx.createLinearGradient(0, y, 0, y + bh);
        grad.addColorStop(0, BRAND);
        grad.addColorStop(1, BRAND_SOFT);
        ctx.fillStyle = grad;
      } else if (v < 0) {
        ctx.fillStyle = DANGER;
      } else {
        ctx.fillStyle = '#E5E7EB';
      }

      const r = Math.min(5, barW / 2);
      ctx.beginPath();
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
        ctx.font = '600 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lbl, x + barW / 2, H - pad.b + 14);
      }

      // মান: কম দিনের চার্টে সব বারে; বেশি দিনের চার্টে শুধু সেরা দিনে
      if (v !== 0 && (showValues || i === bestIdx)) {
        ctx.fillStyle = v < 0 ? DANGER : BRAND_TEXT;
        ctx.font = '800 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(fmtBar(v), x + barW / 2, y - 5);
      }
    });
  }

  const total = series.values.reduce((s, v) => s + v, 0);
  const activeDays = series.values.filter((v) => v !== 0).length;
  const best = series.values.length ? Math.max(...series.values) : 0;
  const bestLabel = best > 0 ? series.labels[series.values.indexOf(best)] : '';

  return (
    <div className="mt-4 rounded-[24px] border border-white/90 bg-white p-4 shadow-sh1 sm:p-5">
      <SectionHeading hint={series.subtitle}>প্রফিট ট্রেন্ড</SectionHeading>
      <div ref={wrapRef} className="sleek-scrollbar overflow-x-auto">
        <canvas ref={canvasRef} height={200} className="block w-full max-w-full" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="min-w-0 rounded-xl border border-border-base/70 px-3 py-2">
          <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">মোট প্রফিট</div>
          <div className={`truncate font-body text-[15px] font-black ${total < 0 ? 'text-danger' : 'text-success'}`}>
            {total < 0 ? '−' : ''}৳{Math.abs(Math.round(total)).toLocaleString('en-US')}
          </div>
        </div>
        <div className="min-w-0 rounded-xl border border-border-base/70 px-3 py-2">
          <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">সক্রিয় দিন</div>
          <div className="font-body text-[15px] font-black text-ink">{activeDays}টি</div>
        </div>
        <div className="min-w-0 rounded-xl border border-border-base/70 px-3 py-2">
          <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">সেরা দিন</div>
          <div className="truncate font-body text-[15px] font-black text-ink">{bestLabel || '—'}</div>
        </div>
      </div>
    </div>
  );
}
