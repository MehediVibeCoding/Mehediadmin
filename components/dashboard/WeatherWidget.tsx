'use client';

import { useEffect, useState } from 'react';

interface ForecastHour {
  label: string;
  temp: number;
  pct: number;
}

interface WeatherState {
  icon: string;
  temp: string;
  desc: string;
  loc: string;
  feels: string;
  hum: string;
  wind: string;
  forecast: ForecastHour[];
}

const INITIAL_STATE: WeatherState = {
  icon: '⛅',
  temp: '--°',
  desc: 'আবহাওয়া লোড হচ্ছে...',
  loc: '📍 লোকেশন খোঁজা হচ্ছে...',
  feels: '--°',
  hum: '--%',
  wind: '-- km/h',
  forecast: [],
};

// legacy weatherCodeInfo() থেকে হুবহু — Open-Meteo weather_code → [ইমোজি, বাংলা বর্ণনা]
const WEATHER_CODE_MAP: Record<number, [string, string]> = {
  0: ['☀️', 'পরিষ্কার আকাশ'], 1: ['🌤️', 'মোটামুটি পরিষ্কার'], 2: ['⛅', 'আংশিক মেঘলা'], 3: ['☁️', 'মেঘলা'],
  45: ['🌫️', 'কুয়াশা'], 48: ['🌫️', 'ঘন কুয়াশা'],
  51: ['🌦️', 'হালকা গুঁড়ি বৃষ্টি'], 53: ['🌦️', 'মাঝারি গুঁড়ি বৃষ্টি'], 55: ['🌧️', 'ভারী গুঁড়ি বৃষ্টি'],
  61: ['🌦️', 'হালকা বৃষ্টি'], 63: ['🌧️', 'মাঝারি বৃষ্টি'], 65: ['🌧️', 'ভারী বৃষ্টি'],
  66: ['🌧️', 'হিমশীতল বৃষ্টি'], 67: ['🌧️', 'ভারী হিমশীতল বৃষ্টি'],
  71: ['🌨️', 'হালকা তুষারপাত'], 73: ['🌨️', 'মাঝারি তুষারপাত'], 75: ['❄️', 'ভারী তুষারপাত'], 77: ['🌨️', 'তুষার দানা'],
  80: ['🌦️', 'হালকা বৃষ্টির ঝাপটা'], 81: ['🌧️', 'মাঝারি বৃষ্টির ঝাপটা'], 82: ['⛈️', 'প্রবল বৃষ্টির ঝাপটা'],
  85: ['🌨️', 'হালকা তুষার ঝাপটা'], 86: ['❄️', 'ভারী তুষার ঝাপটা'],
  95: ['⛈️', 'বজ্রঝড়'], 96: ['⛈️', 'বজ্রঝড় সহ শিলাবৃষ্টি'], 99: ['⛈️', 'ভারী বজ্রঝড় সহ শিলাবৃষ্টি'],
};

function weatherInfo(code: number): [string, string] {
  return WEATHER_CODE_MAP[code] || ['⛅', 'আবহাওয়া'];
}

export default function WeatherWidget() {
  const [state, setState] = useState<WeatherState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeatherFor(lat: number, lon: number, label: string) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&forecast_days=1&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;

        const cur = data.current;
        const [icon, desc] = weatherInfo(cur.weather_code);

        const hourlyTimes: string[] = data.hourly.time;
        const hourlyTemps: number[] = data.hourly.temperature_2m;
        const nowIdx = hourlyTimes.findIndex((t) => new Date(t) >= new Date());
        const startIdx = nowIdx >= 0 ? nowIdx : 0;
        const hours = hourlyTimes.slice(startIdx, startIdx + 6);
        const temps = hourlyTemps.slice(startIdx, startIdx + 6);
        const maxT = Math.max(...temps);
        const minT = Math.min(...temps);
        const range = maxT - minT || 1;

        const forecast: ForecastHour[] = hours.map((t, i) => {
          const hr = new Date(t).getHours();
          const pct = Math.max(18, Math.round(((temps[i] - minT) / range) * 100));
          const label12 = (hr % 12 === 0 ? 12 : hr % 12) + (hr < 12 ? 'AM' : 'PM');
          return { label: label12, temp: Math.round(temps[i]), pct };
        });

        setState({
          icon,
          temp: Math.round(cur.temperature_2m) + '°C',
          desc,
          loc: '📍 ' + label,
          feels: Math.round(cur.apparent_temperature) + '°',
          hum: cur.relative_humidity_2m + '%',
          wind: Math.round(cur.wind_speed_10m) + ' km/h',
          forecast,
        });
      } catch {
        if (!cancelled) {
          setState((s) => ({ ...s, desc: 'আবহাওয়ার তথ্য লোড করা যায়নি' }));
        }
      }
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeatherFor(pos.coords.latitude, pos.coords.longitude, 'আপনার বর্তমান অবস্থান'),
        () => fetchWeatherFor(23.8103, 90.4125, 'ঢাকা, বাংলাদেশ'),
        { timeout: 6000 }
      );
    } else {
      fetchWeatherFor(23.8103, 90.4125, 'ঢাকা, বাংলাদেশ');
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative mb-4 flex flex-wrap items-center gap-3 overflow-hidden rounded-brand bg-brand-grad p-4 text-white shadow-[0_14px_40px_rgba(0,61,143,.28),inset_0_1px_0_rgba(255,255,255,.18)] md:gap-4 md:p-5">
      {/* legacy .weather-card::before — top-right/bottom-left radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 90% -20%, rgba(255,255,255,.22) 0%, transparent 45%), radial-gradient(circle at 0% 120%, rgba(0,18,41,.28) 0%, transparent 55%)',
        }}
      />
      {/* legacy .weather-card::after — floating soft circle */}
      <div className="pointer-events-none absolute -right-[6%] -top-[30%] h-56 w-56 animate-weather-float rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.16),transparent_70%)]" />

      <div className="relative z-10 flex min-w-[220px] flex-1 items-center gap-3.5">
        <div className="animate-weather-icon-bob text-[44px] leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,.25)]">
          {state.icon}
        </div>
        <div>
          <div className="text-[32px] font-bold tracking-tight">{state.temp}</div>
          <div className="mt-0.5 text-[12.5px] text-white/85">{state.desc}</div>
          <div className="mt-0.5 text-[11px] text-white/60">{state.loc}</div>
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap gap-4">
        <div className="text-center">
          <div className="text-sm font-bold">{state.feels}</div>
          <div className="text-[9.5px] uppercase tracking-wide text-white/60">অনুভূত হয়</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold">{state.hum}</div>
          <div className="text-[9.5px] uppercase tracking-wide text-white/60">আর্দ্রতা</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold">{state.wind}</div>
          <div className="text-[9.5px] uppercase tracking-wide text-white/60">বাতাস</div>
        </div>
      </div>

      {state.forecast.length > 0 && (
        <div className="relative z-10 flex w-full flex-wrap justify-between gap-2.5 border-t border-white/20 pt-3 md:w-auto md:justify-start md:border-l md:border-t-0 md:pl-4 md:pt-0">
          {state.forecast.map((f, i) => (
            <div key={i} className="flex min-w-[34px] flex-col items-center gap-1">
              <div className="text-[9.5px] font-bold">{f.temp}°</div>
              <div className="flex h-[46px] w-1.5 items-end overflow-hidden rounded-full bg-white/15">
                <div
                  className="w-full rounded-full bg-gradient-to-b from-white to-white/55 transition-[height] duration-500"
                  style={{ height: `${f.pct}%` }}
                />
              </div>
              <div className="text-[9px] text-white/60">{f.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
