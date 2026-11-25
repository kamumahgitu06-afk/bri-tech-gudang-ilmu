import crypto from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import type { MateriCategory, MateriLevel, NotificationSource, NotificationType } from './src/types.ts';
import {
  createApiKeyRecord,
  createMateriRecord,
  createNotificationRecord,
  deleteApiKeyRecord,
  deleteMateriRecord,
  deleteNotificationRecord,
  getAllMateriRaw,
  getAnalyticsSummary,
  getMateriBySlugOrId,
  listApiKeys,
  listMateri,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  recordAnalyticsEvent,
  updateMateriRecord,
  upsertMateriBatch,
  verifyAndTrackApiKey,
} from './server/db.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const VALID_LEVELS: ReadonlySet<string> = new Set(['Beginner', 'Intermediate', 'Advanced']);
const VALID_CATEGORIES: ReadonlySet<string> = new Set(['Termux', 'Networking', 'Automation', 'System']);
const VALID_NOTIF_TYPES: ReadonlySet<string> = new Set(['info', 'success', 'warning', 'alert']);
const VALID_NOTIF_SOURCES: ReadonlySet<string> = new Set(['system', 'materi', 'api', 'sholat']);

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcastWs(event: string, payload: unknown): void {
  const message = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

wss.on('connection', (socket) => {
  broadcastWs('presence:count', { activeClients: wss.clients.size });

  socket.on('close', () => {
    broadcastWs('presence:count', { activeClients: wss.clients.size });
  });

  socket.on('error', () => {
    // Connection errors handled via close cleanup
  });
});

function signWorkspaceToken(): string {
  const issuedAt = Date.now().toString();
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = `${issuedAt}.${nonce}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyWorkspaceToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [issuedAtStr, nonce, providedSig] = parts;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt) || !nonce || !providedSig) return false;
  // Valid for 24 hours
  if (Date.now() - issuedAt > 24 * 60 * 60 * 1000) return false;

  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(`${issuedAtStr}.${nonce}`).digest('hex');
  const providedBuf = Buffer.from(providedSig);
  const expectedBuf = Buffer.from(expectedSig);
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

function requireWriteAccess(req: Request, res: Response, next: NextFunction): void {
  const rawApiKey =
    (req.header('x-api-key') || '').trim() ||
    (req.header('authorization')?.startsWith('Bearer ') ? req.header('authorization')!.slice(7).trim() : '');

  if (rawApiKey) {
    const validKey = verifyAndTrackApiKey(rawApiKey);
    if (validKey) {
      res.locals.authMethod = `api_key:${validKey.name}`;
      next();
      return;
    }
    res.status(401).json({ error: 'API key tidak valid atau telah dicabut.' });
    return;
  }

  const workspaceToken = (req.header('x-workspace-token') || '').trim();
  if (workspaceToken && verifyWorkspaceToken(workspaceToken)) {
    res.locals.authMethod = 'workspace_session';
    next();
    return;
  }

  res.status(401).json({
    error: 'Autentikasi diperlukan. Sertakan header X-API-Key yang valid atau gunakan sesi aktif aplikasi.',
  });
}

// Real API request telemetry middleware (records real HTTP calls & latency to SQLite)
app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
  const startedAt = performance.now();
  const pathUrl = req.originalUrl.split('?')[0];

  // Skip recording high-frequency analytics polling and ephemeral token bootstrap
  const skipTracking =
    pathUrl === '/api/v1/session' ||
    pathUrl === '/api/v1/analytics/summary' ||
    pathUrl === '/api/v1/analytics/track';

  res.on('finish', () => {
    if (skipTracking) return;
    const latencyMs = Math.max(1, Math.round(performance.now() - startedAt));
    try {
      recordAnalyticsEvent({
        event_type: 'api_call',
        target: pathUrl,
        meta: { method: req.method, auth: res.locals.authMethod || 'public' },
        latency_ms: latencyMs,
        status_code: res.statusCode,
      });
      broadcastWs('analytics:updated', { reason: 'api_call', target: pathUrl });
    } catch {
      // Do not interrupt HTTP response if logging fails
    }
  });

  next();
});

// 1. Session & Health
app.get('/api/v1/session', (_req, res) => {
  res.json({ token: signWorkspaceToken() });
});

app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    activeWebSockets: wss.clients.size,
    timestamp: new Date().toISOString(),
  });
});

// 2. Materi CRUD & Bulk Import/Export
app.get('/api/v1/materi', (req, res) => {
  const result = listMateri({
    level: typeof req.query.level === 'string' ? req.query.level : 'all',
    category: typeof req.query.category === 'string' ? req.query.category : 'all',
    q: typeof req.query.q === 'string' ? req.query.q : '',
    page: typeof req.query.page === 'string' ? Number(req.query.page) : 1,
    limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : 12,
  });
  res.json(result);
});

app.get('/api/v1/materi/export', (_req, res) => {
  const items = getAllMateriRaw();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="britech-materi-export.json"');
  res.send(JSON.stringify(items, null, 2));
});

app.get('/api/v1/materi/:slug', (req, res) => {
  const item = getMateriBySlugOrId(req.params.slug);
  if (!item) {
    res.status(404).json({ error: 'Materi tidak ditemukan.' });
    return;
  }
  res.json(item);
});

app.post('/api/v1/materi', requireWriteAccess, (req, res) => {
  const body = req.body as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
  const level = typeof body.level === 'string' && VALID_LEVELS.has(body.level) ? (body.level as MateriLevel) : null;
  const category =
    typeof body.category === 'string' && VALID_CATEGORIES.has(body.category)
      ? (body.category as MateriCategory)
      : null;

  if (!title || title.length < 3) {
    res.status(400).json({ error: 'Judul materi wajib diisi (minimal 3 karakter).' });
    return;
  }
  if (!summary || summary.length < 10) {
    res.status(400).json({ error: 'Ringkasan materi wajib diisi (minimal 10 karakter).' });
    return;
  }
  if (!level) {
    res.status(400).json({ error: 'Level harus salah satu dari: Beginner, Intermediate, Advanced.' });
    return;
  }
  if (!category) {
    res.status(400).json({ error: 'Kategori harus salah satu dari: Termux, Networking, Automation, System.' });
    return;
  }

  const created = createMateriRecord({
    title,
    slug: typeof body.slug === 'string' ? body.slug : undefined,
    level,
    category,
    summary,
    reading_time: typeof body.reading_time === 'number' ? body.reading_time : Number(body.reading_time) || 5,
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    sections: Array.isArray(body.sections) ? (body.sections as never) : undefined,
  });

  const notif = createNotificationRecord({
    title: 'Materi Baru Ditambahkan',
    message: `"${created.title}" (${created.level}) kini tersedia di Gudang Ilmu.`,
    type: 'success',
    source: res.locals.authMethod?.startsWith('api_key') ? 'api' : 'materi',
    link_slug: created.slug,
  });

  broadcastWs('materi:created', created);
  broadcastWs('notification:new', notif);

  res.status(201).json(created);
});

app.put('/api/v1/materi/:id', requireWriteAccess, (req, res) => {
  const body = req.body as Record<string, unknown>;
  const updates: Parameters<typeof updateMateriRecord>[1] = {};

  if (typeof body.title === 'string') {
    if (body.title.trim().length < 3) {
      res.status(400).json({ error: 'Judul materi minimal 3 karakter.' });
      return;
    }
    updates.title = body.title.trim();
  }
  if (typeof body.summary === 'string') {
    if (body.summary.trim().length < 10) {
      res.status(400).json({ error: 'Ringkasan materi minimal 10 karakter.' });
      return;
    }
    updates.summary = body.summary.trim();
  }
  if (typeof body.level === 'string') {
    if (!VALID_LEVELS.has(body.level)) {
      res.status(400).json({ error: 'Level tidak valid.' });
      return;
    }
    updates.level = body.level as MateriLevel;
  }
  if (typeof body.category === 'string') {
    if (!VALID_CATEGORIES.has(body.category)) {
      res.status(400).json({ error: 'Kategori tidak valid.' });
      return;
    }
    updates.category = body.category as MateriCategory;
  }
  if (body.reading_time !== undefined) {
    updates.reading_time = Number(body.reading_time) || 5;
  }
  if (Array.isArray(body.tags)) {
    updates.tags = body.tags.map(String);
  }
  if (Array.isArray(body.sections)) {
    updates.sections = body.sections as never;
  }

  const updated = updateMateriRecord(req.params.id, updates);
  if (!updated) {
    res.status(404).json({ error: 'Materi tidak ditemukan.' });
    return;
  }

  const notif = createNotificationRecord({
    title: 'Materi Diperbarui',
    message: `Konten "${updated.title}" telah diperbarui.`,
    type: 'info',
    source: res.locals.authMethod?.startsWith('api_key') ? 'api' : 'materi',
    link_slug: updated.slug,
  });

  broadcastWs('materi:updated', updated);
  broadcastWs('notification:new', notif);

  res.json(updated);
});

app.delete('/api/v1/materi/:id', requireWriteAccess, (req, res) => {
  const deleted = deleteMateriRecord(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Materi tidak ditemukan.' });
    return;
  }

  const notif = createNotificationRecord({
    title: 'Materi Dihapus',
    message: `"${deleted.title}" telah dihapus dari Gudang Ilmu.`,
    type: 'warning',
    source: res.locals.authMethod?.startsWith('api_key') ? 'api' : 'materi',
    link_slug: null,
  });

  broadcastWs('materi:deleted', { id: deleted.id, slug: deleted.slug });
  broadcastWs('notification:new', notif);

  res.json({ deleted: true, id: deleted.id });
});

app.post('/api/v1/materi/import', requireWriteAccess, (req, res) => {
  const payload = Array.isArray(req.body) ? req.body : (req.body as { items?: unknown }).items;
  if (!Array.isArray(payload) || payload.length === 0 || payload.length > 50) {
    res.status(400).json({ error: 'Kirim array JSON berisi 1 hingga 50 materi yang valid.' });
    return;
  }

  const validItems: Parameters<typeof upsertMateriBatch>[0] = [];
  for (const raw of payload) {
    const item = raw as Record<string, unknown>;
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const summary = typeof item.summary === 'string' ? item.summary.trim() : '';
    const level =
      typeof item.level === 'string' && VALID_LEVELS.has(item.level) ? (item.level as MateriLevel) : 'Beginner';
    const category =
      typeof item.category === 'string' && VALID_CATEGORIES.has(item.category)
        ? (item.category as MateriCategory)
        : 'Termux';

    if (!title || !summary) {
      res.status(400).json({ error: 'Setiap item impor wajib memiliki title dan summary.' });
      return;
    }

    validItems.push({
      title,
      slug: typeof item.slug === 'string' ? item.slug : undefined,
      level,
      category,
      summary,
      reading_time: typeof item.reading_time === 'number' ? item.reading_time : 5,
      tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
      sections: Array.isArray(item.sections) ? (item.sections as never) : undefined,
    });
  }

  const summaryRes = upsertMateriBatch(validItems);
  const notif = createNotificationRecord({
    title: 'Impor Massal Selesai',
    message: `${summaryRes.created} materi baru dibuat dan ${summaryRes.updated} materi diperbarui melalui API.`,
    type: 'success',
    source: 'api',
    link_slug: null,
  });

  broadcastWs('materi:updated', { batch: true });
  broadcastWs('notification:new', notif);

  res.json(summaryRes);
});

// 3. Real-Time Notifications API
app.get('/api/v1/notifications', (req, res) => {
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50;
  res.json(listNotifications(limit));
});

app.post('/api/v1/notifications', requireWriteAccess, (req, res) => {
  const body = req.body as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const type =
    typeof body.type === 'string' && VALID_NOTIF_TYPES.has(body.type) ? (body.type as NotificationType) : 'info';
  const source =
    typeof body.source === 'string' && VALID_NOTIF_SOURCES.has(body.source)
      ? (body.source as NotificationSource)
      : res.locals.authMethod?.startsWith('api_key')
        ? 'api'
        : 'system';
  const linkSlug = typeof body.link_slug === 'string' && body.link_slug.trim() ? body.link_slug.trim() : null;

  if (!title || title.length < 2) {
    res.status(400).json({ error: 'Judul notifikasi wajib diisi.' });
    return;
  }
  if (!message || message.length < 2) {
    res.status(400).json({ error: 'Pesan notifikasi wajib diisi.' });
    return;
  }

  const created = createNotificationRecord({ title, message, type, source, link_slug: linkSlug });
  broadcastWs('notification:new', created);
  res.status(201).json(created);
});

app.patch('/api/v1/notifications/:id/read', requireWriteAccess, (req, res) => {
  const updated = markNotificationRead(req.params.id);
  if (!updated) {
    res.status(404).json({ error: 'Notifikasi tidak ditemukan.' });
    return;
  }
  broadcastWs('notification:read', { id: updated.id });
  res.json(updated);
});

app.post('/api/v1/notifications/read-all', requireWriteAccess, (_req, res) => {
  markAllNotificationsRead();
  broadcastWs('notification:read_all', {});
  res.json({ ok: true });
});

app.delete('/api/v1/notifications/:id', requireWriteAccess, (req, res) => {
  const deleted = deleteNotificationRecord(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Notifikasi tidak ditemukan.' });
    return;
  }
  res.json({ deleted: true });
});

// 4. Analytics API
app.get('/api/v1/analytics/summary', (req, res) => {
  const rawRange = typeof req.query.range === 'string' ? req.query.range : '7d';
  const range = (['24h', '7d', '30d', 'all'].includes(rawRange) ? rawRange : '7d') as '24h' | '7d' | '30d' | 'all';
  res.json(getAnalyticsSummary(range));
});

app.post('/api/v1/analytics/track', requireWriteAccess, (req, res) => {
  const body = req.body as Record<string, unknown>;
  const eventType = typeof body.event_type === 'string' ? body.event_type : '';
  const target = typeof body.target === 'string' ? body.target.trim() : '';

  if (!['page_view', 'materi_read', 'materi_complete', 'cmd_copy', 'search'].includes(eventType)) {
    res.status(400).json({ error: 'event_type tidak valid.' });
    return;
  }
  if (!target) {
    res.status(400).json({ error: 'target wajib diisi.' });
    return;
  }

  recordAnalyticsEvent({
    event_type: eventType as 'page_view' | 'materi_read' | 'materi_complete' | 'cmd_copy' | 'search',
    target,
    meta: typeof body.meta === 'object' && body.meta !== null ? (body.meta as Record<string, unknown>) : {},
  });

  if (eventType === 'materi_complete') {
    const item = getMateriBySlugOrId(target);
    if (item) {
      const notif = createNotificationRecord({
        title: 'Materi Diselesaikan',
        message: `Anda menyelesaikan modul "${item.title}". Progres tercatat di dasbor analitik.`,
        type: 'success',
        source: 'materi',
        link_slug: item.slug,
      });
      broadcastWs('notification:new', notif);
    }
  }

  broadcastWs('analytics:updated', { reason: eventType, target });
  res.status(201).json({ recorded: true });
});

// 5. API Keys Management
app.get('/api/v1/keys', (_req, res) => {
  res.json({ items: listApiKeys() });
});

app.post('/api/v1/keys', requireWriteAccess, (req, res) => {
  const body = req.body as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length < 2) {
    res.status(400).json({ error: 'Nama API key wajib diisi (minimal 2 karakter).' });
    return;
  }

  const { keyItem, rawKey } = createApiKeyRecord(name);
  const notif = createNotificationRecord({
    title: 'API Key Baru Dibuat',
    message: `Kunci akses "${keyItem.name}" (${keyItem.key_prefix}) telah aktif.`,
    type: 'info',
    source: 'api',
    link_slug: null,
  });
  broadcastWs('notification:new', notif);

  res.status(201).json({ item: keyItem, rawKey });
});

app.delete('/api/v1/keys/:id', requireWriteAccess, (req, res) => {
  const deleted = deleteApiKeyRecord(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'API key tidak ditemukan.' });
    return;
  }
  res.json({ deleted: true });
});

// 6. Real Sholat API Proxy (Aladhan + MyQuran Official APIs, Zero SSRF)
app.get('/api/v1/sholat', async (req, res) => {
  const latRaw = typeof req.query.lat === 'string' ? Number(req.query.lat) : NaN;
  const lngRaw = typeof req.query.lng === 'string' ? Number(req.query.lng) : NaN;
  const cityIdRaw = typeof req.query.cityId === 'string' ? req.query.cityId.trim() : '1221';
  const cityId = /^\d{4}$/.test(cityIdRaw) ? cityIdRaw : '1221';
  const now = new Date();

  try {
    if (Number.isFinite(latRaw) && Number.isFinite(lngRaw) && latRaw >= -90 && latRaw <= 90 && lngRaw >= -180 && lngRaw <= 180) {
      const ts = Math.floor(now.getTime() / 1000);
      const url = `https://api.aladhan.com/v1/timings/${ts}?latitude=${encodeURIComponent(latRaw.toFixed(5))}&longitude=${encodeURIComponent(lngRaw.toFixed(5))}&method=20`;
      const upstream = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (upstream.ok) {
        const json = (await upstream.json()) as {
          data?: { timings?: Record<string, string>; date?: { readable?: string } };
        };
        const t = json.data?.timings;
        if (t) {
          res.json({
            provider: 'aladhan',
            locationLabel: `Koordinat ${latRaw.toFixed(2)}, ${lngRaw.toFixed(2)}`,
            dateLabel: json.data?.date?.readable || now.toLocaleDateString('id-ID'),
            timings: {
              Subuh: t.Fajr.slice(0, 5),
              Dzuhur: t.Dhuhr.slice(0, 5),
              Ashar: t.Asr.slice(0, 5),
              Maghrib: t.Maghrib.slice(0, 5),
              Isya: t.Isha.slice(0, 5),
            },
          });
          return;
        }
      }
    }

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const myQuranUrl = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${yyyy}/${mm}/${dd}`;
    const upstream = await fetch(myQuranUrl, { signal: AbortSignal.timeout(6000) });

    if (!upstream.ok) {
      res.status(502).json({ error: 'Layanan jadwal sholat eksternal sedang tidak merespons.' });
      return;
    }

    const json = (await upstream.json()) as {
      status?: boolean;
      data?: {
        lokasi?: string;
        daerah?: string;
        jadwal?: {
          tanggal?: string;
          subuh: string;
          dzuhur: string;
          ashar: string;
          maghrib: string;
          isya: string;
        };
      };
    };

    if (!json.status || !json.data?.jadwal) {
      res.status(502).json({ error: 'Format respons jadwal sholat tidak valid.' });
      return;
    }

    res.json({
      provider: 'myquran',
      cityId,
      locationLabel: `${json.data.lokasi || 'Sumedang'}, ${json.data.daerah || 'Jawa Barat'}`,
      dateLabel: json.data.jadwal.tanggal || now.toLocaleDateString('id-ID'),
      timings: {
        Subuh: json.data.jadwal.subuh,
        Dzuhur: json.data.jadwal.dzuhur,
        Ashar: json.data.jadwal.ashar,
        Maghrib: json.data.jadwal.maghrib,
        Isya: json.data.jadwal.isya,
      },
    });
  } catch {
    res.status(502).json({ error: 'Gagal menghubungi API jadwal sholat resmi.' });
  }
});

app.get('/api/v1/sholat/cities', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const sanitized = q.replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 40);

  try {
    const endpoint = sanitized
      ? `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(sanitized)}`
      : 'https://api.myquran.com/v2/sholat/kota/semua';

    const upstream = await fetch(endpoint, { signal: AbortSignal.timeout(6000) });
    if (!upstream.ok) {
      res.json({ items: [{ id: '1221', lokasi: 'KAB. SUMEDANG' }] });
      return;
    }
    const json = (await upstream.json()) as { status?: boolean; data?: Array<{ id: string; lokasi: string }> };
    const items = Array.isArray(json.data) ? json.data.slice(0, 25) : [];
    res.json({ items });
  } catch {
    res.json({ items: [{ id: '1221', lokasi: 'KAB. SUMEDANG' }] });
  }
});

// 7. Real SEO robots.txt & dynamic sitemap.xml
app.get('/robots.txt', (req, res) => {
  const origin = `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const origin = `${req.protocol}://${req.get('host')}`;
  const items = getAllMateriRaw();
  const urls = [
    `  <url>\n    <loc>${origin}/</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...items.map(
      (item) =>
        `  <url>\n    <loc>${origin}/?materi=${encodeURIComponent(item.slug)}</loc>\n    <lastmod>${item.updated_at.slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    ),
  ];

  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
  );
});

// 8. Vite Dev Middleware / Production Static Serving
async function setupFrontend(): Promise<void> {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }
}

setupFrontend()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Bri Tech server running at http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start Bri Tech server:', err);
    process.exit(1);
  });
