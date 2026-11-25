import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  Database,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { DataApiManager } from './components/DataApiManager';
import { LibraryView } from './components/LibraryView';
import { NotificationsCenter } from './components/NotificationsCenter';
import { SaweriaButton, SaweriaCard } from './components/SaweriaSupport';
import { fetchNotifications, getWorkspaceToken, trackAnalyticsEvent } from './lib/api';
import type { NotificationItem, WorkspaceTab } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('materi')) return 'library';
    }
    return 'analytics';
  });

  const [selectedSlug, setSelectedSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('materi');
    }
    return null;
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('britech-theme');
      if (saved === 'light') return false;
      if (saved === 'dark') return true;
    }
    return true;
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Real-time WebSocket & Notification State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [activeClients, setActiveClients] = useState<number>(1);
  const [toast, setToast] = useState<NotificationItem | null>(null);

  // Live reactive ticks triggered by WebSocket events
  const [analyticsTick, setAnalyticsTick] = useState<number>(0);
  const [materiTick, setMateriTick] = useState<number>(0);

  const toastTimerRef = useRef<number | null>(null);

  // Sync HTML class for Tailwind v4 @custom-variant dark
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      window.localStorage.setItem('britech-theme', 'dark');
    } else {
      root.classList.remove('dark');
      window.localStorage.setItem('britech-theme', 'light');
    }
  }, [isDark]);

  // Sync URL query param when opening/closing an article
  const handleOpenMateri = useCallback((slug: string | null) => {
    setSelectedSlug(slug);
    if (slug) {
      setActiveTab('library');
      const url = new URL(window.location.href);
      url.searchParams.set('materi', slug);
      window.history.replaceState({}, '', url.toString());
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('materi');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetchNotifications();
      setNotifications(res.items);
      setUnreadCount(res.unreadCount);
    } catch {
      // Handled gracefully
    }
  }, []);

  // Bootstrap workspace session, initial notifications, and page_view tracking
  useEffect(() => {
    void getWorkspaceToken().then(() => {
      void trackAnalyticsEvent('page_view', window.location.pathname || '/');
    });
    void loadNotifications();
  }, [loadNotifications]);

  // Real WebSocket Connection with Reconnect & Idempotent State Sync
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let attempt = 0;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        attempt = 0;
        setWsConnected(true);
        void loadNotifications();
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { event: string; payload: unknown };

          if (msg.event === 'presence:count') {
            const p = msg.payload as { activeClients?: number };
            if (typeof p.activeClients === 'number') setActiveClients(p.activeClients);
          } else if (msg.event === 'notification:new') {
            const incoming = msg.payload as NotificationItem;
            setNotifications((prev) => {
              if (prev.some((item) => item.id === incoming.id)) return prev;
              return [incoming, ...prev];
            });
            if (!incoming.is_read) {
              setUnreadCount((c) => c + 1);
            }
            setToast(incoming);
            if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
            toastTimerRef.current = window.setTimeout(() => setToast(null), 5000);

            if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
              new window.Notification(incoming.title, { body: incoming.message });
            }
          } else if (msg.event === 'notification:read') {
            const p = msg.payload as { id: string };
            setNotifications((prev) => prev.map((n) => (n.id === p.id ? { ...n, is_read: true } : n)));
            setUnreadCount((c) => Math.max(0, c - 1));
          } else if (msg.event === 'notification:read_all') {
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
          } else if (msg.event.startsWith('materi:')) {
            setMateriTick((t) => t + 1);
            setAnalyticsTick((t) => t + 1);
          } else if (msg.event === 'analytics:updated') {
            setAnalyticsTick((t) => t + 1);
          }
        } catch {
          // Ignore malformed frame
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
        if (!disposed) {
          const delay = Math.min(10000, 1000 * Math.pow(2, attempt));
          attempt += 1;
          reconnectTimer = window.setTimeout(connect, delay);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      socket?.close();
    };
  }, [loadNotifications]);

  const navItems: Array<{
    id: WorkspaceTab;
    label: string;
    icon: typeof BarChart3;
    badge?: number;
  }> = [
    { id: 'analytics', label: 'Dasbor Analitik', icon: BarChart3 },
    { id: 'library', label: 'Gudang Ilmu', icon: BookOpen },
    { id: 'api-data', label: 'Manajemen & API', icon: Database },
    { id: 'notifications', label: 'Notifikasi Live', icon: Bell, badge: unreadCount },
  ];

  const activeSectionLabel =
    activeTab === 'analytics'
      ? 'Dasbor Analitik'
      : activeTab === 'library'
        ? selectedSlug
          ? 'Gudang Ilmu / Baca Materi'
          : 'Gudang Ilmu'
        : activeTab === 'api-data'
          ? 'Manajemen Data & API'
          : 'Notifikasi Real-Time';

  const switchTab = (tab: WorkspaceTab) => {
    if (tab !== 'library') {
      handleOpenMateri(null);
    }
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="p-5">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              switchTab('analytics');
            }}
            className="block text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap"
          >
            Bri Tech
          </a>

          <nav aria-label="Navigasi utama" className="mt-7 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => switchTab(item.id)}
                  className={`flex min-h-[42px] w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  wsConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>{wsConnected ? 'Live WebSocket' : 'Menghubungkan…'}</span>
            </span>
            <span className="font-mono tabular-nums">{activeClients}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            className="flex min-h-[38px] w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span>{isDark ? 'Mode Gelap' : 'Mode Terang'}</span>
            {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex w-72 flex-col justify-between bg-white p-5 dark:bg-slate-900">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-50">Bri Tech</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Tutup menu"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-6 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => switchTab(item.id)}
                      className={`flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="font-mono text-xs font-semibold tabular-nums">{item.badge}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              <span>{isDark ? 'Mode Gelap' : 'Mode Terang'}</span>
              {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka navigasi"
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden dark:border-slate-700 dark:text-slate-200"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="truncate text-sm font-medium text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 dark:text-slate-500">Bri Tech / </span>
              <span className="text-slate-900 dark:text-slate-100">{activeSectionLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => switchTab('notifications')}
              aria-label="Notifikasi real-time"
              className="relative inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Bell className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  ({unreadCount})
                </span>
              )}
            </button>

            <SaweriaButton compact />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              analyticsTick={analyticsTick}
              onOpenMateri={(slug) => handleOpenMateri(slug)}
              onNavigateTab={(tab) => switchTab(tab)}
            />
          )}

          {activeTab === 'library' && (
            <LibraryView
              selectedSlug={selectedSlug}
              onSelectSlug={handleOpenMateri}
              materiTick={materiTick}
            />
          )}

          {activeTab === 'api-data' && (
            <DataApiManager
              materiTick={materiTick}
              onOpenMateri={(slug) => handleOpenMateri(slug)}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsCenter
              notifications={notifications}
              unreadCount={unreadCount}
              wsConnected={wsConnected}
              activeClients={activeClients}
              onRefresh={() => void loadNotifications()}
              onOpenMateri={(slug) => handleOpenMateri(slug)}
            />
          )}
        </main>

        <footer className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
            <SaweriaCard />
            <div className="flex flex-col items-start justify-between gap-2 text-xs text-slate-500 sm:flex-row sm:items-center dark:text-slate-400">
              <span>Bri Tech · Gudang Ilmu</span>
              <span>Semua materi gratis untuk belajar Termux, jaringan, dan automasi.</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Real-Time Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-50 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Notifikasi Real-Time · {toast.source}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {toast.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{toast.message}</p>
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setToast(null);
                    if (toast.link_slug) {
                      handleOpenMateri(toast.link_slug);
                    } else {
                      switchTab('notifications');
                    }
                  }}
                  className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  {toast.link_slug ? 'Buka Materi →' : 'Lihat Semua →'}
                </button>
              </div>
            </div>
            <button
              type="button"
              aria-label="Tutup notifikasi"
              onClick={() => setToast(null)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
