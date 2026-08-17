'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CategoryOption } from '@/lib/constants/categories';
import type { Product } from '@/types';
import { smartParse, SMART_PARSER_EXAMPLE } from '@/lib/smart-parser';
import { parsedToFormState } from '@/lib/product-form';
import ImageManager from '@/components/products/ImageManager';
import ProductModal from '@/components/products/ProductModal';

const STATUS_MESSAGES = ['তথ্য পড়ছি...', 'নাম ও দাম বের করছি...', 'Features ও Specs সাজাচ্ছি...', 'FAQ ও বর্ণনা গোছাচ্ছি...'];

export default function ParserPageClient({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(STATUS_MESSAGES[0]);
  const [error, setError] = useState('');
  const [modalState, setModalState] = useState<ReturnType<typeof parsedToFormState> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  async function handleParse() {
    const raw = text.trim();
    if (!raw) {
      alert('Master Input Box এ তথ্য দিন');
      return;
    }
    setError('');
    setLoading(true);
    let i = 0;
    setStatus(STATUS_MESSAGES[0]);
    intervalRef.current = setInterval(() => {
      if (i < STATUS_MESSAGES.length) setStatus(STATUS_MESSAGES[i++]);
    }, 600);

    await new Promise((r) => setTimeout(r, 2200));
    if (intervalRef.current) clearInterval(intervalRef.current);

    try {
      const parsed = smartParse(raw);
      const formState = parsedToFormState(parsed, images.filter(Boolean));
      setModalState(formState);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : 'অজানা এরর');
    }
  }

  function handleSaved(product: Product) {
    setModalState(null);
    router.push('/products');
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl text-ink">🤖 AI Product Planner</h1>
        <p className="mt-0.5 text-sm text-muted">প্রোডাক্টের তথ্য পেস্ট করুন — স্বয়ংক্রিয়ভাবে সব ফিল্ড পূরণ করে প্রোডাক্ট ফর্ম খুলবে</p>
      </div>

      <div className="mb-4 flex items-center gap-3.5 rounded-brand border border-[#4CAF50] bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] px-4.5 py-3.5">
        <span className="text-2xl">⚡</span>
        <div>
          <div className="text-sm font-bold text-[#1b5e20]">Smart Parser — কোনো API লাগবে না, সম্পূর্ণ বিনামূল্যে</div>
          <div className="mt-0.5 text-xs text-[#2e7d32]">আপনার দেওয়া তথ্য থেকে স্বয়ংক্রিয়ভাবে সব ফিল্ড পূরণ করে। ইন্টারনেট ছাড়াও কাজ করে।</div>
        </div>
      </div>

      <div className="mb-4 rounded-brand bg-brand-surface p-4 shadow-sh1">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-ink">📋 ধাপ ১ — প্রোডাক্টের তথ্য লিখুন</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setText(SMART_PARSER_EXAMPLE)}
              className="rounded-lg border border-border-base px-2.5 py-1.5 text-xs font-medium text-ink hover:border-brand-primary"
            >
              📝 উদাহরণ
            </button>
            <button
              type="button"
              onClick={() => setText('')}
              className="rounded-lg border border-border-base px-2.5 py-1.5 text-xs font-medium text-ink hover:border-brand-primary"
            >
              🗑️ মুছুন
            </button>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="এখানে প্রোডাক্টের সমস্ত তথ্য পেস্ট করুন..."
          className="min-h-[280px] w-full resize-y rounded-brand border border-border-base p-3.5 text-[13px] leading-relaxed"
        />
      </div>

      <div className="mb-4 rounded-brand bg-brand-surface p-4 shadow-sh1">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-ink">🖼️ ধাপ ২ — প্রোডাক্ট ছবি যোগ করুন</span>
        </div>
        <ImageManager images={images} onChange={setImages} />
      </div>

      <button
        type="button"
        onClick={handleParse}
        disabled={loading}
        className="mb-4 w-full rounded-brand bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] py-4 text-[15px] font-bold text-white transition-brand disabled:opacity-70"
      >
        {loading ? status : '⚡ Parse করুন — প্রোডাক্ট ফর্ম খুলবে, এডিট করে সেভ করুন'}
      </button>

      {loading && (
        <div className="rounded-brand bg-brand-surface p-12 text-center shadow-sh1">
          <div className="mx-auto mb-4.5 h-16 w-16 animate-spin rounded-full border-4 border-border-base border-t-[#4CAF50]" />
          <div className="mb-1.5 text-[15px] font-bold text-ink">তথ্য বিশ্লেষণ করছে...</div>
          <div className="text-xs text-muted">{status}</div>
        </div>
      )}

      {error && (
        <div className="rounded-brand border border-red-300 bg-red-50 p-7 text-center">
          <div className="mb-2.5 text-4xl">❌</div>
          <div className="mb-2 text-[15px] font-bold text-danger">Parse করতে সমস্যা হয়েছে</div>
          <div className="mb-4 text-sm text-muted">{error}</div>
          <button
            type="button"
            onClick={() => setError('')}
            className="rounded-brand border border-border-base px-4 py-2 text-sm font-medium text-ink"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      )}

      {modalState && (
        <ProductModal
          categories={categories}
          initialState={modalState}
          titleOverride="🤖 AI Parse — প্রোডাক্ট যোগ করুন"
          onClose={() => setModalState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
