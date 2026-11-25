import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, MapPin, RefreshCw, Search } from 'lucide-react';
import { fetchSholatSchedule, pushNotification, searchSholatCities } from '../lib/api';
import type { SholatCity, SholatSchedule } from '../types';

interface NextPrayerState {
  name: string;
  time: string;
  remainingMs: number;
}

function computeNextPrayer(timings: SholatSchedule['timings']): NextPrayerState {
  const now = new Date();
  const entries: Array<[string, string]> = [
    ['Subuh', timings.Subuh],
    ['Dzuhur', timings.Dzuhur],
    ['Ashar', timings.Ashar],
    ['Maghrib', timings.Maghrib],
    ['Isya', timings.Isya],
  ];

  for (const [name, time] of entries) {
    const [hh, mm] = time.split(':').map(Number);
    const candidate = new Date(now);
    candidate.setHours(hh, mm, 0, 0);
    if (candidate.getTime() > now.getTime()) {
      return { name, time, remainingMs: candidate.getTime() - now.getTime() };
    }
  }

  const [hh, mm] = timings.Subuh.split(':').map(Number);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hh, mm, 0, 0);
  return {
    name: 'Subuh (Besok)',
    time: timings.Subuh,
    remainingMs: tomorrow.getTime() - now.getTime(),
  };
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SholatWidget() {
  const [schedule, setSchedule] = useState<SholatSchedule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string>('1221');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerState | null>(null);

  const [cityPickerOpen, setCityPickerOpen] = useState<boolean>(false);
  const [cityQuery, setCityQuery] = useState<string>('');
  const [cities, setCities] = useState<SholatCity[]>([]);
  const [searchingCities, setSearchingCities] = useState<boolean>(false);

  const notifiedPrayerRef = useRef<string>('');
  const lastDateRef = useRef<string>(new Date().toDateString());

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = coords
        ? await fetchSholatSchedule({ lat: coords.lat, lng: coords.lng })
        : await fetchSholatSchedule({ cityId });
      setSchedule(data);
      setNextPrayer(computeNextPrayer(data.timings));
      lastDateRef.current = new Date().toDateString();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat jadwal sholat');
    } finally {
      setLoading(false);
    }
  }, [cityId, coords]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    if (!schedule) return;
    const timer = window.setInterval(() => {
      const now = new Date();
      if (now.toDateString() !== lastDateRef.current) {
        void loadSchedule();
        return;
      }

      const next = computeNextPrayer(schedule.timings);
      setNextPrayer(next);

      if (next.remainingMs <= 1000 && next.remainingMs >= 0) {
        const key = `${now.toDateString()}-${next.name}`;
        if (notifiedPrayerRef.current !== key) {
          notifiedPrayerRef.current = key;
          void pushNotification({
            title: `Waktu ${next.name} Tiba`,
            message: `Memasuki waktu sholat ${next.name} (${next.time}) untuk wilayah ${schedule.locationLabel}.`,
            type: 'info',
            source: 'sholat',
          }).catch(() => {});
        }
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [schedule, loadSchedule]);

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setError('Peramban tidak mendukung geolokasi.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCityPickerOpen(false);
      },
      () => {
        setLoading(false);
        setError('Izin lokasi ditolak; tetap menggunakan jadwal kota terpilih.');
      },
      { timeout: 6000 }
    );
  };

  useEffect(() => {
    if (!cityPickerOpen) return;
    const handle = window.setTimeout(async () => {
      setSearchingCities(true);
      try {
        const list = await searchSholatCities(cityQuery);
        setCities(list);
      } finally {
        setSearchingCities(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [cityQuery, cityPickerOpen]);

  const prayerRows = useMemo(() => {
    if (!schedule) return [];
    return Object.entries(schedule.timings) as Array<[string, string]>;
  }, [schedule]);

  return (
    <section
      aria-label="Jadwal Sholat Real-Time"
      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Jadwal Sholat Real-Time
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {schedule
                ? `${schedule.locationLabel} · ${schedule.provider === 'aladhan' ? 'Aladhan GPS' : 'MyQuran API'}`
                : 'Memuat lokasi…'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUseGps}
              title="Gunakan koordinat GPS saat ini"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>GPS</span>
            </button>
            <button
              type="button"
              onClick={() => setCityPickerOpen((v) => !v)}
              title="Pilih kota Indonesia"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Kota</span>
            </button>
            <button
              type="button"
              onClick={() => void loadSchedule()}
              aria-label="Muat ulang jadwal sholat"
              className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {cityPickerOpen && (
          <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Cari kota (mis. Bandung, Jakarta, Sumedang)…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div className="mt-2 max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {searchingCities ? (
                <p className="py-2 text-xs text-slate-500">Mencari daftar kota…</p>
              ) : cities.length === 0 ? (
                <p className="py-2 text-xs text-slate-500">Kota tidak ditemukan.</p>
              ) : (
                cities.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCoords(null);
                      setCityId(c.id);
                      setCityPickerOpen(false);
                    }}
                    className="flex w-full items-center justify-between py-1.5 text-left text-xs text-slate-700 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400"
                  >
                    <span>{c.lokasi}</span>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">{c.id}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">{error}</p>
        )}

        <div className="mt-4 rounded-lg bg-slate-50 p-3.5 dark:bg-slate-950">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Menuju {nextPrayer ? nextPrayer.name : '—'}
            </span>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {nextPrayer ? nextPrayer.time : '--:--'}
            </span>
          </div>
          <div className="mt-1 font-mono text-2xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
            {nextPrayer ? formatCountdown(nextPrayer.remainingMs) : '--:--:--'}
          </div>
        </div>
      </div>

      <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        {loading && !schedule ? (
          <div className="space-y-2 py-2">
            <div className="h-6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="h-6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="h-6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        ) : (
          prayerRows.map(([name, time]) => {
            const isNext = nextPrayer?.name.startsWith(name);
            return (
              <div
                key={name}
                className="flex h-9 items-center justify-between text-sm"
              >
                <span
                  className={
                    isNext
                      ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-300'
                  }
                >
                  {name}
                </span>
                <span
                  className={`font-mono tabular-nums ${
                    isNext
                      ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {time}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
