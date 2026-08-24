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
  total: number;
  payment_txn: string;
  payment_last4: string;
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
