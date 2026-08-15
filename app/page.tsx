import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/actions/auth';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-brand bg-brand-surface p-8 shadow-sh2">
        <h1 className="mb-2 font-display text-2xl text-brand-primary">
          Vangcur Admin
        </h1>
        <p className="mb-6 text-muted">
          লগইন সফল — {user?.email}। এখান থেকে Phase B-তে module-ভিত্তিক
          (Dashboard, Orders, Products, ...) UI বসানো হবে।
        </p>

        <form action={logout}>
          <button
            type="submit"
            className="rounded-brand border border-border-base px-4 py-2 text-sm font-medium text-ink transition-brand hover:border-brand-primary"
          >
            লগআউট
          </button>
        </form>
      </div>
    </div>
  );
}
