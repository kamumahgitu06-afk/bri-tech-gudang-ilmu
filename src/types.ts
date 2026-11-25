export type MateriLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type MateriCategory = 'Termux' | 'Networking' | 'Automation' | 'System';

export type NotificationType = 'info' | 'success' | 'warning' | 'alert';

export type NotificationSource = 'system' | 'materi' | 'api' | 'sholat';

export interface MateriTable {
  headers: string[];
  rows: string[][];
}

export interface MateriSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: MateriTable;
  code?: {
    language: string;
    caption?: string;
    content: string;
  };
  commands?: Array<{
    cmd: string;
    label: string;
  }>;
}

export interface MateriItem {
  id: string;
  slug: string;
  title: string;
  level: MateriLevel;
  category: MateriCategory;
  summary: string;
  reading_time: number;
  tags: string[];
  sections: MateriSection[];
  sort_order?: number;
  views_count: number;
  completions_count: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  source: NotificationSource;
  link_slug: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  request_count: number;
  last_used_at: string | null;
  created_at: string;
}

export interface AnalyticsSummary {
  range: '24h' | '7d' | '30d' | 'all';
  kpis: {
    totalMateri: number;
    totalViews: number;
    totalCompletions: number;
    completionRate: number;
    totalApiCalls: number;
    avgApiLatencyMs: number;
    totalCmdCopies: number;
  };
  timeline: Array<{
    bucket: string;
    views: number;
    completions: number;
    apiCalls: number;
  }>;
  byLevel: Array<{
    level: MateriLevel;
    count: number;
    views: number;
  }>;
  byCategory: Array<{
    category: MateriCategory;
    count: number;
    views: number;
  }>;
  topMateri: Array<{
    id: string;
    slug: string;
    title: string;
    level: MateriLevel;
    category: MateriCategory;
    views_count: number;
    completions_count: number;
  }>;
  topCommands: Array<{
    command: string;
    copies: number;
  }>;
  topSearches: Array<{
    query: string;
    count: number;
  }>;
  recentApiLogs: Array<{
    id: number;
    target: string;
    method: string;
    status_code: number;
    latency_ms: number;
    created_at: string;
  }>;
}

export interface SholatSchedule {
  provider: 'aladhan' | 'myquran';
  locationLabel: string;
  dateLabel: string;
  cityId?: string;
  timings: {
    Subuh: string;
    Dzuhur: string;
    Ashar: string;
    Maghrib: string;
    Isya: string;
  };
}

export interface SholatCity {
  id: string;
  lokasi: string;
}

export type WorkspaceTab = 'analytics' | 'library' | 'api-data' | 'notifications';
