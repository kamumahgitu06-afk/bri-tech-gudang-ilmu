import type {
  AnalyticsSummary,
  ApiKeyItem,
  MateriCategory,
  MateriItem,
  MateriLevel,
  MateriSection,
  NotificationItem,
  NotificationSource,
  NotificationType,
  SholatCity,
  SholatSchedule,
} from '../types';

let inMemoryWorkspaceToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

export async function getWorkspaceToken(forceRefresh = false): Promise<string> {
  if (inMemoryWorkspaceToken && !forceRefresh) {
    return inMemoryWorkspaceToken;
  }
  if (tokenPromise && !forceRefresh) {
    return tokenPromise;
  }

  tokenPromise = fetch('/api/v1/session')
    .then(async (res) => {
      if (!res.ok) throw new Error('Gagal menginisialisasi sesi workspace');
      const data = (await res.json()) as { token: string };
      inMemoryWorkspaceToken = data.token;
      return data.token;
    })
    .finally(() => {
      tokenPromise = null;
    });

  return tokenPromise;
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  customApiKey?: string
): Promise<{ data: T; status: number; latencyMs: number }> {
  const started = performance.now();
  const method = (options.method || 'GET').toUpperCase();
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (customApiKey && customApiKey.trim()) {
    headers.set('X-API-Key', customApiKey.trim());
  } else if (isMutation) {
    const token = await getWorkspaceToken();
    headers.set('X-Workspace-Token', token);
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && isMutation && !customApiKey) {
    const freshToken = await getWorkspaceToken(true);
    headers.set('X-Workspace-Token', freshToken);
    res = await fetch(url, { ...options, headers });
  }

  const latencyMs = Math.max(1, Math.round(performance.now() - started));
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok) {
    const errMsg =
      (parsed as { error?: string } | null)?.error || `Permintaan gagal dengan status ${res.status}`;
    throw new Error(errMsg);
  }

  return { data: parsed as T, status: res.status, latencyMs };
}

export async function fetchMateriList(params: {
  level?: string;
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: MateriItem[]; total: number; page: number; totalPages: number }> {
  const search = new URLSearchParams();
  if (params.level && params.level !== 'all') search.set('level', params.level);
  if (params.category && params.category !== 'all') search.set('category', params.category);
  if (params.q && params.q.trim()) search.set('q', params.q.trim());
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));

  const { data } = await apiRequest<{ items: MateriItem[]; total: number; page: number; totalPages: number }>(
    `/api/v1/materi?${search.toString()}`
  );
  return data;
}

export async function fetchMateriDetail(slug: string): Promise<MateriItem> {
  const { data } = await apiRequest<MateriItem>(`/api/v1/materi/${encodeURIComponent(slug)}`);
  return data;
}

export interface MateriPayload {
  title: string;
  slug?: string;
  level: MateriLevel;
  category: MateriCategory;
  summary: string;
  reading_time: number;
  tags: string[];
  sections: MateriSection[];
}

export async function createMateri(payload: MateriPayload): Promise<MateriItem> {
  const { data } = await apiRequest<MateriItem>('/api/v1/materi', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

export async function updateMateri(id: string, payload: Partial<MateriPayload>): Promise<MateriItem> {
  const { data } = await apiRequest<MateriItem>(`/api/v1/materi/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

export async function deleteMateri(id: string): Promise<void> {
  await apiRequest(`/api/v1/materi/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function importMateriBatch(items: MateriPayload[]): Promise<{ created: number; updated: number }> {
  const { data } = await apiRequest<{ created: number; updated: number }>('/api/v1/materi/import', {
    method: 'POST',
    body: JSON.stringify(items),
  });
  return data;
}

export async function fetchNotifications(): Promise<{ items: NotificationItem[]; unreadCount: number }> {
  const { data } = await apiRequest<{ items: NotificationItem[]; unreadCount: number }>('/api/v1/notifications');
  return data;
}

export async function pushNotification(payload: {
  title: string;
  message: string;
  type: NotificationType;
  source: NotificationSource;
  link_slug?: string | null;
}): Promise<NotificationItem> {
  const { data } = await apiRequest<NotificationItem>('/api/v1/notifications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await apiRequest(`/api/v1/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiRequest('/api/v1/notifications/read-all', { method: 'POST' });
}

export async function removeNotification(id: string): Promise<void> {
  await apiRequest(`/api/v1/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function fetchAnalyticsSummary(range: '24h' | '7d' | '30d' | 'all'): Promise<AnalyticsSummary> {
  const { data } = await apiRequest<AnalyticsSummary>(`/api/v1/analytics/summary?range=${range}`);
  return data;
}

export async function trackAnalyticsEvent(
  event_type: 'page_view' | 'materi_read' | 'materi_complete' | 'cmd_copy' | 'search',
  target: string,
  meta: Record<string, unknown> = {}
): Promise<void> {
  try {
    await apiRequest('/api/v1/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event_type, target, meta }),
    });
  } catch {
    // Non-blocking telemetry
  }
}

export async function fetchApiKeys(): Promise<ApiKeyItem[]> {
  const { data } = await apiRequest<{ items: ApiKeyItem[] }>('/api/v1/keys');
  return data.items;
}

export async function createApiKey(name: string): Promise<{ item: ApiKeyItem; rawKey: string }> {
  const { data } = await apiRequest<{ item: ApiKeyItem; rawKey: string }>('/api/v1/keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return data;
}

export async function revokeApiKey(id: string): Promise<void> {
  await apiRequest(`/api/v1/keys/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function fetchSholatSchedule(params: {
  lat?: number;
  lng?: number;
  cityId?: string;
}): Promise<SholatSchedule> {
  const search = new URLSearchParams();
  if (params.lat !== undefined && params.lng !== undefined) {
    search.set('lat', String(params.lat));
    search.set('lng', String(params.lng));
  } else if (params.cityId) {
    search.set('cityId', params.cityId);
  }
  const { data } = await apiRequest<SholatSchedule>(`/api/v1/sholat?${search.toString()}`);
  return data;
}

export async function searchSholatCities(q: string): Promise<SholatCity[]> {
  const { data } = await apiRequest<{ items: SholatCity[] }>(
    `/api/v1/sholat/cities?q=${encodeURIComponent(q)}`
  );
  return data.items;
}
