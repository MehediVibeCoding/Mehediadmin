'use client';

import { useEffect, useState } from 'react';

// মডাল/বটম-শীট/ড্রপডাউন-ব্যাকড্রপ খোলা আছে কিনা — DOM দেখেই বোঝা যায়, তাই নতুন-পুরনো সব মডাল
// (ProductModal, OrderDetailModal, গাইড এডিটর, QuickEdit, ConfirmDialog …) আলাদা কোড ছাড়াই কভার হয়।
//
// মানদণ্ড: `fixed inset-0` ফুল-স্ক্রিন স্তর, z-index ≥ 60 (ডক বার z-40, ভাসমান বার z-45-এর উপরে),
// যেটা দৃশ্যমান ও ক্লিকযোগ্য। বন্ধ থাকা মোবাইল-মেনুর ব্যাকড্রপ `pointer-events-none` — সেটা গোনা হয় না।
const MODAL_MIN_Z = 60;

function detectModalOpen(): boolean {
  const layers = document.querySelectorAll<HTMLElement>('.fixed.inset-0');
  for (const el of layers) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') continue;
    if (Number(cs.opacity) < 0.05) continue;
    const z = parseInt(cs.zIndex, 10);
    if (Number.isFinite(z) && z >= MODAL_MIN_Z) return true;
  }
  return false;
}

/**
 * মডাল খোলা থাকলে `true`। একইসাথে <html data-modal-open="true"> বসায়, যাতে
 * `.hide-when-modal` ক্লাসের যেকোনো ভাসমান বার (বাল্ক বার ইত্যাদি) CSS দিয়ে নিজে লুকায়।
 */
export function useAnyModalOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    let last = false;

    const sync = () => {
      frame = 0;
      const next = detectModalOpen();
      if (next === last) return;
      last = next;
      setOpen(next);
      if (next) document.documentElement.setAttribute('data-modal-open', 'true');
      else document.documentElement.removeAttribute('data-modal-open');
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    sync();
    const obs = new MutationObserver(schedule);
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'inert', 'open'],
    });
    window.addEventListener('resize', schedule);

    return () => {
      obs.disconnect();
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
      document.documentElement.removeAttribute('data-modal-open');
    };
  }, []);

  return open;
}
