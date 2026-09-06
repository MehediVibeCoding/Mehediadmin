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

const INITIAL_WEATHER: WeatherData = {
  code: 0,
  temp: '--°C',
  desc: 'আবহাওয়া লোড হচ্ছে...',
  loc: 'লোকেশন খোঁজা হচ্ছে...',
  feels: '--°',
  hum: '--%',
  wind: '-- km/h',
  forecast: [],
};

function WeatherIcon({ code, className = 'h-8 w-8' }: { code: number; className?: string }) {
  if (code === 0) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    );
  }
  if (code === 1 || code === 2) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" />
        <path d="M15.5 12a4.5 4.5 0 0 0-4.5-4.5 4.4 4.4 0 0 0-1.7.35" />
        <path d="M17.5 19H9a5 5 0 0 1-1-9.9 5.5 5.5 0 0 1 10.5 2.4A4 4 0 0 1 17.5 19Z" />
      </svg>
    );
  }
  if (code === 3) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17.5 19H9a5 5 0 0 1-1-9.9 5.5 5.5 0 0 1 10.5 2.4A4 4 0 0 1 17.5 19Z" />
      </svg>
    );
  }
  if (code >= 51 && code <= 67) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 13v6M8 13v6M12 15v6" />
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
      </svg>
    );
  }
  if (code >= 95) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
        <polyline points="13 11 9 17 15 17 11 23" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
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
  const [data, setData] = useState<WeatherData>(INITIAL_WEATHER);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather(lat: number, lon: number, locationName: string) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&forecast_days=1&timezone=auto`;
        const res = await fetch(url);
        const json = await res.json();
        if (cancelled) return;

        const cur = json.current;
        const code = cur.weather_code;
        const desc = getWeatherDescription(code);

        const hourlyTimes: string[] = json.hourly.time;
        const hourlyTemps: number[] = json.hourly.temperature_2m;
        const nowIndex = hourlyTimes.findIndex((t) => new Date(t) >= new Date());
        const startIndex = nowIndex >= 0 ? nowIndex : 0;
        const times = hourlyTimes.slice(startIndex, startIndex + 6);
        const temps = hourlyTemps.slice(startIndex, startIndex + 6);
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        const diff = maxTemp - minTemp || 1;

        const forecast: ForecastHour[] = times.map((t, i) => {
          const hour = new Date(t).getHours();
          const pct = Math.max(20, Math.round(((temps[i] - minTemp) / diff) * 100));
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
          forecast,
        });
      } catch {
        if (!cancelled) {
          setData((prev) => ({ ...prev, desc: 'আবহাওয়া তথ্য লোড করা যায়নি' }));
        }
      }
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, 'বর্তমান অবস্থান'),
        () => fetchWeather(23.8103, 90.4125, 'ঢাকা, বাংলাদেশ'),
        { timeout: 6000 }
      );
    } else {
      fetchWeather(23.8103, 90.4125, 'ঢাকা, বাংলাদেশ');
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="card-hover-glow relative mb-5 overflow-hidden rounded-[24px] border border-white/90 bg-white/80 p-4 shadow-sh1 backdrop-blur-xl sm:p-5 md:p-6">
      {/* ব্যাকগ্রাউন্ড সফট গ্লাস অ্যাম্বিয়েন্স */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-brand-light/15 to-transparent blur-2xl"
      />

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* ১. বাম পাশ: লাইভ আইকন ও তাপমাত্রা */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-brand-light to-brand-primary text-white shadow-[0_6px_20px_rgba(68,167,252,0.35)]">
            <WeatherIcon code={data.code} className="h-7 w-7" />
          </div>
          <div>
            <div className="font-body text-[32px] font-black tracking-tight text-ink sm:text-[36px]">
              {data.temp}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-body text-[13px] font-bold text-ink/85">{data.desc}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-0.5 font-body text-[10.5px] font-semibold text-muted">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {data.loc}
              </span>
            </div>
          </div>
        </div>

        {/* ২. মাঝের অংশ: ৩টি ট্যাকটাইল মেট্রিক ক্যাপসুল (ইমেজ ২ ও ৩ ইন্সপায়ারেশন) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <div className="flex flex-col items-center justify-center rounded-[16px] border border-border-base/50 bg-surface-muted/50 px-3 py-2.5 text-center shadow-xs transition-colors hover:bg-white">
            <span className="mb-0.5 font-body text-[10px] font-extrabold uppercase tracking-wider text-muted">অনুভূত</span>
            <span className="font-body text-[14px] font-black text-ink">{data.feels}</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-[16px] border border-border-base/50 bg-surface-muted/50 px-3 py-2.5 text-center shadow-xs transition-colors hover:bg-white">
            <span className="mb-0.5 font-body text-[10px] font-extrabold uppercase tracking-wider text-muted">আর্দ্রতা</span>
            <span className="font-body text-[14px] font-black text-brand-primary">{data.hum}</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-[16px] border border-border-base/50 bg-surface-muted/50 px-3 py-2.5 text-center shadow-xs transition-colors hover:bg-white">
            <span className="mb-0.5 font-body text-[10px] font-extrabold uppercase tracking-wider text-muted">বাতাস</span>
            <span className="font-body text-[14px] font-black text-ink">{data.wind}</span>
          </div>
        </div>

        {/* ৩. ডান পাশ: ৬-ঘণ্টার স্লিক ফোরকাস্ট ট্র্যাক */}
        {data.forecast.length > 0 && (
          <div className="flex items-end justify-between gap-3 border-t border-border-base/60 pt-3 sm:gap-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {data.forecast.map((item, idx) => (
              <div key={idx} className="flex min-w-[34px] flex-col items-center gap-1.5">
                <span className="font-body text-[10px] font-bold text-ink">{item.temp}°</span>
                <div className="flex h-10 w-2 items-end overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-brand-primary to-brand-light transition-[height] duration-500"
                    style={{ height: `${item.pct}%` }}
                  />
                </div>
                <span className="whitespace-nowrap font-body text-[9px] font-semibold text-muted">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
