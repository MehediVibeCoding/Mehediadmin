'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getLiveVisitors } from '@/app/actions/traffic';
import type { LiveData } from '@/lib/analytics/types';
import { flagEmoji } from '@/lib/analytics/derive';

const POLL_MS = 45_000;

// এখন সাইটে কত জন আছে — GA4 Realtime API থেকে, ট্যাব খোলা থাকলে প্রতি ৪৫ সেকেন্ডে নিজে আপডেট হয়।
export default function LiveVisitorsCard() {
  const [live, setLive] = useState<LiveData | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      setLive(await getLiveVisitors());
    } catch {
      setLive({ ok: false, error: 'লাইভ ডাটা আনা যায়নি', last30: 0, last5: 0, countries: [], pages: [] });
    }
  }, []);

  useEffect(() => {
    load();
    function start() {
      clearInterval(timer.current);
      timer.current = setInterval(() => {
        if (document.visibilityState === 'visible') load();
      }, POLL_MS);
    }
    function onVisible() {
      if (document.visibilityState === 'visible') load();
    }
    start();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  return (
    <div className="mb-4 rounded-[24px] border border-white/90 bg-white p-4 shadow-sh1 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className={`absolute inline-flex h-full w-full rounded-full ${live?.ok ? 'animate-ping bg-success/60' : 'bg-border-base'}`} />
            <span className={`relative inline-flex h-3 w-3 rounded-full ${live?.ok ? 'bg-success' : 'bg-border-base'}`} />
          </span>
          <div>
            <div className="font-body text-[13px] font-black text-ink">এখন সাইটে</div>
            <div className="font-body text-[11px] font-semibold text-muted">লাইভ — প্রতি ৪৫ সেকেন্ডে আপডেট</div>
          </div>
        </div>
        <div className="flex items-end gap-4 text-right">
          <div>
            <div className="font-body text-[28px] font-black leading-none tracking-tight text-ink">
              {live ? live.last5.toLocaleString('en-US') : '–'}
            </div>
            <div className="mt-1 font-body text-[10.5px] font-extrabold uppercase tracking-wide text-muted">গত ৫ মিনিট</div>
          </div>
          <div>
            <div className="font-body text-[20px] font-black leading-none tracking-tight text-[#0F6FC6]">
              {live ? live.last30.toLocaleString('en-US') : '–'}
            </div>
            <div className="mt-1 font-body text-[10.5px] font-extrabold uppercase tracking-wide text-muted">গত ৩০ মিনিট</div>
          </div>
        </div>
      </div>

      {live && !live.ok && (
        <div className="mt-3 rounded-xl bg-surface-muted/70 px-3 py-2 font-body text-[11.5px] font-semibold text-muted">
          লাইভ ডাটা পাওয়া যায়নি{live.error ? `: ${live.error.slice(0, 140)}` : ''}
        </div>
      )}

      {live?.ok && (live.countries.length > 0 || live.pages.length > 0) && (
        <div className="mt-3.5 grid grid-cols-1 gap-3 border-t border-border-base/60 pt-3.5 sm:grid-cols-2">
          <div className="min-w-0">
            <div className="mb-1.5 font-body text-[10.5px] font-extrabold uppercase tracking-wide text-muted">কোথা থেকে (গত ৩০ মিনিট)</div>
            <div className="flex flex-wrap gap-1.5">
              {live.countries.map((c) => (
                <span key={c.name} className="rounded-full border border-border-base/70 bg-white px-2.5 py-1 font-body text-[12px] font-bold text-ink">
                  {flagEmoji(c.code)} {c.name} · {c.users}
                </span>
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <div className="mb-1.5 font-body text-[10.5px] font-extrabold uppercase tracking-wide text-muted">কোন পেজে</div>
            <div className="flex flex-col gap-1">
              {live.pages.map((p) => (
                <div key={p.path} className="flex items-center justify-between gap-2 font-body text-[12px] font-semibold text-ink">
                  <span className="truncate">{p.path}</span>
                  <span className="shrink-0 font-black text-[#0F6FC6]">{p.users}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
