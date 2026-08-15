# Mehediadmin

Vangcur Admin Panel — legacy vanilla JS `admin.html` থেকে Next.js 15 (App Router,
TypeScript, Tailwind) এ রূপান্তরিত হচ্ছে। পুরো প্ল্যান `ADMIN_MASTER_ROADMAP.md`-এ।

## Phase A (এই commit-এ যা আছে)

- Next.js 15 + TypeScript + Tailwind scaffold
- `@supabase/ssr` দিয়ে SSR auth
- `middleware.ts` — সব route (`/login` ছাড়া) server-side এ gate করা,
  শুধু `ADMIN_EMAIL` env var-এর সাথে মিলে গেলেই ঢুকতে পারবে
- Login page + logout server action
- Protected dashboard placeholder (Phase B-তে আসল UI বসবে)

## Setup

Vercel Environment Variables (`.env.example` দেখুন):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `GOOGLE_SHEET_URL`
