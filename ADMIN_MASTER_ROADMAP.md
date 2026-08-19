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
| ৯ | ~~Design — Colors~~ | `page-design-colors` | ❌ **স্কোপ থেকে বাদ (owner সিদ্ধান্ত)** — legacy-তেই অকার্যকর mockup ছিল, নিচে সেশন নোট দেখুন |
| ১০ | ~~Design — Logo~~ | `page-design-logo` | ❌ **স্কোপ থেকে বাদ (owner সিদ্ধান্ত)** |
| ১১ | ~~Design — Header~~ | `page-design-header` | ❌ **স্কোপ থেকে বাদ (owner সিদ্ধান্ত)** — legacy-তেই অকার্যকর mockup (Module ৯-এর মতোই), নিচে সেশন নোট দেখুন |
| ১২ | ~~Design — Footer~~ | `page-design-footer` | ❌ **স্কোপ থেকে বাদ (owner সিদ্ধান্ত)** |
| ১৩ | Offers | `page-offers-mgmt` | Discount campaign management |
| ১৪ | Review Gallery | `page-review-gallery` | Customer review CRUD |
| ১৫ | ~~FAQ Settings~~ | `page-faq-settings` | ❌ **স্কোপ থেকে বাদ (owner সিদ্ধান্ত)** |
| ১৬ | Header Copy | `page-header-copy` | সাইট হেডারের টেক্সট — ⏸️ আপাতত স্কিপ (owner সিদ্ধান্ত), real/কার্যকর ফিচার, ভবিষ্যতে করা যাবে |
| ১৭ | ~~Settings~~ | `page-settings`, `page-shipping-settings` | ❌ **স্কোপ থেকে বাদ (owner সিদ্ধান্ত)** — General + shipping config |
| ১৮ | Info Pages | `ipage-about`, `ipage-privacy`, `ipage-returns`, `ipage-terms` | Static page content editor — ⏸️ আপাতত স্কিপ (owner সিদ্ধান্ত), real/কার্যকর ফিচার, ভবিষ্যতে করা যাবে |

**নোট (owner সিদ্ধান্ত, দেখুন Progress Tracker-এর পরের সেশন নোট):** Module ৯, ১০, ১১, ১২, ১৫, ১৭ — এই ছয়টা মডিউল সম্পূর্ণ স্কোপ থেকে বাদ দেওয়া হয়েছে, বানানো হবে না (১১ এই সেশনে যোগ হলো — legacy-তেই অকার্যকর mockup বলে)। Sidebar থেকেও সংশ্লিষ্ট নেভ আইটেম মুছে ফেলা হয়েছে (আগে "শীঘ্রই আসছে" disabled অবস্থায় ছিল)। Module ১৬ (Header Copy) ও ১৮ (Info Pages) real/কার্যকর ফিচার — এই সেশনে owner "আপাতত বানানোর দরকার নেই" বলেছেন (Phase C আগে করার জন্য), স্কোপ থেকে বাদ না — ভবিষ্যতে চাইলে আবার শুরু করা যাবে।

**বোনাস আবিষ্কার (এই সেশনে):** legacy `page-design-footer`-এর ভেতর একটা "📞 যোগাযোগ তথ্য" কার্ড আছে (ফোন/WhatsApp/bKash/Messenger/Email/Facebook/ঠিকানা, `saveContactInfo()`) যেটা এই roadmap-এর কোনো module-এ কখনো লেখাই হয়নি। owner সিদ্ধান্ত: এটাও লাগবে না, স্কিপ।

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
| B | Module-by-module conversion (মূলত ১৮টা module ছিল, ৫টা owner সিদ্ধান্তে বাদ — কার্যত ১৩টা, উপরের টেবিল) | 🔵 চলছে — নিচে per-module breakdown |
| B-১ | Dashboard | ✅ সম্পূর্ণ |
| B-২ | Orders | ✅ সম্পূর্ণ (list, search, status filter, calendar range filter, ১৪/page pagination, bulk status update, CSV export all/range, order detail modal, single status change + sound, realtime new-order sound/browser-notification/toast/pending badge) |
| B-৩ | Products | ✅ সম্পূর্ণ (AI Parser সহ) |
| B-৪ | Customers | ✅ সম্পূর্ণ (কোনো আলাদা `customers` টেবিল নেই — legacy-র মতোই `orders` থেকে ফোন/নাম দিয়ে গ্রুপ করে দেখানো হয়, এখন সার্ভার-সাইড Server Action-এ; Dashboard-এর "কাস্টমার" stat card-ও এখন `/customers`-এ লিংক করে) |
| B-৫ | Traffic/Analytics | ✅ সম্পূর্ণ (৪টা stat card, দিন-টেবিল, ভিজিটর ট্রেন্ড চার্ট (hourly/daily), পিক-আওয়ার চার্ট, top-viewed products (৩ স্টেট: ট্র্যাকিং-নেই/খালি/ডাটা), ৭ দিন ডিফল্ট রেঞ্জ + ৮৯ দিন পর্যন্ত ক্যালেন্ডার, রিফ্রেশ; Dashboard-এর "আজকের ভিজিটর" card-ও `/traffic`-এ লিংক করে) |
| B-৬ | Profit | ✅ সম্পূর্ণ (৪টা stat card — নিট প্রফিট/রেভিনিউ/অর্ডার সংখ্যা/গড় প্রফিট, দিন-অনুযায়ী প্রফিট চার্ট, দিন-টেবিল, ৭ দিন ডিফল্ট রেঞ্জ + ৩৬৪ দিন পর্যন্ত ক্যালেন্ডার, রিফ্রেশ; Dashboard-এর "নিট প্রফিট" stat card-ও এখন `/profit`-এ লিংক করে; চার্টের রঙ DESIGN_SYSTEM.md-এর নিয়ম অনুযায়ী brand-primary — legacy-র green থেকে ইচ্ছাকৃত পরিবর্তন, নিচে নোট দেখুন) |
| B-৭ | Design — Categories | ✅ সম্পূর্ণ (list + drag-reorder (desktop drag ও mobile touch), add/edit/delete, প্রতি ক্যাটাগরিতে product count, "+ প্রোডাক্ট" বাটন → Products পেজে গিয়ে ক্যাটাগরি প্রি-সিলেক্ট করে অ্যাড-মোডাল অটো-ওপেন করে (`?openAdd=<catId>`); কোনো আলাদা টেবিল নেই, `store_settings.vc_categories`-এই সেভ হয়, না থাকলে `DEFAULT_CATEGORIES` fallback — এটা Products module থেকেই আগে read-only পড়া হতো, এখন CRUD যোগ হলো) |
| B-৮ | Design — Category Cards (হিরো সেকশন কার্ড) | ✅ সম্পূর্ণ (গ্রিড ভিউ + এডিটর মোডাল — ছবি URL/আপলোড/প্রিভিউ, বাটন টেক্সট, ক্যাটাগরি লিংক, লাইভ প্রিভিউ; add/edit/delete + "ডিফল্টে রিসেট" (১৩টা ডিফল্ট কার্ড); `store_settings.vc_cath_cards`-এ সেভ হয়; সর্বোচ্চ ১৩টা কার্ড লিমিট UI-তেই আটকানো হয়েছে, নিচে নোট দেখুন) |
| B-৯ | ~~Design — Colors~~ | ❌ **স্কোপ থেকে বাদ** — owner সিদ্ধান্ত, নিচে সেশন নোট দেখুন |
| B-১০ | ~~Design — Logo~~ | ❌ **স্কোপ থেকে বাদ** — owner সিদ্ধান্ত |
| B-১১ | ~~Design — Header~~ | ❌ **স্কোপ থেকে বাদ** — owner সিদ্ধান্ত (এই সেশনে): legacy-তেই অকার্যকর mockup পাওয়া গেছে (Module ৯-এর মতোই), নিচে সেশন নোট দেখুন |
| B-১২ | ~~Design — Footer~~ | ❌ **স্কোপ থেকে বাদ** — owner সিদ্ধান্ত |
| B-১৩ | Offers Popup | ✅ সম্পূর্ণ (৩টা মডেল — টেক্সট নোটিশ/ব্যানার ইমেজ/হট প্রোডাক্ট প্রোমোশন; pill বাটন → এডিটর মোডাল, ৩-কলাম লাইভ প্রিভিউ গ্রিড, প্রতিটায় toggle switch — একবারে একটাই মডেল লাইভ থাকতে পারে, চালু করলে বাকি দুইটা অটো বন্ধ; `store_settings.vc_offer_popup`-এ সেভ হয়; মডেল ৩-এর প্রোডাক্ট ড্রপডাউন `custom_products` থেকে) |
| B-১৪ | Review Gallery | ✅ সম্পূর্ণ (গ্রিড ভিউ, ছবি URL/আপলোড + প্রিভিউ, add/edit/delete, ক্লিক করলে ফুল-স্ক্রিন zoom প্রিভিউ; `customer_reviews` টেবিলে সেভ হয়, শুধু `image_url` কলাম touch করা হয় — টেবিলে অন্য কলাম থাকলেও admin সেগুলো ছোঁয় না, নিচে নোট দেখুন) |
| B-১৫ | ~~FAQ Settings~~ | ❌ **স্কোপ থেকে বাদ** — owner সিদ্ধান্ত |
| B-১৬ | ~~Header Copy~~ | ⏸️ **আপাতত স্কিপ** — owner সিদ্ধান্ত (এই সেশনে), ভবিষ্যতে চাইলে আবার শুরু করা যাবে |
| B-১৭ | ~~Settings (General + Shipping)~~ | ❌ **স্কোপ থেকে বাদ** — owner সিদ্ধান্ত |
| B-১৮ | ~~Info Pages~~ | ⏸️ **আপাতত স্কিপ** — owner সিদ্ধান্ত (এই সেশনে), ভবিষ্যতে চাইলে আবার শুরু করা যাবে |
| C | Server Actions & API routes | 🔵 চলছে — Orders "confirmed" sync-sheet ✅ সম্পূর্ণ (নিচে সেশন নোট), বাকি item গুলো (image upload আগেই B-৮/B-১৪-এ হয়ে গেছে) মূলত সম্পূর্ণ |
| D | Documentation (ARCHITECTURE.md, MIGRATION_NOTES.md) | ⏳ বাকি |

### সেশন নোট — Module ৭ (Design — Categories)

legacy `admin.html`-এর `#page-design-categories` (`getCats`/`saveCats`/`renderCategoryList`/`addNewCategory`/`editCategory`/`saveCategoryEdit`/`deleteCategory`) সম্পূর্ণ পড়ে port করা হলো। বিদ্যমান কনভেনশন অনুসরণ করা হয়েছে (Products/Orders module যেভাবে গঠিত — `app/actions/<module>.ts`, `components/<module>/`, `useToast()` from `components/admin/Toast.tsx`, `window.confirm()` delete pattern, `store_settings` upsert+fallback pattern)।

- **[REPLACE]** `app/actions/categories.ts` — আগে শুধু `getCategories()` ছিল (read-only, Products dropdown-এর জন্য), এখন `addCategory`/`updateCategory`/`deleteCategory`/`reorderCategories` যোগ হলো
- **[NEW FILE]** `app/(admin)/design/categories/page.tsx` — categories + products fetch করে product count হিসাব করে
- **[NEW FILE]** `components/design/CategoriesPageClient.tsx` — drag-reorder list, add/edit ফর্ম (modal), delete
- **[REPLACE]** `app/(admin)/products/ProductsPageClient.tsx` — `?openAdd=<catId>` query param সাপোর্ট যোগ হলো (Categories পেজের "+ প্রোডাক্ট" বাটন থেকে ক্যাটাগরি প্রি-সিলেক্ট করে অ্যাড-মোডাল খোলার জন্য) — ছোট, additive পরিবর্তন, বাকি কম্পোনেন্ট অপরিবর্তিত
- **[REPLACE]** `components/admin/Sidebar.tsx` — `/design/categories` নেভ আইটেম `enabled: false` থেকে `true` করা হলো
- `npx tsc --noEmit` ও `next build` — ক্লিন

**একটা ছোট, ইচ্ছাকৃত পার্থক্য:** legacy-তে "+ প্রোডাক্ট" বাটন ক্লিক করলে একই পেজে (SPA) মডাল খুলত। Next.js-এ এটা এখন Products পেজে নেভিগেট করে (route আলাদা), কিন্তু ফলাফল একই — ক্যাটাগরি প্রি-সিলেক্ট করা অ্যাড-মোডাল খোলে। এটা এই migration-এর framework-স্বাভাবিক পরিবর্তন (routing-based), কোনো ফিচার বাদ পড়েনি।

### সেশন নোট — Module ৮ (Design — Category Cards / হিরো সেকশন কার্ড)

legacy `admin.html`-এর `#page-design-cath-cards` (`getCathCards`/`saveCathCardsData`/`renderCathCardGrid`/`openCathCardDrawer`/`saveCathCardNew`/`deleteCathCardNew`/`resetCathCardsToDefault`/`handleCathFile`) সম্পূর্ণ পড়ে port করা হলো।

- **[NEW FILE]** `lib/constants/heroCards.ts` — `DEFAULT_HERO_CARDS` (legacy `DEFAULT_CATH_CARDS` থেকে হুবহু, ১৩টা), `HeroCard` টাইপ, `HERO_CARDS_MAX`
- **[NEW FILE]** `app/actions/hero-cards.ts` — `getHeroCards`/`addHeroCard`/`updateHeroCard`/`deleteHeroCard`/`resetHeroCardsToDefault`/`uploadHeroCardImage`
- **[NEW FILE]** `app/(admin)/design/hero-cards/page.tsx`
- **[NEW FILE]** `components/design/HeroCardsPageClient.tsx` — গ্রিড + এডিটর মোডাল
- **[REPLACE]** `components/admin/Sidebar.tsx` — `/design/hero-cards` নেভ আইটেম `enabled: false` থেকে `true`
- `npx tsc --noEmit` ও `next build` — ক্লিন

**দুটো ইচ্ছাকৃত পার্থক্য (owner-কে জানানো দরকার):**
1. **ছবি আপলোড: base64 থেকে আসল Storage upload** — legacy `handleCathFile()` ছবি সরাসরি base64 বানিয়ে `store_settings` JSON-এর ভেতরেই বসিয়ে দিত (প্রতিটা কার্ডের ছবি পুরো টেবিল রো-কে ভারী করে তুলত)। এখানে Products module-এর মতোই আসল Supabase Storage-এ আপলোড হয় (bucket `product-images` পুনর্ব্যবহার, নতুন bucket বানানো হয়নি, path শুধু `hero-cards/...` আলাদা) — `store_settings`-এ শুধু ছোট URL string থাকে। এটা bug ফিক্সের মতো, ফিচার পাল্টায়নি (ব্যবহারকারীর জন্য URL অথবা আপলোড দুটো অপশনই আগের মতোই আছে)।
2. **১৩ কার্ডের সীমা এখন UI-তেই আটকানো** — legacy-তে ১৪তম কার্ড যোগ করা যেত, কিন্তু পরের বার পেজ লোডে সেটা silently ট্রিম হয়ে হারিয়ে যেত (কারণ মূল সাইটে ফিক্সড ১৩টা স্লট)। এখানে "+ নতুন কার্ড" বাটনে ১৩ নম্বরে পৌঁছালে স্পষ্ট বার্তা দেখানো হয় ("আগে একটা মুছুন"), যাতে কেউ silently কার্ড না হারায়। read-side safety-net trim-ও রাখা হয়েছে (কেউ ম্যানুয়ালি DB-তে ১৩+ ঢুকিয়ে দিলে)।

### সেশন নোট — Module ৯ স্কিপ + স্কোপ থেকে ৫টা মডিউল বাদ (owner সিদ্ধান্ত)

Module ৭/৮ merge করার পর owner-কে জিজ্ঞেস করা হয়েছিল Module ৯ (Design — Colors) নিয়ে, কারণ legacy `#page-design-colors` (লাইন ২২৭১-২৩০৪) পড়ে দেখা গেছে এটা আসলে অকার্যকর mockup: কালার পিকার/ফন্ট dropdown আছে কিন্তু কোনো save handler নেই, আর পেজেই লেখা আছে "রঙ ও ফন্ট পরিবর্তন করতে এখন index.html এর CSS ভেরিয়েবল সরাসরি এডিট করতে হবে। ভবিষ্যতে এটি স্বয়ংক্রিয় হবে।" — অর্থাৎ ডেভেলপার নিজেই future-placeholder হিসেবে রেখেছিলেন, কখনো backend-এর সাথে connect হয়নি।

owner সিদ্ধান্ত নিয়েছেন:
- Module ৯ (Colors) সম্পূর্ণ স্কিপ — বানানো হবে না
- আরও ৪টা মডিউল সম্পূর্ণ স্কোপ থেকে বাদ: Module ১০ (Logo), Module ১২ (Footer), Module ১৫ (FAQ Settings), Module ১৭ (Settings — General + Shipping)
- Module ১১ (Design — Header) ও Module ১৮ (Info Pages) বাদ পড়েনি, এখনো ভবিষ্যতের কাজ হিসেবে roadmap-এ আছে

- **[REPLACE]** `components/admin/Sidebar.tsx` — চারটা নেভ আইটেম মুছে ফেলা হলো: `সাধারণ` (`/settings`), `শিপিং` (`/shipping-settings`), `Footer ও লোগো` (`/design/footer`), `FAQ` (`/faq-settings`)। এই চারটা আগে `enabled: false` অবস্থায় "শীঘ্রই আসছে" ট্যাগ নিয়ে ছিল, এখন পুরোপুরি সরিয়ে দেওয়া হলো যেহেতু বানানো হবে না।

### সেশন নোট — Module ১৩ (Offers Popup)

legacy `admin.html`-এর `#page-offers-mgmt` + সংশ্লিষ্ট JS (`loadOfferData`/`renderOfferPreviews`/`handleOfferToggle`/`openOfferEditor`/`saveOfferModel`/`deleteOfferModel`) সম্পূর্ণ পড়ে port করা হলো।

- **[NEW FILE]** `app/actions/offers.ts` — `getOfferConfig`/`toggleActiveModel`/`saveOfferModel1`/`saveOfferModel2`/`saveOfferModel3`/`deleteOfferModel`
- **[NEW FILE]** `app/(admin)/offers-mgmt/page.tsx` — config + `listProducts()` (মডেল ৩-এর প্রোডাক্ট ড্রপডাউনের জন্য, আগে থেকেই থাকা `products.ts`-এর ফাংশন পুনর্ব্যবহার)
- **[NEW FILE]** `components/offers/OffersPageClient.tsx` — ৩টা pill বাটন, ৩-কলাম লাইভ প্রিভিউ গ্রিড (প্রতিটায় toggle + live badge), মডেল-নির্দিষ্ট এডিটর মোডাল
- **[REPLACE]** `types/index.ts` — আগে placeholder `Offer` টাইপ ছিল (আন্দাজে বানানো, ব্যবহৃত হতো না), verified `OfferConfig`/`OfferModel1`/`OfferModel2`/`OfferModel3` দিয়ে replace করা হলো
- **[REPLACE]** `components/admin/Sidebar.tsx` — `/offers-mgmt` নেভ আইটেম `enabled: false` থেকে `true`
- `npx tsc --noEmit` ও `next build` — ক্লিন

কোনো ইচ্ছাকৃত পার্থক্য নেই — behavior হুবহু (একবারে একটাই মডেল লাইভ, toggle করলে বাকিগুলো অটো বন্ধ, প্রতিটা মডেলের নিজস্ব ফিল্ড)।

### সেশন নোট — Module ১৪ (Review Gallery)

legacy `admin.html`-এর `#page-review-gallery` + TASK 30 JS (`loadReviewGallery`/`renderReviewGrid`/`saveReview`/`deleteReview`/`handleReviewImgUpload`/`openReviewPreview`) সম্পূর্ণ পড়ে port করা হলো।

- **[NEW FILE]** `app/actions/reviews.ts` — `listReviews`/`addReview`/`updateReview`/`deleteReview`/`uploadReviewImage`
- **[NEW FILE]** `app/(admin)/review-gallery/page.tsx`
- **[NEW FILE]** `components/reviews/ReviewGalleryPageClient.tsx` — গ্রিড, add/edit মোডাল, ফুল-স্ক্রিন zoom প্রিভিউ মোডাল
- **[REPLACE]** `types/index.ts` — আগে placeholder `Review` টাইপ ছিল (customer_name/content/rating সহ, আন্দাজে বানানো, ব্যবহৃত হতো না), verified শেপ দিয়ে replace করা হলো (`id`, `image_url`, `created_at` — admin এই তিনটার বাইরে কিছু ছোঁয় না)
- **[REPLACE]** `components/admin/Sidebar.tsx` — `/review-gallery` নেভ আইটেম `enabled: false` থেকে `true`
- `npx tsc --noEmit` ও `next build` — ক্লিন

**একটা ইচ্ছাকৃত পার্থক্য (owner-কে জানানো দরকার), Module ৮-এর মতোই একই কারণে:** **ছবি আপলোড: base64 থেকে আসল Storage upload** — legacy `handleReviewImgUpload()` ছবি সরাসরি base64 বানিয়ে `image_url` কলামেই বসিয়ে দিত (প্রতিটা রিভিউ রো ভারী হয়ে উঠত)। এখানে Products/Hero-Cards module-এর মতোই আসল Supabase Storage-এ আপলোড হয় (bucket `product-images` পুনর্ব্যবহার, path `reviews/...`) — কলামে শুধু ছোট URL string থাকে। এটা bug ফিক্সের মতো, ফিচার পাল্টায়নি (URL অথবা আপলোড দুটো অপশনই আগের মতোই আছে)।

### সেশন নোট — Module ১১ যাচাই + স্কোপ থেকে বাদ, Phase C (Orders confirmed sync-sheet)

**Module ১১ (Design — Header) যাচাই:** legacy `#page-design-header` (নেভ লগইন বাটন টেক্সট, হেডার ব্যাকগ্রাউন্ড রং, announcement bar টেক্সট, ক্যাটাগরি বার টগল, sticky header টগল) সম্পূর্ণ কোড পড়ে নিশ্চিত হওয়া গেছে — `saveHeader()` আসলে কিছুই সেভ করে না (শুধু টোস্ট দেখায়), আর কোনো load ফাংশনও নেই এই ফিল্ডগুলো populate করার জন্য। অর্থাৎ Module ৯ (Colors)-এর মতোই legacy-তেই এটা অকার্যকর mockup ছিল। owner এই তথ্য দেখে **Module ৯-এর মতোই সম্পূর্ণ স্কোপ থেকে বাদ দিতে বলেছেন।** Sidebar-এ এই মডিউলের কোনো নেভ আইটেম কখনো যোগ হয়নি, তাই ফাইল পরিবর্তনের দরকার হয়নি।

**Module ১৬ (Header Copy) ও ১৮ (Info Pages):** দুটোই কোড পড়ে verify করা হয়েছে — legacy-তে real/কার্যকর ফিচার (load+save সাইকেল আছে, `vc_navbar_texts`/`vc_about_desc`/`vc_info_pages`-এ সেভ হয়, সাইটের real পেজ চালায়)। owner এই সেশনে এগুলো **আপাতত স্কিপ করে সরাসরি Phase C করতে বলেছেন** — স্কোপ থেকে বাদ না, ভবিষ্যতে আবার শুরু করা যাবে।

**বোনাস আবিষ্কার:** legacy `page-design-footer`-এর ভেতরে একটা "📞 যোগাযোগ তথ্য" কার্ড (ফোন/WhatsApp/bKash/Messenger/Email/Facebook/ঠিকানা) roadmap-এর কোনো module-এ কখনো লেখাই ছিল না। owner সিদ্ধান্ত: এটাও লাগবে না।

**Phase C — Orders "confirmed" sync-sheet (আগের TODO এখন সম্পূর্ণ):**

legacy `setOrderStatus()`-এর Google Sheet sync অংশ (`addConfirmed` payload) সম্পূর্ণ পড়ে port করা হলো। **একটা আর্কিটেকচারাল সিদ্ধান্ত owner-কে জিজ্ঞেস করা হয়েছিল** (roadmap Phase C-তে লেখা ছিল legacy-র মতোই আলাদা public `/api/sync-sheet` route বানানোর কথা) — legacy-তে এই আলাদা proxy route লাগত কারণ vanilla SPA-তে Google Apps Script URL গোপন রাখার আর কোনো উপায় ছিল না। Next.js-এ Server Action এমনিতেই সার্ভারে চলে, তাই একই কারণ প্রযোজ্য না। **owner অনুমোদন দিয়েছেন সহজ/বেশি নিরাপদ অপশনে যাওয়ার জন্য** — কোনো নতুন public route ছাড়াই, বিদ্যমান Server Action-এর ভেতর থেকেই সরাসরি Google Sheet-এ কল।

- **[NEW FILE]** `lib/googleSheet.ts` — `syncConfirmedOrderToSheet(order)`, legacy-র `addConfirmed` payload শেপ হুবহু (orderNum/date/name/phone/dist/addr/email/items/itemsRaw/shippingCost/total/ip), `text/plain` content-type বজায় রাখা হয়েছে (Google Apps Script-এর doPost() এই ফরম্যাট আশা করে), ব্যর্থ হলে silently catch করে (legacy-ও তাই করত), ১০ সেকেন্ড টাইমআউট
- **[REPLACE]** `app/actions/orders.ts` — `updateOrderStatus()`-এ status 'confirmed' হলে Next.js 15-এর `after()` API দিয়ে ব্যাকগ্রাউন্ডে sync ট্রিগার হয় (response আটকায় না, কিন্তু un-awaited fetch-এর মতো serverless-এ মাঝপথে থেমে যাওয়ার ঝুঁকিও নেই — `after()` ঠিক এই কাজের জন্যই বানানো)। `bulkUpdateOrderStatus()`-এ touch করা হয়নি — legacy-তেও bulk confirm sync ট্রিগার করত না, এটা যাচাই করেই নিশ্চিত হওয়া হয়েছে
- মকড fetch দিয়ে payload শেপ আলাদাভাবে টেস্ট করে verify করা হয়েছে (legacy-র payload-এর সাথে field-by-field মিল)
- `GOOGLE_SHEET_URL` env var আগে থেকেই owner-এর External Setup Checklist-এ ছিল (Phase A.1) — নতুন কিছু বসাতে হবে না

**একটা আলাদা বাগ পাওয়া গেছে ও ফিক্স করা হয়েছে (এই সেশনের কাজের অংশ না, কিন্তু build ভেঙে ছিল):** `lib/constants/heroCards.ts` ফাইলটা repo-তে সম্পূর্ণ অনুপস্থিত ছিল (Module ৮-এর সেশনে তৈরি হয়েছিল বলে roadmap-এ লেখা আছে, কিন্তু GitHub-এ কখনো commit/upload হয়নি — সম্ভবত ZIP থেকে drag-drop করার সময় বাদ পড়ে গিয়েছিল), যার ফলে পুরো repo build ভাঙা ছিল। legacy `DEFAULT_CATH_CARDS` থেকে হুবহু পুনর্গঠন করে ফাইলটা রিস্টোর করা হলো — **[NEW FILE]** `lib/constants/heroCards.ts`।

- `npx tsc --noEmit` ও `next build` — ক্লিন (এখন সব রুট build হয়)

**পরের ধাপ:** owner চাইলে Module ১৬ (Header Copy) বা ১৮ (Info Pages) আবার শুরু করা যাবে, নয়তো Phase D (Documentation)।

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
