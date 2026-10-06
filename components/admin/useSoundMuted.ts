'use client';

import { useSyncExternalStore } from 'react';
import { isSoundMuted, setSoundMuted, subscribeSoundMute } from '@/lib/sound';

// সার্ভার রেন্ডারে সবসময় false (হাইড্রেশন মিসম্যাচ এড়াতে), ক্লায়েন্টে আসল মান
export function useSoundMuted(): [boolean, () => void] {
  const muted = useSyncExternalStore(subscribeSoundMute, isSoundMuted, () => false);
  return [muted, () => setSoundMuted(!muted)];
}
