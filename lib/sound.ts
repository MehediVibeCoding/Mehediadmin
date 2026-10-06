// 🔇 সাউন্ড মিউট — এই ব্রাউজারে মনে রাখা হয় (localStorage), সব জায়গায় (অর্ডার পেজ,
// বিকাশ পেজ, রিয়েলটাইম নোটিফিকেশন) একসাথে কাজ করে কারণ চেকটা playChaChing()-এর ভেতরেই।
const MUTE_KEY = 'admin_sound_muted';
const MUTE_EVENT = 'admin-sound-mute-change';

export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // storage বন্ধ থাকলে এই সেশনের জন্য কাজ করবে না — ক্র্যাশ নয়
  }
  window.dispatchEvent(new Event(MUTE_EVENT));
}

// useSyncExternalStore-এর জন্য: একই ট্যাবের ইভেন্ট + অন্য ট্যাবের 'storage' ইভেন্ট
export function subscribeSoundMute(cb: () => void): () => void {
  window.addEventListener(MUTE_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(MUTE_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

// legacy playChaChing() হুবহু পোর্ট — Web Audio API দিয়ে "Cha-Ching!" ক্যাশ
// রেজিস্টার সাউন্ড, কোনো audio file লাগে না। নতুন অর্ডার এলে ও অর্ডার
// confirm করলে বাজে।
export function playChaChing(): void {
  if (typeof window === 'undefined') return;
  if (isSoundMuted()) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // "Cha" — উজ্জ্বল বেল কর্ড
    [1046.5, 1318.5].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    });

    // "Ching" — একটু পরে বাজা উঁচু বেল + ধাতব ক্যাশ-ড্রয়ার নয়েজ বার্স্ট
    setTimeout(() => {
      const t = ctx.currentTime;
      [1567.98, 2093].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.start(t);
        osc.stop(t + 0.62);
      });
      try {
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 3000;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.12;
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(t);
      } catch {
        // নয়েজ বার্স্ট ব্যর্থ হলে চুপচাপ স্কিপ — মূল বেল সাউন্ড তো বেজে গেছে
      }
    }, 140);
  } catch {
    // AudioContext না থাকলে/ব্যর্থ হলে নিঃশব্দে স্কিপ (legacy আচরণ)
  }
}
