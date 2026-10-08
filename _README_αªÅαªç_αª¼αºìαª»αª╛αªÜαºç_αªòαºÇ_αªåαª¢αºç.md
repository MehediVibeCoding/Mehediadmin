# এই zip-এ কী আছে (সম্পূর্ণ ব্যাচ)

আগের মতোই — `Mehediadmin/` ফোল্ডারের ভেতরের কনটেন্ট রিপোর রুটে কপি-পেস্ট
করলেই পাথ মিলে যাবে। `_README...` আর `_migration_reference/` শুধু
আপনার পড়ার জন্য, রিপোতে বসানোর দরকার নেই।

এটা আগের zip-এর (batch 2) জায়গায় — তাতে যা ছিল সব আছে, তার উপর নতুন
তিনটা কাজ (ID ভ্যালিডেশন বাকি ফাইলে, stock_logs UI, loading.tsx পলিশ)
যোগ হয়েছে।

---

## ১. স্কেলেটন ফ্লিকার — আসল কারণ ফিক্স + পলিশ
- **আসল কারণ (`app/actions/orders.ts`):** `updateOrderStatus()` ও
  `bulkUpdateOrderStatus()`-এ রিডান্ডেন্ট `revalidatePath('/orders')` +
  `revalidatePath('/')` সরানো হয়েছে — এগুলো প্রতি status বদলে ক্লায়েন্টের
  Router Cache জোর করে মুছে দিচ্ছিল, যদিও `invalidateOrdersData()`
  (ট্যাগ-ভিত্তিক) একাই যথেষ্ট ছিল ডাটা ফ্রেশ রাখার জন্য।
- **পলিশ (`next.config.js`):** `staleTimes.dynamic` ১৮০→৪২০ সেকেন্ড,
  `static` ৩০০→৬০০ — root cause ঠিক হয়ে যাওয়ায় এখন cache আর বিনা কারণে
  মোছে না, তাই টাইমআউট বাড়ালে ১২-১৩ ঘণ্টার সেশনে কম-ঘোরাফেরা করা
  পেজগুলোতেও (customers, coupons, offers-mgmt...) স্কেলেটন আরও কম দেখাবে।
- **ইতিমধ্যে যা ভালোভাবে করা ছিল (অপরিবর্তিত, শুধু নিশ্চিত করেছি):**
  প্রতিটা পেজের স্কেলেটন (`components/admin/skeletons.tsx`) আসল পেজের
  হুবহু লেআউট নকল করে (layout shift নেই), আর `app/(admin)/template.tsx`
  প্রতিটা পেজ-বদলে হালকা opacity fade করে। এগুলো বদলানোর দরকার ছিল না —
  সমস্যাটা আসলে এক জায়গায় (revalidatePath) ছিল।

`products.ts`-এও একই প্যাটার্নের বাগ ছিল (মিউটেশনে `PRODUCTS_TAG`
ইনভ্যালিডেট হতো না) — `invalidateProductsData()` যোগ করা হয়েছে ৮ জায়গায়।

## ২. `stock_logs` অডিট — টেবিল + UI দুটোই এখন আছে
- টেবিল + RPC ফাংশন **ইতিমধ্যে আপনার লাইভ Supabase-এ বসানো** (আবার
  চালানোর দরকার নেই, `_migration_reference/`-এ শুধু রেফারেন্স)।
- **নতুন: প্রোডাক্ট টেবিলে স্টক এডিট করতে গেলে এখন হিস্ট্রি দেখা যায়।**
  "স্টক আপডেট" বাটনে ক্লিক করলে যে বটম-শিট খোলে (`QuickEditPopover.tsx`),
  তার নিচে এখন "📒 সাম্প্রতিক স্টক পরিবর্তন" সেকশনে শেষ ৫টা
  পরিবর্তন দেখায় — কারণ (যেমন "অর্ডার স্ট্যাটাস বদল → rejected",
  "অ্যাডমিন সরাসরি এডিট করেছেন"), কবে, কে করেছে, আর +/- কত বদলেছে
  (সবুজ/লাল ব্যাজ দিয়ে)। `ProductsTable.tsx`-এ `productId` পাস করে
  ওয়্যার-আপ করা হয়েছে।
- `app/actions/stockLogs.ts`-এর `listRecentStockLogs()` ফাংশনটা এখনো কোনো
  UI-তে বসানো হয়নি (প্রোডাক্ট-নির্বিশেষে সব স্টক-পরিবর্তনের একটা আলাদা
  ওভারভিউ পেজ বানাতে চাইলে এটা রেডি আছে — বললে পরের ব্যাচে যোগ করে দেব)।

## ৩. বাকি ফাইলে ID ভ্যালিডেশন — শেষ
- `customers.ts`, `offers.ts` — চেক করে দেখেছি raw id lookup নেই
  (RPC/fixed-key দিয়ে চলে), তাই এগুলোতে কিছু করার দরকারই ছিল না।
- `guidePages.ts` — `getGuidePage`, `updateGuidePage`, `setGuidePagePublished`,
  `deleteGuidePage`, `listGuidePagesByProduct`-এ `isValidUuid`/
  `isValidPositiveIntId` বসানো হয়েছে।
- `guideTemplates.ts` — `updateGuideTemplate`, `deleteGuideTemplate`-এ
  `isValidUuid`।
- `product-qa.ts` — `answerQuestion`, `deleteQuestion`, `deleteAnswer`-এ
  `isValidPositiveIntId`।
- `product-reviews.ts` — `approveReview`, `rejectReview`,
  `deleteProductReview`-এ `isValidPositiveIntId`।

## ৪. CSV এক্সপোর্ট — ৫০,০০০+ অর্ডারে স্কেল করবে (আগের ব্যাচের মতোই)
নতুন `app/api/export-orders/route.ts` — streaming Route Handler, ১০০০
সারির ব্যাচে ব্যাচে পড়ে সরাসরি ফাইল-ডাউনলোড হিসেবে স্ট্রিম করে (পুরো
ডাটা মেমোরিতে না রেখে)। Orders পেজ ও Dashboard-এর CSV বাটন দুটোই এটা
ব্যবহার করে।

## যাচাই করা হয়েছে
- `npx tsc --noEmit` — পুরো প্রজেক্টে কোনো টাইপ এরর নেই (সব পরিবর্তনসহ)
- `npx next lint` — কোনো নতুন ESLint warning/error নেই (শুধু আগে থেকেই
  থাকা, অসম্পর্কিত একটা font warning `app/layout.tsx`-এ, যেটা এই
  ব্যাচে ছোঁয়া হয়নি)

## বসানোর ধাপ
1. এই zip-এর `Mehediadmin/` ফোল্ডারের কনটেন্ট রিপোর রুটে কপি-পেস্ট করুন।
2. `git diff` করে একবার চোখ বুলিয়ে নিন।
3. Commit → push → ডিপ্লয়। Supabase-এর দিকের কাজ আগে থেকেই লাইভ।
4. টেস্ট:
   - একটা অর্ডার reject/cancel করুন → `stock_logs` টেবিলে রো পড়ছে কিনা
     (Supabase Dashboard) আর প্রোডাক্টের "স্টক আপডেট" শিটে সেটা দেখাচ্ছে কিনা।
   - Orders পেজে CSV এক্সপোর্ট করে ফাইল ডাউনলোড হচ্ছে কিনা।
   - অর্ডার কনফার্ম করার পর Dashboard-এ গিয়ে দেখুন স্কেলেটন কম দেখাচ্ছে কিনা।

## এখনো যা ঐচ্ছিক/ভবিষ্যতের কাজ
- `listRecentStockLogs()`-এর জন্য একটা আলাদা "স্টক হিস্ট্রি" ওভারভিউ পেজ
- মডারেটর/স্টাফ রোল সিস্টেম
- কুরিয়ার API / ফ্রড ডিটেকশন / SMS / UTM — ভলিউম বাড়লে
