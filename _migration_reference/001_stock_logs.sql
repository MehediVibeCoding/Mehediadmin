-- ══════════════════════════════════════════════════════════════
--  stock_logs — স্টক পরিবর্তনের অডিট ট্রেইল
-- ══════════════════════════════════════════════════════════════
-- ⚠️ এই মাইগ্রেশন ইতিমধ্যে আপনার Supabase প্রজেক্টে (mehedivibecoding@gmail.com's
-- Project, ref: dlzgfgcqabsawhmekcbg) সরাসরি প্রয়োগ করা হয়েছে Claude-এর
-- Supabase সংযোগ দিয়ে — এটা আবার চালানোর দরকার নেই। এই ফাইলটা শুধু
-- রেকর্ড/রেফারেন্সের জন্য রাখা হলো (ঠিক কী বদলেছে তা দেখার জন্য)।
--
-- কে/কখন/কেন স্টক বদলালো তার ইতিহাস রাখে: অ্যাডমিন reject/cancel করলে
-- স্টক ফেরত, রি-কনফার্ম করলে আবার কমা, storefront checkout করলে কমা,
-- বা অ্যাডমিন সরাসরি স্টক সংখ্যা এডিট করলে — সবকিছুর লগ এখানে জমা হয়।

create table if not exists public.stock_logs (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.custom_products(id) on delete cascade,
  change_qty integer not null,              -- ধনাত্মক = স্টক বৃদ্ধি, ঋণাত্মক = স্টক হ্রাস
  reason text not null,                     -- order_status:rejected, order_status_bulk:cancelled, manual_admin_edit, checkout_or_unspecified...
  changed_by text,                          -- অ্যাডমিন ইমেইল, checkout/system কল হলে NULL
  created_at timestamptz not null default now()
);

create index if not exists stock_logs_product_id_idx on public.stock_logs (product_id, created_at desc);
create index if not exists stock_logs_created_at_idx on public.stock_logs (created_at desc);

alter table public.stock_logs enable row level security;

drop policy if exists "service role full access" on public.stock_logs;
create policy "service role full access" on public.stock_logs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- decrement_product_stock ও restore_product_stock — এখন p_reason/p_changed_by
-- (দুটোই optional, default আছে — তাই storefront/checkout.ts আগের মতো ১-আর্গুমেন্ট
-- কল করলেও ভাঙবে না) নিয়ে প্রতিটা সফল stock পরিবর্তনে stock_logs-এ লগ করে।
-- পুরো সংজ্ঞা দেখতে চাইলে Supabase Dashboard → Database → Functions-এ দেখুন,
-- অথবা admin repo-র app/actions/orders.ts-এর কমেন্টে সংক্ষিপ্ত বিবরণ আছে।

grant execute on function public.decrement_product_stock(jsonb, text, text) to anon, authenticated, service_role;
grant execute on function public.restore_product_stock(jsonb, text, text) to anon, authenticated, service_role;
