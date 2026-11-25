import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { fetchMateriDetail, fetchMateriList, trackAnalyticsEvent } from '../lib/api';
import type { MateriItem } from '../types';
import { ArticleReader } from './ArticleReader';

interface LibraryViewProps {
  selectedSlug: string | null;
  onSelectSlug: (slug: string | null) => void;
  materiTick: number;
}

const LEVELS = [
  { value: 'all', label: 'Semua Level' },
  { value: 'Beginner', label: 'Dasar' },
  { value: 'Intermediate', label: 'Menengah' },
  { value: 'Advanced', label: 'Ahli' },
] as const;

const CATEGORIES = ['all', 'Termux', 'Networking', 'System', 'Automation'] as const;

export function LibraryView({ selectedSlug, onSelectSlug, materiTick }: LibraryViewProps) {
  const [items, setItems] = useState<MateriItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [level, setLevel] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [queryInput, setQueryInput] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeArticle, setActiveArticle] = useState<MateriItem | null>(null);
  const [loadingArticle, setLoadingArticle] = useState<boolean>(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQuery(queryInput);
      setPage(1);
      if (queryInput.trim().length >= 2) {
        void trackAnalyticsEvent('search', queryInput.trim().toLowerCase());
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [queryInput]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMateriList({
        level,
        category,
        q: debouncedQuery,
        page,
        limit: 12,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  }, [level, category, debouncedQuery, page]);

  useEffect(() => {
    void loadList();
  }, [loadList, materiTick]);

  useEffect(() => {
    if (!selectedSlug) {
      setActiveArticle(null);
      return;
    }
    let cancelled = false;
    setLoadingArticle(true);
    fetchMateriDetail(selectedSlug)
      .then((item) => {
        if (!cancelled) setActiveArticle(item);
      })
      .catch(() => {
        if (!cancelled) onSelectSlug(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingArticle(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSlug, onSelectSlug]);

  if (selectedSlug) {
    if (loadingArticle || !activeArticle) {
      return (
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-10 w-44 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-80 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 animate-pulse" />
        </div>
      );
    }

    return (
      <ArticleReader
        materi={activeArticle}
        onBack={() => onSelectSlug(null)}
        onCompleted={() => {
          void loadList();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Gudang Ilmu
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Kurikulum disusun berurutan dari level paling dasar hingga ahli—siap dipraktikkan langsung dari HP maupun desktop.
          </p>
        </div>
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {total} materi tersedia
        </span>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <Search className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Cari judul, topik, atau tag (mis. nmap, bash, chmod)…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
            {LEVELS.map((lvl) => (
              <button
                key={lvl.value}
                type="button"
                onClick={() => {
                  setLevel(lvl.value);
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  level === lvl.value
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  category === cat
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {cat === 'all' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-52 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Tidak ada materi yang cocok dengan filter saat ini.
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Coba ubah kata kunci pencarian atau atur ulang filter level dan kategori.
          </p>
          <button
            type="button"
            onClick={() => {
              setLevel('all');
              setCategory('all');
              setQueryInput('');
              setPage(1);
            }}
            className="mt-4 inline-flex min-h-[38px] items-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950"
          >
            Atur Ulang Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => {
            const stepNum = String((page - 1) * 12 + idx + 1).padStart(2, '0');
            const levelText =
              item.level === 'Beginner'
                ? 'Dasar'
                : item.level === 'Intermediate'
                  ? 'Menengah'
                  : 'Ahli';
            return (
              <article
                key={item.id}
                onClick={() => onSelectSlug(item.slug)}
                className="group flex cursor-pointer flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                      {stepNum}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      {item.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{levelText}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{item.reading_time} mnt</span>
                  </div>

                  <h2 className="mt-2.5 text-base font-semibold text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
                    {item.title}
                  </h2>

                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.summary}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs dark:border-slate-800">
                  <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {item.views_count} baca · {item.completions_count} selesai
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
                    <span>Baca</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`min-h-[36px] min-w-[36px] rounded-lg border px-3 text-xs font-mono font-medium transition-colors tabular-nums ${
                p === page
                  ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-slate-950'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
