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

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category_id: string;
  images: string[];
  specs: Record<string, string>;
  order_index: number;
}

export interface Category {
  id: string;
  name: string;
  order_index: number;
}

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
