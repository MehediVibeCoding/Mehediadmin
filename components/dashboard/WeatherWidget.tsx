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

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData>(DEFAULT_WEATHER);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather(lat: number, lon: number, locationName: string) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&forecast_days=1&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled || !json.current) return;

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
      } catch {
        // কোনো নেটওয়ার্ক সমস্যা হলে ডিফল্ট চৌদ্দগ্রাম প্রদর্শিত থাকবে, ফলে কখনোই ভাঙা অবস্থা আসবে না
      }
    }

    // ১. মাউন্ট হওয়ামাত্রই তাৎক্ষণিক লাইভ চৌদ্দগ্রাম, কুমিল্লার আবহাওয়া ফেচ শুরু হবে (জিরো ডিলে)
    fetchWeather(23.2167, 91.3167, 'চৌদ্দগ্রাম, কুমিল্লা');

    // ২. ব্রাউজার লোকেশন সাপোর্ট করলে ব্যাকগ্রাউন্ডে ইউজার লোকেশনে স্মুথলি শিফট হবে
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) {
            fetchWeather(pos.coords.latitude, pos.coords.longitude, 'আপনার বর্তমান এলাকা');
          }
        },
        () => {
          // পারমিশন ডিনাই করলেও কোনো সমস্যা নেই, চৌদ্দগ্রাম নিরবচ্ছিন্নভাবে চলবে
        },
        { timeout: 4000 }
      );
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative mb-5 overflow-hidden rounded-2xl border border-white/90 bg-gradient-to-r from-brand-bg/60 via-white to-white p-3.5 shadow-sh1 sm:p-4">
      {/* ডেকোরেটিভ ওয়াটারমার্ক — ওয়াইড স্ক্রিনে মাঝের ফাঁকা জায়গা এলিগেন্টভাবে পূরণ করে */}
      <svg
        aria-hidden="true"
        width="130"
        height="130"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="pointer-events-none absolute -right-6 -top-8 text-brand-light opacity-[0.10]"
      >
        <path d="M17.5 19H9a5 5 0 0 1-1-9.9 5.5 5.5 0 0 1 10.5 2.4A4 4 0 0 1 17.5 19Z" />
      </svg>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        {/* বাম ক্লাস্টার: আইকন + তাপমাত্রা + বিবরণ + লোকেশন (সবই main info, সব স্ক্রিনে দেখাবে) */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-brand-light text-white shadow-[0_4px_14px_rgba(68,167,252,0.35)] sm:h-12 sm:w-12">
            <WeatherIcon code={data.code} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-body text-[22px] font-black tracking-tight text-ink sm:text-[24px]">
                {data.temp}
              </span>
              <span className="font-body text-[12.5px] font-bold text-ink/80">{data.desc}</span>
            </div>
            <span className="mt-0.5 flex items-center gap-1 font-body text-[11.5px] font-semibold text-muted">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="truncate">{data.loc}</span>
            </span>
          </div>
        </div>

        {/* ডান ক্লাস্টার: সেকেন্ডারি স্ট্যাট — শুধু মোবাইলে লুকানো থাকবে */}
        <div className="hidden shrink-0 items-center gap-4 border-l border-border-base pl-4 sm:flex">
          <div className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
            </svg>
            <span className="font-body text-[12px] font-bold text-ink">{data.feels}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
              <path d="M12 2.69s5 5.6 5 9.31a5 5 0 0 1-10 0c0-3.71 5-9.31 5-9.31Z" />
            </svg>
            <span className="font-body text-[12px] font-bold text-ink">{data.hum}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <path d="M9.6 4.6a2 2 0 1 1 1.4 3.4H2M14 12.3a2 2 0 1 1 1.4 3.4H2m9.6-4.6H22" />
            </svg>
            <span className="font-body text-[12px] font-bold text-ink">{data.wind}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
