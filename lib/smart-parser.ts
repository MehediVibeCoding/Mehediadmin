// ══════════════════════════════════════════════════════════════
//  SMART PARSER (কোনো external AI/API না — সম্পূর্ণ rule-based)
//  legacy admin.html-এর smartParse() থেকে ১:১ পোর্ট করা।
//  UI-তে "AI Parser"/"AI Product Planner" নামে দেখানো হয়, কিন্তু
//  ভেতরে regex/heuristic দিয়ে master text block থেকে ফিল্ড বের করে —
//  ইন্টারনেট বা কোনো API key ছাড়াই কাজ করে।
// ══════════════════════════════════════════════════════════════

export interface ParsedProductData {
  name: string;
  cat: string;
  price: number;
  old: number;
  stock: number;
  rating: number;
  warranty: string;
  badge: string;
  quick_specs: string;
  packaging_content: string;
  desc: string;
  features: string[];
  tech_specs: string;
  faqs: string;
  closing: string;
}

function escRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// বাংলা সংখ্যা → ইংরেজি
function bnToEn(s: string): string {
  if (!s) return s;
  return s.replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
}

function parsePrice(s: string): number {
  if (!s) return 0;
  const cleaned = bnToEn(s);
  const m = cleaned.match(/[\d,]+/);
  return m ? parseInt(m[0].replace(/,/g, '')) : 0;
}

export function smartParse(raw: string): ParsedProductData {
  const lines = raw.split('\n');

  function findVal(keys: string[]): string {
    for (const line of lines) {
      for (const k of keys) {
        const m = line.match(new RegExp('^' + escRe(k) + '\\s*[:=—\\-ঃ]\\s*(.+)', 'i'));
        if (m) return bnToEn(m[1].trim());
      }
    }
    return '';
  }

  function findInline(patterns: RegExp[]): string {
    for (const pat of patterns) {
      const m = raw.match(pat);
      if (m && m[1]) return bnToEn(m[1].trim());
    }
    return '';
  }

  // ── Product Name ──
  let name = findVal(['Product Name', 'পণ্যের নাম', 'প্রোডাক্টের নাম', 'Name', 'নাম', 'Product']);
  if (!name) {
    for (const l of lines) {
      if (l.trim() && !l.includes(':') && l.length > 8) {
        name = l.trim();
        break;
      }
    }
  }
  if (name) {
    name = name
      .replace(/\s*(?:price|মূল্য|দাম|Price)\s*[:=]?\s*[\d,০-৯]+\s*(?:tk|taka|টাকা|BDT)?/gi, '')
      .trim();
    name = name.replace(/\s*[\d,০-৯]+\s*(?:tk|taka|টাকা|BDT)\s*$/gi, '').trim();
  }

  // ── Price ──
  const priceRaw = findVal(['বর্তমান মূল্য', 'Price', 'মূল্য', 'দাম', 'Current Price', 'বর্তমান দাম']);
  let price = parsePrice(priceRaw);
  if (!price) {
    const inlinePrice = findInline([/(?:price|বর্তমান মূল্য|মূল্য|দাম)\s*[:=—\-ঃ]\s*([\d,০-৯]+)/i]);
    price = parsePrice(inlinePrice);
  }
  if (!price) {
    const pm = raw.match(/(?:price|মূল্য|দাম)[^\d০-৯]*([\d,০-৯]+)/i);
    if (pm) price = parsePrice(pm[1]);
  }

  const oldRaw = findVal(['পুরনো মূল্য', 'Old Price', 'আগের মূল্য', 'পুরানো মূল্য', 'পুরনো দাম', 'Original Price']);
  const old = parsePrice(oldRaw) || Math.round(price * 1.3);

  // ── Rating ──
  let ratingRaw = findVal(['রেটিং', 'Rating', 'রেটিং (1-5)', 'Rate']);
  if (!ratingRaw) {
    ratingRaw = findInline([/(?:রেটিং|Rating|Rate)\s*[:=—\-ঃ]\s*([\d.০-৯]+)/i]);
  }
  let rating = parseFloat(bnToEn(ratingRaw)) || 4.5;
  if (rating > 5) rating = 5;
  if (rating < 1) rating = 4.5;

  // ── Warranty ──
  let warranty = findVal(['ওয়ারেন্টি', 'Warranty', 'গ্যারান্টি', 'Guarantee']);
  if (!warranty) {
    warranty = findInline([/(?:ওয়ারেন্টি|Warranty|গ্যারান্টি|Guarantee)\s*[:=—\-ঃ]\s*([^\n|,]+)/i]);
  }
  if (!warranty) {
    const wm = raw.match(/(\d+\s*(?:months?|বছর|মাস)[^\n,]*warranty[^\n,]*)/i);
    if (wm) warranty = wm[1].trim();
  }

  // ── Badge ──
  let badgeRaw = findVal(['Badge', 'ব্যাজ', 'Tag']);
  if (!badgeRaw) {
    badgeRaw = findInline([/(?:Badge|ব্যাজ|Tag)\s*[:=—\-ঃ]\s*([^\n|,]+)/i]);
  }
  let badge = '';
  if (/hot/i.test(badgeRaw)) badge = 'HOT';
  else if (/new/i.test(badgeRaw)) badge = 'NEW';
  else if (/sale/i.test(badgeRaw)) badge = 'SALE';

  // ── Stock ──
  let stockRaw = findVal(['Stock', 'স্টক', 'Quantity', 'স্টক পরিমাণ']);
  if (!stockRaw) {
    stockRaw = findInline([/(?:Stock|স্টক|Quantity)\s*[:=—\-ঃ]\s*([\d,০-৯]+)/i]);
  }
  if (stockRaw) stockRaw = bnToEn(stockRaw);
  const stock = parseInt(stockRaw) || 0;

  // ── Quick Specs ──
  let quickSpecs = '';
  const qsPatterns = [
    /স্পেসিফিকেশন\s*\(\s*এক\s*নজরে\s*\)\s*[:：=\-—\s]+\s*(.+)/i,
    /স্পেসিফিকেশন\s*\(\s*একনজরে\s*\)\s*[:：=\-—\s]+\s*(.+)/i,
    /Quick\s*Specs?\s*[:：=\-—\s]+\s*(.+)/i,
    /এক\s*নজরে\s*[:：=\-—\s]+\s*(.+)/i,
    /স্পেসিফিকেশন\s*[:：=\-—\s]+\s*(.+)/i,
  ];
  for (const pat of qsPatterns) {
    const m = raw.match(pat);
    if (m && m[1] && m[1].trim().length > 2) {
      quickSpecs = m[1].trim();
      break;
    }
  }
  if (!quickSpecs) {
    const qsHeadings = [
      /স্পেসিফিকেশন\s*\(\s*একনজরে\s*\)/i,
      /স্পেসিফিকেশন\s*\(\s*এক\s*নজরে\s*\)/i,
      /Quick\s*Specs?/i,
    ];
    for (const hPat of qsHeadings) {
      const idx = lines.findIndex((l) => hPat.test(l));
      if (idx >= 0) {
        const colonIdx = lines[idx].indexOf(':');
        if (colonIdx >= 0) {
          const after = lines[idx].slice(colonIdx + 1).trim();
          if (after.length > 2) {
            quickSpecs = after;
            break;
          }
        }
        for (let j = idx + 1; j < lines.length && j <= idx + 2; j++) {
          const nl = lines[j].trim();
          if (!nl) continue;
          if (nl.length > 2) {
            quickSpecs = nl;
            break;
          }
        }
        if (quickSpecs) break;
      }
    }
  }

  // ── Category detection ──
  let cat = 'rgb';
  if (/smartwatch|ঘড়ি|watch/i.test(raw)) cat = 'smartwatch';
  else if (/power.?bank|পাওয়ার ব্যাংক/i.test(raw)) cat = 'powerbank';
  else if (/tws|earbuds|earphone|ইয়ারবাড/i.test(raw)) cat = 'tws';
  else if (/headphone|headset|হেডফোন/i.test(raw)) cat = 'headphone';
  else if (/lamp|লাইট.*acrylic|acrylic/i.test(raw)) cat = 'lamp';
  else if (/fan|ফ্যান/i.test(raw)) cat = 'fan';
  else if (/rgb|neon|light|লাইট/i.test(raw)) cat = 'rgb';

  // ── Description ──
  let desc = '';
  const descKeywords = ['পণ্যটির বিস্তারিত বর্ণনা', 'বিস্তারিত বর্ণনা', 'Description', 'বর্ণনা', 'পণ্যের বর্ণনা'];
  for (const kw of descKeywords) {
    const idx = lines.findIndex((l) => l.toLowerCase().includes(kw.toLowerCase()));
    if (idx >= 0) {
      const parts: string[] = [];
      for (let i = idx + 1; i < lines.length && parts.length < 4; i++) {
        const l = lines[i].trim();
        if (!l) continue;
        if (/^(Q:|A:|FAQ|ফিচার|Feature|Spec|Technical|Product F)/i.test(l)) break;
        if (l.includes(':') && l.length < 40) break;
        parts.push(l);
      }
      desc = parts.join(' ').trim();
      if (desc) break;
    }
  }

  // ── Features ──
  let features: string[] = [];
  const featKwds = ['Product Features', 'Features', 'ফিচার', 'সুবিধা', 'Product Feature', 'Feature'];
  for (const kw of featKwds) {
    const idx = lines.findIndex((l) => l.toLowerCase().includes(kw.toLowerCase()) && !l.includes('Quick'));
    if (idx >= 0) {
      for (let i = idx + 1; i < lines.length; i++) {
        const l = lines[i].trim();
        if (!l) continue;
        if (/^(Q:|A:|FAQ|Spec|Technical|বর্ণনা|Description|কিছু কমন)/i.test(l)) break;
        if (l.includes(':') && !l.startsWith('-') && l.length < 60 && !/^[-•*]/.test(l)) break;
        const feat = l.replace(/^[-•*✔✓]\s*/, '').trim();
        if (feat && feat.length > 3 && features.length < 10) features.push(feat);
      }
      if (features.length) break;
    }
  }

  // ── Technical Specs ──
  const techSpecLines: string[] = [];
  const specKwds = ['Product Specifications', 'Technical Specs', 'Specifications', 'কারিগরি তথ্য'];
  for (const kw of specKwds) {
    const idx = lines.findIndex(
      (l) => l.toLowerCase().includes(kw.toLowerCase()) && !l.includes('একনজরে') && !l.includes('এক নজরে')
    );
    if (idx >= 0) {
      for (let i = idx + 1; i < lines.length; i++) {
        const l = lines[i].trim();
        if (!l) continue;
        if (/^(Q:|FAQ|Feature|বর্ণনা|Description|কিছু কমন|ADMIN|Packaging)/i.test(l)) break;
        if (l.includes(':') && !l.startsWith('-')) techSpecLines.push(l);
      }
      if (techSpecLines.length) break;
    }
  }
  const tech_specs = techSpecLines.join('\n');

  // ── Packaging Content ──
  let packagingContent = '';
  const pkgPatterns = [
    /Packaging\s*Content\s*[:：=\-—ঃ]/i,
    /প্যাকেজিং\s*কন্টেন্ট\s*[:：=\-—ঃ]/i,
    /প্যাকেজে\s*কী\s*থাকবে\s*[:：=\-—ঃ]/i,
    /বাক্সে\s*কী\s*আছে\s*[:：=\-—ঃ]/i,
    /In\s*the\s*Box\s*[:：=\-—ঃ]/i,
  ];
  for (const pat of pkgPatterns) {
    const pkgIdx = lines.findIndex((l) => pat.test(l));
    if (pkgIdx >= 0) {
      const colonMatch = lines[pkgIdx].match(/[:：=\-—ঃ]\s*(.+)/);
      if (colonMatch && colonMatch[1].trim().length > 2) {
        packagingContent = colonMatch[1].trim();
      }
      const pkgLines = packagingContent ? [packagingContent] : [];
      for (let i = pkgIdx + 1; i < lines.length; i++) {
        const l = lines[i].trim();
        if (!l) continue;
        if (/^(Q:|A:|FAQ|ADMIN|বর্ণনা|Description|Feature|Spec|Technical)/i.test(l)) break;
        if (l.includes(':') && l.length < 60 && !/^[-•*]/.test(l) && i > pkgIdx + 1) break;
        pkgLines.push(l.replace(/^[-•*✔✓]\s*/, ''));
      }
      packagingContent = pkgLines.join('\n').trim();
      break;
    }
  }

  // ── FAQs ──
  const faqBlocks: string[] = [];
  const faqIdx = lines.findIndex((l) => /^FAQ|^কিছু কমন প্রশ্ন/i.test(l.trim()));
  if (faqIdx >= 0) {
    let q = '';
    let a = '';
    for (let i = faqIdx + 1; i < lines.length; i++) {
      const l = lines[i].trim();
      if (!l) continue;
      if (/^ADMIN/i.test(l)) break;
      if (/^(?:প্রশ্ন|Q)[:\s]/.test(l)) {
        if (q && a) faqBlocks.push(`Q: ${q}\nA: ${a}`);
        q = l.replace(/^(?:প্রশ্ন|Q)[:\s]*/, '').trim();
        a = '';
      } else if (/^(?:উত্তর|A)[:\s]/.test(l)) {
        a = l.replace(/^(?:উত্তর|A)[:\s]*/, '').trim();
      } else if (a) {
        a += ' ' + l;
      }
    }
    if (q && a) faqBlocks.push(`Q: ${q}\nA: ${a}`);
  }
  const faqs = faqBlocks.join('\n\n');

  // ── Closing ──
  let closing = '';
  const closingPatterns =
    /(?:অর্ডার করুন|পেতে|যোগাযোগ|থেকে সেরা|থেকে পাবেন|বিশ্বাস|পরিবার|নিশ্চিত|গ্যারান্টি|সাশ্রয়|সেরা দাম|এখনই|আজই|কিনুন)/i;
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
    const l = lines[i].trim();
    if (l && !l.includes(':') && l.length > 15 && !/^(Q:|A:|FAQ|-|•|\*)/i.test(l) && !/^ADMIN/i.test(l)) {
      if (closingPatterns.test(l)) {
        closing = l;
        break;
      }
    }
  }
  if (!closing) {
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 6); i--) {
      const l = lines[i].trim();
      if (
        l &&
        !l.includes(':') &&
        l.length > 20 &&
        l.length < 200 &&
        !/^(Q:|A:|FAQ|-|•|\*|উত্তর|প্রশ্ন)/i.test(l) &&
        !/^ADMIN/i.test(l)
      ) {
        closing = l;
        break;
      }
    }
  }

  return {
    name,
    cat,
    price,
    old,
    stock,
    rating,
    warranty,
    badge,
    quick_specs: quickSpecs,
    packaging_content: packagingContent,
    desc,
    features,
    tech_specs,
    faqs,
    closing,
  };
}

// ── উদাহরণ টেক্সট (legacy loadExample() থেকে) — "উদাহরণ" বাটনে ব্যবহার হবে ──
export const SMART_PARSER_EXAMPLE = `Product Name: GearUP NRGB50 5 Meter RGB Neon Light with App & Remote Control
Price: 2200 TK
পুরনো মূল্য: 2850
Badge: HOT
ওয়ারেন্টি: 6 Months Replacement Warranty
রেটিং (1-5): 4.8
Quick Specs: দৈর্ঘ্য 5 Meter, কন্ট্রোল App & Remote, কানেক্টিভিটি Bluetooth, ওয়ারেন্টি 6 Months

স্পেসিফিকেশন:
Brand: GearUP
5 Meter Length
Vibrant RGB Colors
App and Remote Control
Multiple Lighting Modes
Flexible Design

পণ্যটির বিস্তারিত বর্ণনা:
আধুনিক ইন্টেরিয়র এবং লাইটিং সলিউশনে GearUP একটি পরিচিত নাম। GearUP NRGB50 5 Meter RGB Neon Light আপনার রুম বা গেমিং সেটআপকে সম্পূর্ণ বদলে দিতে পারে।

Product Features:
- Vibrant RGB Colors
- 5-Meter Length
- App and Remote Control
- Multiple Lighting Modes
- DIY Flexibility
- Energy Efficient
- Safe and Durable
- Easy Installation

Technical Specs:
Brand: GearUP
Model: NRGB50
LED Density: 96Led/per meter
Connectivity: Bluetooth
Power: 24W
Voltage: 24V
Length: 5m
Useful Life: 50000 hours

FAQ:
Q: এই নিয়ন লাইটটি কীভাবে কন্ট্রোল করা যায়?
A: স্মার্টফোনের অ্যাপ এবং রিমোট কন্ট্রোল দিয়ে কন্ট্রোল করা যায়।

Q: এই প্রোডাক্টটির সাথে কতদিনের ওয়ারেন্টি?
A: ৬ মাসের রিপ্লেসমেন্ট ওয়ারেন্টি।`;
