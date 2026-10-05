interface Props {
  children: React.ReactNode;
  /** হেডিংয়ের নিচে ছোট ধূসর ব্যাখ্যা (ঐচ্ছিক) */
  hint?: React.ReactNode;
  className?: string;
}

// "ওপেন" সেকশন হেডিং — কোনো বক্স/আইকন/রেখা নেই: শুধু বড় স্কাই-ব্লু লেখা।
// অর্ডার ডিটেইল মোডাল ও প্রোডাক্ট মোডালসহ সব ফর্ম/ডিটেইল সেকশনে একই হেডিং স্টাইল।
export default function SectionHeading({ children, hint, className = '' }: Props) {
  return (
    <div className={`mb-3.5 ${className}`}>
      <div className="flex items-center gap-3">
        <h3 className="shrink-0 font-body text-[18px] font-black leading-tight tracking-tight text-brand-light">{children}</h3>
      </div>
      {hint && <p className="mt-1.5 font-body text-[11.5px] font-medium leading-snug text-muted">{hint}</p>}
    </div>
  );
}
