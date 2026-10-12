# Mehediadmin — অডিট ফিক্স ডেলিভারি (ব্যাচ ১)

রিপো: `MehediVibeCoding/Mehediadmin`। নিচের ফাইলগুলো রিপোর তেমন ফোল্ডার-পাথেই বসাবে (একই
নামে ওভাররাইট করবে), শুধু `.env.example`-এ নতুন ভ্যারিয়েবলের **নাম** যোগ হয়েছে, কোনো আসল
মান নেই — আসল মান Vercel-এর Environment Variables-এ নিজে বসাতে হবে।

## কোন ফাইলে কোন আইডি ফিক্স হলো

| আইডি | কী ঠিক হলো | ফাইল |
|---|---|---|
| **A1** | লগইনে রেট-লিমিট (১০ মিনিটে ৫ বার) + Cloudflare Turnstile CAPTCHA + সফল লগইনে Telegram এলার্ট (সময়/ইমেইল/IP/শহর-দেশ/ডিভাইস) | `lib/limiter.ts` (নতুন), `lib/turnstile.ts` (নতুন), `lib/turnstileServer.ts` (নতুন), `lib/telegramAlert.ts` (নতুন), `lib/ipGeo.ts` (নতুন), `components/auth/TurnstileWidget.tsx` (নতুন), `app/actions/auth.ts`, `app/login/page.tsx` |
| **A2** | Q&A ও রিভিউ লিস্ট আগে ১,০০০ সারির পর নীরবে কাটত (নতুন উত্তরও বাদ পড়ত) — এখন ব্যাচে ব্যাচে সব সারি আনে | `lib/fetchAllRows.ts` (নতুন), `app/actions/product-qa.ts`, `app/actions/product-reviews.ts` |
| **A3** | অফার-পিকার ১,০০১তম প্রোডাক্টের পর বাকিগুলো দেখাতই না | `app/actions/products.ts` (`listProductsForPicker`) |
| **A4** | প্রতি প্রোডাক্ট/ক্যাটাগরি/হিরো-কার্ড/অফার সেভে লাইভ-সাইট ক্যাশ-রিফ্রেশ UI ব্লক করত (৪+৪ সে) — এখন ব্যাকগ্রাউন্ডে; ৪২৯ রেট-লিমিটেও এখন রিট্রাই হয় | `lib/revalidateVangcurCatalog.ts`, `app/actions/products.ts`, `app/actions/offers.ts`, `app/actions/categories.ts`, `app/actions/hero-cards.ts` |
| **A5** | `updateStock`-এ lost-update বাগ — অ্যাডমিনের এডিটের মাঝে গ্রাহকের অর্ডার স্টক কমালে অ্যাডমিনের সেভ সেটা চুপচাপ মুছে দিত (ওভারসেল ঝুঁকি) | `app/actions/products.ts` (`updateStock`) |
| **A6** | অর্ডার স্ট্যাটাস বদল আগে ৩টা আলাদা রাউন্ড-ট্রিপে হতো, রেস কন্ডিশনে স্টক ডাবল-কাউন্ট হতে পারত | `app/actions/orders.ts` + **DB মাইগ্রেশন** (নিচে দেখো) |
| **A9** | মৃত কোড `listOrders()` (কোথাও কল হতো না) সরানো হলো | `app/actions/orders.ts` |
| **A10** | CSV এক্সপোর্টে ফর্মুলা-ইনজেকশনের দ্বিতীয় স্তর (`=`/`+`/`-`/`@` দিয়ে শুরু হওয়া সেলে গার্ড) | `lib/csv.ts`, `app/api/export-orders/route.ts` |

## DB মাইগ্রেশন — সরাসরি Supabase-এ প্রয়োগ হয়েছে (কোনো ফাইল নেই)

- **`add_admin_transition_order_status`** (migration `20261011064402`) — নতুন ফাংশন
  `public.admin_transition_order_status(p_order_id, p_new_status, p_admin_email)`।
  অর্ডার রো `SELECT ... FOR UPDATE` দিয়ে লক করে, একই ট্রানজ্যাকশনে বিদ্যমান
  `restore_product_stock`/`decrement_product_stock` কল করে, তারপর status আপডেট করে।
  স্টক অপর্যাপ্ত হলে পুরো ট্রানজ্যাকশন rollback হয় (fail-closed)। Supabase-এ সরাসরি
  (BEGIN...ROLLBACK টেস্ট কুয়েরি দিয়ে, আসল ডেটা না ছুঁয়ে) যাচাই করা হয়েছে।
  **এটা ইতিমধ্যে Supabase প্রজেক্টে প্রয়োগ হয়ে গেছে — আলাদা করে কিছু করার দরকার নেই।**

## তোমার করণীয় (ডিপ্লয়ের আগে)

Vercel → Mehediadmin প্রজেক্ট → Environment Variables-এ এই ৪টা বসাও (না বসালেও সাইট ভাঙবে
না, শুধু CAPTCHA/এলার্ট বন্ধ থাকবে):

- `TELEGRAM_BOT_TOKEN` — Vangcur (মূল সাইট)-এর একই মান
- `TELEGRAM_CHAT_ID` — Vangcur-এর একই মান
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — Vangcur-এর Turnstile সাইটেই এডমিনের ডোমেইন যোগ করে একই কী
- `TURNSTILE_SECRET_KEY` — উপরেরটারই সিক্রেট

ঐচ্ছিক (না বসালে রেট-লিমিট ইনস্ট্যান্স-মেমোরি ফলব্যাকে চলবে, এখনকার ট্রাফিকে যথেষ্ট):
`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

## স্কিপ হয়েছে / এখনও বাকি

- **A7** (আপলোড বাটন) — owner নিশ্চিত করেছেন এটা আসল সমস্যা না (Cloudinary দিয়ে সরাসরি আপলোড করা হয়, অ্যাডমিনের নিজের আপলোড বাটন সব জায়গায় এখনো ব্যবহার করা হয়নি)।
- **A8** (প্রতি ক্লিকে ২টা Auth কল) — আসল পারফরম্যান্স সমস্যা, কিন্তু ফিক্স (JWT লোকাল-ভেরিফিকেশন, `getClaims()`) লগইন/অ্যাক্সেস-কন্ট্রোলের মূল গেট ছোঁয়, আর লাইভ ব্রাউজারে টেস্ট ছাড়া নিরাপদে করা যাচ্ছে না — তাই হাত দিইনি।
- **A11/A12** (ক্যাশ-স্টেলনেস টাইমিং, CSP-তে third-party ডোমেইন) — কোডের কমেন্টেই আগে থেকে ইচ্ছাকৃত ট্রেডঅফ হিসেবে ব্যাখ্যা করা আছে (owner-এর আগের সিদ্ধান্ত), তাই না জিজ্ঞেস করে বদলাইনি।
- **A13** (পোলিং ট্যাব-হিডেন চেক) — ইতিমধ্যে ঠিকভাবে করা আছে (`document.visibilityState` চেক দুই জায়গাতেই আছে), কিছু করার দরকার ছিল না।
- **A14** (দুই জায়গায় অ্যাডমিন-পরিচয়: env ইমেইল vs `profiles.is_admin`) — সত্যিকারের গ্যাপ, কিন্তু DB-তে চেক করে দেখেছি `profiles.is_admin = true` এখন শুধু `mehedivibecoding@gmail.com`-এর জন্য সেট আছে। এটাই যদি আসল `ADMIN_EMAIL` (Vercel env) না হয়, তাহলে এই ফিক্স করলে সরাসরি নিজেকেই লগইন থেকে লক-আউট করে ফেলার ঝুঁকি আছে — তাই নিশ্চিত হওয়ার আগে হাত দিইনি।

সব ফিক্সের পর `npx tsc --noEmit` → ০ এরর, `npx eslint` → ক্লিন (প্রতিটা কমিটে আলাদাভাবে চেক করা হয়েছে)।
