# Vangcur Admin — Design System

মূল সোর্স: `vangcurweb` (main site) repo-র `DESIGN_SYSTEM.md` ও `tailwind.config.ts`।
এই ফাইলের সব token **হুবহু একই** — নতুন কোনো রঙ/স্কেল এখানে বানানো হয়নি। মূল
সাইটে টোকেন বদলালে (`tailwind.config.ts`), এখানেও একই মান বসিয়ে sync রাখতে হবে।

## Brand Colors

| Role | Hex | Tailwind token | ব্যবহার |
|------|-----|-----------------|---------|
| Background / Base | `#C3DEFC` | `brand-bg` | Page background gradient (`brand-bg` → `#DCEBFD` → `white`) |
| Light accent | `#44A4FB` | `brand-light` | মাঝারি-তীব্রতার হাইলাইট, chart accent |
| Contrast / Primary | `#0058C7` | `brand-primary` | Button, active nav item, heading emphasis, primary CTA |
| Secondary Accent | `#005EFC` | `brand-accent` | Badge, hover highlight |
| Surface | `#FFFFFF` | `brand-surface` | Card/sidebar/table background |

## Neutral Colors

| Role | Hex | Tailwind token |
|------|-----|-----------------|
| Text (dark) | `#1A1A1A` | `ink` |
| Muted text | `#6B7280` | `muted` |
| Light background | `#F3F4F6` | `surface-muted` |
| Border | `#E5E7EB` | `border-base` |
| Gold (offer/badge) | `#D4A853` | `gold` |
| Green (success) | `#10B981` | `success` |
| Info blue | `#3B82F6` | `info` |

## Shadows / Radius / Transition

মূল সাইটের মতোই: `shadow-sh1/sh2/sh3`, `rounded-brand` (12px), `transition-brand`
(250ms, cubic-bezier(.4,0,.2,1)) — `tailwind.config.ts`-এ এই একই মান কপি করা হবে।

## Typography

- Display / logo: `Playfair Display, serif`
- Body / UI: `DM Sans, Hind Siliguri, sans-serif`

## Breakpoints (legacy-exact, মূল সাইটের সাথে অভিন্ন)

| Token | Width |
|-------|-------|
| `xs` | 359px |
| `sm2` | 411px |
| `sm` | 480px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1200px |
| `2xl` | 1440px |

---

## Admin-only Patterns (এই সেকশনটা শুধু admin panel-এর জন্য নতুন — কোনো নতুন color/token তৈরি হয়নি, existing token-ই re-use)

legacy `admin.html`-এর CSS থেকে exact spacing/layout নেওয়া হবে, শুধু নিচের patterns-এ সবসময় brand token ব্যবহার করা বাধ্যতামূলক:

- **Sidebar nav**: `brand-surface` background, active item `brand-primary` background + সাদা টেক্সট, inactive item `ink`/`muted`, hover-এ `surface-muted`
- **Stat card (Dashboard)**: `brand-surface` + `shadow-sh1` + `rounded-brand`, বড় সংখ্যা `ink`, লেবেল `muted`, up/down trend indicator `success`/একটা red-family টোকেন প্রয়োজন হলে শুধু ব্যর্থতা/negative trend-এর জন্য আলাদাভাবে সিদ্ধান্ত নিতে হবে (legacy-তে কী রঙ ব্যবহার হতো সেটা verify করে বসানো হবে, নতুন করে বানানো হবে না)
- **Data table (Orders/Products/Customers)**: header row `surface-muted` background + `muted` text uppercase small, row border `border-base`, hover row `surface-muted`, status pill রঙ legacy অনুযায়ী (pending/confirmed/shipped/cancelled — exact legacy hex verify করে token-এ map করা হবে)
- **Chart colors (Revenue/Traffic/Profit)**: primary series `brand-primary`, secondary series `brand-accent`/`brand-light`, gridline `border-base` — কোনো নতুন hex না
- **Modal (Order detail, Product edit, Review edit)**: `brand-surface` + `shadow-sh3` + `rounded-brand`, overlay `ink/50` (black-family opacity, existing Tailwind default)
- **Toast/notification**: success `success`, error-এর জন্য legacy hex verify করে দরকার হলে neutral token থেকেই বানানো হবে

## নোট

- Admin panel-এর কোনো visual decision মূল সাইটের ব্র্যান্ড রঙের বাইরে যাবে না — নতুন hex দরকার মনে হলে আগে owner-কে জানিয়ে `tailwind.config.ts`-এর token লিস্টে যোগ করে নিতে হবে, কোনো component-এ সরাসরি hardcoded hex না
- Legacy `admin.html`-এর exact pixel spacing/padding প্রতিটা component convert করার সময় verify করে Tailwind arbitrary-value syntax-এ (`w-[42px]` ইত্যাদি) বসানো হবে — নতুন spacing scale বানানো হবে না, মূল সাইটের Phase B convention অনুসরণ করে
