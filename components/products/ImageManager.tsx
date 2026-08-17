'use client';

import { useRef, useState } from 'react';
import { uploadProductImage } from '@/app/actions/products';

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

export default function ImageManager({ images, onChange }: Props) {
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
        alert('❌ ছবি আপলোড ব্যর্থ: ' + (res.message || 'অজানা এরর'));
      }
    } finally {
      setUploadingIdx(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, idx) => {
        const url = isUrl(row.value);
        return (
          <div key={idx} className="flex overflow-hidden rounded-brand border border-border-base bg-white shadow-sh1">
            {/* প্রিভিউ */}
            <div className="relative h-[130px] w-[130px] shrink-0 overflow-hidden border-r border-border-base bg-surface-muted">
              {url ? (
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
              ) : (
                <span className="flex h-full w-full items-center justify-center text-5xl">
                  {row.value || '🖼️'}
                </span>
              )}
              {url && (
                <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  PREVIEW
                </div>
              )}
            </div>

            {/* কন্ট্রোল */}
            <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
              <div className="flex gap-1.5">
                <input
                  className="min-w-0 flex-1 rounded-lg border border-border-base px-2.5 py-2 text-xs"
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
                  className="shrink-0 rounded-lg border border-border-base px-2.5 py-2 text-xs font-medium text-ink transition-brand hover:border-brand-primary disabled:opacity-50"
                >
                  {uploadingIdx === idx ? '...' : '📤 আপলোড'}
                </button>
              </div>

              {url && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="min-w-[52px] text-[11px] font-semibold text-muted">🔍 Zoom</span>
                    <input
                      type="range"
                      min={100}
                      max={250}
                      step={5}
                      value={row.zoom}
                      onChange={(e) => updateCrop(idx, 'zoom', Number(e.target.value))}
                      className="h-1 flex-1 accent-ink"
                    />
                    <span className="min-w-[34px] text-[10px] text-muted">{row.zoom}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="min-w-[52px] text-[11px] font-semibold text-muted">↔ অনুভূমিক</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={row.x}
                      onChange={(e) => updateCrop(idx, 'x', Number(e.target.value))}
                      className="h-1 flex-1 accent-ink"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="min-w-[52px] text-[11px] font-semibold text-muted">↕ উল্লম্ব</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={row.y}
                      onChange={(e) => updateCrop(idx, 'y', Number(e.target.value))}
                      className="h-1 flex-1 accent-ink"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="self-end rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-danger transition-brand hover:bg-red-50"
              >
                🗑️ সরান
              </button>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addRow}
        className="w-full rounded-brand border border-border-base py-2.5 text-sm font-medium text-ink transition-brand hover:border-brand-primary"
      >
        + ছবি / Emoji যোগ করুন
      </button>
    </div>
  );
}
