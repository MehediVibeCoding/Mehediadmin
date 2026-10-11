-- ফাইল: _migration_reference/002_product_collections.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- প্রোডাক্টে "কালেকশন" (gift / premium / unique / cute) রাখার জন্য নতুন কলাম।
--
-- 👉 কোড ডিপ্লয়ের আগে Supabase → SQL Editor-এ এটা একবার চালান।
-- নিরাপদ: শুধু একটা নতুন কলাম + ইনডেক্স যোগ হয়। কোনো পুরনো ডেটা বদলায় না বা মোছে না,
-- আর সব পুরনো প্রোডাক্টে ফাঁকা ({}) থাকে। বারবার চালালেও সমস্যা নেই (IF NOT EXISTS)।
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.custom_products
  add column if not exists collections text[] not null default '{}';

comment on column public.custom_products.collections is
  'কালেকশন id লিস্ট (gift / premium / unique / cute) — হোম পেজের কালেকশন কার্ড ও /collection/<id> পেজের জন্য। ক্যাটাগরি (cat/cats) থেকে সম্পূর্ণ আলাদা।';

-- /collection/<id> পেজে "এই id আছে এমন প্রোডাক্ট" দ্রুত খোঁজার জন্য
create index if not exists custom_products_collections_gin
  on public.custom_products using gin (collections);

-- ── রোলব্যাক (দরকার হলে) ──────────────────────────────────────────────────────
-- drop index if exists public.custom_products_collections_gin;
-- alter table public.custom_products drop column if exists collections;
