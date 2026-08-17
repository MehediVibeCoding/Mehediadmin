
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
