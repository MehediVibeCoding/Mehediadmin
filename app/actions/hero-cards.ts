'use server';

import { revalidatePath } from 'next/cache';
import { revalidateVangcurCatalog } from '@/lib/revalidateVangcurCatalog';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { ALLOWED_IMAGE_MIME, verifyImageMagicBytes, MAGIC_BYTE_MISMATCH_MESSAGE } from '@/lib/uploadValidation';
import {
  DEFAULT_HERO_CARDS, HERO_CARDS_MAX, type HeroCard, type HeroCardInput, type HeroProductOption,
} from '@/lib/constants/heroCards';

const SETTING_KEY = 'vc_cath_cards';
const STORAGE_BUCKET = 'product-images'; // products module-এ ব্যবহৃত bucket-ই পুনর্ব্যবহার করা হচ্ছে, নতুন bucket তৈরি করা হয়নি

// legacy getCathCards() — saved থাকলে সেটাই authority, ১৩টার বেশি হলে
// (safety net, কখনো bug/manual DB edit-এ হতে পারে) ট্রিম করে আবার সেভ করে দেয়
export async function getHeroCards(): Promise<HeroCard[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('store_settings')
    .select('setting_value')
    .eq('setting_key', SETTING_KEY)
    .maybeSingle();

  if (error || !data?.setting_value) return DEFAULT_HERO_CARDS;

  try {
    const raw = data.setting_value;
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed) && parsed.length) {
      if (parsed.length > HERO_CARDS_MAX) {
        const trimmed = parsed.slice(0, HERO_CARDS_MAX) as HeroCard[];
        await persistHeroCards(trimmed);
        return trimmed;
      }
      return parsed as HeroCard[];
    }
  } catch {
    // parse ব্যর্থ হলে fallback-এই থাকো
  }
  return DEFAULT_HERO_CARDS;
}

async function persistHeroCards(cards: HeroCard[]): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error: upsertError } = await supabase
    .from('store_settings')
    .upsert({ setting_key: SETTING_KEY, setting_value: JSON.stringify(cards) }, { onConflict: 'setting_key' });
  if (upsertError) {
    await supabase.from('store_settings').delete().eq('setting_key', SETTING_KEY);
    await supabase.from('store_settings').insert({ setting_key: SETTING_KEY, setting_value: JSON.stringify(cards) });
  }
  revalidatePath('/design/hero-cards');
  await revalidateVangcurCatalog();
}

export interface HeroCardActionResult {
  ok: boolean;
  message?: string;
}

function validateLink(input: HeroCardInput): string | null {
  if ((input.linkType === 'grid' || input.linkType === 'product') && !input.productId) {
    return '⚠️ লিংকের জন্য একটি প্রোডাক্ট বেছে নিন';
  }
  return null;
}

// category টাইপে শুধু catId থাকে (পুরনো ফরম্যাটের সাথে হুবহু মিল), বাকি দুই টাইপে প্রোডাক্টের তথ্যও সেভ হয়
function linkFields(input: HeroCardInput): Pick<HeroCard, 'linkType' | 'productId' | 'productName'> {
  if (input.linkType === 'grid' || input.linkType === 'product') {
    return { linkType: input.linkType, productId: input.productId, productName: input.productName };
  }
  return {};
}

// অ্যাডমিন ড্রপডাউনের জন্য হালকা প্রোডাক্ট লিস্ট (শুধু দরকারি কলাম)
export async function getHeroProductOptions(): Promise<HeroProductOption[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from('custom_products').select('id, name, cat, imgs').order('id', { ascending: false });
  return (data || []).map((p) => {
    const first = Array.isArray(p.imgs) ? String(p.imgs[0] || '') : '';
    return { id: p.id as number, name: String(p.name || ''), cat: String(p.cat || ''), img: first.startsWith('http') ? first : '' };
  });
}

// legacy saveCathCardNew()-এর "নতুন" শাখা
export async function addHeroCard(input: HeroCardInput): Promise<HeroCardActionResult> {
  await requireAdmin();
  const label = input.label.trim();
  if (!label) return { ok: false, message: '⚠️ বাটন টেক্সট দিন' };
  const linkErr = validateLink(input);
  if (linkErr) return { ok: false, message: linkErr };

  const cards = await getHeroCards();
  if (cards.length >= HERO_CARDS_MAX) {
    return { ok: false, message: `মূল সাইটে সর্বোচ্চ ${HERO_CARDS_MAX}টা কার্ড সাপোর্ট করে — আগে একটা মুছুন` };
  }

  // legacy: নতুন কার্ডে ঘুরিয়ে-ফিরিয়ে emoji + একটাই ডিফল্ট gradient বসে
  const emojis = ['🛍️', '💡', '⌚', '🔋', '🎧', '🎵', '🪔', '💨', '📦'];
  const card: HeroCard = {
    label,
    catId: input.catId || '',
    img: input.img || '',
    emoji: emojis[cards.length % emojis.length],
    bg: 'linear-gradient(155deg,#1a1a2e,#0f3460)',
    ...linkFields(input),
  };

  await persistHeroCards([...cards, card]);
  return { ok: true };
}

// legacy saveCathCardNew()-এর "এডিট" শাখা — index দিয়ে রেফার করা হয় (legacy-ও তাই করত, কোনো stable id নেই)
export async function updateHeroCard(index: number, input: HeroCardInput): Promise<HeroCardActionResult> {
  await requireAdmin();
  const label = input.label.trim();
  if (!label) return { ok: false, message: '⚠️ বাটন টেক্সট দিন' };
  const linkErr = validateLink(input);
  if (linkErr) return { ok: false, message: linkErr };

  const cards = await getHeroCards();
  if (index < 0 || index >= cards.length) return { ok: false, message: 'কার্ড খুঁজে পাওয়া যায়নি' };

  const { linkType: _lt, productId: _pid, productName: _pn, ...base } = cards[index];
  void _lt; void _pid; void _pn;
  cards[index] = {
    ...base,
    label,
    catId: input.catId || '',
    img: input.img || cards[index].img || '',
    ...linkFields(input),
  };
  await persistHeroCards(cards);
  return { ok: true };
}

// legacy deleteCathCardNew()
export async function deleteHeroCard(index: number): Promise<HeroCardActionResult> {
  await requireAdmin();
  const cards = await getHeroCards();
  if (index < 0 || index >= cards.length) return { ok: false, message: 'কার্ড খুঁজে পাওয়া যায়নি' };
  cards.splice(index, 1);
  await persistHeroCards(cards);
  return { ok: true };
}

// legacy resetCathCardsToDefault()
export async function resetHeroCardsToDefault(): Promise<HeroCardActionResult> {
  await requireAdmin();
  await persistHeroCards(JSON.parse(JSON.stringify(DEFAULT_HERO_CARDS)));
  return { ok: true };
}

// legacy handleCathFile() — কিন্তু legacy base64 সরাসরি settings JSON-এ embed করত;
// এখানে products module-এর মতোই আসল Supabase Storage upload-এ পাঠানো হচ্ছে (bucket
// পুনর্ব্যবহার), settings টেবিলে শুধু ছোট URL string থাকে — ইচ্ছাকৃত উন্নতি, নিচে
// roadmap নোটে বিস্তারিত
export async function uploadHeroCardImage(
  formData: FormData
): Promise<{ ok: boolean; url?: string; message?: string }> {
  await requireAdmin();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'কোনো ফাইল পাওয়া যায়নি' };
  }
  if (file.size > 3 * 1024 * 1024) {
    return { ok: false, message: '⚠️ ছবির সাইজ ৩MB এর বেশি — ছোট করে দিন' };
  }
  // 🛡️ অডিট ফিক্স: ফাইলের নাম না, আসল MIME টাইপ চেক করে ext বসানো হচ্ছে
  const ext = ALLOWED_IMAGE_MIME[file.type];
  if (!ext) {
    return { ok: false, message: 'শুধুমাত্র JPG, PNG বা WebP ছবি আপলোড করা যাবে' };
  }
  // 🛡️ অডিট ফিক্স: file.type স্পুফ করা সম্ভব, তাই আসল ফাইল-বাইট দিয়েও যাচাই
  if (!(await verifyImageMagicBytes(file, file.type))) {
    return { ok: false, message: MAGIC_BYTE_MISMATCH_MESSAGE };
  }
  const supabase = createServiceRoleClient();
  const path = `hero-cards/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) return { ok: false, message: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { ok: true, url: publicUrl };
}
