import Link from 'next/link';

export default function QuickActions() {
  return (
    <div className="rounded-brand bg-brand-surface p-5 shadow-sh1">
      <div className="mb-4 text-sm font-bold text-ink">দ্রুত কাজ</div>
      <div className="flex flex-col gap-2">
        <Link
          href="/products"
          className="flex items-center justify-center rounded-brand bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90"
        >
          + নতুন প্রোডাক্ট
        </Link>

        {/* CSV export ও পেন্ডিং অর্ডার শর্টকাট Module ২ (Orders) তৈরি হলে সক্রিয় হবে */}
        <button
          type="button"
          disabled
          title="শীঘ্রই আসছে"
          className="flex cursor-not-allowed items-center justify-center rounded-brand border border-border-base px-4 py-2.5 text-sm font-semibold text-muted opacity-50"
        >
          📊 CSV Export
        </button>
        <button
          type="button"
          disabled
          title="শীঘ্রই আসছে"
          className="flex cursor-not-allowed items-center justify-center rounded-brand border border-border-base px-4 py-2.5 text-sm font-semibold text-muted opacity-50"
        >
          📦 পেন্ডিং অর্ডার
        </button>
      </div>
    </div>
  );
}
