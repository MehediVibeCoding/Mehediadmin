// ব্রাউজারে অর্ডার-তালিকা মনে রাখা — একই ফিল্টার/পেজে ফিরলে আবার সার্ভারে যেতে হয় না।
// মেয়াদ ১৮০ সেকেন্ড। নতুন অর্ডার আসলে বা অ্যাডমিন নিজে কিছু বদলালে পুরোটা মুছে যায়।
// (মডিউল-লেভেল Map — পেজ ছেড়ে অন্য পেজে গিয়ে ফিরলেও থাকে, কিন্তু রিলোড হলে নতুন)

const TTL_MS = 180_000;
const MAX_ENTRIES = 30;

interface Entry<T> {
  at: number;
  value: T;
}

const store = new Map<string, Entry<unknown>>();
// মুছে ফেলার পর দেরিতে ফিরে আসা পুরনো রেসপন্স যেন আবার ক্যাশে ঢুকতে না পারে
let epoch = 0;

export function getOrdersCacheEpoch(): number {
  return epoch;
}

export function getOrdersCache<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

/** startEpoch = রিকোয়েস্ট শুরুর সময়ের epoch; এর মধ্যে ক্যাশ মুছে গেলে এই মান আর জমা হয় না */
export function setOrdersCache<T>(key: string, value: T, startEpoch: number): void {
  if (startEpoch !== epoch) return;
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { at: Date.now(), value });
}

export function clearOrdersCache(): void {
  epoch += 1;
  store.clear();
}
