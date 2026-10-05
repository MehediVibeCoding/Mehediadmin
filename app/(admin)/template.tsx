// প্রতিটি পেজ বদলে হালকা ফেড-ইন (শুধু opacity — লেআউট শিফট নেই)
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-fade">{children}</div>;
}
