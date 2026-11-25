import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
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
} from '../src/types.ts';
import { INITIAL_MATERI } from './seed.ts';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'britech.db');
export const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS materi (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    level TEXT NOT NULL CHECK(level IN ('Beginner', 'Intermediate', 'Advanced')),
    category TEXT NOT NULL CHECK(category IN ('Termux', 'Networking', 'Automation', 'System')),
    summary TEXT NOT NULL,
    reading_time INTEGER NOT NULL DEFAULT 5,
    tags TEXT NOT NULL DEFAULT '[]',
    sections TEXT NOT NULL DEFAULT '[]',
    sort_order INTEGER NOT NULL DEFAULT 1000,
    views_count INTEGER NOT NULL DEFAULT 0,
    completions_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('info', 'success', 'warning', 'alert')),
    source TEXT NOT NULL CHECK(source IN ('system', 'materi', 'api', 'sholat')),
    link_slug TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL CHECK(event_type IN ('page_view', 'materi_read', 'materi_complete', 'cmd_copy', 'search', 'api_call')),
    target TEXT NOT NULL,
    meta TEXT NOT NULL DEFAULT '{}',
    latency_ms INTEGER,
    status_code INTEGER,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
  CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
  CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
`);

const CURRICULUM_ORDER: Record<string, number> = {
  'termux-pengenalan': 1,
  'filesystem': 2,
  'pkg-apt': 3,
  'nano-vim-editor': 4,
  'symlink-alias-trik': 5,
  'zip-tar-kompresi': 6,
  'zsh-ohmyzsh': 7,
  'git-github-termux': 8,
  'networking-dasar': 9,
  'http-status-code': 10,
  'curl-http-testing': 11,
  'whois-ssl-inspeksi': 12,
  'bash-variabel-kondisi': 13,
  'permission': 14,
  'path': 15,
  'troubleshooting': 16,
  'grep-find-pencarian': 17,
  'proses-htop-kill': 18,
  'logs-journal-baca': 19,
  'env-dotenv-rahasia': 20,
  'tmux-session': 21,
  'python-nodejs-termux': 22,
  'sqlite-database-hp': 23,
  'termux-api-hardware': 24,
  'ssh-remote-server': 25,
  'dns-doh-privasi': 26,
  'keamanan-wifi-web': 27,
  'nmap-recon': 28,
  'ngrok-cloudflare-tunnel': 29,
  'bash-looping-array': 30,
  'bash-function-modular': 31,
  'jq-json-parsing': 32,
  'python-automation-api': 33,
  'ssh-tunneling': 34,
  'websocket-realtime-konsep': 35,
  'backup-rsync-sinkron': 36,
  'cron-job-scheduler': 37,
  'webhook-notifikasi-bot': 38,
  'automation': 39,
  'ci-cd-deploy-konsep': 40,
};

function ensureSortOrderColumn(): void {
  const cols = db.prepare('PRAGMA table_info(materi)').all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === 'sort_order')) {
    db.exec('ALTER TABLE materi ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 1000');
  }
}

function seedDatabase(): void {
  ensureSortOrderColumn();
  const now = new Date().toISOString();
  const findById = db.prepare('SELECT id FROM materi WHERE id = ?');
  const insertMateri = db.prepare(`
    INSERT INTO materi (
      id, slug, title, level, category, summary, reading_time,
      tags, sections, sort_order, views_count, completions_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
  `);
  const updateSeedMateri = db.prepare(`
    UPDATE materi
    SET title = ?, level = ?, category = ?, summary = ?, reading_time = ?, tags = ?, sections = ?, sort_order = ?, updated_at = ?
    WHERE id = ?
  `);

  for (const item of INITIAL_MATERI) {
    const sortOrder = CURRICULUM_ORDER[item.slug] ?? 900;
    const existing = findById.get(item.id) as { id: string } | undefined;
    if (!existing) {
      insertMateri.run(
        item.id,
        item.slug,
        item.title,
        item.level,
        item.category,
        item.summary,
        item.reading_time,
        JSON.stringify(item.tags),
        JSON.stringify(item.sections),
        sortOrder,
        now,
        now
      );
    } else {
      updateSeedMateri.run(
        item.title,
        item.level,
        item.category,
        item.summary,
        item.reading_time,
        JSON.stringify(item.tags),
        JSON.stringify(item.sections),
        sortOrder,
        now,
        item.id
      );
    }
  }

  const notifCount = db.prepare('SELECT COUNT(*) as total FROM notifications').get() as { total: number };
  if (notifCount.total === 0) {
    db.prepare(`
      INSERT INTO notifications (id, title, message, type, source, link_slug, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      `notif-${crypto.randomUUID()}`,
      'Gudang Ilmu Bri Tech Aktif',
      '40 modul pembelajaran Termux, Jaringan, Sistem, dan Automasi API telah dimuat ke database SQLite dan siap diakses.',
      'success',
      'system',
      'termux-pengenalan',
      now
    );
  }
}

seedDatabase();

interface RawMateriRow {
  id: string;
  slug: string;
  title: string;
  level: MateriLevel;
  category: MateriCategory;
  summary: string;
  reading_time: number;
  tags: string;
  sections: string;
  sort_order: number;
  views_count: number;
  completions_count: number;
  created_at: string;
  updated_at: string;
}

function mapMateriRow(row: RawMateriRow): MateriItem {
  let tags: string[] = [];
  let sections: MateriSection[] = [];
  try {
    tags = JSON.parse(row.tags) as string[];
  } catch {
    tags = [];
  }
  try {
    sections = JSON.parse(row.sections) as MateriSection[];
  } catch {
    sections = [];
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    level: row.level,
    category: row.category,
    summary: row.summary,
    reading_time: row.reading_time,
    tags,
    sections,
    sort_order: row.sort_order,
    views_count: row.views_count,
    completions_count: row.completions_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export function listMateri(params: {
  level?: string;
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
}): { items: MateriItem[]; total: number; page: number; totalPages: number } {
  const conditions: string[] = [];
  const args: Array<string | number> = [];

  if (params.level && params.level !== 'all') {
    conditions.push('level = ?');
    args.push(params.level);
  }
  if (params.category && params.category !== 'all') {
    conditions.push('category = ?');
    args.push(params.category);
  }
  if (params.q && params.q.trim() !== '') {
    const like = `%${params.q.trim().toLowerCase()}%`;
    conditions.push('(LOWER(title) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(tags) LIKE ?)');
    args.push(like, like, like);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM materi ${whereClause}`)
    .get(...args) as { total: number };

  const total = countRow.total;
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 12));
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.max(1, Math.min(totalPages, Number(params.page) || 1));
  const offset = (page - 1) * limit;

  const rows = db
    .prepare(`
      SELECT * FROM materi ${whereClause}
      ORDER BY
        CASE level
          WHEN 'Beginner' THEN 1
          WHEN 'Intermediate' THEN 2
          WHEN 'Advanced' THEN 3
          ELSE 4
        END ASC,
        sort_order ASC,
        created_at ASC
      LIMIT ? OFFSET ?
    `)
    .all(...args, limit, offset) as unknown as RawMateriRow[];

  return {
    items: rows.map(mapMateriRow),
    total,
    page,
    totalPages,
  };
}

export function getAllMateriRaw(): MateriItem[] {
  const rows = db
    .prepare(`
      SELECT * FROM materi
      ORDER BY
        CASE level
          WHEN 'Beginner' THEN 1
          WHEN 'Intermediate' THEN 2
          WHEN 'Advanced' THEN 3
          ELSE 4
        END ASC,
        sort_order ASC,
        created_at ASC
    `)
    .all() as unknown as RawMateriRow[];
  return rows.map(mapMateriRow);
}

export function getMateriBySlugOrId(slugOrId: string): MateriItem | null {
  const row = db
    .prepare('SELECT * FROM materi WHERE slug = ? OR id = ? LIMIT 1')
    .get(slugOrId, slugOrId) as unknown as RawMateriRow | undefined;
  return row ? mapMateriRow(row) : null;
}

export function createMateriRecord(input: {
  title: string;
  slug?: string;
  level: MateriLevel;
  category: MateriCategory;
  summary: string;
  reading_time?: number;
  tags?: string[];
  sections?: MateriSection[];
}): MateriItem {
  const id = `mat-${crypto.randomUUID().slice(0, 8)}`;
  let baseSlug = slugify(input.slug || input.title);
  if (!baseSlug) baseSlug = id;

  const existing = db.prepare('SELECT id FROM materi WHERE slug = ?').get(baseSlug);
  const finalSlug = existing ? `${baseSlug}-${crypto.randomUUID().slice(0, 4)}` : baseSlug;
  const now = new Date().toISOString();

  const readingTime = Math.max(1, Math.min(180, Number(input.reading_time) || 5));
  const tags = Array.isArray(input.tags) ? input.tags.map((t) => String(t).trim()).filter(Boolean) : [];
  const sections: MateriSection[] =
    Array.isArray(input.sections) && input.sections.length > 0
      ? input.sections
      : [{ heading: 'Ringkasan Materi', paragraphs: [input.summary] }];

  db.prepare(`
    INSERT INTO materi (
      id, slug, title, level, category, summary, reading_time,
      tags, sections, views_count, completions_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
  `).run(
    id,
    finalSlug,
    input.title.trim(),
    input.level,
    input.category,
    input.summary.trim(),
    readingTime,
    JSON.stringify(tags),
    JSON.stringify(sections),
    now,
    now
  );

  return getMateriBySlugOrId(id)!;
}

export function updateMateriRecord(
  idOrSlug: string,
  input: Partial<{
    title: string;
    level: MateriLevel;
    category: MateriCategory;
    summary: string;
    reading_time: number;
    tags: string[];
    sections: MateriSection[];
  }>
): MateriItem | null {
  const current = getMateriBySlugOrId(idOrSlug);
  if (!current) return null;

  const now = new Date().toISOString();
  const title = input.title !== undefined ? input.title.trim() : current.title;
  const level = input.level !== undefined ? input.level : current.level;
  const category = input.category !== undefined ? input.category : current.category;
  const summary = input.summary !== undefined ? input.summary.trim() : current.summary;
  const readingTime =
    input.reading_time !== undefined ? Math.max(1, Math.min(180, Number(input.reading_time) || 5)) : current.reading_time;
  const tags = input.tags !== undefined ? input.tags.map((t) => String(t).trim()).filter(Boolean) : current.tags;
  const sections = input.sections !== undefined ? input.sections : current.sections;

  db.prepare(`
    UPDATE materi
    SET title = ?, level = ?, category = ?, summary = ?, reading_time = ?, tags = ?, sections = ?, updated_at = ?
    WHERE id = ?
  `).run(title, level, category, summary, readingTime, JSON.stringify(tags), JSON.stringify(sections), now, current.id);

  return getMateriBySlugOrId(current.id);
}

export function deleteMateriRecord(idOrSlug: string): MateriItem | null {
  const current = getMateriBySlugOrId(idOrSlug);
  if (!current) return null;
  db.prepare('DELETE FROM materi WHERE id = ?').run(current.id);
  return current;
}

export function upsertMateriBatch(
  items: Array<{
    title: string;
    slug?: string;
    level: MateriLevel;
    category: MateriCategory;
    summary: string;
    reading_time?: number;
    tags?: string[];
    sections?: MateriSection[];
  }>
): { created: number; updated: number } {
  let created = 0;
  let updated = 0;

  for (const item of items) {
    const candidateSlug = slugify(item.slug || item.title);
    const existing = candidateSlug ? getMateriBySlugOrId(candidateSlug) : null;
    if (existing) {
      updateMateriRecord(existing.id, item);
      updated += 1;
    } else {
      createMateriRecord(item);
      created += 1;
    }
  }
  return { created, updated };
}

interface RawNotificationRow {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  source: NotificationSource;
  link_slug: string | null;
  is_read: number;
  created_at: string;
}

function mapNotificationRow(row: RawNotificationRow): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    source: row.source,
    link_slug: row.link_slug,
    is_read: row.is_read === 1,
    created_at: row.created_at,
  };
}

export function listNotifications(limit = 50): { items: NotificationItem[]; unreadCount: number } {
  const safeLimit = Math.max(1, Math.min(200, limit));
  const rows = db
    .prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?')
    .all(safeLimit) as unknown as RawNotificationRow[];

  const unreadRow = db
    .prepare('SELECT COUNT(*) as total FROM notifications WHERE is_read = 0')
    .get() as { total: number };

  return {
    items: rows.map(mapNotificationRow),
    unreadCount: unreadRow.total,
  };
}

export function createNotificationRecord(input: {
  title: string;
  message: string;
  type?: NotificationType;
  source?: NotificationSource;
  link_slug?: string | null;
}): NotificationItem {
  const id = `notif-${crypto.randomUUID().slice(0, 12)}`;
  const now = new Date().toISOString();
  const type: NotificationType =
    input.type && ['info', 'success', 'warning', 'alert'].includes(input.type) ? input.type : 'info';
  const source: NotificationSource =
    input.source && ['system', 'materi', 'api', 'sholat'].includes(input.source) ? input.source : 'system';

  db.prepare(`
    INSERT INTO notifications (id, title, message, type, source, link_slug, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(id, input.title.trim(), input.message.trim(), type, source, input.link_slug ?? null, now);

  const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as unknown as RawNotificationRow;
  return mapNotificationRow(row);
}

export function markNotificationRead(id: string): NotificationItem | null {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as unknown as RawNotificationRow | undefined;
  return row ? mapNotificationRow(row) : null;
}

export function markAllNotificationsRead(): void {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE is_read = 0').run();
}

export function deleteNotificationRecord(id: string): boolean {
  const res = db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
  return Number(res.changes) > 0;
}

export function recordAnalyticsEvent(input: {
  event_type: 'page_view' | 'materi_read' | 'materi_complete' | 'cmd_copy' | 'search' | 'api_call';
  target: string;
  meta?: Record<string, unknown>;
  latency_ms?: number | null;
  status_code?: number | null;
}): void {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO analytics_events (event_type, target, meta, latency_ms, status_code, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    input.event_type,
    input.target.slice(0, 200),
    JSON.stringify(input.meta ?? {}),
    input.latency_ms ?? null,
    input.status_code ?? null,
    now
  );

  if (input.event_type === 'materi_read') {
    db.prepare('UPDATE materi SET views_count = views_count + 1 WHERE slug = ? OR id = ?').run(
      input.target,
      input.target
    );
  } else if (input.event_type === 'materi_complete') {
    db.prepare('UPDATE materi SET completions_count = completions_count + 1 WHERE slug = ? OR id = ?').run(
      input.target,
      input.target
    );
  }
}

export function getAnalyticsSummary(range: '24h' | '7d' | '30d' | 'all' = '7d'): AnalyticsSummary {
  const now = new Date();
  let sinceIso = '1970-01-01T00:00:00.000Z';
  if (range === '24h') {
    sinceIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  } else if (range === '7d') {
    sinceIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (range === '30d') {
    sinceIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  const materiAgg = db
    .prepare('SELECT COUNT(*) as totalMateri, COALESCE(SUM(views_count), 0) as totalViews, COALESCE(SUM(completions_count), 0) as totalCompletions FROM materi')
    .get() as { totalMateri: number; totalViews: number; totalCompletions: number };

  const apiAgg = db
    .prepare(`SELECT COUNT(*) as totalApiCalls, COALESCE(ROUND(AVG(latency_ms)), 0) as avgLatency FROM analytics_events WHERE event_type = 'api_call' AND created_at >= ?`)
    .get(sinceIso) as { totalApiCalls: number; avgLatency: number };

  const cmdAgg = db
    .prepare(`SELECT COUNT(*) as totalCmdCopies FROM analytics_events WHERE event_type = 'cmd_copy' AND created_at >= ?`)
    .get(sinceIso) as { totalCmdCopies: number };

  const completionRate =
    materiAgg.totalViews > 0 ? Math.min(100, Math.round((materiAgg.totalCompletions / materiAgg.totalViews) * 100)) : 0;

  // Timeline generation from real rows
  const eventsInRange = db
    .prepare(`SELECT event_type, created_at FROM analytics_events WHERE created_at >= ? AND event_type IN ('materi_read', 'page_view', 'materi_complete', 'api_call') ORDER BY created_at ASC`)
    .all(sinceIso) as Array<{ event_type: string; created_at: string }>;

  const bucketMap = new Map<string, { views: number; completions: number; apiCalls: number }>();

  if (range === '24h') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
      const label = `${String(d.getHours()).padStart(2, '0')}:00`;
      bucketMap.set(label, { views: 0, completions: 0, apiCalls: 0 });
    }
    for (const ev of eventsInRange) {
      const d = new Date(ev.created_at);
      const evenHour = Math.floor(d.getHours() / 2) * 2;
      const label = `${String(evenHour).padStart(2, '0')}:00`;
      const b = bucketMap.get(label);
      if (b) {
        if (ev.event_type === 'materi_read' || ev.event_type === 'page_view') b.views += 1;
        if (ev.event_type === 'materi_complete') b.completions += 1;
        if (ev.event_type === 'api_call') b.apiCalls += 1;
      }
    }
  } else {
    const days = range === '30d' ? 14 : 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      bucketMap.set(key, { views: 0, completions: 0, apiCalls: 0 });
    }
    for (const ev of eventsInRange) {
      const key = ev.created_at.slice(0, 10);
      const b = bucketMap.get(key);
      if (b) {
        if (ev.event_type === 'materi_read' || ev.event_type === 'page_view') b.views += 1;
        if (ev.event_type === 'materi_complete') b.completions += 1;
        if (ev.event_type === 'api_call') b.apiCalls += 1;
      }
    }
  }

  const timeline = Array.from(bucketMap.entries()).map(([bucket, counts]) => ({
    bucket: range === '24h' ? bucket : bucket.slice(5),
    views: counts.views,
    completions: counts.completions,
    apiCalls: counts.apiCalls,
  }));

  const byLevel = db
    .prepare(`SELECT level, COUNT(*) as count, COALESCE(SUM(views_count), 0) as views FROM materi GROUP BY level`)
    .all() as Array<{ level: MateriLevel; count: number; views: number }>;

  const byCategory = db
    .prepare(`SELECT category, COUNT(*) as count, COALESCE(SUM(views_count), 0) as views FROM materi GROUP BY category ORDER BY count DESC`)
    .all() as Array<{ category: MateriCategory; count: number; views: number }>;

  const topMateri = db
    .prepare(`SELECT id, slug, title, level, category, views_count, completions_count FROM materi ORDER BY views_count DESC, completions_count DESC LIMIT 6`)
    .all() as Array<{
      id: string;
      slug: string;
      title: string;
      level: MateriLevel;
      category: MateriCategory;
      views_count: number;
      completions_count: number;
    }>;

  const topCommands = db
    .prepare(`SELECT target as command, COUNT(*) as copies FROM analytics_events WHERE event_type = 'cmd_copy' AND created_at >= ? GROUP BY target ORDER BY copies DESC LIMIT 6`)
    .all(sinceIso) as Array<{ command: string; copies: number }>;

  const topSearches = db
    .prepare(`SELECT target as query, COUNT(*) as count FROM analytics_events WHERE event_type = 'search' AND created_at >= ? GROUP BY target ORDER BY count DESC LIMIT 6`)
    .all(sinceIso) as Array<{ query: string; count: number }>;

  const recentApiLogsRaw = db
    .prepare(`SELECT id, target, meta, status_code, latency_ms, created_at FROM analytics_events WHERE event_type = 'api_call' ORDER BY id DESC LIMIT 12`)
    .all() as Array<{
      id: number;
      target: string;
      meta: string;
      status_code: number | null;
      latency_ms: number | null;
      created_at: string;
    }>;

  const recentApiLogs = recentApiLogsRaw.map((row) => {
    let method = 'GET';
    try {
      const parsed = JSON.parse(row.meta) as { method?: string };
      if (parsed.method) method = parsed.method;
    } catch {
      method = 'GET';
    }
    return {
      id: row.id,
      target: row.target,
      method,
      status_code: row.status_code ?? 200,
      latency_ms: row.latency_ms ?? 0,
      created_at: row.created_at,
    };
  });

  return {
    range,
    kpis: {
      totalMateri: materiAgg.totalMateri,
      totalViews: materiAgg.totalViews,
      totalCompletions: materiAgg.totalCompletions,
      completionRate,
      totalApiCalls: apiAgg.totalApiCalls,
      avgApiLatencyMs: apiAgg.avgLatency,
      totalCmdCopies: cmdAgg.totalCmdCopies,
    },
    timeline,
    byLevel,
    byCategory,
    topMateri,
    topCommands,
    topSearches,
    recentApiLogs,
  };
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export function listApiKeys(): ApiKeyItem[] {
  return db
    .prepare('SELECT id, name, key_prefix, request_count, last_used_at, created_at FROM api_keys ORDER BY created_at DESC')
    .all() as unknown as ApiKeyItem[];
}

export function createApiKeyRecord(name: string): { keyItem: ApiKeyItem; rawKey: string } {
  const id = `key-${crypto.randomUUID().slice(0, 8)}`;
  const rawSecret = crypto.randomBytes(20).toString('hex');
  const rawKey = `bt_live_${rawSecret}`;
  const keyPrefix = rawKey.slice(0, 15) + '…';
  const keyHash = hashApiKey(rawKey);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO api_keys (id, name, key_prefix, key_hash, request_count, last_used_at, created_at)
    VALUES (?, ?, ?, ?, 0, NULL, ?)
  `).run(id, name.trim(), keyPrefix, keyHash, now);

  const keyItem = db
    .prepare('SELECT id, name, key_prefix, request_count, last_used_at, created_at FROM api_keys WHERE id = ?')
    .get(id) as unknown as ApiKeyItem;

  return { keyItem, rawKey };
}

export function verifyAndTrackApiKey(rawKey: string): ApiKeyItem | null {
  const keyHash = hashApiKey(rawKey);
  const row = db
    .prepare('SELECT id, name, key_prefix, request_count, last_used_at, created_at FROM api_keys WHERE key_hash = ? LIMIT 1')
    .get(keyHash) as unknown as ApiKeyItem | undefined;

  if (!row) return null;

  const now = new Date().toISOString();
  db.prepare('UPDATE api_keys SET request_count = request_count + 1, last_used_at = ? WHERE id = ?').run(now, row.id);
  return row;
}

export function deleteApiKeyRecord(id: string): boolean {
  const res = db.prepare('DELETE FROM api_keys WHERE id = ?').run(id);
  return Number(res.changes) > 0;
}
