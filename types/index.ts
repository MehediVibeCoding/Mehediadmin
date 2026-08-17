// legacy admin.html-এর ব্যবহার থেকে আন্দাজ করা base shape।
// প্রতিটা module convert করার সময় (Phase B) আসল Supabase column
// নাম/টাইপ verify করে এই ফাইল হালনাগাদ করতে হবে — অনুমান করে code
// লেখা যাবে না, প্রতিটা table-এর real schema Supabase Dashboard-এ
// গিয়ে verify করে নিতে হবে।

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'cancelled';

export interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  total: number;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
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
  created_at?: string;
}

// নতুন প্রোডাক্ট তৈরির সময় id/created_at বাদে বাকি সব ফিল্ড লাগবে
export type ProductInput = Omit<Product, 'id' | 'created_at'>;

export interface StoreSetting {
  setting_key: string;
  setting_value: string;
}

export interface Review {
  id: string;
  customer_name: string;
  content: string;
  rating: number;
  image_url?: string;
  created_at: string;
}

export interface Offer {
  id: string;
  title: string;
  discount_percent: number;
  active: boolean;
  starts_at?: string;
  ends_at?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

export interface Customer {
  email: string;
  name: string;
  phone: string;
  order_count: number;
}

export interface TrafficDay {
  date: string;
  page_views: number;
}
