# Vangcur Admin — Master Roadmap
## (vanilla JS `admin.html` → Next.js 15 + TypeScript + Tailwind + SSR Auth — Full Rewrite)

(নতুন Claude চ্যাটে এই পুরো ফাইলটা paste করো)

---

## প্রেক্ষাপট

মূল ওয়েবসাইট (`vangcurweb`) Next.js migration ইতিমধ্যে অনেকদূর এগিয়েছে (Phase B পর্যন্ত সম্পূর্ণ)।
এখন সেই একই architecture, একই design system দিয়ে **Admin Panel**-কে vanilla JS থেকে Next.js-এ আনা হচ্ছে।

- **পুরনো admin repo:** `MehediVibeCoding/Vangcuradmin` (Private) — single-file `admin.html` (~7000 লাইন, ২১১টা function), live `vangcuradmin.vercel.app`। এই repo delete হচ্ছে না, reference হিসেবে থেকে যাবে।
- **নতুন admin repo:** `MehediVibeCoding/Mehediadmin` (Public)
- **নতুন Vercel project:** owner তৈরি করবে, নতুন লাইভ URL (সম্ভবত `mehediadmin.vercel.app` — Vercel-এর ডিফল্ট নামকরণ অনুযায়ী, deploy করার সময় নিশ্চিত হবে)
- **Database:** মূল সাইটের নতুন Supabase project-ই ব্যবহার হবে (একই DB, আলাদা কোনো নতুন Supabase project লাগবে না) — admin.html ইতিমধ্যে এই DB-এর সাথেই connected
- **Design system:** মূল সাইটের `DESIGN_SYSTEM.md`/`tailwind.config.ts` থেকে token হুবহু কপি (এই repo-র নিজস্ব `DESIGN_SYSTEM.md`-এ বিস্তারিত)

### পুরনো repo-তে যা fix হয়ে গেছে (এই migration শুরুর আগেই)

`admin.html`-এ দুইটা জিনিস client-side এ hardcoded ছিল (browser-এ "View Page Source" করলেই দেখা যেত, GitHub repo public/private-এর সাথে সম্পর্কহীনভাবে):

1. **`GOOGLE_SHEET_URL`** (Apps Script exec URL, auth ছাড়া open POST endpoint) — ✅ **সমাধান হয়ে গেছে**: browser এখন `/api/sync-sheet`-এ POST করে, আসল URL একটা নতুন serverless function-এর ভেতরে, `GOOGLE_SHEET_URL` Vercel env variable থেকে পড়া হয়। এই একই pattern নিচে Phase C-তে Next.js version-এ port হবে।
2. **`ADMIN_EMAIL`** — ⚠️ **ইচ্ছাকৃতভাবে এখনো ছোঁয়া হয়নি।** প্রথমে মনে করা হয়েছিল এটা শুধু সুবিধার জন্য (শর্টকাট username), কিন্তু কোড দেখে বোঝা গেছে এটা আসলে login-এর client-side authorization check হিসেবেও কাজ করে (কে admin panel access করতে পারবে তার whitelist)। শুধু delete করলে হয় security কমে যেত, নয়তো login ভেঙে যেত। **সঠিক সমাধান** — server-side middleware দিয়ে route-লেভেলে gate করা — নিচে Phase A.3-এ এই migration-এই করা হচ্ছে, তাই পুরনো repo-তে আলাদা patch করার দরকার নেই।

---

## আর্কিটেকচার সিদ্ধান্ত

- **Auth:** `@supabase/ssr` + httpOnly cookies, ঠিক মূল সাইটের `lib/supabase/client.ts`/`server.ts`/`middleware.ts` pattern অনুসরণ করে। পার্থক্য: admin-এ **সব route** (except `/login`) middleware দিয়ে গেট করা থাকবে — session না থাকলে বা session-এর email admin না হলে, কোনো admin JS/HTML browser-এ পৌঁছানোর *আগেই* সার্ভার থেকে `/login`-এ redirect হয়ে যাবে। এটাই পুরনো `ADMIN_EMAIL` client-side-exposure সমস্যার প্রকৃত সমাধান — vanilla SPA-তে এটা structurally সম্ভব ছিল না (পুরো ফাইল আগে browser-এ নামত, তারপর check হতো), Next.js SSR-এ সম্ভব।
- **Data access:** প্রতিটা module (Orders, Products, Settings, ...) নিজের client-side Supabase call না করে Next.js **Server Action**/Route Handler ব্যবহার করবে। এই server-side code `SUPABASE_SERVICE_ROLE_KEY` (server-only env var, কখনো `NEXT_PUBLIC_` prefix না, কখনো browser bundle-এ যাবে না) দিয়ে কাজ করবে — কারণ middleware-এ identity ইতিমধ্যে verify হয়ে গেছে, তাই প্রতিটা টেবিলের জন্য আলাদা fine-grained RLS policy বানানোর দরকার নেই (১৪টা module, ১০+ টেবিল জুড়ে RLS maintain করা বেশি ঝুঁকিপূর্ণ ও ভুলপ্রবণ — পুরনো repo-তেই একবার ভুল RLS/column-name bug হয়েছিল)। মূল সাইটের নিজস্ব roadmap-ও এই একই নীতি মেনে চলে ("Service Role Key কখনো GitHub-এ commit হবে না, শুধু Vercel Environment Variables-এ")।
- **Design:** কোনো নতুন color/spacing scale না — মূল সাইটের `tailwind.config.ts` টোকেন হুবহু reuse।
- **DevTools blocking:** মূল সাইটের roadmap-এর মতোই **বাদ** — trivially bypass হয়, legitimate user (owner নিজেই) বিরক্ত হয়, প্রকৃত security দেয় না।

---

## কাজের নিয়ম (Claude-এর ভূমিকা ও সীমা)

- **গুরুত্বপূর্ণ পরিবর্তনে নিজে থেকে কোনো সিদ্ধান্ত না নেওয়া** — কোনো ফিচার/logic/flow-এ উল্লেখযোগ্য পরিবর্তন (কিছু বাদ দেওয়া, ভিন্নভাবে ইমপ্লিমেন্ট করা, structure পুনর্গঠন) owner-এর স্পষ্ট অনুমতি ছাড়া করা যাবে না। অনুমান করে এগোনোর বদলে প্রশ্ন করে নিশ্চিত হয়ে নিতে হবে।
- **Design পরিবর্তনের নির্দেশ মেনে চলা** — owner মাঝে মধ্যে ডিজাইন পরিবর্তনের কথা বলবেন (এই ফাইলের `DESIGN_SYSTEM.md` টোকেনের বাইরে গিয়েও হতে পারে) — তখন সেই নির্দেশ অনুযায়ী কাজ করতে হবে।
- **Logic ১০০% বিশ্বস্তভাবে রূপান্তর** — এটা একটা critical admin system (অর্ডার, স্টক, পেমেন্ট-সম্পর্কিত ডাটা পরিচালনা করে) বলে legacy `admin.html`-এর প্রতিটা ফিচারের আসল behavior/logic হুবহু সঠিকভাবে port করতে হবে — "মোটামুটি একই রকম" বা আন্দাজে-করা ইমপ্লিমেন্টেশন গ্রহণযোগ্য না। নিশ্চিত না হলে legacy কোড আবার পড়ে verify করে নিতে হবে।
- **আর্কিটেকচারাল উন্নতির সাজেশন** — Next.js ব্যবহার হওয়ায় legacy vanilla JS-এর কিছু approach Next.js-এর নিজস্ব pattern (Server Component, Server Action, প্রয়োজনে অন্য কোনো লাইব্রেরি/টুল যা এই framework-এর সাথে ভালো যায়) দিয়ে আরও ভালোভাবে করা সম্ভব হতে পারে। এমন জায়গা চোখে পড়লে Claude সেটা owner-কে suggest করবে — কিন্তু নিজে থেকে বদলে দেবে না; suggest করার পর owner অনুমতি দিলেই implement করা হবে।

---

## Privacy & Key Rule (মূল সাইটের রুলের অনুরূপ, কঠোরভাবে মানতে হবে)

- পুরনো admin.html-এর কোনো URL/key **কপি-পেস্ট করে কোনো ফাইলে আবার লেখা যাবে না**, রেফারেন্স হিসেবেও না — শুধু ফাঁকা `process.env.VARIABLE_NAME`
- Claude কখনো কোনো actual key/secret চ্যাটে দেখাবে না বা চাইবে না
- সব secret শুধু Vercel Environment Variables-এ (owner নিজে বসাবে)
- `.gitignore` প্রথম ফাইল হিসেবে থাকবে, `.env*` কখনো commit হবে না
- কোনো ফাইলে migration/phase-history comment থাকবে না ("legacy-তে এটা ছিল" জাতীয় narration) — কোড শুধু কী করে সেটা বলবে, ইতিহাস না। এই roadmap ফাইলেই migration history থাকবে, actual app code-এ না।
- Claude প্রতিটা ফাইল দেওয়ার সময় বলবে **[NEW FILE]** বা **[REPLACE]**

---

## PHASE A — Foundation

1. Next.js 15 scaffold (App Router, TypeScript, Tailwind) — নতুন repo
2. `tsconfig.json`, `tailwind.config.ts` (মূল সাইট থেকে token হুবহু কপি), `postcss.config.js`
3. `types/index.ts` — কেন্দ্রীয় টাইপ: `Order`, `Product`, `StoreSettings`, `Category`, `Review`, `Offer`, `FAQItem`, `TrafficDay`, `Customer` ইত্যাদি (legacy `admin.html`-এর ডেটা শেপ অনুযায়ী)
4. `DESIGN_SYSTEM.md` — এই repo-র নিজস্ব ফাইল, মূল সাইটের token + admin-specific pattern (আলাদাভাবে দেওয়া হয়েছে)
5. `lib/supabase/client.ts`, `server.ts` — মূল সাইটের `@supabase/ssr` pattern হুবহু
6. `lib/security.ts` — মূল সাইট থেকে reuse (`sanitizeInput`, ইত্যাদি) — review/FAQ/header-copy-এর মতো text input field গুলোতে দরকার হবে

## PHASE A.3 — Auth Middleware (আগেভাগে করা হচ্ছে, কারণ এটাই ADMIN_EMAIL সমস্যার real fix)

1. `middleware.ts` — সব route match করবে `/login` ছাড়া
2. প্রতিটা request-এ SSR session check করবে; session না থাকলে বা `session.user.email !== process.env.ADMIN_EMAIL` হলে `/login`-এ redirect
3. `ADMIN_EMAIL` env var-এ কোনো `NEXT_PUBLIC_` prefix থাকবে না — browser কখনো এই মান পাবে না
4. `app/login/page.tsx` — email/password ফর্ম, `supabaseClient.auth.signInWithPassword` কল করবে, ভুল হলে generic error ("ভুল username বা password" — কোনো hint না)

## PHASE A.1 — Owner-এর External Setup Checklist

কোডিং শুরুর আগে/চলাকালীন owner-কে যা করতে হবে:

1. নতুন GitHub repo — `MehediVibeCoding/Mehediadmin` (Public)
2. নতুন Vercel project কানেক্ট করা, GitHub repo-র সাথে link
3. Vercel Environment Variables বসানো:
   - `NEXT_PUBLIC_SUPABASE_URL` — মূল সাইটে যেই মান আছে, একই
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — মূল সাইটে যেই মান আছে, একই
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard → Settings → API থেকে (নতুন, পুরনো admin.html কখনো এটা ব্যবহার করেনি, শুধু anon key + client-side gate দিয়ে চলত)
   - `ADMIN_EMAIL` — পুরনো repo-তে যে email ছিল, সেই একই মান, `NEXT_PUBLIC_` prefix ছাড়া
   - `GOOGLE_SHEET_URL` — পুরনো repo-র proxy-তে যে মান বসানো হয়েছে, একই
4. পুরনো repo (`Vangcuradmin`)-এর Vercel project-এও `GOOGLE_SHEET_URL` env var বসানো (proxy function সেখান থেকেই পড়ে) — এটা এই migration-এর অংশ না, কিন্তু এখনো বাকি থাকলে এখানে নোট রাখা হলো

## PHASE B — Module-by-Module Conversion

legacy `admin.html`-এ পাওয়া প্রতিটা module, priority অনুযায়ী ক্রম:

| ক্রম | Module | Legacy পেজ ID | মূল ফিচার |
|-----|--------|---------------|-----------|
| ১ | Dashboard | `page-dashboard` | Stat grid, revenue chart, low-stock alert, weather widget |
| ২ | Orders | `page-orders` | List, calendar range filter, bulk status update, CSV export, order detail modal, sound/browser notification |
| ৩ | Products | `page-products` | CRUD, image upload/crop, category assign, stock, drag-sort order, AI Parser (smart product data parsing) |
| ৪ | Customers | `page-customers` | Customer list |
| ৫ | Traffic/Analytics | `page-traffic` | Peak-hours chart, traffic trend chart, top-viewed products |
| ৬ | Profit | `page-profit` | Profit calculation + chart |
| ৭ | Design — Categories | `page-design-categories` | Category CRUD, ordering |
| ৮ | Design — Category Cards | `page-design-cath-cards` | Homepage category card visuals |
| ৯ | Design — Colors | `page-design-colors` | Brand color override (owner UI) |
| ১০ | Design — Logo | `page-design-logo` | Logo upload/switch |
| ১১ | Design — Header | `page-design-header` | Header copy/config |
| ১২ | Design — Footer | `page-design-footer` | Footer links/content |
| ১৩ | Offers | `page-offers-mgmt` | Discount campaign management |
| ১৪ | Review Gallery | `page-review-gallery` | Customer review CRUD |
| ১৫ | FAQ Settings | `page-faq-settings` | FAQ CRUD |
| ১৬ | Header Copy | `page-header-copy` | সাইট হেডারের টেক্সট |
| ১৭ | Settings | `page-settings`, `page-shipping-settings` | General + shipping config |
| ১৮ | Info Pages | `ipage-about`, `ipage-privacy`, `ipage-returns`, `ipage-terms` | Static page content editor |

**প্রতিটা module convert করার নিয়ম (মূল সাইটের Phase B rule-ই এখানেও):**
1. `.js` state/render logic → `.tsx` component + proper TS types
2. Client-side direct Supabase call → Server Action (`app/actions/<module>.ts`)-এ সরানো
3. Inline style/class → Tailwind utility, exact legacy visual output বজায় রেখে
4. `npm run build` — TS error check
5. Legacy `admin.html`-এর সাথে visual diff verify

## PHASE C — Server Actions & API Routes

1. `app/actions/orders.ts`, `products.ts`, `settings.ts`, `design.ts`, ... — প্রতিটা module-এর জন্য, `SUPABASE_SERVICE_ROLE_KEY` দিয়ে
2. `app/api/sync-sheet/route.ts` — পুরনো repo-তে বানানো `api/sync-sheet.js` proxy-র Next.js version (একই logic: browser থেকে POST নেয়, server-side `GOOGLE_SHEET_URL` env var দিয়ে Google Apps Script-এ forward করে)
3. Image upload — legacy-তে যেভাবে হতো (Cloudinary/Supabase storage, যেটাই legacy কোডে পাওয়া যায় সেটা অনুসরণ করে) সার্ভার-সাইড রুটে সরানো

## PHASE D — Polish & Documentation

1. `ARCHITECTURE.md` — module list, data flow, auth flow diagram (text)
2. `MIGRATION_NOTES.md` — legacy `admin.html`-এর সাথে পার্থক্য, কোনো ফিচার bypass/deprioritize হলে তার কারণ
3. Notification sound/browser-notification — legacy behavior হুবহু বজায়

---

## প্রতিটা session-এ Claude-এর কাজের নিয়ম

1. এই roadmap পড়ো, GitHub রেপো (`Mehediadmin`, public) clone করো
2. নিচের Progress Tracker দেখো — কোন অংশ শেষ
3. পরবর্তী অসম্পূর্ণ অংশ ধরে কাজ করো, প্রতিটা component-এর পর build test
4. কাজ শেষে Progress Tracker আপডেট করো

---

## Progress Tracker

| Phase | কাজ | অবস্থা |
|-------|-----|--------|
| — | পুরনো repo fix: `GOOGLE_SHEET_URL` → `/api/sync-sheet` proxy | ✅ সম্পূর্ণ |
| — | পুরনো repo: `ADMIN_EMAIL` (ইচ্ছাকৃতভাবে অপরিবর্তিত, নিচে Phase A.3-এ প্রকৃত সমাধান) | 🟡 জানা আছে, নতুন repo-তে সমাধান হয়ে গেছে |
| A | Foundation (tsconfig, Tailwind config token কপি, types, DESIGN_SYSTEM.md, ssr client setup) | ✅ সম্পূর্ণ |
| A.3 | Auth middleware (route-level SSR gate) | ✅ সম্পূর্ণ |
| A.1 | Owner-এর External Setup Checklist (নতুন repo, Vercel project, env vars) | 🟡 owner নিজে confirm করবে |
| B | Module-by-module conversion (১৮টা module, উপরের টেবিল) | 🔵 চলছে — নিচে per-module breakdown |
| B-১ | Dashboard | ✅ সম্পূর্ণ |
| B-২ | Orders | ✅ সম্পূর্ণ (list, search, status filter, calendar range filter, ১৪/page pagination, bulk status update, CSV export all/range, order detail modal, single status change + sound, realtime new-order sound/browser-notification/toast/pending badge) |
| B-৩ | Products | ✅ সম্পূর্ণ (AI Parser সহ) |
| B-৪ | Customers | ✅ সম্পূর্ণ (কোনো আলাদা `customers` টেবিল নেই — legacy-র মতোই `orders` থেকে ফোন/নাম দিয়ে গ্রুপ করে দেখানো হয়, এখন সার্ভার-সাইড Server Action-এ; Dashboard-এর "কাস্টমার" stat card-ও এখন `/customers`-এ লিংক করে) |
| B-৫ থেকে B-১৮ | Traffic, Profit, Design pages, Offers, Review Gallery, FAQ, Header Copy, Settings, Info Pages | ⏳ বাকি |
| C | Server Actions & API routes (`sync-sheet` proxy সহ) | ⏳ বাকি — Orders-এর "confirmed" স্ট্যাটাসে Google Sheet sync call এখনো wire করা হয়নি, TODO কমেন্ট রাখা আছে `app/actions/orders.ts`-এ |
| D | Documentation (ARCHITECTURE.md, MIGRATION_NOTES.md) | ⏳ বাকি |

---

## Owner-এর কাজ (প্রতিটা phase শেষে)

- ZIP/ফাইল download করে GitHub-এ upload
- Vercel-এ build সফল হয়েছে কিনা দেখা
- সাইট visually legacy admin panel-এর মতোই আছে কিনা check করা
- পরের phase-এর জন্য "চালিয়ে যাও" বলা

## গুরুত্বপূর্ণ নোট

- Database schema বদলাচ্ছে না — মূল সাইটের একই Supabase project reuse হচ্ছে
- Phase B সবচেয়ে বড় ধাপ — module ধরে ধরে, ধীরে করা হবে
- প্রতিটা Phase মোটামুটি independent — কোনোটা আটকে থাকলে অন্যটা এগোনো যায়
