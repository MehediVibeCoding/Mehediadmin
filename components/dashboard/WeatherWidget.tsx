'use client';

import { useEffect, useState } from 'react';

interface ForecastHour {
  label: string;
  temp: number;
  pct: number;
}

interface WeatherData {
  code: number;
  temp: string;
  desc: string;
  loc: string;
  feels: string;
  hum: string;
  wind: string;
  forecast: ForecastHour[];
}

const DEFAULT_WEATHER: WeatherData = {
  code: 1,
  temp: '28°C',
  desc: 'মোটামুটি পরিষ্কার',
  loc: 'চৌদ্দগ্রাম, কুমিল্লা',
  feels: '30°',
  hum: '68%',
  wind: '12 km/h',
  forecast: [
    { label: '১২ PM', temp: 29, pct: 85 },
    { label: '১ PM', temp: 30, pct: 95 },
    { label: '২ PM', temp: 31, pct: 100 },
    { label: '৩ PM', temp: 30, pct: 90 },
    { label: '৪ PM', temp: 28, pct: 75 },
    { label: '৫ PM', temp: 27, pct: 60 },
  ],
};

function WeatherIcon({ code, className = 'h-8 w-8' }: { code: number; className?: string }) {
  if (code === 0) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    );
  }
  if (code === 1 || code === 2) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" />
        <path d="M15.5 12a4.5 4.5 0 0 0-4.5-4.5 4.4 4.4 0 0 0-1.7.35" />
        <path d="M17.5 19H9a5 5 0 0 1-1-9.9 5.5 5.5 0 0 1 10.5 2.4A4 4 0 0 1 17.5 19Z" />
      </svg>
    );
  }
  if (code === 3) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17.5 19H9a5 5 0 0 1-1-9.9 5.5 5.5 0 0 1 10.5 2.4A4 4 0 0 1 17.5 19Z" />
      </svg>
    );
  }
  if (code >= 51 && code <= 67) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 13v6M8 13v6M12 15v6" />
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
      </svg>
    );
  }
  if (code >= 95) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
        <polyline points="13 11 9 17 15 17 11 23" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17.5 19H9a5 5 0 0 1-1-9.9 5.5 5.5 0 0 1 10.5 2.4A4 4 0 0 1 17.5 19Z" />
      <circle cx="12" cy="7" r="3" />
    </svg>
  );
}

function getWeatherDescription(code: number): string {
  const map: Record<number, string> = {
    0: 'পরিষ্কার আকাশ',
    1: 'মোটামুটি পরিষ্কার',
    2: 'আংশিক মেঘলা',
    3: 'মেঘলা আকাশ',
    45: 'কুয়াশাচ্ছন্ন',
    48: 'ঘন কুয়াশা',
    51: 'হালকা গুঁড়ি বৃষ্টি',
    53: 'মাঝারি গুঁড়ি বৃষ্টি',
    55: 'ভারী গুঁড়ি বৃষ্টি',
    61: 'হালকা বৃষ্টিপাত',
    63: 'মাঝারি বৃষ্টিপাত',
    65: 'ভারী বৃষ্টিপাত',
    71: 'হালকা তুষারপাত',
    80: 'বৃষ্টির ঝাপটা',
    82: 'প্রবল বৃষ্টির ঝাপটা',
    95: 'বজ্রবিদ্যুৎ সহ বৃষ্টি',
  };
  return map[code] || 'স্বাভাবিক আবহাওয়া';
}

// উপরের কোণ সোজা — কার্ডটা পেজের একদম মাথায় লেগে থাকে (পেজ থেকে -mt দিয়ে লাগানো হয়)।
// স্বাগতম বার্তা ও তারিখ সরানো হয়েছে।
export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData>(DEFAULT_WEATHER);

  useEffect(() => {
    let cancelled = false;
    let reqId = 0; // শুধু সর্বশেষ অনুরোধের ফলই কার্ডে বসবে — দেরিতে আসা পুরনো উত্তর নতুনটাকে উল্টে দেবে না

    const LOC_CACHE_KEY = 'vc_admin_weather_loc';
    const DEFAULT_LAT = 23.2167;
    const DEFAULT_LON = 91.3167;
    const DEFAULT_NAME = 'চৌদ্দগ্রাম, কুমিল্লা';
    const GENERIC_NAME = 'আপনার বর্তমান এলাকা';

    // শেষবার জানা লোকেশন — পরের বার খুলতেই সঠিক এলাকার আবহাওয়া ঝলকে দেখাতে (ভুল জায়গা দেখিয়ে লাফানো এড়াতে)
    function readCachedLocation(): { lat: number; lon: number; name: string } | null {
      try {
        const raw = localStorage.getItem(LOC_CACHE_KEY);
        if (!raw) return null;
        const v = JSON.parse(raw);
        if (typeof v?.lat === 'number' && typeof v?.lon === 'number') {
          return { lat: v.lat, lon: v.lon, name: typeof v.name === 'string' && v.name ? v.name : GENERIC_NAME };
        }
      } catch {
        // ক্যাশ পড়া ব্যর্থ হলে ডিফল্টই চলবে
      }
      return null;
    }

    function saveCachedLocation(lat: number, lon: number, name: string) {
      try {
        localStorage.setItem(LOC_CACHE_KEY, JSON.stringify({ lat, lon, name }));
      } catch {
        // ignore
      }
    }

    // লোকেশনের নাম (বিনা-কী রিভার্স জিওকোডিং)। ব্যর্থ হলে খালি স্ট্রিং — আবহাওয়ার সংখ্যা তাতে আটকায় না
    async function resolvePlaceName(lat: number, lon: number): Promise<string> {
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=bn`,
          { signal: AbortSignal.timeout(4000) },
        );
        if (!res.ok) return '';
        const j = await res.json();
        const place = (j.locality || j.city || '').toString().trim();
        const region = (j.principalSubdivision || '').toString().replace(/\s*(বিভাগ|Division)\s*$/i, '').trim();
        return [place, region].filter((s, i, a) => s && a.indexOf(s) === i).join(', ');
      } catch {
        return '';
      }
    }

    async function fetchWeather(lat: number, lon: number, locationName: string): Promise<boolean> {
      const myReq = ++reqId;
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&forecast_days=1&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) return false;
        const json = await res.json();
        if (cancelled || myReq !== reqId || !json.current) return false;

        const cur = json.current;
        const code = cur.weather_code;
        const desc = getWeatherDescription(code);

        const hourlyTimes: string[] = json.hourly?.time || [];
        const hourlyTemps: number[] = json.hourly?.temperature_2m || [];
        const nowIndex = hourlyTimes.findIndex((t) => new Date(t) >= new Date());
        const startIndex = nowIndex >= 0 ? nowIndex : 0;
        const times = hourlyTimes.slice(startIndex, startIndex + 6);
        const temps = hourlyTemps.slice(startIndex, startIndex + 6);
        const maxTemp = Math.max(...temps, 1);
        const minTemp = Math.min(...temps, 0);
        const diff = maxTemp - minTemp || 1;

        const forecast: ForecastHour[] = times.map((t, i) => {
          const hour = new Date(t).getHours();
          const pct = Math.max(25, Math.round(((temps[i] - minTemp) / diff) * 100));
          const label = (hour % 12 === 0 ? 12 : hour % 12) + (hour < 12 ? ' AM' : ' PM');
          return { label, temp: Math.round(temps[i]), pct };
        });

        setData({
          code,
          temp: `${Math.round(cur.temperature_2m)}°C`,
          desc,
          loc: locationName,
          feels: `${Math.round(cur.apparent_temperature)}°`,
          hum: `${cur.relative_humidity_2m}%`,
          wind: `${Math.round(cur.wind_speed_10m)} km/h`,
          forecast: forecast.length > 0 ? forecast : DEFAULT_WEATHER.forecast,
        });
        return true;
      } catch {
        // কোনো নেটওয়ার্ক সমস্যা হলে আগের/ডিফল্ট ডেটাই থাকবে, ফলে কখনোই ভাঙা অবস্থা আসবে না
        return false;
      }
    }

    // ১. মাউন্ট হওয়ামাত্র শেষবার জানা লোকেশন (না থাকলে চৌদ্দগ্রাম) দিয়ে তাৎক্ষণিক ফেচ
    const cached = readCachedLocation();
    fetchWeather(
      cached ? cached.lat : DEFAULT_LAT,
      cached ? cached.lon : DEFAULT_LON,
      cached ? cached.name : DEFAULT_NAME,
    );

    // ২. ব্রাউজারের বর্তমান লোকেশনে সরে যাওয়া — সফল হলে সেই জায়গার আসল আবহাওয়া ও এলাকার নাম বসে
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          const { latitude, longitude } = pos.coords;
          const ok = await fetchWeather(latitude, longitude, GENERIC_NAME);
          if (!ok || cancelled) return;
          const myReq = reqId;
          const name = await resolvePlaceName(latitude, longitude);
          const finalName = name || GENERIC_NAME;
          saveCachedLocation(latitude, longitude, finalName);
          if (!cancelled && myReq === reqId && name) {
            setData((d) => ({ ...d, loc: name }));
          }
        },
        () => {
          // অনুমতি না দিলে বা লোকেশন না পেলে শেষবার জানা/ডিফল্ট এলাকাই চলবে
        },
        // Windows/ডেস্কটপে Wi-Fi ভিত্তিক লোকেশন পেতে ৪ সেকেন্ডের বেশি লাগতে পারে; ৩০ মিনিটের মধ্যে পাওয়া লোকেশন পুনর্ব্যবহার
        { timeout: 12000, maximumAge: 30 * 60 * 1000 },
      );
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative overflow-hidden rounded-b-[24px] rounded-t-none border border-t-0 border-white/90 bg-gradient-to-br from-brand-bg/70 via-white to-white p-3.5 shadow-sh1 sm:p-5">
      {/* ডেকোরেটিভ ওয়াটারমার্ক মেঘ — স্থির (অ্যানিমেশন নেই) */}
      <svg
        aria-hidden="true"
        width="150"
        height="150"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        className="pointer-events-none absolute -bottom-10 -right-6 text-brand-light opacity-[0.10] sm:-bottom-12 sm:-right-8 sm:h-[190px] sm:w-[190px]"
      >
        <path d="M17.5 19H9a5 5 0 0 1-1-9.9 5.5 5.5 0 0 1 10.5 2.4A4 4 0 0 1 17.5 19Z" />
      </svg>

      <div className="relative z-10">
        {/* ═ নিচের অংশ: আবহাওয়া + তিনটা মান একটাই স্ট্রিপে ═ */}
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-white sm:h-14 sm:w-14 sm:rounded-[18px]">
              <WeatherIcon code={data.code} className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-body text-[26px] font-black leading-none tracking-tight text-ink sm:text-[30px]">{data.temp}</span>
                <span className="font-body text-[12.5px] font-extrabold text-ink/80 sm:text-[13px]">{data.desc}</span>
              </div>
              <span className="mt-1 flex items-center gap-1 font-body text-[11px] font-semibold text-muted sm:mt-1.5 sm:text-[11.5px]">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-brand-light"
                  aria-hidden="true"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="truncate">{data.loc}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-brand-light/20 rounded-2xl border border-border-base/70 bg-white/80 lg:min-w-[330px] lg:shrink-0">
            <StatChip label="অনুভূত" value={data.feels} tone="muted">
              <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
            </StatChip>
            <StatChip label="আর্দ্রতা" value={data.hum} tone="brand">
              <path d="M12 2.69s5 5.6 5 9.31a5 5 0 0 1-10 0c0-3.71 5-9.31 5-9.31Z" />
            </StatChip>
            <StatChip label="বাতাস" value={data.wind} tone="muted">
              <path d="M9.6 4.6a2 2 0 1 1 1.4 3.4H2M14 12.3a2 2 0 1 1 1.4 3.4H2m9.6-4.6H22" />
            </StatChip>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatChip({
  label,
  value,
  tone,
  children,
}: {
  label: string;
  value: string;
  tone: 'brand' | 'muted';
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`hidden shrink-0 sm:block ${tone === 'brand' ? 'text-brand-light' : 'text-muted'}`}
        aria-hidden="true"
      >
        {children}
      </svg>
      <div className="min-w-0 text-center sm:text-left">
        <div className="truncate font-body text-[9.5px] font-extrabold uppercase tracking-wide text-muted sm:text-[10px]">{label}</div>
        <div className="truncate font-body text-[13.5px] font-black leading-tight text-ink sm:text-[14px]">{value}</div>
      </div>
    </div>
  );
}
