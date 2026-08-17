// legacy admin.html-এর DEFAULT_CATS থেকে হুবহু পোর্ট করা — কোনো নতুন
// category/icon তৈরি করা হয়নি। store_settings key 'vc_categories'-এ
// owner সেভ করা কাস্টম লিস্ট না থাকলে এটাই ব্যবহার হয় (getCategories() দ্রষ্টব্য)।
export interface CategoryOption {
  id: string;
  name: string;
  icon: string; // emoji অথবা raw <svg> markup
}

export const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: "all", name: "All Products", icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\"><defs><linearGradient id=\"ag\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#3B82F6\"/><stop offset=\"100%\" stop-color=\"#E63946\"/></linearGradient></defs><path d=\"M2 3h1.5l.5 1h16l-2 8H6L4.5 4H3L2 3z\" fill=\"url(#ag)\"/><circle cx=\"7\" cy=\"17\" r=\"2\" fill=\"#E63946\"/><circle cx=\"15\" cy=\"17\" r=\"2\" fill=\"#3B82F6\"/></svg>" },
  { id: "tws", name: "TWS", icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" fill=\"#10B981\"><path d=\"M5.5 13a3.5 3.5 0 0 1-3.5-3.5v-1A3.5 3.5 0 0 1 5.5 5H6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-.5zm0 2H6a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-.5A5.5 5.5 0 0 0 0 9.5v1A5.5 5.5 0 0 0 5.5 16zM6 16v2a2 2 0 0 0 4 0v-1.268A5.5 5.5 0 0 1 5.5 16H6zm12.5-3a3.5 3.5 0 0 0 3.5-3.5v-1A3.5 3.5 0 0 0 18.5 5H18a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5zm0 2H18a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h.5A5.5 5.5 0 0 1 24 9.5v1A5.5 5.5 0 0 1 18.5 16zM18 16v2a2 2 0 0 1-4 0v-1.268A5.5 5.5 0 0 0 18.5 16H18z\"/></svg>" },
  { id: "powerbank", name: "Power Bank", icon: "\ud83d\udd0b" },
  { id: "rgb", name: "RGB Light", icon: "\ud83d\udca1" },
  { id: "smartwatch", name: "Smart Watch", icon: "\u231a" },
  { id: "acrylic", name: "Acrylic Lamp", icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\"><defs><linearGradient id=\"acrg\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#A855F7\"/><stop offset=\"100%\" stop-color=\"#EC4899\"/></linearGradient><radialGradient id=\"acrg2\" cx=\"50%\" cy=\"40%\" r=\"50%\"><stop offset=\"0%\" stop-color=\"#FDE68A\"/><stop offset=\"100%\" stop-color=\"#F59E0B\" stop-opacity=\"0.4\"/></radialGradient></defs><rect x=\"8\" y=\"18\" width=\"8\" height=\"4\" rx=\"1\" fill=\"#7C3AED\"/><rect x=\"10\" y=\"14\" width=\"4\" height=\"5\" rx=\".5\" fill=\"#8B5CF6\"/><ellipse cx=\"12\" cy=\"10\" rx=\"5\" ry=\"7\" fill=\"url(#acrg)\"/><ellipse cx=\"12\" cy=\"9\" rx=\"3.5\" ry=\"5\" fill=\"url(#acrg2)\"/><circle cx=\"12\" cy=\"7\" r=\"2\" fill=\"#FFF8DC\" opacity=\".9\"/><path d=\"M10 20 L14 20\" stroke=\"#5B21B6\" stroke-width=\"1\" stroke-linecap=\"round\"/></svg>" },
  { id: "headphone", name: "Headphone", icon: "\ud83c\udfa7" },
  { id: "fan", name: "Rechargeable Fan", icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\"><defs><linearGradient id=\"fg\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#3B82F6\"/><stop offset=\"100%\" stop-color=\"#06B6D4\"/></linearGradient></defs><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"#EFF6FF\"/><path d=\"M12 12 C10 8 7 7 7 4 C7 2.5 9 2 11 3.5 C13 5 12.5 9 12 12Z\" fill=\"url(#fg)\"/><path d=\"M12 12 C16 10 17 7 20 7 C21.5 7 22 9 20.5 11 C19 13 15 12.5 12 12Z\" fill=\"url(#fg)\"/><path d=\"M12 12 C14 16 17 17 17 20 C17 21.5 15 22 13 20.5 C11 19 11.5 15 12 12Z\" fill=\"url(#fg)\"/><path d=\"M12 12 C8 14 7 17 4 17 C2.5 17 2 15 3.5 13 C5 11 9 11.5 12 12Z\" fill=\"url(#fg)\"/><circle cx=\"12\" cy=\"12\" r=\"2\" fill=\"#1E3A8A\"/></svg>" },
  { id: "unique", name: "Unique Collection", icon: "\ud83d\udc8e" },
  { id: "crystalball", name: "Crystal Ball", icon: "\ud83d\udd2e" },
  { id: "waterbottle", name: "Water Bottle", icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" fill=\"none\"><rect x=\"9\" y=\"2\" width=\"6\" height=\"3\" rx=\"1\" fill=\"#64748B\"/><path d=\"M7 6 C7 5 8 5 8 5 L16 5 C16 5 17 5 17 6 L18 20 C18 21 17 22 16 22 L8 22 C7 22 6 21 6 20 Z\" fill=\"#3B82F6\"/><path d=\"M7 6 L17 6 L16.5 10 L7.5 10 Z\" fill=\"#60A5FA\"/><rect x=\"7\" y=\"10\" width=\"10\" height=\"1\" rx=\".5\" fill=\"rgba(255,255,255,.3)\"/><ellipse cx=\"12\" cy=\"16\" rx=\"3\" ry=\"2\" fill=\"rgba(255,255,255,.2)\"/><path d=\"M9 13 Q10 12.5 11 13 Q12 13.5 13 13\" stroke=\"rgba(255,255,255,.5)\" stroke-width=\".7\" fill=\"none\" stroke-linecap=\"round\"/></svg>" },
  { id: "wifiups", name: "Wifi UPS", icon: "\ud83c\udfae" },
  { id: "humidifier", name: "Humidifier", icon: "\ud83d\udca7" },
  { id: "keyboard", name: "Keyboard", icon: "\u2328\ufe0f" },
  { id: "gimbal", name: "Gimbal", icon: "\ud83d\udcf8" },
  { id: "light", name: "Light", icon: "\ud83e\ude94" },
  { id: "mouse", name: "Mouse", icon: "\ud83d\uddb1\ufe0f" },
  { id: "cable", name: "Cable And Charges", icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" fill=\"none\"><rect x=\"9\" y=\"2\" width=\"6\" height=\"4\" rx=\"1\" fill=\"#F59E0B\"/><rect x=\"10\" y=\"4\" width=\"4\" height=\"8\" rx=\"1\" fill=\"#D97706\"/><path d=\"M12 12 C12 15 15 16 15 19\" stroke=\"#6B7280\" stroke-width=\"2\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M12 12 C12 15 9 16 9 19\" stroke=\"#6B7280\" stroke-width=\"2\" stroke-linecap=\"round\" fill=\"none\"/><rect x=\"7\" y=\"19\" width=\"10\" height=\"3\" rx=\"1\" fill=\"#F59E0B\"/><rect x=\"10\" y=\"3\" width=\"1.5\" height=\"2\" rx=\".3\" fill=\"#1A1A1A\"/><rect x=\"12.5\" y=\"3\" width=\"1.5\" height=\"2\" rx=\".3\" fill=\"#1A1A1A\"/></svg>" },
  { id: "unique-tools", name: "Unique Tools", icon: "\ud83d\udd27" },
  { id: "hairdryer", name: "Hair Dryer", icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" fill=\"none\"><ellipse cx=\"10\" cy=\"10\" rx=\"6\" ry=\"7\" fill=\"#EC4899\" transform=\"rotate(-30 10 10)\"/><ellipse cx=\"10\" cy=\"10\" rx=\"4\" ry=\"5\" fill=\"#F9A8D4\" transform=\"rotate(-30 10 10)\"/><path d=\"M14 13 L20 17\" stroke=\"#9D174D\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><circle cx=\"9.5\" cy=\"9.5\" r=\"2\" fill=\"#9D174D\" opacity=\".7\"/><path d=\"M17 4 Q19 6 18 8\" stroke=\"#F9A8D4\" stroke-width=\"1.2\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M19 6 Q21 8 20 10\" stroke=\"#FBCFE8\" stroke-width=\"1\" stroke-linecap=\"round\" fill=\"none\"/></svg>" },
  { id: "toys", name: "Toys", icon: "\ud83e\uddf8" },
  { id: "alarmclock", name: "Alarm Clock", icon: "\u23f0" },
  { id: "lamp", name: "Lamp", icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\"><defs><radialGradient id=\"lg\" cx=\"50%\" cy=\"70%\" r=\"60%\"><stop offset=\"0%\" stop-color=\"#FFE566\"/><stop offset=\"100%\" stop-color=\"#FF9800\" stop-opacity=\"0.3\"/></radialGradient></defs><ellipse cx=\"12\" cy=\"21\" rx=\"4\" ry=\"1.2\" fill=\"#D4A853\" opacity=\".5\"/><rect x=\"11\" y=\"16\" width=\"2\" height=\"5\" rx=\"1\" fill=\"#A0522D\"/><rect x=\"8.5\" y=\"15\" width=\"7\" height=\"1.5\" rx=\".75\" fill=\"#8B4513\"/><path d=\"M8 4 Q12 2 16 4 L15 15 H9 Z\" fill=\"url(#lg)\"/><path d=\"M8 4 Q12 2 16 4 L15 15 H9 Z\" fill=\"#FFD700\" opacity=\".6\"/><ellipse cx=\"12\" cy=\"14.5\" rx=\"3\" ry=\".8\" fill=\"#FF9800\" opacity=\".4\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\" fill=\"#FFF176\" opacity=\".85\"/></svg>" },
  { id: "usbhub", name: "USB HUB", icon: "\ud83d\udd17" },
  { id: "accessories", name: "Accessories", icon: "\ud83c\udf92" },
  { id: "powerstrip", name: "Power Strip", icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" fill=\"none\"><rect x=\"2\" y=\"9\" width=\"20\" height=\"7\" rx=\"2\" fill=\"#374151\"/><rect x=\"5\" y=\"11\" width=\"3.5\" height=\"4\" rx=\".5\" fill=\"#1F2937\"/><rect x=\"5.7\" y=\"11.8\" width=\"0.9\" height=\"1.2\" rx=\".3\" fill=\"#F59E0B\"/><rect x=\"7\" y=\"11.8\" width=\"0.9\" height=\"1.2\" rx=\".3\" fill=\"#F59E0B\"/><rect x=\"10\" y=\"11\" width=\"3.5\" height=\"4\" rx=\".5\" fill=\"#1F2937\"/><rect x=\"10.7\" y=\"11.8\" width=\"0.9\" height=\"1.2\" rx=\".3\" fill=\"#F59E0B\"/><rect x=\"12\" y=\"11.8\" width=\"0.9\" height=\"1.2\" rx=\".3\" fill=\"#F59E0B\"/><rect x=\"15\" y=\"11\" width=\"3.5\" height=\"4\" rx=\".5\" fill=\"#1F2937\"/><rect x=\"15.7\" y=\"11.8\" width=\"0.9\" height=\"1.2\" rx=\".3\" fill=\"#F59E0B\"/><rect x=\"17\" y=\"11.8\" width=\"0.9\" height=\"1.2\" rx=\".3\" fill=\"#F59E0B\"/><circle cx=\"21\" cy=\"12.5\" r=\"1\" fill=\"#10B981\"/><path d=\"M3 13 L1 13\" stroke=\"#6B7280\" stroke-width=\"1.5\" stroke-linecap=\"round\"/></svg>" },
  { id: "projector", name: "Projector", icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" fill=\"none\"><rect x=\"3\" y=\"7\" width=\"14\" height=\"10\" rx=\"2\" fill=\"#1E293B\"/><circle cx=\"8\" cy=\"12\" r=\"3\" fill=\"#0F172A\" stroke=\"#3B82F6\" stroke-width=\".8\"/><circle cx=\"8\" cy=\"12\" r=\"1.5\" fill=\"#3B82F6\" opacity=\".7\"/><circle cx=\"8\" cy=\"12\" r=\".6\" fill=\"#93C5FD\"/><circle cx=\"13.5\" cy=\"14\" r=\"1\" fill=\"#10B981\" opacity=\".8\"/><path d=\"M17 11 L21 8\" stroke=\"#FCD34D\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\".7\"/><path d=\"M17 13 L21 16\" stroke=\"#FCD34D\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\".7\"/><path d=\"M17 12 L22 12\" stroke=\"#FCD34D\" stroke-width=\"1.2\" stroke-linecap=\"round\" opacity=\".9\"/></svg>" },
  { id: "neckband", name: "Neckband", icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" fill=\"none\"><path d=\"M5 8 Q5 4 12 4 Q19 4 19 8\" stroke=\"#8B5CF6\" stroke-width=\"2.5\" stroke-linecap=\"round\" fill=\"none\"/><rect x=\"2\" y=\"7\" width=\"4\" height=\"7\" rx=\"2\" fill=\"#7C3AED\"/><circle cx=\"4\" cy=\"10.5\" r=\"1.5\" fill=\"#DDD6FE\" opacity=\".7\"/><rect x=\"18\" y=\"7\" width=\"4\" height=\"7\" rx=\"2\" fill=\"#7C3AED\"/><circle cx=\"20\" cy=\"10.5\" r=\"1.5\" fill=\"#DDD6FE\" opacity=\".7\"/><line x1=\"4\" y1=\"14\" x2=\"4\" y2=\"19\" stroke=\"#A78BFA\" stroke-width=\"1.5\" stroke-linecap=\"round\"/><line x1=\"20\" y1=\"14\" x2=\"20\" y2=\"19\" stroke=\"#A78BFA\" stroke-width=\"1.5\" stroke-linecap=\"round\"/><circle cx=\"4\" cy=\"20\" r=\"1.2\" fill=\"#C4B5FD\"/><circle cx=\"20\" cy=\"20\" r=\"1.2\" fill=\"#C4B5FD\"/></svg>" },
  { id: "kitchenaccessories", name: "Kitchen Accessories", icon: "\ud83c\udf73" },
  { id: "offer", name: "Offers", icon: "\ud83c\udff7\ufe0f" },
  { id: "btspeaker", name: "BT Speaker", icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" fill=\"none\"><defs><linearGradient id=\"spg\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#1E3A5F\"/><stop offset=\"100%\" stop-color=\"#0F1C2E\"/></linearGradient></defs><rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"4\" fill=\"url(#spg)\"/><rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"4\" stroke=\"#3B82F6\" stroke-width=\".6\" opacity=\".5\"/><circle cx=\"9\" cy=\"12\" r=\"4.5\" fill=\"#0F1C2E\" stroke=\"#3B82F6\" stroke-width=\".8\"/><circle cx=\"9\" cy=\"12\" r=\"2.5\" fill=\"#152A45\"/><circle cx=\"9\" cy=\"12\" r=\"1.3\" fill=\"#3B82F6\"/><circle cx=\"9\" cy=\"12\" r=\".45\" fill=\"#93C5FD\"/><rect x=\"15\" y=\"8\" width=\"5\" height=\"8\" rx=\"1\" fill=\"#0F1C2E\"/><circle cx=\"17.5\" cy=\"10.5\" r=\"1.1\" fill=\"#1E3A5F\" stroke=\"#3B82F6\" stroke-width=\".5\"/><path d=\"M16.8 9.2 L17.5 8.2 L18.2 9.2\" stroke=\"#3B82F6\" stroke-width=\".6\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M16.8 11.8 L17.5 12.8 L18.2 11.8\" stroke=\"#3B82F6\" stroke-width=\".6\" stroke-linecap=\"round\" fill=\"none\"/><circle cx=\"19.5\" cy=\"7\" r=\".8\" fill=\"#10B981\"/><line x1=\"4.5\" y1=\"12\" x2=\"6.5\" y2=\"12\" stroke=\"#3B82F6\" stroke-width=\".5\" opacity=\".5\"/></svg>" },
];
// legacy getCleanIcon()-এর হুবহু পোর্ট — <select><option>-এর মতো জায়গায়
// raw SVG রেন্ডার করা যায় না, তাই SVG icon হলে category id ধরে একটা
// ইমোজি fallback দেখানো হয়। emoji/text icon হলে সরাসরি সেটাই ফেরত যায়।
const SVG_ICON_FALLBACKS: Record<string, string> = {
  acrylic: '🪔',
  fan: '💨',
  cable: '🔌',
  tws: '🎧',
  neckband: '🎧',
  btspeaker: '🔊',
  projector: '📽️',
  lamp: '🪔',
  hairdryer: '💇',
  powerstrip: '🔌',
  all: '🛍️',
};

export function getCleanIcon(c: CategoryOption | undefined | null): string {
  if (!c || !c.icon) return '📦';
  if (!c.icon.startsWith('<svg')) return c.icon;
  return SVG_ICON_FALLBACKS[c.id] || '📦';
}
