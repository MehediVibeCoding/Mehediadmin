// Vangcur Gadgets-এর নিজস্ব লোগো — সাইডবার, মোবাইল ড্রয়ার ও লগইন পেজে একই ফাইল।
// public/vangcur-logo.png = পুরো লোগো (V + Vangcur + gadgets), ট্রান্সপারেন্ট ব্যাকগ্রাউন্ড।
// public/vangcur-mark.png = শুধু "V" মার্ক (সাইডবার ছোট থাকা অবস্থায়)।
// width/height দেওয়া আছে যাতে ছবি লোড হওয়ার সময় লেআউট না নড়ে।

interface Props {
  className?: string;
  priority?: boolean;
}

export function BrandLogo({ className = '', priority = false }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/vangcur-logo.png"
      alt="Vangcur Gadgets"
      width={560}
      height={197}
      draggable={false}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={`block select-none ${className}`}
    />
  );
}

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/vangcur-mark.png"
      alt="Vangcur"
      width={144}
      height={108}
      draggable={false}
      decoding="async"
      className={`block select-none ${className}`}
    />
  );
}
