// legacy sendBrowserNotification()/requestNotifPermission() হুবহু পোর্ট।

export function requestNotifPermission(): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function sendBrowserNotification(title: string, body: string, onOpenOrders?: () => void): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  const n = new Notification(title, {
    body,
    tag: 'new-order',
    requireInteraction: true,
    // renotify: TS lib.dom-এর NotificationOptions টাইপে নেই এই সংস্করণে,
    // কিন্তু ব্রাউজার রানটাইমে সাপোর্টেড — legacy behavior (tag পুনরাবৃত্তি হলেও
    // আবার notify করা) বজায় রাখতে any-cast দিয়ে পাস করা হচ্ছে
    ...({ renotify: true } as object),
  });
  n.onclick = () => {
    window.focus();
    onOpenOrders?.();
    n.close();
  };
  setTimeout(() => n.close(), 10000);
}

export type NotifPermissionState = 'unsupported' | 'granted' | 'denied' | 'default';

export function getNotifPermissionState(): NotifPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
