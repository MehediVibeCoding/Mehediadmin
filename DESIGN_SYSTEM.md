# Vangcur Admin — Design System (v2)

> **সংস্করণ:** v2 · ২০২৬-১০-০৪ · কোডবেসের সর্বশেষ অবস্থা (Next.js 15.5, React 19, TypeScript 5.7, Tailwind **3.4.17**, ESLint 9, Supabase) মিলিয়ে লেখা।
> **এই ফাইলই চূড়ান্ত নিয়ম।** আগের সংস্করণে `brand-primary` (গাঢ় নীল `#0058C7`) প্রাইমারি রং বলা ছিল — **সেটা বাতিল।** অ্যাডমিন UI-তে ব্র্যান্ড রং শুধু স্কাই-ব্লু।
> চ্যাট-ভিত্তিক টুল (AI Studio ইত্যাদি) যা রিপোর ফাইল নিজে পড়ে না, তাদের জন্য আলাদা `AI_STUDIO_MASTER_PROMPT.md` আছে — দুটোর মধ্যে সংঘাত হলে **এই ফাইলই** জিতবে।

---

## ০. কীভাবে ব্যবহার করবে

1. UI-র যেকোনো কাজের আগে **§১ (নীতি), §৩ (নিষিদ্ধ ও ফাঁদ)** পড়ো।
2. নতুন কিছু বানানোর আগে **§৪ (শেয়ার্ড কম্পোনেন্ট)** দেখো — যা আছে তা আবার বানাবে না।
3. লেআউট/মডাল বানাতে **§৫–৬-এর রেসিপি** থেকে ক্লাস হুবহু কপি করো। নিজে নতুন স্টাইল আবিষ্কার করবে না।
4. কাজ শেষে **§১০ চেকলিস্ট** মেলাও এবং যাচাইয়ের কমান্ড চালাও।
5. কোন পেজ ইতিমধ্যে নতুন ডিজাইনে আছে আর কোনটা বাকি — **§৯**-এ। নতুন ডিজাইনের পেজগুলো (বিশেষত `ProductsTable`, `OrdersTable`, `ProductModal`) **গোল্ডেন রেফারেন্স**।

---

## ১. মূল নীতি

1. **মোবাইল-ফার্স্ট।** মালিক ~৯০% সময় ফোনে প্যানেল চালায়। প্রতিটা স্ক্রিন প্রথমে ~৩৬০–৪১২px-এ ঠিক থাকতে হবে।
2. **শুধু স্কাই-ব্লু ব্র্যান্ড** (`#44A7FC`)। গাঢ় নীল/নেভি/ইন্ডিগো কোথাও নয়।
3. **মোবাইলে কার্ড, ডেস্কটপে (≥1024px) টেবিল।** মোবাইলে আড়াআড়ি-স্ক্রল টেবিল কখনো নয়; কার্ডের ভেতরে কার্ড নয়।
4. **কম্প্যাক্ট তালিকা।** প্রোডাক্ট ~৫০০টা হবে। বেশি আইটেমের তালিকায় কার্ড ডিফল্টে ছোট, "সবকিছু দেখুন" চাপলে খোলে।
5. **পেজের উপরে লোগো-আইকন, বড় টাইটেল বা সাবটাইটেল থাকবে না।** পেজ সরাসরি টুলবার কার্ড দিয়ে শুরু হয়।
6. **ওপেন হেডিং, আইকনবিহীন ডিটেইল।** ফর্ম/ডিটেইল সেকশন বক্সে ঢোকে না — `SectionHeading` (বড় স্কাই-ব্লু লেখা + মিলিয়ে যাওয়া রেখা)।
7. **মডাল = মোবাইলে নিচ থেকে ওঠা শীট** (স্টিকি হেডার/ফুটার), ডেস্কটপে মাঝখানের কার্ড। ট্যাব বার কখনো মডাল বা বোতামের উপর আসে না।
8. **UI বদলালে লজিক বদলায় না।** সার্ভার অ্যাকশন (`app/actions/*`), ডাটা-ফেচ, props-এর আকার — আলাদা অনুমতি ছাড়া অপরিবর্তিত।
9. **ব্রাউজারের `confirm()`/`alert()` নয়** — `ConfirmDialog` ও `useToast()`।
10. **হেডিং/লেবেলে ইমোজি নয়।** আইকন লাগলে inline SVG। ইমোজি শুধু ডাটা (প্রোডাক্টের ছবির ফলব্যাক) ও টোস্টে।

---

## ২. ডিজাইন টোকেন

### ২.১ রং

`tailwind.config.ts`-এ আরও টোকেন আছে (মূল সাইটের সাথে sync রাখতে) — কিন্তু **অ্যাডমিন UI-তে শুধু নিচেরগুলো**:

| ভূমিকা | টোকেন | মান |
|---|---|---|
| ব্র্যান্ড (বাটন, অ্যাকটিভ, আইকন, অ্যাকসেন্ট) | `brand-light` | `#44A7FC` |
| ব্র্যান্ড হোভার | `brand-light-hover` | `#3C93DE` |
| পেজ ব্যাকগ্রাউন্ড টিন্ট | `brand-bg` | `#C3DEFC` (পেজ গ্রেডিয়েন্ট: `brand-bg → #DCEBFD → white`; টেবিল হেড `bg-brand-bg/30`) |
| মূল লেখা | `ink` | `#1A1A1A` |
| গৌণ লেখা | `muted` | `#6B7280` |
| হালকা ধূসর ফিল | `surface-muted` | `#F3F4F6` |
| বর্ডার | `border-base` | `#E5E7EB` (প্রায় সবসময় `/80` বা `/70` সহ) |
| সফল / প্রাপ্ত টাকা | `success` | `#10B981` |
| বিপদ / ডিলিট / বাকি | `danger` | `#E63946` (হালকা: `bg-red-50 border-red-200/80`) |
| সতর্কতা | `warn` / amber | `#F59E0B`; পিল: `bg-amber-50 text-[#92400E]` |
| অফার/কুপন অ্যাকসেন্ট | `gold` | `#D4A853` (শুধু অফার/কুপন প্রসঙ্গে) |

**অ্যাডমিন UI-তে নিষিদ্ধ টোকেন:** `brand-primary` (#0058C7), `brand-accent` (#005EFC), `bg-brand-grad`, `topbar-grad`, `brand-dark-*`, `info` — এবং যেকোনো নেভি/ইন্ডিগো hex (`#1E40AF`, `#3730A3`, `#001229` …)।

**অর্ডার স্ট্যাটাস** — একমাত্র সূত্র `ORDER_STATUS_META` (`lib/orders.ts`), প্রদর্শন `StatusPill`। নিজে রং বানাবে না:

| স্ট্যাটাস | dot | bg | text |
|---|---|---|---|
| Pending | `#F59E0B` | `#FEF3C7` | `#92400E` |
| Confirmed | `#44A7FC` | `#E3F2FF` | `#0F6FC6` |
| Shipped | `#8B5CF6` | `#EDE9FE` | `#6D28D9` |
| Delivered | `#10B981` | `#D1FAE5` | `#065F46` |
| Cancelled | `#EF4444` | `#FEE2E2` | `#B91C1C` |
| Rejected | `#B91C1C` | `#FECACA` | `#7F1D1D` |

**স্টক পিল:** ০ → লাল "Sold Out"; ≤৫ → অ্যাম্বার; বাকি → সবুজ।

### ২.২ টাইপোগ্রাফি

- সব লেখায় `font-body` (DM Sans + Noto Sans Bengali)। `font-display` (Playfair) অ্যাডমিন UI-তে ব্যবহার হয় না।
- হেডিং `font-black`; লেবেল/বাটন `font-extrabold`; মান (টাকা, সংখ্যা) `font-black`; গৌণ `font-semibold`/`font-medium`।

| ব্যবহার | আকার |
|---|---|
| মডাল টাইটেল | `text-[22px] font-black` |
| `SectionHeading` | `text-[18px] font-black text-brand-light` |
| মডাল ইয়ারো-লেবেল | `text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light` |
| কার্ডের নাম | `text-[13.5px]`–`[14px] font-extrabold` |
| ফিল্ড লেবেল | `text-[12.5px] font-extrabold` |
| মাইক্রো-লেবেল | `text-[10px]–[11px] font-extrabold uppercase tracking-wide text-muted` |
| মূল সংখ্যা | `text-[15px] font-black` |
| ইনপুট | `text-[14px] font-semibold` |

- সংখ্যা ইংরেজি ডিজিটে: `'৳' + n.toLocaleString('en-US')`।
- তারিখ: **`formatDateBn()`** (`lib/dateFormat.ts`) — নতুন করে লোকাল `fmtDate` বানাবে না। সময়সহ লাগলে `toLocaleDateString('bn-BD', …)`/`toLocaleTimeString('bn-BD', …)`।
- UI-র সব লেখা বাংলায়। (স্ট্যাটাস লেবেল Pending/Confirmed… এবং ট্যাব "Basic Info/Full Layout/Images" ইংরেজিতেই — বিদ্যমান নিয়ম।)

### ২.৩ রেডিয়াস

| ব্যবহার | মান |
|---|---|
| মডাল শীটের উপরের কোণ | `rounded-t-[30px]` |
| ডেস্কটপ মডাল | `md:rounded-[28px]` |
| ড্রপডাউন শীট | `rounded-[26px]` |
| টুলবার / বড় কার্ড | `rounded-[24px]` |
| আইটেম কার্ড | `rounded-[20px]`–`[22px]` |
| ইনপুট, টাইল | `rounded-2xl` |
| ছোট টাইল | `rounded-xl` |
| বাটন, চিপ, পিল, সার্চ | `rounded-full` |

### ২.৪ শ্যাডো

- কার্ড: `shadow-sh1`; পপওভার: `shadow-sh2`।
- স্কাই বাটন: `shadow-[0_6px_18px_rgba(68,167,252,0.42)]` (ছোট বাটনে `0_4px_14px_rgba(68,167,252,0.36)`)।
- মডাল শীট: `shadow-[0_-12px_50px_rgba(26,26,26,0.22)]`; ডেস্কটপ: `shadow-[0_24px_70px_rgba(26,26,26,0.28)]`।

### ২.৫ ব্রেকপয়েন্ট (⚠️ ফাঁদ আছে)

| টোকেন | প্রস্থ | নোট |
|---|---|---|
| `xs` | 359px | |
| `sm2` | 411px | |
| **`sm`** | **480px** | ⚠️ ডিফল্ট Tailwind-এর 640px **নয়** |
| `md` | 768px | ট্যাবলেট: কার্ড ২-কলাম |
| `lg` | 1024px | **কার্ড → টেবিল সুইচ** |
| `xl` / `2xl` | 1200 / 1440px | |

⚠️ **`hover:` শুধু হোভার-সক্ষম ডিভাইসে কাজ করে** (কাস্টম ভ্যারিয়েন্ট)। মোবাইলে ফিডব্যাকের জন্য **`active:`** ব্যবহার করো (`active:scale-95`)।

### ২.৬ z-index স্কেল (এর বাইরে নতুন সংখ্যা বানাবে না)

| স্তর | মান |
|---|---|
| ডেস্কটপ সাইডবার | `z-50` |
| নিচের মোবাইল ট্যাব বার | `z-40` |
| ভাসমান সিলেকশন/বাল্ক বার | `z-[45]` |
| মূল মডাল (ProductModal, OrderDetailModal…) | `z-[60]` |
| ছোট মডাল (QuickEdit), ড্রপডাউন ব্যাকড্রপ | `z-[70]` |
| ড্রপডাউন শীট | `z-[71]` |
| গাইড তালিকা-মডাল / গাইড এডিটর | `z-[105]` / `z-[110]` |
| `ConfirmDialog` | `z-[120]` |
| মোবাইল মেনু ড্রয়ার | `z-[550]` / `z-[560]` |
| তারিখ-পিকার মডাল | `z-[999]` |
| টোস্ট | `z-[9999]` |

### ২.৭ অ্যানিমেশন

অনুমোদিত: `animate-sheet-up` (শীট ওঠা), `animate-soft-fade-in` (ব্যাকড্রপ/এক্সপ্যান্ড), `animate-spin` (রিফ্রেশ), `animate-pulse` (স্কেলিটন), ছোট `transition-all duration-brand` ও `active:scale-*`।
**নিষিদ্ধ:** অনন্ত (infinite) সাজসজ্জার অ্যানিমেশন (`shimmer-sheen`, `statLiveSweep`, `weatherFloat`, `badgeHotGlow` …) — মোবাইলের ব্যাটারি/GPU খায়। `prefers-reduced-motion` গ্লোবালি হ্যান্ডেল করা আছে।

---

## ৩. নিষিদ্ধ ও Tailwind ফাঁদ

### ৩.১ নিষিদ্ধ (নতুন কোডে)

- গাঢ় নীল: `brand-primary`, `brand-accent`, `bg-brand-grad`, `topbar-grad`, নেভি hex।
- রংধনু সেকশন বক্স (বেগুনি/গোলাপি/কমলা প্যাস্টেল)। ফর্ম সেকশন সাদা ব্যাকগ্রাউন্ডে `SectionHeading` দিয়ে ভাগ হবে। (একমাত্র ব্যতিক্রম: ঐচ্ছিক বিশেষ গ্রুপ `rounded-[24px] border border-brand-light/30 bg-brand-light/[0.07] p-4` — যেমন কালার ভ্যারিয়েন্ট।)
- **কার্ড/তালিকায় `backdrop-blur-*`** (মোবাইল GPU ল্যাগ)। ব্লার শুধু: মডাল ব্যাকড্রপ (`backdrop-blur-[3px]`), নিচের ডক বার, সাইডবার।
- ব্রাউজার `confirm()` / `alert()` / `prompt()`।
- নেটিভ চেকবক্স / নেটিভ select তীর (নিচে ৩.২)।
- `vh` ইউনিট উচ্চতায় (→ `dvh`)।
- ডিফাইন-না-করা ক্লাস: **`glass-card`, `glass-card-strong`, `text-brand-dark`, `shadow-xs`, `mt-4.5`** (এগুলো নীরবে কিছুই করে না)।
- পেজের উপরের লোগো/টাইটেল/সাবটাইটেল (`components/admin/PageHeader.tsx` ফাইলটা আছে কিন্তু **অব্যবহৃত — ব্যবহার করবে না**)।

### ৩.২ Tailwind ৩.৪ ও `globals.css`-এর ফাঁদ

1. **অপাসিটি মডিফায়ার শুধু ৫-এর গুণিতক** (`/5 /10 … /95`)। `bg-brand-light/12` **কাজ করে না**। অন্য মান লাগলে `bg-brand-light/[0.12]`।
2. `globals.css`-এ `input, textarea, select { -webkit-appearance: none }`:
   - নেটিভ **চেকবক্স অদৃশ্য** → `Checkbox` কম্পোনেন্ট।
   - নেটিভ **select-এ তীর নেই** → `SelectBox` (অথবা কাঁচা `<select>`-এ `select-chevron appearance-none`)।
   - ইনপুট ফোকাস রিং গ্লোবালি স্কাই-ব্লু — নিজে `ring`/`outline` যোগ করবে না।
3. **`<select>`-এ `[appearance:textfield]` দেবে না** (নেটিভ তীর ফিরে আসে → দুটো তীর)। `FIELD_CLS` নম্বর-ইনপুটের জন্য; select-এ `SelectBox` ব্যবহার করো।
4. যে wrapper-এর ভেতরে `fixed` মডাল/ড্রপডাউন/ক্যালেন্ডার আছে, সেখানে **`overflow-hidden`, `backdrop-blur`, `transform`, `filter` দেবে না** — `fixed` উপাদান কেটে যায়/ভুল জায়গায় বসে।
5. নিচে `fixed` কিছু থাকলে সেফ-এরিয়া: `style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}`।
6. আছে: `no-scrollbar`, `sleek-scrollbar`, `animate-sheet-up`, `select-chevron`, `line-clamp-N`, `shadow-sh1/sh2/sh3`, `duration-brand`, `transition-brand`।
7. `'use client'` ফাইল থেকে সার্ভার কম্পোনেন্টে কোনো **মান** (যেমন `PAGE_SIZE`) ইমপোর্ট করলে সেটা সংখ্যা না হয়ে রেফারেন্স অবজেক্ট হয়ে যায় (→ `limit=NaN`, তালিকা খালি)। তাই সীমা `lib/constants/pagination.ts`-এ।

---

## ৪. শেয়ার্ড কম্পোনেন্ট ও হেল্পার (আবার বানাবে না)

### কম্পোনেন্ট

| নাম | পাথ | কাজ |
|---|---|---|
| `Checkbox` | `components/common/Checkbox` | স্কাই-ব্লু কাস্টম চেকবক্স — `checked`, `onChange(bool)`, `label`, `className?` (৩৬×৩৬ টাচ এরিয়া) |
| `Pagination` | `components/common/Pagination` | `page`, `total`, `onPageChange`, `pageSize?`, `bare?` (কার্ডের ভেতরে `bare`)। `PAGE_SIZE` পুনঃএক্সপোর্ট করে |
| `SectionHeading` | `components/common/SectionHeading` | ওপেন স্কাই-ব্লু হেডিং — `children`, `hint?` |
| `Field`, `SelectBox`, `FIELD_CLS`, `TEXTAREA_CLS` | `components/common/FormField` | ফর্ম ফিল্ড; `Field` props: `label`, `hint?`, `required?`, `help?` |
| `ConfirmDialog` | `components/common/ConfirmDialog` | `title`, `message`, `confirmLabel`, `busy?`, `busyLabel?`, `tone: 'danger'\|'brand'`, `onConfirm`, `onCancel` |
| `DateRangePicker` | `components/common/DateRangePicker` | তারিখ রেঞ্জ (`className?` wrapper-এর জন্য) |
| `StatusPill` | `components/admin/StatusPill` | অর্ডার স্ট্যাটাস পিল; `verification?` দিলে অটো-কনফার্ম ট্যাগ ("Tnx Confirm"/"LD Confirm") |
| `useToast` | `components/admin/Toast` | `showToast('✅ …')` / `'❌ …'` (মোবাইলে উপরে, ডেস্কটপে নিচে) |
| `PageSkeleton` | `components/admin/PageSkeleton` | লোডিং স্কেলিটন (§১০-এর নোট দেখো) |
| `useOrdersRealtime` | `components/admin/OrdersRealtimeProvider` | `ordersVersion` (রিয়েলটাইম রিফ্রেশ ডিবাউন্সড) |

### হেল্পার (`lib/`)

| নাম | পাথ | কাজ |
|---|---|---|
| `PAGE_SIZE` (=14) | `lib/constants/pagination.ts` | পেজিনেশন সীমা (সার্ভার + ক্লায়েন্ট দুই জায়গায় এখান থেকেই) |
| `formatDateBn(d)` | `lib/dateFormat.ts` | "৪ অক্টো ২০২৬"; ফাঁকা/অবৈধ হলে "—" |
| `ORDER_STATUS_META`, `ORDER_STATUS_ORDER` | `lib/orders.ts` | স্ট্যাটাসের রং/লেবেল/ক্রম |
| `getOrderAdvance`, `getOrderDueCOD`, `isAdvanceTier2`, `needsDiamondAction` | `lib/orders.ts` | অর্ডারের টাকা/ডায়মন্ড হিসাব |
| `sanitizeInput`, `sanitizeInputArray` | `lib/security.ts` | **সার্ভার অ্যাকশনে প্রতিটা টেক্সট ইনপুটে বাধ্যতামূলক** |
| `sanitizeSvgHtml`, `sanitizeIcon` | `lib/sanitizeSvg.ts`, `lib/sanitizeIcon.ts` | SVG/আইকন স্যানিটাইজ (রেন্ডার ও সেভ) |
| `ordersToCsvRows`, `downloadCsvRows` | `lib/csv.ts` | CSV এক্সপোর্ট |

নতুন শেয়ার্ড কম্পোনেন্ট (দুই জায়গায় লাগবে) → `components/common/`-এ আলাদা ফাইল। ব্যবহারকারী ফাইলের আগে সেটা তৈরি করো।

---

## ৫. লেআউট রেসিপি (ক্লাস হুবহু কপি করো)

### ৫.১ তালিকা-পেজের কাঠামো
```tsx
<div>
  {/* ১. টুলবার কার্ড (৫.২) + চিপ (৫.৩) */}
  {/* ২. (ঐচ্ছিক) মোট সংখ্যা + হিন্ট লাইন */}
  <div className="lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-white/90 lg:bg-white lg:shadow-sh1">
    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:hidden"> {/* মোবাইল কার্ড (৫.৪) */} </div>
    <div className="hidden lg:block"> {/* ডেস্কটপ টেবিল (৫.৫) */} </div>
    <div className="mt-3 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1 lg:mt-0 lg:rounded-none lg:border-0 lg:border-t lg:border-border-base/60 lg:px-5 lg:shadow-none">
      <Pagination page={page} total={total} onPageChange={setPage} bare />
    </div>
  </div>
</div>
```

### ৫.২ টুলবার কার্ড + সার্চ
```tsx
<div className="mb-4 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
  <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
    <div className="relative min-w-0 flex-1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
           className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-light">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input placeholder="… দিয়ে খুঁজুন..."
        className="h-11 w-full rounded-full border border-border-base/80 bg-surface-muted/50 pl-11 pr-10 font-body text-[13px] font-medium text-ink transition-all duration-brand placeholder:text-muted/70 focus:bg-white lg:h-10" />
    </div>
    {/* প্রাইমারি অ্যাকশন — মোবাইলে ফুল-উইডথ (বাটন ৫.১১) */}
  </div>
  {/* ৫.৩ চিপ এখানে */}
</div>
```
টুলবারে `overflow-hidden`/`backdrop-blur` **নেই** (৩.২-৪)।

### ৫.৩ ফিল্টার চিপ (কাউন্টসহ)
```tsx
<div className="no-scrollbar -mx-3.5 mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 sm:-mx-4 sm:px-4">
  <button className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 font-body text-[12px] font-extrabold transition-all duration-brand active:scale-95 ${
    active ? 'border-brand-light bg-brand-light text-white shadow-[0_4px_14px_rgba(68,167,252,0.36)]'
           : 'border-border-base/80 bg-white text-ink hover:border-brand-light hover:text-brand-light'}`}>
    <span>{label}</span>
    <span className={`min-w-[22px] rounded-full px-1.5 text-center text-[10.5px] font-black leading-[18px] ${active ? 'bg-white/25 text-white' : 'bg-surface-muted text-muted'}`}>{count}</span>
  </button>
  {/* ফিল্টার চালু থাকলে শেষে "রিসেট": border-red-200/80 bg-red-50 text-danger */}
</div>
```

### ৫.৪ মোবাইল কার্ড — কম্প্যাক্ট + এক্সপ্যান্ডেবল
```tsx
<article className="flex flex-col rounded-[20px] border border-white/90 bg-white p-3 shadow-sh1 transition-all duration-brand">
  <div className="flex items-start gap-2.5">
    {/* ছবি ৫২px: rounded-2xl border border-border-base/70 bg-brand-light/10 */}
    <div className="min-w-0 flex-1">
      <div className="line-clamp-2 font-body text-[13.5px] font-extrabold leading-snug text-ink">{নাম}</div>
      <div className="mt-1 truncate font-body text-[11px] font-semibold text-muted">#{id} · {ক্যাটাগরি}</div>
    </div>
  </div>
  <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border-base/60 pt-2.5">
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">{/* মূল সংখ্যা + পিল */}</div>
    <button className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 font-body text-[12px] font-extrabold transition-all duration-brand active:scale-95 ${
      isOpen ? 'border-brand-light bg-brand-light text-white shadow-[0_3px_10px_rgba(68,167,252,0.36)]'
             : 'border-brand-light/40 bg-brand-light/10 text-ink'}`}>
      {isOpen ? 'লুকান' : 'সবকিছু দেখুন'} {/* চেভ্রন: rotate-180 খোলা অবস্থায় */}
    </button>
  </div>
  {isOpen && <div className="animate-soft-fade-in">{/* ২-কলাম টাইল + অ্যাকশন বাটন */}</div>}
</article>
```
- এক্সপ্যান্ড স্টেট: `useState<Set<id>>` (প্রতিটা কার্ড স্বাধীন)।
- বিস্তারিত টাইল: `min-w-0 rounded-xl border border-border-base/70 px-3 py-2` (লেবেল `text-[10px]` মাইক্রো, মান `text-[15px] font-black`)।
- অ্যাকশন সারি: প্রাইমারি `h-11 flex-1`, সেকেন্ডারি সফট-স্কাই, ডিলিট `h-11 w-11` লাল-সফট।
- **ড্র্যাগ-সর্ট** থাকলে গ্রিপ হ্যান্ডেলে `touch-none` (নইলে টাচে স্ক্রল ড্র্যাগ কেড়ে নেয়) এবং `onPointerCancel` হ্যান্ডেল করো।

### ৫.৫ ডেস্কটপ টেবিল
```tsx
<div className="hidden lg:block"><div className="sleek-scrollbar overflow-x-auto">
  <table className="w-full min-w-[900px] text-left">
    <thead><tr className="border-b border-border-base/60 bg-brand-bg/30 font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
      <th className="px-3 py-3.5">…</th></tr></thead>
    <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
      <tr className="transition-colors duration-brand hover:bg-brand-bg/25"><td className="px-3 py-3">…</td></tr>
    </tbody>
  </table>
</div></div>
```
টেবিলের অ্যাকশন: গোল আইকন বাটন `h-9 w-9 rounded-full` — এডিট সলিড স্কাই, দ্বিতীয় `border-brand-light/40 bg-brand-light/10 text-brand-light`, ডিলিট লাল-সফট।

### ৫.৬ খালি অবস্থা
```tsx
<div className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] border border-white/90 bg-white px-6 py-16 text-center shadow-sh1 lg:rounded-none lg:border-0 lg:shadow-none">
  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/15 text-brand-light">{/* svg */}</span>
  <span className="font-body text-[14px] font-extrabold text-ink">কিছু পাওয়া যায়নি</span>
  <span className="font-body text-[12px] font-medium text-muted">ফিল্টার বদলে দেখুন</span>
</div>
```

### ৫.৭ সামারি টাইল (কাস্টমার পেজের মতো, ৩-কলাম)
`grid grid-cols-3 gap-2.5` → প্রতিটা `rounded-[20px] border border-white/90 bg-white p-3 shadow-sh1`; আইকন চিপ `h-9 w-9 rounded-xl bg-brand-light/15 text-brand-light`; লেবেল মাইক্রো; মান `text-[17px] font-black`।

### ৫.৮ ভাসমান সিলেকশন/বাল্ক বার
মোবাইলে `fixed inset-x-3 z-[45] mx-auto max-w-[420px]` + `style={{ bottom: 'calc(92px + env(safe-area-inset-bottom, 0px))' }}` (ট্যাব বারের ঠিক উপরে); `lg:static` দিয়ে ডেস্কটপে ইনলাইন। বার দেখা গেলে তালিকার শেষে `<div className="h-28 lg:hidden" />` স্পেসার। রেফারেন্স: `components/orders/OrdersToolbar.tsx`।

### ৫.৯ বাটন

| ধরন | ক্লাস |
|---|---|
| প্রাইমারি | `h-12 rounded-full bg-brand-light font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-60` |
| সেকেন্ডারি | `h-12 rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98]` |
| সফট-স্কাই | `rounded-full border border-brand-light/40 bg-brand-light/10 font-body font-extrabold text-ink` |
| ডিলিট (সফট) | `rounded-full border border-red-200/80 bg-red-50 text-danger` |
| সফল (পাবলিশ) | `bg-success text-white shadow-[0_6px_18px_rgba(16,185,129,0.4)]` |
| আইকন (গোল) | `h-9 w-9 rounded-full` (মোবাইলে প্রাথমিক টাচ-কন্ট্রোলে `h-11 w-11` — §৭) |

---

## ৬. মডাল, শীট ও ফর্ম রেসিপি

### ৬.১ মডাল শেল (রেফারেন্স: `ProductModal`, `OrderDetailModal`)
```tsx
<div className="animate-soft-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
     onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
  <div className="animate-sheet-up flex max-h-[94dvh] w-full max-w-[820px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] md:max-h-[92dvh] md:rounded-[28px] md:shadow-[0_24px_70px_rgba(26,26,26,0.28)]">
    {/* হেডার — আটকে থাকে */}
    <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.12] to-white px-5 pb-3.5 pt-2.5 md:pt-5">
      <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 md:hidden" />
      {/* ইয়ারো-লেবেল + টাইটেল (২২px black) + ক্লোজ বাটন h-9 w-9 rounded-full bg-white shadow-sh1 */}
      {/* ঐচ্ছিক ট্যাব: <div className="mt-3.5 flex rounded-full bg-surface-muted p-1"> প্রতিটা h-10 flex-1 rounded-full; সক্রিয় bg-brand-light text-white shadow-[0_4px_12px_rgba(68,167,252,0.4)] */}
    </div>
    {/* বডি */}
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">…</div>
    {/* ফুটার — আটকে থাকে; এরর এখানে (বডিতে নয়, নইলে স্ক্রল করা অবস্থায় দেখা যায় না) */}
    <div className="shrink-0 border-t border-border-base/70 bg-white px-5 pt-3.5" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="grid grid-cols-[1fr_2fr] gap-2.5">{/* বাতিল (সেকেন্ডারি) + সেভ (প্রাইমারি) */}</div>
    </div>
  </div>
</div>
```
- মডাল খোলা থাকলে ব্যাকগ্রাউন্ড স্ক্রল লক: `useEffect`-এ `document.body.style.overflow = 'hidden'`, cleanup-এ আগের মান।
- সেভ-ফর্মে Esc দিয়ে বন্ধ করবে না (অসংরক্ষিত ডাটা হারাতে পারে); শুধু ডিটেইল/ভিউ মডালে Esc চলে।
- ডুপ্লিকেট/ডিলিট নিশ্চিতকরণ → `ConfirmDialog` (শীটের উপরে `z-[120]`)।

### ৬.২ ড্রপডাউন/মেনু (মোবাইলে বটম শীট, বড় স্ক্রিনে পপওভার) — রেফারেন্স: `CsvExportMenu`
```tsx
{open && (<>
  <div className="fixed inset-0 z-[70] bg-ink/30 backdrop-blur-[2px] lg:hidden" onClick={() => setOpen(false)} />
  <div className="animate-sheet-up fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom,0px))] z-[71] max-h-[80dvh] overflow-y-auto rounded-[26px] border border-white/90 bg-white p-2.5 shadow-[0_-8px_40px_rgba(26,26,26,0.18)] lg:absolute lg:inset-x-auto lg:bottom-auto lg:left-0 lg:top-[calc(100%+8px)] lg:z-40 lg:min-w-[210px] lg:animate-none lg:rounded-2xl lg:p-1.5 lg:shadow-sh2">
    <div className="mx-auto mb-2 mt-1 h-1 w-10 rounded-full bg-border-base lg:hidden" />
    {/* আইটেম: flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-bold hover:bg-brand-bg/40 lg:py-2.5 */}
  </div>
</>)}
```
ট্রিগার: `flex h-11 items-center justify-center gap-2 rounded-full border border-border-base/80 bg-white px-4 text-[12.5px] font-bold text-ink hover:border-brand-light hover:text-brand-light lg:h-10`।

### ৬.৩ ছোট এডিট শীট
রেফারেন্স `QuickEditPopover`: `z-[70]`, `max-w-[400px]`, বড় সংখ্যা-ইনপুট (`h-14 text-[22px] font-black`) + ±স্টেপার, ব্যাজে শর্টকাট চিপ। ভুল ইনপুটের বার্তা **ইনলাইন লাল লেখা** (`alert` নয়)।

### ৬.৪ ওপেন সেকশন হেডিং
```tsx
<SectionHeading hint="ঐচ্ছিক ছোট ব্যাখ্যা">গ্রাহকের তথ্য</SectionHeading>
```
সেকশনের মাঝে `space-y-8`। আইকন বা বক্স নয়।

### ৬.৫ ফর্ম ফিল্ড
```tsx
<Field label="প্রোডাক্টের নাম" required hint="(ছোট নোট)" help="ইনপুটের নিচে ব্যাখ্যা">
  <input className={FIELD_CLS} value={…} onChange={…} />
</Field>
<Field label="বিবরণ"><textarea rows={4} className={TEXTAREA_CLS} /></Field>
<Field label="ধরন"><SelectBox value={v} onChange={setV}><option value="a">A</option></SelectBox></Field>
```
- গ্রিড: `grid grid-cols-1 gap-3.5 sm:grid-cols-2` (সংখ্যার ফিল্ড মোবাইলেও `grid-cols-2`)।
- সংখ্যা: `type="number" inputMode="numeric"` (দশমিক হলে `inputMode="decimal"`)।
- অনুসন্ধান-ফলাফল **ইনলাইন** (ভাসমান `absolute` নয়) — স্ক্রল এরিয়ায় কাটা পড়ে না।

### ৬.৬ ডিটেইল-টাইল (আইকনবিহীন)
```tsx
<div className="flex items-center gap-3 rounded-2xl border border-border-base/80 border-l-[3.5px] border-l-brand-light bg-surface-muted/60 px-4 py-3">
  <span className="min-w-0 flex-1">
    <span className="block font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">নাম</span>
    <span className="mt-1 block break-words font-body text-[15px] font-extrabold leading-snug text-ink">{মান}</span>
  </span>
  {/* কপি-যোগ্য হলে ডানে ছোট কপি আইকন text-muted/60 */}
</div>
```

---

## ৭. মোবাইল ও অ্যাক্সেসিবিলিটি নিয়ম

1. **টাচ টার্গেট:** মোবাইলে নতুন প্রতিটা ইন্টারেক্টিভ কন্ট্রোল **≥ ৪৪×৪৪px** (`h-11`/`h-12`/`w-11`)। ডেস্কটপে `lg:h-10` ঠিক আছে।
   - ✔ প্রোডাক্ট কার্ডের ড্র্যাগ গ্রিপ, এডিট-ডট ও ডিলিট বাটন ইতিমধ্যে `h-11 w-11` — এটাই আদর্শ।
   - *পরিচিত ঋণ (§৯ দেখো):* মোবাইলে এখনও ৩৬px — ফিল্টার চিপ (`h-9`), কার্ডের "সবকিছু দেখুন" বাটন (`h-9`), `Pagination`-এর বোতাম (`h-9`), `Checkbox` (`h-9 w-9`)। নতুন কোডে এগুলো `h-11` করো।
2. **কনট্রাস্ট:** সাদা/হালকা ব্যাকগ্রাউন্ডে `#44A7FC` লেখার কনট্রাস্ট ≈২.৫:১ — ছোট লেখায় অপর্যাপ্ত (WCAG AA ৪.৫:১)।
   - `text-brand-light` ব্যবহার করবে: বড়/ভারী হেডিং (`SectionHeading`), আইকন, সলিড-স্কাই বাটনের ভেতরে সাদা ভারী লেখা।
   - **ছোট (<১৮px) লেখায়** `text-ink` অথবা গাঢ়-স্কাই `text-[#0F6FC6]` (স্ট্যাটাস Confirmed-এর টেক্সট রং) প্রস্তাবিত। *(বিদ্যমান ছোট `text-brand-light` — যেমন অর্ডার নম্বর চিপ — মালিকের অনুমোদিত; বদলানোর সিদ্ধান্ত মালিকের।)*
   - মিউটেড লেখা (`text-muted`) টেবিল-হেডের `bg-brand-bg/30`-এর উপর কম কনট্রাস্ট — ছোট আকার এড়াও।
3. **ফোকাস:** গ্লোবাল স্কাই-ব্লু রিং আছে — মুছবে না।
4. **সেফ-এরিয়া ও `dvh`:** নিচে `fixed` কিছু থাকলে `env(safe-area-inset-bottom)`; উচ্চতায় `dvh`।
5. **ফিডব্যাক:** প্রতিটা বাটনে `active:scale-95` (বা `[0.98]`); `hover:` কেবল ডেস্কটপ-বোনাস।
6. **বাটনের নাম:** আইকন-অনলি বাটনে `aria-label` ও `title` বাধ্যতামূলক।

---

## ৮. ডাটা ও আর্কিটেকচার কনভেনশন (UI-কে প্রভাবিত করে)

1. **পেজ কাঠামো:** `app/(admin)/<পেজ>/page.tsx` (সার্ভার — ডাটা আনে) → `<Page>PageClient.tsx` (`'use client'` — UI)। `'use client'` শুধু hooks/ইভেন্টে।
2. **ক্লায়েন্টে ভারী কাজ নয়।** বড় তালিকা সার্ভারে পেজিনেশন (`.range()`), ফিল্টার/সার্চ/সামারি এগ্রিগেশন সার্ভারে। উদাহরণ: `listOrdersPage` (`app/actions/orders.ts`) + `OrdersPageClient` — সার্ভার থেকে `rows`, `total`, `grandTotal`, `statusCounts` আসে।
3. **তালিকা-কলামে হালকা সিলেক্ট:** লিস্ট ভিউতে `select('*')` নয় — শুধু দরকারি কলাম (ভারী `items` JSON ইত্যাদি ডিটেইলে)।
4. **সার্ভার অ্যাকশনে ইনপুট স্যানিটাইজ:** প্রতিটা টেক্সট প্যারামিটারে `sanitizeInput()`। SVG/আইকন সেভের আগে `sanitizeIcon`।
5. **রিয়েলটাইম:** `router.refresh()` ডিবাউন্সড; পেজ-স্টেট ওভাররাইট করার আগে ফিল্টার/পেজ ref চেক (রেফারেন্স `OrdersPageClient`-এর `paramsRef`/`reqIdRef`)।
6. **চার্ট/ক্যানভাস:** `resize` লিসেনার ডিবাউন্স (≥১৫০ms) বা `requestAnimationFrame`।
7. **ফাইল ডিলিট/রিনেম/মার্জ করার নিয়ম (ভাঙা বিল্ড এড়াতে):**
   - আগে `grep -rn "<ফাইলের নাম>" app components lib` দিয়ে **সব নির্ভরশীল ফাইল** বের করো।
   - **আগে নতুন/বিকল্প ফাইল তৈরি, সব ইমপোর্ট ঠিক, সবশেষে পুরনোটা মোছা।**
   - শেষে `npx tsc --noEmit` পাস না হলে কাজ শেষ নয়।

---

## ৯. পেজের অবস্থা ও রেফারেন্স (২০২৬-১০-০৪)

### ✅ নতুন ডিজাইনে (এগুলো থেকে প্যাটার্ন শেখো)

| পেজ | ফাইল |
|---|---|
| অর্ডার | `app/(admin)/orders/OrdersPageClient.tsx`, `components/orders/{OrdersToolbar,OrdersTable,OrderDetailModal,CsvExportMenu,OrderStatusDropdown}.tsx` |
| কাস্টমার | `app/(admin)/customers/CustomersPageClient.tsx`, `components/customers/CustomersTable.tsx` |
| প্রোডাক্ট | `app/(admin)/products/ProductsPageClient.tsx`, `components/products/{ProductsTable,ProductModal,QuickEditPopover,CategoryPicker,ImageManager}.tsx` |
| গাইড মডাল | `components/guides/{GuidePagesListModal,GuideEditorModal,GuideFieldPrimitives,GuideBlockEditors}.tsx` |
| কুপন | `app/(admin)/coupons/CouponsPageClient.tsx`, `components/coupons/{CouponModal,CouponStatCards,CouponsTable}.tsx` |
| অফার | `components/offers/OffersPageClient.tsx` |
| ক্যাটাগরি | `components/design/CategoriesPageClient.tsx` |
| রিভিউ ও প্রশ্নোত্তর | `components/reviews/{ProductReviewsQnAPageClient,ReviewsPanel,QnAPanel}.tsx` |
| রিভিউ গ্যালারি | `components/reviews/ReviewGalleryPageClient.tsx` |
| নিট প্রফিট | `app/(admin)/profit/ProfitPageClient.tsx`, `components/profit/{ProfitStatCards,ProfitChart,ProfitDayTable}.tsx` |
| হিরো ক্যাটাগরি কার্ড | `components/design/HeroCardsPageClient.tsx` |
| গাইড টেমপ্লেট | `components/design/GuideTemplatesPageClient.tsx` (+ `GuideBlockListEditor`-এ `ConfirmDialog`) |
| AI প্ল্যানার | `app/(admin)/products/parser/ParserPageClient.tsx` |
| স্কেলিটন | `components/admin/PageSkeleton.tsx` (টুলবার কার্ড + কার্ড তালিকার কাঠামো) |

### ⏳ বাকি (এখনও পুরনো টোকেন/প্যাটার্ন আছে)

| পেজ/অংশ | ফাইল | কী বাকি |
|---|---|---|
| ড্যাশবোর্ড | `app/(admin)/page.tsx`, `components/dashboard/*` | `brand-primary`, `shadow-xs`; কার্ডে ব্লার; §৫ রেসিপিতে আনা |
| ট্রাফিক | `components/traffic/*` | `brand-primary`/`brand-accent` (চার্ট ও টেবিল) |
| লগইন | `app/login/page.tsx` | `brand-primary` |
| সাইডবার | `components/admin/Sidebar.tsx` | `shadow-xs` (নিষ্ক্রিয় ক্লাস) |
| অব্যবহৃত | `components/coupons/DeleteConfirmDialog.tsx`, `components/admin/PageHeader.tsx` | কেউ ব্যবহার করে না; নিরাপদে মোছা যায় |

### ⚠️ পরিচিত ঋণ (জানা আছে, আলাদা সেশনে ঠিক হবে)
- মোবাইলে ৩৬px টাচ টার্গেট: ফিল্টার চিপ, "সবকিছু দেখুন" বাটন, `Pagination` বোতাম, `Checkbox` (§৭-১)। *(প্রোডাক্ট কার্ডের গ্রিপ/এডিট/ডিলিট ইতিমধ্যে ৪৪px।)*
- কিছু ছোট `text-brand-light` লেখার কনট্রাস্ট (§৭-২)।
- `tailwind.config.ts`-এর অব্যবহৃত অ্যানিমেশন কীফ্রেম (`cartJiggle`, `heartbeat`, `ripple`, `liquidWobble`, `weatherFloat` …) — মূল সাইটের সাথে sync রাখতে আছে; অ্যাডমিনে ব্যবহার করবে না।

---

## ১০. চেকলিস্ট ও যাচাই

### সেলফ-চেকলিস্ট
- [ ] গাঢ় নীল টোকেন/hex নেই? নিষিদ্ধ ক্লাস (§৩.১) নেই?
- [ ] অপাসিটি ৫-এর গুণিতক বা `[0.xx]`?
- [ ] মোবাইলে কার্ড (`lg:hidden`), ডেস্কটপে টেবিল (`hidden lg:block`)? আড়াআড়ি-স্ক্রল টেবিল নেই?
- [ ] পেজের উপরে লোগো/টাইটেল/সাবটাইটেল নেই?
- [ ] তালিকা বড় হতে পারলে কার্ড কম্প্যাক্ট + "সবকিছু দেখুন"?
- [ ] মডাল ≥ `z-[60]`, `dvh`, স্টিকি হেডার/ফুটার, ফুটারে সেফ-এরিয়া, এরর ফুটারে?
- [ ] `confirm()/alert()` নেই — `ConfirmDialog`/`showToast`?
- [ ] চেকবক্স = `Checkbox`, select = `SelectBox`/`select-chevron`, ফিল্ড = `Field`?
- [ ] হেডিং/লেবেলে ইমোজি নেই; সেকশন = `SectionHeading`?
- [ ] মোবাইলে নতুন কন্ট্রোল ≥৪৪px, `active:` ফিডব্যাক, আইকন-বাটনে `aria-label`?
- [ ] কার্ডে `backdrop-blur` নেই; অনন্ত অ্যানিমেশন নেই?
- [ ] তারিখ `formatDateBn`; সংখ্যা `toLocaleString('en-US')`; PAGE_SIZE `lib/constants/pagination.ts` থেকে?
- [ ] **লজিক, props, সার্ভার অ্যাকশন অপরিবর্তিত?** টেক্সট ইনপুটে `sanitizeInput`?
- [ ] ফাইল মুছলে/নাম বদলালে সব ইমপোর্টার ঠিক করা হয়েছে?

### যাচাইয়ের কমান্ড (কাজ শেষের আগে)
```bash
npx tsc --noEmit                      # টাইপ-চেক — ০ ত্রুটি হতে হবে
npx eslint app components lib types   # লিন্ট — ০ ত্রুটি
npx next build                        # পুরো বিল্ড (Google Fonts-এর জন্য ইন্টারনেট লাগে)

# নিষিদ্ধ ক্লাস খোঁজা (নতুন/বদলানো ফাইলে ফল ফাঁকা হতে হবে)
grep -rnE "glass-card|text-brand-dark|shadow-xs|brand-primary|brand-accent|brand-grad" app components

# অবৈধ অপাসিটি ধাপ খোঁজা
grep -rnE "(bg|border|text|ring|from|to|via)-[a-z-]+/(1[1-4]|1[6-9]|2[1-4]|2[6-9]|3[1-4]|3[6-9]|4[1-4]|4[6-9])\b" app components
```

### স্কেলিটনের নিয়ম
লোডিং স্কেলিটন আসল পেজের কাঠামো নকল করবে (টুলবার কার্ড → চিপ সারি → ৪-৬টা কার্ড/সারি), আসল পেজে না থাকা উপাদান (যেমন পেজ-টাইটেল) আঁকবে না। ক্লাস `animate-pulse rounded-brand bg-black/[.06]`।

---

## ১১. পরিবর্তন লগ

- **v2 (২০২৬-১০-০৪):** সম্পূর্ণ নতুন করে লেখা। স্কাই-ব্লু-অনলি নিয়ম; কার্ড/টেবিল, মডাল-শীট, ড্রপডাউন-শীট, কম্প্যাক্ট এক্সপ্যান্ডেবল কার্ড, ওপেন হেডিং, ফর্ম ফিল্ড, `ConfirmDialog` রেসিপি; Tailwind ফাঁদ; পেজ-স্ট্যাটাস; যাচাই কমান্ড।
- **v1 (আদি):** মূল সাইটের টোকেন কপি; `brand-primary` প্রাইমারি (**বাতিল**)।
