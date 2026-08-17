import Sidebar from '@/components/admin/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="min-h-screen flex-1 overflow-x-hidden px-6 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
