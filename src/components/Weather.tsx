import { useEffect, useState } from "react";
import WeatherParticles from "./WeatherParticles";

type WeatherData = {
  city: string;
  temperature: number;
  weatherCode: number;
  windSpeed: number;
};

type WeatherCache = {
  data: WeatherData;
  fetchedAt: number;
};

const CACHE_KEY = "dm_weather";
const CACHE_TTL_MS = 30 * 60 * 1000;

const weatherDescription = (code: number): string => {
  if (code === 0) return "Bezchmurnie ☀️";
  if ([1, 2, 3].includes(code)) return "Pochmurnie ⛅";
  if ([45, 48].includes(code)) return "Mgła 🌫️";
  if ([51, 53, 55, 61, 63, 65].includes(code)) return "Deszcz 🌧️";
  if ([71, 73, 75, 77].includes(code)) return "Śnieg ❄️";
  if ([80, 81, 82].includes(code)) return "Przelotny deszcz 🌦️";
  if ([85, 86].includes(code)) return "Przelotny śnieg 🌨️";
  if ([95, 96, 99].includes(code)) return "Burza ⛈️";
  return "—";
};

const readCache = (): WeatherCache | null => {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const cache = parsed as Partial<WeatherCache>;
    if (!cache.data || typeof cache.fetchedAt !== "number") return null;

    const data = cache.data as Partial<WeatherData>;
    if (
      typeof data.city !== "string" ||
      typeof data.temperature !== "number" ||
      typeof data.weatherCode !== "number" ||
      typeof data.windSpeed !== "number"
    ) {
      return null;
    }

    return {
      data: {
        city: data.city,
        temperature: data.temperature,
        weatherCode: data.weatherCode,
        windSpeed: data.windSpeed
      },
      fetchedAt: cache.fetchedAt
    };
  } catch {
    return null;
  }
};

const writeCache = (data: WeatherData): void => {
  const payload: WeatherCache = { data, fetchedAt: Date.now() };
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
};

function Weather() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    setVisible(data !== null);
  }, [data]);

  useEffect(() => {
    let cancelled = false;

    const loadWeather = async () => {
      const cache = readCache();
      if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
        if (!cancelled) {
          setData(cache.data);
          setFromCache(false);
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        const result = await window.electronAPI?.getWeather?.();
        if (!result) throw new Error("brak electronAPI.getWeather");
        if ("error" in result) throw new Error(result.error);

        const nextData: WeatherData = {
          city: result.city,
          temperature: result.temperature,
          weatherCode: result.weatherCode,
          windSpeed: result.windSpeed
        };

        writeCache(nextData);

        if (!cancelled) {
          setData(nextData);
          setFromCache(false);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        const cacheFallback = readCache();
        if (!cancelled) {
          if (cacheFallback) {
            setData(cacheFallback.data);
            setFromCache(true);
            setError(null);
          } else {
            setData(null);
            setError(String(err));
          }
          setLoading(false);
        }
      }
    };

    void loadWeather();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative overflow-hidden px-4 py-4">
      {!loading && data && <WeatherParticles weatherCode={data.weatherCode} />}

      {loading && <p className="relative z-10 text-sm text-white/40">Ładowanie pogody…</p>}

      {!loading && data && (
        <div className={`relative z-10 transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-wide text-white/40">{data.city}</p>
              <p className="mt-1 text-4xl font-thin text-white/90">{Math.round(data.temperature)}&deg;C</p>
              <p className="mt-1 text-sm text-white/60">{weatherDescription(data.weatherCode)}</p>
              <p className="mt-2 text-xs text-white/30">Wiatr {Math.round(data.windSpeed)} km/h</p>
              {fromCache && <p className="mt-0.5 text-xs text-white/25">z cache</p>}
            </div>
          </div>
        </div>
      )}

      {!loading && error && <p className="relative z-10 text-sm text-white/40">Brak danych pogodowych</p>}
    </section>
  );
}

export default Weather;
