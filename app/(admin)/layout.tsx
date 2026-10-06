import Sidebar from '@/components/admin/Sidebar';
import TopProgressBar from '@/components/admin/TopProgressBar';
import { ToastProvider } from '@/components/admin/Toast';
import { OrdersRealtimeProvider } from '@/components/admin/OrdersRealtimeProvider';
import CatalogSyncBanner from '@/components/admin/CatalogSyncBanner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <OrdersRealtimeProvider>
        <TopProgressBar />
        <div className="relative flex min-h-screen w-full flex-col md:flex-row">
          <Sidebar />
          <main
            className="min-w-0 flex-1 overflow-x-hidden px-3.5 pt-3 sm:px-5 md:px-8 md:pt-6 md:pb-8 xl:px-10"
            style={{
              paddingBottom: 'calc(130px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div className="mx-auto w-full max-w-[1520px]">
              <CatalogSyncBanner />
              {children}
            </div>
          </main>
        </div>
      </OrdersRealtimeProvider>
    </ToastProvider>
  );
}
