import { useEffect, useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, Copy } from 'lucide-react';
import { trackAnalyticsEvent } from '../lib/api';
import type { MateriItem } from '../types';

interface ArticleReaderProps {
  materi: MateriItem;
  onBack: () => void;
  onCompleted: (slug: string) => void;
}

export function ArticleReader({ materi, onBack, onCompleted }: ArticleReaderProps) {
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<boolean>(false);
  const [submittingComplete, setSubmittingComplete] = useState<boolean>(false);

  useEffect(() => {
    void trackAnalyticsEvent('materi_read', materi.slug, {
      category: materi.category,
      level: materi.level,
    });
  }, [materi.slug, materi.category, materi.level]);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - doc.clientHeight;
      const pct = maxScroll > 0 ? Math.min(100, Math.round((doc.scrollTop / maxScroll) * 100)) : 100;
      setScrollPercent(pct);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(key);
      void trackAnalyticsEvent('cmd_copy', text.split('\n')[0].slice(0, 80), {
        materi: materi.slug,
      });
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === key ? null : prev));
      }, 1600);
    } catch {
      // Clipboard blocked
    }
  };

  const handleMarkComplete = async () => {
    if (completed || submittingComplete) return;
    setSubmittingComplete(true);
    try {
      await trackAnalyticsEvent('materi_complete', materi.slug, {
        title: materi.title,
      });
      setCompleted(true);
      onCompleted(materi.slug);
    } finally {
      setSubmittingComplete(false);
    }
  };

  const levelLabel =
    materi.level === 'Beginner'
      ? 'Dasar'
      : materi.level === 'Intermediate'
        ? 'Menengah'
        : 'Ahli';

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 z-50 h-0.5 bg-emerald-600 transition-transform duration-150 dark:bg-emerald-400"
        style={{ width: `${scrollPercent}%` }}
      />

      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Gudang Ilmu</span>
          </button>

          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Progres baca {scrollPercent}%
          </span>
        </div>

        <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-emerald-700 dark:text-emerald-400">{materi.category}</span>
            <span aria-hidden="true">·</span>
            <span>Level {levelLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{materi.reading_time} menit baca</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{materi.views_count} kali dibaca</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50 text-balance">
            {materi.title}
          </h1>

          <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            {materi.summary}
          </p>

          {materi.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
              {materi.tags.map((tag) => (
                <span key={tag} className="font-mono">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <hr className="my-7 border-slate-200 dark:border-slate-800" />

          <div className="space-y-8">
            {materi.sections.map((section, idx) => (
              <section key={`${section.heading}-${idx}`} className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {String(idx + 1).padStart(2, '0')}. {section.heading}
                </h2>

                {section.paragraphs?.map((para, pIdx) => (
                  <p key={pIdx} className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {para}
                  </p>
                ))}

                {section.bullets && section.bullets.length > 0 && (
                  <ul className="list-disc space-y-2 pl-5 text-[15px] text-slate-700 dark:text-slate-300">
                    {section.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}

                {section.table && (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                        <tr>
                          {section.table.headers.map((h, hIdx) => (
                            <th key={hIdx} className="border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {section.table.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={`px-4 py-2.5 ${
                                  cIdx === 1
                                    ? 'font-mono text-xs text-emerald-700 dark:text-emerald-400'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {section.commands && section.commands.length > 0 && (
                  <div className="space-y-2">
                    {section.commands.map((item, cIdx) => {
                      const copyKey = `cmd-${idx}-${cIdx}`;
                      const isCopied = copiedId === copyKey;
                      return (
                        <div
                          key={copyKey}
                          className="flex flex-col justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-950"
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                            <code className="mt-0.5 block truncate font-mono text-xs font-medium text-slate-900 dark:text-emerald-400">
                              {item.cmd}
                            </code>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleCopy(item.cmd, copyKey)}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {section.code && (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 dark:border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-xs text-slate-400">
                      <span className="font-mono">
                        {section.code.caption || section.code.language}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopy(section.code!.content, `code-${idx}`)}
                        className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-800 hover:text-white whitespace-nowrap shrink-0"
                      >
                        {copiedId === `code-${idx}` ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Salin Kode</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-emerald-300">
                      <code>{section.code.content}</code>
                    </pre>
                  </div>
                )}
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Sudah memahami modul ini?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tandai selesai untuk memperbarui statistik belajar dan memicu notifikasi progres.
              </p>
            </div>
            <button
              type="button"
              disabled={completed || submittingComplete}
              onClick={() => void handleMarkComplete()}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                completed
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{completed ? 'Tercatat Selesai' : submittingComplete ? 'Menyimpan…' : 'Tandai Selesai Dibaca'}</span>
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
