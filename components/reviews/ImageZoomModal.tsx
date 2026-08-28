'use client';

export default function ImageZoomModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[110] flex cursor-zoom-out items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div className="relative max-h-[90vh] max-w-[90vw]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="রিভিউ ছবি" className="block max-h-[90vh] max-w-[90vw] rounded-xl" />
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-3.5 -top-3.5 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-base shadow-sh2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
