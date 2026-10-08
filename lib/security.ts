
// 🛡️ অডিট ফিক্স: service-role client ব্যবহার করা action-গুলোতে id প্যারামিটার
// সরাসরি .eq('id', id)-এ পাঠানোর আগে ফরম্যাট যাচাই। মূল সুরক্ষা ইনজেকশনের
// বিরুদ্ধে না (Supabase client parameterized query ব্যবহার করে, তাই raw SQL
// ইনজেকশন এমনিতেই সম্ভব না) — এটা defense-in-depth: ভুল/জাল আইডি দিয়ে
// অপ্রয়োজনীয় DB round-trip বা অস্পষ্ট এরর এড়ানো, আর future-এ কোনো কোড-পাথ
// raw query-তে গেলে একটা বাড়তি সুরক্ষা স্তর থাকা।
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/** bigint identity কলাম (custom_products.id, product_questions.id ইত্যাদি)-এর জন্য */
export function isValidPositiveIntId(value: unknown): boolean {
  if (typeof value === 'number') return Number.isInteger(value) && value > 0;
  if (typeof value === 'string') return /^[1-9][0-9]*$/.test(value);
  return false;
}

export function sanitizeInput(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  // <script>/<style> ট্যাগ তাদের ভেতরের কনটেন্টসহ পুরোপুরি বাদ
  const withoutScripts = str.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
  // বাকি সব HTML ট্যাগ সরাও, ভেতরের টেক্সট রেখে দাও
  const withoutTags = withoutScripts.replace(/<[^>]*>/g, '');
  return withoutTags.trim();
}

// একই fields-এর array (features, FAQ answers ইত্যাদি) sanitize করতে
export function sanitizeInputArray(values: unknown[]): string[] {
  return values.map(sanitizeInput).filter(Boolean);
}
