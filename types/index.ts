// legacy admin.html-এর ব্যবহার থেকে আন্দাজ করা base shape।
// প্রতিটা module convert করার সময় (Phase B) আসল Supabase column
// নাম/টাইপ verify করে এই ফাইল হালনাগাদ করতে হবে — অনুমান করে code
// লেখা যাবে না, প্রতিটা table-এর real schema Supabase Dashboard-এ
// গিয়ে verify করে নিতে হবে।

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'rejected';

// ⚠️ আপডেট (রিজেক্ট + স্টক রিস্টোর ফিচারের সাথে): checkout (Vangcur)-এর
// cart item shape-এ আসলে `id` (আর `cat`) ফিল্ড থাকে (lib/cartData.ts-এর
// addToCart()/CartItem দ্রষ্টব্য), যেটা `verifiedItems`-এর মাধ্যমে
// অপরিবর্তিত অবস্থায় orders.items-এ সেভ হয়ে যায় — কিন্তু এই টাইপে আগে
// `id` declare করা ছিল না। এখন যোগ করা হলো যাতে reject-এ স্টক রিস্টোর
// করার সময় প্রতিটা item ঠিক কোন product-এর, সেটা চেনা যায়। পুরনো অর্ডার
// (যদি কখনো id ছাড়া সেভ হয়ে থাকে) হ্যান্ডেল করতে optional রাখা হলো।
export interface OrderItem {
  id?: number | string;
  name: string;
  qty: number;
  price: number;
  emoji?: string;
}

// ✅ VERIFIED (Module ১ — Dashboard): কলাম নামগুলো legacy admin.html-এর
// getOrdersAsync()/viewOrder()/setOrderStatus()-এ সরাসরি Supabase-এ
// পড়া/লেখা হওয়া column নাম থেকে নেওয়া (অনুমান না — production কোড
// আসলেই এই কলামগুলো ব্যবহার করে)। তবে owner চাইলে Supabase Dashboard-এ
// গিয়ে column type (numeric/text) once spot-check করে নেওয়া ভালো,
// বিশেষ করে shipping_cost/subtotal/total সংখ্যাসূচক কিনা।
export interface Order {
  id: string;
  order_num: string;
  created_at: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_district: string;
  customer_address: string;
  customer_email: string;
  items: OrderItem[];
  shipping: string;
  shipping_cost: number;
  subtotal: number;
  // কুপন ছাড়ের পরিমাণ (৳) — কুপন প্রয়োগ না হলে ০। total = (subtotal - discount_amount) + shipping_cost
  discount_amount: number;
  // প্রয়োগ করা কুপন কোড (যেমন 'SAVE100'), কুপন ছাড়া অর্ডারে null
  coupon_code: string | null;
  total: number;
  // ডায়নামিক অ্যাডভান্স — storefront-এ total অনুযায়ী গণনা করা (৳২০০ ফিক্সড না, ৳৮,০০০+ অর্ডারে 5% + 1.5% bKash ফি)।
  // legacy অর্ডারে কলাম না থাকলে (null/undefined) mapOrderRow ফলব্যাক হিসেবে ২০০ বসায়।
  advance_paid: number;
  payment_txn: string;
  payment_last4: string;
  // গ্রাহকের ডিভাইস ফিঙ্গারপ্রিন্ট আইডি (bKash manual verify ফ্লো থেকে) — না থাকলে null
  fingerprint_id: string | null;
  ip: string;
}

// ✅ VERIFIED (Module ৩ — Products): Supabase টেবিল `custom_products`।
// legacy `admin.html`-এর saveProd()/editProd() থেকে হুবহু কলাম যাচাই করে বসানো।
// note: hardcoded "default 6 products" (legacy DEFAULT_PRODS) সিস্টেমটা এই
// রি-রাইটে ইচ্ছাকৃতভাবে বাদ দেওয়া হয়েছে (owner অনুমোদিত সিদ্ধান্ত) —
// `custom_products` টেবিলই এখন একমাত্র সোর্স অফ ট্রুথ।
export interface ProductFaq {
  q: string;
  a: string;
}

// specs একটা free-form key-value বাংলা/ইংরেজি স্পেসিফিকেশন ম্যাপ, প্লাস
// কয়েকটা আন্ডারস্কোর-প্রিফিক্স internal key (product card/page-এ দেখানো হয় না):
//  _quick_keys       — কোন keys "স্পেসিফিকেশন এক নজরে" হিসেবে দেখাবে
//  _discount_color   — '' (ডিফল্ট কমলা) | 'green' (স্পেশাল ডিসকাউন্ট ব্যাজ রং)
//  _profit           — প্রতি ইউনিট প্রফিট (৳), শুধু admin দেখে, নেট প্রফিট হিসাবে ব্যবহার হয়
export interface ProductSpecs {
  _quick_keys?: string[];
  _discount_color?: '' | 'green';
  _profit?: number;
  [key: string]: string | string[] | number | undefined;
}

// একটা optional "extra info box" — description-এর ভেতরে মিশে না গিয়ে
// প্রোডাক্ট পেজে "অতিরিক্ত তথ্য" ট্যাবে আলাদা card হিসেবে দেখায় (যেমন
// "৫ Meter আসলে কতটা", "কোথায় ব্যবহার করবেন")। যতগুলো ইচ্ছা যোগ করা যায়,
// প্রোডাক্টে না থাকলে ফাঁকা array রাখলেই হবে।
export interface ProductInfoBox {
  title: string;
  body: string;
}

export interface Product {
  id: number;
  name: string;
  name_bn: string | null;
  price: number;
  old: number;
  cat: string; // primary category id — backward compat, সবসময় cats[0]
  cats: string[]; // multi-category id লিস্ট
  stock: number;
  warranty: string;
  imgs: string[]; // প্রতিটা এন্ট্রি হয় image URL, নয়তো emoji fallback (📦)
  specs: ProductSpecs;
  desc_text: string;
  long_desc: string; // বর্তমান ফর্মে desc_text-এর সাথে একই মান সেভ হয় (legacy compat কলাম)
  features: string[];
  badge: string;
  rating: number;
  faqs: ProductFaq[];
  closing: string;
  // 🆕 (নিয়ন লাইট প্রোডাক্ট পেজ রিফরম্যাট, ২০২৬-০৮): দুটোই সম্পূর্ণ
  // optional — খালি/null থাকলে প্রোডাক্ট পেজে সংশ্লিষ্ট অংশ একদম দেখাবে না।
  power_info: string | null; // Power adapter/connection স্পেসিফিকেশন — Specification ট্যাবে টেবিলের নিচে আলাদা বক্সে বসে, সব প্রোডাক্টে থাকবে না
  info_boxes: ProductInfoBox[]; // "অতিরিক্ত তথ্য" ট্যাবে আলাদা কার্ড হিসেবে দেখানো হয়
  // 🆕 (AI Planner + SEO ফিল্ড ওভারহল, ২০২৬-০৮): সবগুলো সম্পূর্ণ optional —
  // খালি/null থাকলে সাইট auto-generated fallback ব্যবহার করে (নিচে দেখুন),
  // পুরনো প্রোডাক্টের আচরণ অপরিবর্তিত থাকে।
  seo_h1: string | null; // খালি হলে সাইটে প্রোডাক্টের `name`-ই <h1> হিসেবে দেখাবে
  meta_title: string | null; // খালি হলে সাইট আগের মতোই "নাম - ৳দাম | Vangcur" অটো-জেনারেট করবে
  meta_description: string | null; // খালি হলে সাইট আগের মতোই desc_text থেকে auto-truncate করবে
  og_description: string | null; // খালি হলে meta_description (বা তার auto fallback) ব্যবহার হবে
  quick_specs_text: string | null; // 🆕 "স্পেসিফিকেশন এক নজরে" — ফ্রি-ফ্লো টেক্সট, "•" দিয়ে আলাদা পিল হিসেবে দেখাবে (পুরনো প্রোডাক্টে এটা খালি থাকলে সাইট আগের _quick_keys সিস্টেমে ফলব্যাক করে)
  packaging_content: string | null; // 🆕 Packaging Content — Power Info বক্সের ঠিক পরে (Power Info না থাকলে Technical Specification-এর পরে) আলাদা বক্সে দেখায়
  created_at?: string;
}

// নতুন প্রোডাক্ট তৈরির সময় id/created_at বাদে বাকি সব ফিল্ড লাগবে
export type ProductInput = Omit<Product, 'id' | 'created_at'>;

export interface StoreSetting {
  setting_key: string;
  setting_value: string;
}

// ✅ VERIFIED (Module ১৪ — Review Gallery): Supabase টেবিল `customer_reviews`।
// legacy admin.html-এর loadReviewGallery()/saveReview() শুধু id/image_url/created_at
// পড়ে-লেখে (select('*') হলেও admin এই তিনটার বাইরে কিছু ব্যবহার করে না — টেবিলে
// আরও কলাম থাকতে পারে মূল সাইটের রিভিউ সেকশনের জন্য, কিন্তু admin সেগুলো ছোঁয় না)।
export interface Review {
  id: number;
  image_url: string;
  created_at: string;
}

// ✅ VERIFIED (Module ১৩ — Offers Popup): কোনো আলাদা "offers" টেবিল নেই —
// legacy admin.html-এর _offerCfg ঠিক এই শেপে `store_settings` key
// 'vc_offer_popup'-এ (একটাই JSON অবজেক্ট, একবারে সর্বোচ্চ একটা মডেল active থাকে)।
export interface OfferModel1 {
  title: string;
  body: string;
  btn_text: string;
  btn_url: string;
}

export interface OfferModel2 {
  img: string;
  url: string;
}

export interface OfferModel3 {
  product_id: string;
  badge_text: string;
}

export type OfferActiveModel = 'none' | 'model1' | 'model2' | 'model3';

export interface OfferConfig {
  active_model: OfferActiveModel;
  model1: OfferModel1;
  model2: OfferModel2;
  model3: OfferModel3;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

// ✅ VERIFIED (Module ৪ — Customers): legacy `admin.html`-এ আলাদা কোনো
// `customers` টেবিল নেই — renderCustomers() `orders` টেবিলের রো থেকেই
// ফোন/নাম দিয়ে client-side গ্রুপ করে এই শেপ বানাত। তাই এটা কোনো Supabase
// row না, orders থেকে derive করা কম্পিউটেড টাইপ (দেখুন lib/customers.ts)।
export interface Customer {
  name: string;
  phone: string;
  email: string;
  order_count: number;
  total_spent: number;
  last_order_date: string;
}

export interface TrafficDay {
  date: string;
  page_views: number;
}

// 🆕 (রিভিউ ও প্রশ্নোত্তর মডারেশন মডিউল): Supabase টেবিল `product_reviews` —
// প্রোডাক্ট পেজে গ্রাহকদের রেটিং/রিভিউ, admin approve/reject না করা পর্যন্ত
// সাইটে দেখায় না। `product_name` কোনো DB কলাম না — action লেয়ারে
// `custom_products` থেকে জয়েন করে বসানো হয় (UI-তে দেখানোর জন্য)।
export interface ProductReview {
  id: number;
  product_id: number;
  user_id: string | null;
  user_name: string;
  rating: number; // ১-৫
  review_text: string;
  image_url: string | null;
  like_count: number;
  is_verified_buyer: boolean;
  is_approved: boolean;
  is_rejected: boolean;
  rejection_reason: string | null;
  created_at: string;
  product_name?: string;
}

export type ReviewModerationStatus = 'pending' | 'approved' | 'rejected';

// 🆕 Supabase টেবিল `product_questions` — গ্রাহকের প্রোডাক্ট-সম্পর্কিত প্রশ্ন।
export interface ProductQuestion {
  id: number;
  product_id: number;
  user_id: string | null;
  user_name: string;
  question: string;
  created_at: string;
  product_name?: string;
}

// 🆕 Supabase টেবিল `product_question_answers` — একটা প্রশ্নের একাধিক
// উত্তর হতে পারে (admin + অন্য গ্রাহক), `is_admin: true` হলে Vangcur টিমের
// অফিসিয়াল উত্তর হিসেবে দেখানো হয়।
export interface ProductQuestionAnswer {
  id: number;
  question_id: number;
  user_id: string | null;
  author_name: string;
  is_admin: boolean;
  answer: string;
  created_at: string;
}

export interface ProductQuestionWithAnswers extends ProductQuestion {
  answers: ProductQuestionAnswer[];
}

// ✅ VERIFIED (Coupon Management মডিউল): Supabase টেবিল `coupons` — owner
// নিজে schema দিয়ে দিয়েছেন (অনুমান করা হয়নি)। `free_shipping` টাইপে
// `discount_value`-এর বাস্তব কোনো অর্থ নেই, কিন্তু DB constraint অনুযায়ী
// এটা সবসময় > 0 হতে হবে — তাই ফর্মে (CouponModal) এই টাইপের জন্য ফিল্ডটা
// লুকিয়ে রেখে ১ (placeholder) সেট করে দেওয়া হয়, UI-তে এটা কোথাও দেখানো হয় না।
export type CouponDiscountType = 'fixed' | 'percent' | 'free_shipping';

export interface Coupon {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number;
  max_uses_total: number | null;
  used_count: number;
  max_uses_per_user: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

// UI-only ডেরাইভড স্ট্যাটাস — কোনো DB কলাম না। `is_active` আর `expires_at`
// দুটো মিলিয়ে হিসাব করা হয় (lib/coupons.ts-এর getCouponStatus())।
export type CouponStatus = 'active' | 'expired' | 'inactive';

export interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  totalUsedCount: number;
  totalDiscountGiven: number;
}
