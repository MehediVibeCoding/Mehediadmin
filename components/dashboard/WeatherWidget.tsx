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
  loc: 'ঢাকা, বাংলাদেশ',
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
        // কোনো নেটওয়ার্ক সমস্যা হলে ডিফল্ট ঢাকা প্রদর্শিত থাকবে, ফলে কখনোই ভাঙা অবস্থা আসবে না
      }
    }

    // ১. মাউন্ট হওয়ামাত্রই তাৎক্ষণিক লাইভ ঢাকার আবহাওয়া ফেচ শুরু হবে (জিরো ডিলে)
    fetchWeather(23.8103, 90.4125, 'ঢাকা, বাংলাদেশ');

    // ২. ব্রাউজার লোকেশন সাপোর্ট করলে ব্যাকগ্রাউন্ডে ইউজার লোকেশনে স্মুথলি শিফট হবে
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) {
            fetchWeather(pos.coords.latitude, pos.coords.longitude, 'আপনার বর্তমান এলাকা');
          }
        },
        () => {
          // পারমিশন ডিনাই করলেও কোনো সমস্যা নেই, ঢাকা নিরবচ্ছিন্নভাবে চলবে
        },
        { timeout: 4000 }
      );
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="card-hover-glow relative mb-5 overflow-hidden rounded-[26px] border border-brand-light/35 bg-gradient-to-br from-brand-bg/85 via-[#DCEBFD]/60 to-white/95 p-4 shadow-[0_8px_32px_rgba(68,167,252,0.16)] backdrop-blur-2xl sm:p-5 md:p-6">
      {/* ব্যাকগ্রাউন্ড স্কাই-ব্লু লাইট অ্যাম্বিয়েন্স */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-light/20 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* ১. বাম পাশ: লাইভ আইকন, তাপমাত্রা ও লোকেশন পিল */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-[18px] bg-brand-light text-white shadow-[0_6px_20px_rgba(68,167,252,0.35)] sm:h-14 sm:w-14">
            <WeatherIcon code={data.code} className="h-7 w-7" />
          </div>
          <div>
            <div className="font-body text-[32px] font-black tracking-tight text-ink sm:text-[36px]">
              {data.temp}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-body text-[13px] font-bold text-ink/90">{data.desc}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/75 px-2.5 py-0.5 font-body text-[10.5px] font-bold text-brand-light shadow-xs backdrop-blur-md">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {data.loc}
              </span>
            </div>
          </div>
        </div>

        {/* ২. মাঝের অংশ: ৩টি ফ্রস্টেড আইস-ক্যাপসুল (ইমেজ ২ ও ৩ ইন্সপায়ারেশন) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          <div className="flex flex-col items-center justify-center rounded-[16px] border border-white/90 bg-white/80 px-3 py-2 text-center shadow-xs backdrop-blur-md">
            <span className="mb-0.5 font-body text-[9.5px] font-extrabold uppercase tracking-wider text-muted">অনুভূত</span>
            <span className="font-body text-[13.5px] font-black text-ink">{data.feels}</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-[16px] border border-white/90 bg-white/80 px-3 py-2 text-center shadow-xs backdrop-blur-md">
            <span className="mb-0.5 font-body text-[9.5px] font-extrabold uppercase tracking-wider text-muted">আর্দ্রতা</span>
            <span className="font-body text-[13.5px] font-black text-brand-light">{data.hum}</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-[16px] border border-white/90 bg-white/80 px-3 py-2 text-center shadow-xs backdrop-blur-md">
            <span className="mb-0.5 font-body text-[9.5px] font-extrabold uppercase tracking-wider text-muted">বাতাস</span>
            <span className="font-body text-[13.5px] font-black text-ink">{data.wind}</span>
          </div>
        </div>

        {/* ৩. ডান পাশ: ৬-ঘণ্টার ফোরকাস্ট বার গ্রাফ */}
        {data.forecast.length > 0 && (
          <div className="flex items-end justify-between gap-2.5 border-t border-brand-light/20 pt-3 sm:gap-3.5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            {data.forecast.map((item, idx) => (
              <div key={idx} className="flex min-w-[32px] flex-col items-center gap-1">
                <span className="font-body text-[10px] font-bold text-ink">{item.temp}°</span>
                <div className="flex h-9 w-2 items-end overflow-hidden rounded-full bg-white/80 shadow-inner">
                  <div
                    className="w-full rounded-full bg-brand-light transition-[height] duration-500"
                    style={{ height: `${item.pct}%` }}
                  />
                </div>
                <span className="whitespace-nowrap font-body text-[8.5px] font-bold text-muted">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
