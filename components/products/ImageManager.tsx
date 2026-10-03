'use client';

import { useRef, useState } from 'react';
import { uploadProductImage } from '@/app/actions/products';
import { useToast } from '@/components/admin/Toast';
import { FIELD_CLS } from '@/components/common/FormField';

interface Row {
  value: string;
  zoom: number; // %
  x: number; // %
  y: number; // %
}

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

function isUrl(v: string) {
  return !!v && (v.startsWith('http') || v.startsWith('data:'));
}

const SLIDER_CLS = 'h-1.5 min-w-0 flex-1 cursor-pointer accent-brand-light';

export default function ImageManager({ images, onChange }: Props) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Row[]>(() =>
    (images.length ? images : ['']).map((v) => ({ value: v, zoom: 100, x: 50, y: 50 }))
  );
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  function sync(next: Row[]) {
    setRows(next);
    onChange(next.map((r) => r.value).filter(Boolean));
  }

  function updateVal(idx: number, val: string) {
    const next = [...rows];
    next[idx] = { ...next[idx], value: val };
    sync(next);
  }

  function updateCrop(idx: number, field: 'zoom' | 'x' | 'y', val: number) {
    const next = [...rows];
    next[idx] = { ...next[idx], [field]: val };
    setRows(next); // crop preview অবস্থা DB-তে সেভ হয় না — শুধু লোকাল প্রিভিউ
  }

  function removeRow(idx: number) {
    sync(rows.filter((_, i) => i !== idx));
  }

  function addRow() {
    sync([...rows, { value: '', zoom: 100, x: 50, y: 50 }]);
  }

  async function handleFileSelect(idx: number, file: File | undefined) {
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadProductImage(formData);
      if (res.ok && res.url) {
        updateVal(idx, res.url);
      } else {
        showToast('❌ ছবি আপলোড ব্যর্থ: ' + (res.message || 'অজানা এরর'));
      }
    } finally {
      setUploadingIdx(null);
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      {rows.map((row, idx) => {
        const url = isUrl(row.value);
        return (
          <div key={idx} className="overflow-hidden rounded-[22px] border border-border-base/80 bg-white shadow-sh1">
            <div className="flex items-center justify-between border-b border-border-base/60 bg-brand-light/[0.07] px-4 py-2.5">
              <span className="font-body text-[12.5px] font-black text-ink">ছবি {idx + 1}</span>
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="flex h-8 items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3 font-body text-[11.5px] font-extrabold text-danger transition-all duration-brand active:scale-95"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
                সরান
              </button>
            </div>

            <div className="flex flex-col gap-3.5 p-4 sm:flex-row">
              {/* প্রিভিউ */}
              <div className="relative mx-auto h-[150px] w-[150px] shrink-0 overflow-hidden rounded-2xl border border-border-base/70 bg-brand-light/10">
                {url ? (
                  // ইচ্ছাকৃত: admin যেকোনো https URL (শুধু Cloudinary না) বা data:
                  // URL পেস্ট করতে পারে — next/image-এর remotePatterns দিয়ে সব
                  // ডোমেইন আগে থেকে জানা সম্ভব না, তাই next/image ব্যবহার করলে
                  // unoptimized={true} লাগত (কোনো optimization-লাভ ছাড়াই) আর এখানকার
                  // কাস্টম zoom/crop প্রিভিউ (dynamic width/height% + objectFit)
                  // ভেঙে যাওয়ার ঝুঁকি থাকত। তাই plain <img> ইচ্ছাকৃতভাবে রাখা হলো।
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.value}
                    alt=""
                    style={{
                      width: `${row.zoom}%`,
                      height: `${row.zoom}%`,
                      objectFit: row.zoom === 100 && row.x === 50 && row.y === 50 ? 'cover' : 'none',
                      objectPosition: `${row.x}% ${row.y}%`,
                    }}
                    className="h-full w-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : row.value ? (
                  <span className="flex h-full w-full items-center justify-center text-6xl">{row.value}</span>
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-brand-light/60">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </span>
                )}
                {url && (
                  <div className="absolute bottom-1.5 left-1.5 rounded-md bg-ink/60 px-1.5 py-0.5 font-body text-[9px] font-extrabold tracking-wider text-white">
                    PREVIEW
                  </div>
                )}
              </div>

              {/* কন্ট্রোল */}
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    className={`${FIELD_CLS} min-w-0 flex-1 !h-11 !text-[13px]`}
                    placeholder="https://... বা Emoji (💡)"
                    value={row.value}
                    onChange={(e) => updateVal(idx, e.target.value)}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => {
                      fileInputs.current[idx] = el;
                    }}
                    onChange={(e) => handleFileSelect(idx, e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputs.current[idx]?.click()}
                    disabled={uploadingIdx === idx}
                    className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl bg-brand-light px-4 font-body text-[12.5px] font-extrabold text-white shadow-[0_3px_10px_rgba(68,167,252,0.36)] transition-all duration-brand active:scale-95 disabled:opacity-60"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="m17 8-5-5-5 5" />
                      <path d="M12 3v12" />
                    </svg>
                    {uploadingIdx === idx ? '...' : 'আপলোড'}
                  </button>
                </div>

                {url && (
                  <div className="flex flex-col gap-2.5 rounded-2xl bg-surface-muted/70 p-3">
                    <div className="flex items-center gap-3">
                      <span className="w-[68px] shrink-0 font-body text-[11.5px] font-extrabold text-ink">Zoom</span>
                      <input
                        type="range"
                        min={100}
                        max={250}
                        step={5}
                        value={row.zoom}
                        onChange={(e) => updateCrop(idx, 'zoom', Number(e.target.value))}
                        className={SLIDER_CLS}
                      />
                      <span className="w-9 shrink-0 text-right font-body text-[11px] font-bold text-muted">{row.zoom}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-[68px] shrink-0 font-body text-[11.5px] font-extrabold text-ink">অনুভূমিক</span>
                      <input type="range" min={0} max={100} value={row.x} onChange={(e) => updateCrop(idx, 'x', Number(e.target.value))} className={SLIDER_CLS} />
                      <span className="w-9 shrink-0" />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-[68px] shrink-0 font-body text-[11.5px] font-extrabold text-ink">উল্লম্ব</span>
                      <input type="range" min={0} max={100} value={row.y} onChange={(e) => updateCrop(idx, 'y', Number(e.target.value))} className={SLIDER_CLS} />
                      <span className="w-9 shrink-0" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addRow}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-brand-light/50 bg-brand-light/[0.07] font-body text-[13px] font-extrabold text-ink transition-all duration-brand hover:bg-brand-light/15 active:scale-[0.99]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-3.5 w-3.5 text-brand-light">
          <path d="M12 5v14M5 12h14" />
        </svg>
        ছবি / Emoji যোগ করুন
      </button>
    </div>
  );
}
