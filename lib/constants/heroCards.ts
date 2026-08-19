// legacy admin.html-এর DEFAULT_CATH_CARDS থেকে হুবহু পোর্ট করা — কোনো নতুন
// কার্ড/gradient তৈরি করা হয়নি। store_settings key 'vc_cath_cards'-এ owner
// সেভ করা কাস্টম লিস্ট না থাকলে এটাই ব্যবহার হয় (getHeroCards() দ্রষ্টব্য)।
// মূল সাইটে ঠিক ১৩টা কার্ডের স্লট আছে — HERO_CARDS_MAX তাই থেকেই আসা।
export interface HeroCard {
  label: string;
  img: string;
  emoji: string;
  catId: string;
  bg: string;
}

export const HERO_CARDS_MAX = 13;

export const DEFAULT_HERO_CARDS: HeroCard[] = [
  { label: 'Unique Gadgets', img: '', emoji: '💎', catId: 'unique', bg: 'linear-gradient(155deg,#1a0a1a,#3d0a3d,#5c145c)' },
  { label: 'RGB Neon Light', img: '', emoji: '🌈', catId: 'rgb', bg: 'linear-gradient(155deg,#0a1628,#0f2a5e,#1a3a8f)' },
  { label: 'Mini Printer', img: '', emoji: '🖨️', catId: 'miniprinter', bg: 'linear-gradient(155deg,#0d0520,#1a0a45,#2a1060)' },
  { label: 'Crystal Ball', img: '', emoji: '🔮', catId: 'crystalball', bg: 'linear-gradient(155deg,#0d1b0d,#1a3a1a,#0d2d1a)' },
  { label: 'Acrylic Lamp', img: '', emoji: '🪔', catId: 'acrylic', bg: 'linear-gradient(155deg,#1a0a00,#3d1f00,#5c2d00)' },
  { label: 'Water Bottle', img: '', emoji: '🍶', catId: 'waterbottle', bg: 'linear-gradient(155deg,#1a0020,#3d0050,#2d0070)' },
  { label: 'Moon Lamp', img: '', emoji: '🌙', catId: 'moonlamp', bg: 'linear-gradient(155deg,#00101a,#001f3d,#003366)' },
  { label: 'Headphone', img: '', emoji: '🎧', catId: 'headphone', bg: 'linear-gradient(155deg,#1a0010,#3d0030,#1a0040)' },
  { label: 'Fan', img: '', emoji: '💨', catId: 'fan', bg: 'linear-gradient(155deg,#001a1a,#003d3d,#005252)' },
  { label: 'TWS', img: '', emoji: '🎵', catId: 'tws', bg: 'linear-gradient(155deg,#1a1a00,#3d3d00,#525200)' },
  { label: 'G Lamp', img: '', emoji: '💡', catId: 'glamp', bg: 'linear-gradient(155deg,#00001a,#00003d,#000052)' },
  { label: 'Humidifier', img: '', emoji: '💧', catId: 'humidifier', bg: 'linear-gradient(155deg,#001a0d,#003d1a,#005227)' },
  { label: 'RC Plane', img: '', emoji: '✈️', catId: 'rcplane', bg: 'linear-gradient(155deg,#1a000d,#3d001a,#520027)' },
];
