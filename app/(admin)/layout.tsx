import Sidebar from '@/components/admin/Sidebar';
import { ToastProvider } from '@/components/admin/Toast';
import { OrdersRealtimeProvider } from '@/components/admin/OrdersRealtimeProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <OrdersRealtimeProvider>
        <div className="flex">
          <Sidebar />
          <main className="min-h-screen flex-1 overflow-x-hidden px-6 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </OrdersRealtimeProvider>
    </ToastProvider>
  );
}
