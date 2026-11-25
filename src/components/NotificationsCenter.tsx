import { useMemo, useState } from 'react';
import { Bell, Check, CheckCheck, Send, Trash2 } from 'lucide-react';
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  pushNotification,
  removeNotification,
} from '../lib/api';
import type { NotificationItem, NotificationSource, NotificationType } from '../types';

interface NotificationsCenterProps {
  notifications: NotificationItem[];
  unreadCount: number;
  wsConnected: boolean;
  activeClients: number;
  onRefresh: () => void;
  onOpenMateri: (slug: string) => void;
}

export function NotificationsCenter({
  notifications,
  unreadCount,
  wsConnected,
  activeClients,
  onRefresh,
  onOpenMateri,
}: NotificationsCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'api' | 'materi' | 'sholat'>('all');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [type, setType] = useState<NotificationType>('info');
  const [source, setSource] = useState<NotificationSource>('api');
  const [sending, setSending] = useState<boolean>(false);
  const [sendFeedback, setSendFeedback] = useState<string | null>(null);
  const [browserPerm, setBrowserPerm] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'unsupported'
  );

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread') return !n.is_read;
      if (filter === 'api') return n.source === 'api';
      if (filter === 'materi') return n.source === 'materi';
      if (filter === 'sholat') return n.source === 'sholat';
      return true;
    });
  }, [notifications, filter]);

  const handleRequestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const perm = await window.Notification.requestPermission();
    setBrowserPerm(perm);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setSendFeedback(null);
    try {
      await pushNotification({
        title: title.trim(),
        message: message.trim(),
        type,
        source,
      });
      setTitle('');
      setMessage('');
      setSendFeedback('Notifikasi dikirim ke server dan disiarkan real-time ke seluruh tab aktif.');
    } catch (err) {
      setSendFeedback(err instanceof Error ? err.message : 'Gagal mengirim notifikasi.');
    } finally {
      setSending(false);
    }
  };

  const typeLabel = (t: NotificationType) => {
    if (t === 'success') return 'Sukses';
    if (t === 'warning') return 'Peringatan';
    if (t === 'alert') return 'Penting';
    return 'Informasi';
  };

  const typeColor = (t: NotificationType) => {
    if (t === 'success') return 'text-emerald-700 dark:text-emerald-400';
    if (t === 'warning') return 'text-amber-600 dark:text-amber-400';
    if (t === 'alert') return 'text-rose-600 dark:text-rose-400';
    return 'text-sky-700 dark:text-sky-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Pusat Notifikasi Real-Time
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Aliran peristiwa langsung melalui WebSocket (<span className="font-mono">/ws</span>) yang tersimpan permanen di SQLite.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900">
            <span
              className={`h-2 w-2 rounded-full ${
                wsConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {wsConnected ? 'WebSocket Terhubung' : 'Menyambungkan…'}
            </span>
            <span className="font-mono text-slate-400 tabular-nums">· {activeClients} klien</span>
          </div>

          {browserPerm !== 'unsupported' && browserPerm !== 'granted' && (
            <button
              type="button"
              onClick={() => void handleRequestBrowserPermission()}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 whitespace-nowrap shrink-0"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Aktifkan Alert Browser</span>
            </button>
          )}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={async () => {
                await markAllNotificationsAsRead();
                onRefresh();
              }}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 whitespace-nowrap shrink-0"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Tandai Semua Dibaca ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Notifications Feed */}
        <section className="space-y-4 lg:col-span-7">
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {([
              ['all', 'Semua'],
              ['unread', `Belum Dibaca (${unreadCount})`],
              ['api', 'API / Webhook'],
              ['materi', 'Materi'],
              ['sholat', 'Sholat'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  filter === key
                    ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Tidak ada notifikasi pada kategori ini.
              </div>
            ) : (
              filtered.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start justify-between gap-4 p-4 transition-colors ${
                    !n.is_read ? 'bg-emerald-50/40 dark:bg-emerald-950/15' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`font-semibold ${typeColor(n.type)}`}>{typeLabel(n.type)}</span>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{n.source}</span>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className="font-mono text-slate-400 tabular-nums">
                        {new Date(n.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      {!n.is_read && (
                        <>
                          <span aria-hidden="true" className="text-slate-400">·</span>
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">Baru</span>
                        </>
                      )}
                    </div>

                    <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {n.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{n.message}</p>

                    {n.link_slug && (
                      <button
                        type="button"
                        onClick={() => onOpenMateri(n.link_slug!)}
                        className="mt-2 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        Buka materi terkait →
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!n.is_read && (
                      <button
                        type="button"
                        title="Tandai sudah dibaca"
                        onClick={async () => {
                          await markNotificationAsRead(n.id);
                          onRefresh();
                        }}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Hapus notifikasi"
                      onClick={async () => {
                        await removeNotification(n.id);
                        onRefresh();
                      }}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Live Push Composer */}
        <section className="h-fit rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Siarkan Notifikasi Live
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Uji pengiriman notifikasi asli melalui <code className="font-mono">POST /api/v1/notifications</code>. Pesan langsung disimpan ke SQLite dan dikirim via WebSocket ke semua pengguna yang terhubung.
          </p>

          <form onSubmit={(e) => void handleSend(e)} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Judul</label>
              <input
                type="text"
                required
                minLength={2}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="mis. Pembaruan Jadwal Lab Termux"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Pesan</label>
              <textarea
                rows={3}
                required
                minLength={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tulis informasi yang akan disiarkan…"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Tipe</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as NotificationType)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="info">Informasi</option>
                  <option value="success">Sukses</option>
                  <option value="warning">Peringatan</option>
                  <option value="alert">Penting</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Sumber</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as NotificationSource)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="api">API / Webhook</option>
                  <option value="system">Sistem</option>
                  <option value="materi">Materi</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-950"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{sending ? 'Menyiarkan…' : 'Kirim Notifikasi Real-Time'}</span>
            </button>

            {sendFeedback && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">{sendFeedback}</p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
