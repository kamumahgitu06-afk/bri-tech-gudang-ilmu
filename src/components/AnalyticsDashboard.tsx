import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchAnalyticsSummary } from '../lib/api';
import type { AnalyticsSummary } from '../types';
import { SholatWidget } from './SholatWidget';

interface AnalyticsDashboardProps {
  analyticsTick: number;
  onOpenMateri: (slug: string) => void;
  onNavigateTab: (tab: 'library' | 'api-data' | 'notifications') => void;
}

export function AnalyticsDashboard({
  analyticsTick,
  onOpenMateri,
  onNavigateTab,
}: AnalyticsDashboardProps) {
  const [range, setRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const loadSummary = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchAnalyticsSummary(range);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat analitik');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    setLoading(true);
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (analyticsTick > 0) {
      void loadSummary();
    }
  }, [analyticsTick, loadSummary]);

  const maxTimelineVal = useMemo(() => {
    if (!data || data.timeline.length === 0) return 5;
    let max = 1;
    for (const pt of data.timeline) {
      max = Math.max(max, pt.views, pt.apiCalls, pt.completions);
    }
    return Math.max(4, max);
  }, [data]);

  const totalLevelCount = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, data.byLevel.reduce((acc, row) => acc + row.count, 0));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Dasbor Analitik &amp; Aktivitas
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Metrik pembacaan materi, perintah disalin, dan latensi REST API langsung dari SQLite.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {([
              ['24h', '24 Jam'],
              ['7d', '7 Hari'],
              ['30d', '30 Hari'],
              ['all', 'Semua'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  range === value
                    ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void loadSummary()}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Materi Aktif</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {data ? data.kpis.totalMateri : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {data ? `${data.byCategory.length} kategori teknis` : 'Memuat…'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Pembacaan Materi</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {data ? data.kpis.totalViews : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {data ? `${data.kpis.totalCmdCopies} perintah terminal disalin` : 'Memuat…'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tingkat Penyelesaian</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {data ? `${data.kpis.completionRate}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {data ? `${data.kpis.totalCompletions} modul selesai dibaca` : 'Memuat…'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Permintaan API &amp; Latensi</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {data ? data.kpis.totalApiCalls : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {data ? `Rata-rata ${data.kpis.avgApiLatencyMs} ms` : 'Memuat…'}
          </p>
        </div>
      </div>

      {/* Main Chart + Sholat Real-Time */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Tren Aktivitas &amp; Trafik API
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Perbandingan sesi baca, penyelesaian modul, dan panggilan endpoint API.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
                <span>Pembacaan</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-sky-600 dark:bg-sky-400" />
                <span>Panggilan API</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                <span>Selesai</span>
              </span>
            </div>
          </div>

          <div className="relative mt-6">
            {data && data.timeline.length > 0 ? (
              <div className="w-full overflow-x-auto">
                <div className="min-w-[460px]">
                  <div className="flex h-52 items-end gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                    {data.timeline.map((pt, idx) => {
                      const viewH = Math.round((pt.views / maxTimelineVal) * 100);
                      const apiH = Math.round((pt.apiCalls / maxTimelineVal) * 100);
                      const compH = Math.round((pt.completions / maxTimelineVal) * 100);
                      return (
                        <div
                          key={pt.bucket}
                          onMouseEnter={() => setHoveredIdx(idx)}
                          onMouseLeave={() => setHoveredIdx(null)}
                          className="group relative flex h-full flex-1 items-end justify-center gap-1 rounded-md px-1 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <div
                            className="w-2.5 rounded-t bg-emerald-600 transition-all dark:bg-emerald-400"
                            style={{ height: `${Math.max(pt.views > 0 ? 6 : 2, viewH)}%` }}
                          />
                          <div
                            className="w-2.5 rounded-t bg-sky-600 transition-all dark:bg-sky-400"
                            style={{ height: `${Math.max(pt.apiCalls > 0 ? 6 : 2, apiH)}%` }}
                          />
                          <div
                            className="w-2.5 rounded-t bg-amber-500 transition-all"
                            style={{ height: `${Math.max(pt.completions > 0 ? 6 : 2, compH)}%` }}
                          />

                          {hoveredIdx === idx && (
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-950 whitespace-nowrap">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{pt.bucket}</p>
                              <p className="mt-1 font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                                Baca: {pt.views}
                              </p>
                              <p className="font-mono text-sky-700 dark:text-sky-400 tabular-nums">
                                API: {pt.apiCalls}
                              </p>
                              <p className="font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                                Selesai: {pt.completions}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex gap-2 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    {data.timeline.map((pt) => (
                      <span key={pt.bucket} className="flex-1 truncate">
                        {pt.bucket}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                Belum ada rekaman aktivitas pada rentang waktu ini.
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>Setiap klik baca, salin perintah, dan panggilan API tercatat otomatis.</span>
            <button
              type="button"
              onClick={() => onNavigateTab('library')}
              className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Jelajahi Gudang Ilmu →
            </button>
          </div>
        </section>

        <div className="lg:col-span-4">
          <SholatWidget />
        </div>
      </div>

      {/* Distribution + Top Materi */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Distribusi Level &amp; Kategori
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Komposisi kurikulum aktif di Gudang Ilmu.
          </p>

          <div className="mt-5 space-y-4">
            {data?.byLevel.map((row) => {
              const pct = Math.round((row.count / totalLevelCount) * 100);
              const label =
                row.level === 'Beginner'
                  ? 'Dasar (Beginner)'
                  : row.level === 'Intermediate'
                    ? 'Menengah (Intermediate)'
                    : 'Ahli (Advanced)';
              return (
                <div key={row.level}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {row.count} materi · {row.views} baca ({pct}%)
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <hr className="my-5 border-slate-200 dark:border-slate-800" />

          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Per Kategori</h3>
          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {data?.byCategory.map((cat) => (
              <div key={cat.category} className="flex h-9 items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">{cat.category}</span>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {cat.count} modul · {cat.views} baca
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Materi Terpopuler
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Klik baris materi untuk langsung membuka artikel pembelajaran.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('api-data')}
              className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400 whitespace-nowrap shrink-0"
            >
              Kelola Data →
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 font-medium">Judul Materi</th>
                  <th className="py-2 font-medium">Kategori</th>
                  <th className="py-2 text-right font-medium">Dibaca</th>
                  <th className="py-2 text-right font-medium">Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.topMateri.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => onOpenMateri(m.slug)}
                    className="h-10 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="max-w-[240px] truncate pr-3 font-medium text-slate-900 dark:text-slate-100">
                      {m.title}
                    </td>
                    <td className="pr-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {m.category}
                    </td>
                    <td className="text-right font-mono text-xs text-slate-700 dark:text-slate-200 tabular-nums">
                      {m.views_count}
                    </td>
                    <td className="text-right font-mono text-xs text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {m.completions_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.topCommands.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Perintah Terminal Paling Sering Disalin
              </h3>
              <div className="mt-2.5 space-y-1.5">
                {data.topCommands.map((c) => (
                  <div
                    key={c.command}
                    className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-3 py-1.5 text-xs dark:bg-slate-950"
                  >
                    <code className="truncate font-mono text-slate-800 dark:text-emerald-400">
                      {c.command}
                    </code>
                    <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                      {c.copies}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Real API Request Logs */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Log Permintaan REST API Terbaru
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Rekaman permintaan HTTP nyata ke server beserta kode status dan waktu respons terukur.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('api-data')}
            className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400 whitespace-nowrap shrink-0"
          >
            Buka API Explorer →
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {data && data.recentApiLogs.length > 0 ? (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 font-medium">Metode</th>
                  <th className="py-2 font-medium">Endpoint</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Latensi</th>
                  <th className="py-2 text-right font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentApiLogs.map((log) => (
                  <tr key={log.id} className="h-9">
                    <td className="pr-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {log.method}
                    </td>
                    <td className="max-w-[300px] truncate pr-3 font-mono text-slate-600 dark:text-slate-300">
                      {log.target}
                    </td>
                    <td className="pr-3 font-mono tabular-nums">
                      <span
                        className={
                          log.status_code >= 400
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }
                      >
                        {log.status_code}
                      </span>
                    </td>
                    <td className="pr-3 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                      {log.latency_ms} ms
                    </td>
                    <td className="text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
              Belum ada panggilan API tercatat. Coba buka Gudang Ilmu atau uji endpoint di tab Integrasi API.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
