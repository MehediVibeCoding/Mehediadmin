import Sidebar from '@/components/admin/Sidebar';
import { ToastProvider } from '@/components/admin/Toast';
import { OrdersRealtimeProvider } from '@/components/admin/OrdersRealtimeProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <OrdersRealtimeProvider>
        <div className="flex flex-col md:flex-row">
          <Sidebar />
          <main className="min-h-screen flex-1 overflow-x-hidden px-3 pb-28 pt-4 md:px-8 md:py-8 md:pb-8">
            {children}
          </main>
        </div>
      </OrdersRealtimeProvider>
    </ToastProvider>
  );
}
