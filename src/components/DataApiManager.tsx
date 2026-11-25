import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  KeyRound,
  Pencil,
  Play,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  apiRequest,
  createApiKey,
  createMateri,
  deleteMateri,
  fetchApiKeys,
  fetchMateriList,
  importMateriBatch,
  revokeApiKey,
  updateMateri,
} from '../lib/api';
import type { MateriPayload } from '../lib/api';
import type { ApiKeyItem, MateriCategory, MateriItem, MateriLevel } from '../types';

interface DataApiManagerProps {
  materiTick: number;
  onOpenMateri: (slug: string) => void;
}

type SubTab = 'crud' | 'keys' | 'explorer';

interface PresetEndpoint {
  id: string;
  label: string;
  method: 'GET' | 'POST';
  path: string;
  body: string;
}

const PRESET_ENDPOINTS: PresetEndpoint[] = [
  {
    id: 'list-materi',
    label: 'GET Daftar Materi',
    method: 'GET',
    path: '/api/v1/materi?limit=10',
    body: '',
  },
  {
    id: 'create-materi',
    label: 'POST Tambah Materi Baru',
    method: 'POST',
    path: '/api/v1/materi',
    body: JSON.stringify(
      {
        title: 'Panduan SSH Tunneling di Termux',
        level: 'Intermediate',
        category: 'Networking',
        summary: 'Cara aman melakukan port forwarding lokal menggunakan OpenSSH di Android.',
        reading_time: 6,
        tags: ['ssh', 'tunneling', 'termux'],
        sections: [
          {
            heading: 'Perintah Dasar Port Forwarding',
            paragraphs: ['Gunakan flag -L untuk meneruskan port layanan lokal melalui koneksi SSH terenkripsi.'],
            commands: [{ label: 'Forward port 8080 ke server remote', cmd: 'ssh -L 8080:localhost:80 user@server' }],
          },
        ],
      },
      null,
      2
    ),
  },
  {
    id: 'push-notif',
    label: 'POST Kirim Notifikasi Webhook',
    method: 'POST',
    path: '/api/v1/notifications',
    body: JSON.stringify(
      {
        title: 'Sinkronisasi Data API Berhasil',
        message: 'Pipeline data dari integrasi eksternal telah tercatat ke SQLite dan disiarkan via WebSocket.',
        type: 'success',
        source: 'api',
      },
      null,
      2
    ),
  },
  {
    id: 'analytics',
    label: 'GET Ringkasan Analitik',
    method: 'GET',
    path: '/api/v1/analytics/summary?range=7d',
    body: '',
  },
];

export function DataApiManager({ materiTick, onOpenMateri }: DataApiManagerProps) {
  const [subTab, setSubTab] = useState<SubTab>('crud');

  // CRUD state
  const [materiList, setMateriList] = useState<MateriItem[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [crudError, setCrudError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Editor modal state
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<MateriCategory>('Termux');
  const [formLevel, setFormLevel] = useState<MateriLevel>('Beginner');
  const [formReadingTime, setFormReadingTime] = useState<number>(5);
  const [formTags, setFormTags] = useState<string>('termux, linux');
  const [formSummary, setFormSummary] = useState<string>('');
  const [formSectionHeading, setFormSectionHeading] = useState<string>('Materi Inti');
  const [formSectionParagraph, setFormSectionParagraph] = useState<string>('');
  const [formSectionCode, setFormSectionCode] = useState<string>('');
  const [savingMateri, setSavingMateri] = useState<boolean>(false);

  // Import modal state
  const [importOpen, setImportOpen] = useState<boolean>(false);
  const [importJson, setImportJson] = useState<string>(
    JSON.stringify(
      [
        {
          title: 'Dasar cURL untuk Pengujian API',
          level: 'Beginner',
          category: 'Automation',
          summary: 'Menguji endpoint GET dan POST langsung dari terminal Termux menggunakan curl dan jq.',
          reading_time: 4,
          tags: ['curl', 'api', 'json'],
        },
      ],
      null,
      2
    )
  );
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // API Keys state
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // API Explorer state
  const [selectedPreset, setSelectedPreset] = useState<string>('list-materi');
  const [expMethod, setExpMethod] = useState<'GET' | 'POST'>('GET');
  const [expPath, setExpPath] = useState<string>('/api/v1/materi?limit=10');
  const [expBody, setExpBody] = useState<string>('');
  const [expApiKey, setExpApiKey] = useState<string>('');
  const [expRunning, setExpRunning] = useState<boolean>(false);
  const [expResult, setExpResult] = useState<{
    status: number;
    latencyMs: number;
    data: string;
  } | null>(null);
  const [expError, setExpError] = useState<string | null>(null);
  const [snippetLang, setSnippetLang] = useState<'curl' | 'js' | 'python'>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  const loadMateri = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetchMateriList({ limit: 100 });
      setMateriList(res.items);
    } catch (err) {
      setCrudError(err instanceof Error ? err.message : 'Gagal memuat daftar materi');
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadKeys = useCallback(async () => {
    try {
      const items = await fetchApiKeys();
      setKeys(items);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    void loadMateri();
    void loadKeys();
  }, [loadMateri, loadKeys, materiTick]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormCategory('Termux');
    setFormLevel('Beginner');
    setFormReadingTime(5);
    setFormTags('termux, linux');
    setFormSummary('');
    setFormSectionHeading('Pembahasan Utama');
    setFormSectionParagraph('');
    setFormSectionCode('');
    setCrudError(null);
    setEditorOpen(true);
  };

  const openEditModal = (item: MateriItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormLevel(item.level);
    setFormReadingTime(item.reading_time);
    setFormTags(item.tags.join(', '));
    setFormSummary(item.summary);
    const firstSec = item.sections[0];
    setFormSectionHeading(firstSec?.heading || 'Pembahasan Utama');
    setFormSectionParagraph(firstSec?.paragraphs?.join('\n\n') || '');
    setFormSectionCode(firstSec?.code?.content || '');
    setCrudError(null);
    setEditorOpen(true);
  };

  const handleSaveMateri = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMateri(true);
    setCrudError(null);

    const paragraphs = formSectionParagraph
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const existingSections = editingId
      ? materiList.find((m) => m.id === editingId)?.sections || []
      : [];

    const updatedFirstSection = {
      ...(existingSections[0] || {}),
      heading: formSectionHeading.trim() || 'Pembahasan Utama',
      paragraphs: paragraphs.length > 0 ? paragraphs : [formSummary.trim()],
      ...(formSectionCode.trim()
        ? {
            code: {
              language: 'bash',
              caption: 'script.sh',
              content: formSectionCode.trim(),
            },
          }
        : {}),
    };

    const payload: MateriPayload = {
      title: formTitle.trim(),
      category: formCategory,
      level: formLevel,
      reading_time: Number(formReadingTime) || 5,
      tags: formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      summary: formSummary.trim(),
      sections: [updatedFirstSection, ...existingSections.slice(1)],
    };

    try {
      if (editingId) {
        await updateMateri(editingId, payload);
      } else {
        await createMateri(payload);
      }
      setEditorOpen(false);
      await loadMateri();
    } catch (err) {
      setCrudError(err instanceof Error ? err.message : 'Gagal menyimpan materi');
    } finally {
      setSavingMateri(false);
    }
  };

  const handleDeleteMateri = async (id: string) => {
    try {
      await deleteMateri(id);
      setConfirmDeleteId(null);
      await loadMateri();
    } catch (err) {
      setCrudError(err instanceof Error ? err.message : 'Gagal menghapus materi');
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus(null);
    try {
      const parsed = JSON.parse(importJson) as MateriPayload[];
      const res = await importMateriBatch(parsed);
      setImportStatus(`Berhasil mengimpor: ${res.created} materi baru dibuat, ${res.updated} diperbarui.`);
      await loadMateri();
    } catch (err) {
      setImportStatus(err instanceof Error ? err.message : 'Format JSON tidak valid.');
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    setCreatedRawKey(null);
    try {
      const res = await createApiKey(newKeyName);
      setCreatedRawKey(res.rawKey);
      setExpApiKey(res.rawKey);
      setNewKeyName('');
      await loadKeys();
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'Gagal membuat API Key');
    }
  };

  const handleRevokeKey = async (id: string) => {
    await revokeApiKey(id);
    await loadKeys();
  };

  const handleSelectPreset = (preset: PresetEndpoint) => {
    setSelectedPreset(preset.id);
    setExpMethod(preset.method);
    setExpPath(preset.path);
    setExpBody(preset.body);
    setExpError(null);
  };

  const handleRunExplorer = async () => {
    setExpRunning(true);
    setExpError(null);
    try {
      const options: RequestInit = { method: expMethod };
      if (expMethod === 'POST' && expBody.trim()) {
        JSON.parse(expBody);
        options.body = expBody;
      }
      const res = await apiRequest<unknown>(expPath, options, expApiKey || undefined);
      setExpResult({
        status: res.status,
        latencyMs: res.latencyMs,
        data: JSON.stringify(res.data, null, 2),
      });
      await loadKeys();
      await loadMateri();
    } catch (err) {
      setExpError(err instanceof Error ? err.message : 'Permintaan API gagal');
    } finally {
      setExpRunning(false);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const activeKeyPlaceholder = expApiKey.trim() || 'MASUKKAN_API_KEY_ANDA';

  const generatedSnippet =
    snippetLang === 'curl'
      ? expMethod === 'GET'
        ? `curl -s "${origin}${expPath}"`
        : `curl -s -X POST "${origin}${expPath}" \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: ${activeKeyPlaceholder}" \\\n  -d '${expBody.replace(/\n/g, ' ')}'`
      : snippetLang === 'js'
        ? `const response = await fetch("${origin}${expPath}", {\n  method: "${expMethod}",\n  headers: {\n    "Content-Type": "application/json",\n    "X-API-Key": "${activeKeyPlaceholder}"\n  }${expMethod === 'POST' ? `,\n  body: JSON.stringify(${expBody || '{}'})` : ''}\n});\nconst data = await response.json();`
        : `import requests\n\nres = requests.${expMethod.toLowerCase()}(\n    "${origin}${expPath}",\n    headers={"X-API-Key": "${activeKeyPlaceholder}"}${expMethod === 'POST' ? `,\n    json=${expBody || '{}'}` : ''}\n)\nprint(res.json())`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Manajemen Data &amp; Integrasi API
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Kelola basis data materi secara langsung, ekspor/impor massal JSON, dan uji endpoint REST API nyata.
          </p>
        </div>

        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {([
            ['crud', 'Data Materi'],
            ['keys', 'API Keys'],
            ['explorer', 'API Explorer'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSubTab(id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                subTab === id
                  ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: CRUD & BULK DATA MANAGEMENT */}
      {subTab === 'crud' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Materi</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportStatus(null);
                  setImportOpen(true);
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Impor Massal JSON</span>
              </button>
              <a
                href="/api/v1/materi/export"
                download="britech-materi-export.json"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Ekspor JSON</span>
              </a>
            </div>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {materiList.length} baris tersimpan di SQLite
            </span>
          </div>

          {crudError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              {crudError}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                  <th className="px-4 py-3">Judul &amp; Slug</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3 text-right">Baca</th>
                  <th className="px-4 py-3 text-right">Selesai</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingList ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">
                      Memuat data materi dari SQLite…
                    </td>
                  </tr>
                ) : (
                  materiList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onOpenMateri(item.slug)}
                          className="text-left font-medium text-slate-900 hover:text-emerald-700 dark:text-slate-100 dark:hover:text-emerald-400"
                        >
                          {item.title}
                        </button>
                        <p className="font-mono text-[11px] text-slate-400">/api/v1/materi/{item.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {item.category}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {item.level}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-700 dark:text-slate-200 tabular-nums">
                        {item.views_count}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {item.completions_count}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {confirmDeleteId === item.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleDeleteMateri(item.id)}
                              className="rounded bg-rose-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-700"
                            >
                              Konfirmasi Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              aria-label={`Edit ${item.title}`}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(item.id)}
                              aria-label={`Hapus ${item.title}`}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: API KEYS */}
      {subTab === 'keys' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Buat API Key Baru
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Gunakan API Key melalui header <code className="font-mono">X-API-Key</code> untuk mengelola materi atau mengirim notifikasi real-time dari skrip Termux dan backend eksternal.
            </p>

            <form onSubmit={(e) => void handleCreateKey(e)} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Label / Nama Integrasi
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="mis. Termux Backup Script"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950"
              >
                <KeyRound className="h-4 w-4" />
                <span>Generate API Key</span>
              </button>
            </form>

            {keyError && <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">{keyError}</p>}

            {createdRawKey && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/40">
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Salin sekarang — kunci ini hanya ditampilkan satu kali:
                </p>
                <div className="mt-2 flex items-center justify-between gap-2 rounded bg-white px-2.5 py-2 dark:bg-slate-950">
                  <code className="truncate font-mono text-xs text-slate-900 dark:text-emerald-400">
                    {createdRawKey}
                  </code>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(createdRawKey);
                      setCopiedKeyId('new');
                      window.setTimeout(() => setCopiedKeyId(null), 1500);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 shrink-0"
                  >
                    {copiedKeyId === 'new' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKeyId === 'new' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Kunci API Aktif (Tersimpan SHA-256)
            </h2>
            <div className="mt-4 overflow-x-auto">
              {keys.length === 0 ? (
                <p className="py-6 text-sm text-slate-500 dark:text-slate-400">
                  Belum ada API Key. Buat satu di panel sebelah kiri untuk mulai mengintegrasikan skrip eksternal.
                </p>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="py-2 font-medium">Nama</th>
                      <th className="py-2 font-medium">Prefix</th>
                      <th className="py-2 text-right font-medium">Pemakaian</th>
                      <th className="py-2 text-right font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {keys.map((k) => (
                      <tr key={k.id} className="h-10">
                        <td className="pr-3 font-medium text-slate-900 dark:text-slate-100">{k.name}</td>
                        <td className="pr-3 font-mono text-slate-500 dark:text-slate-400">{k.key_prefix}</td>
                        <td className="pr-3 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                          {k.request_count} req
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => void handleRevokeKey(k.id)}
                            className="text-xs font-medium text-rose-600 hover:underline dark:text-rose-400"
                          >
                            Cabut
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: API EXPLORER & INTEGRASI */}
      {subTab === 'explorer' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Uji Endpoint API Langsung
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Setiap permintaan langsung memanggil server Express dan mencatat latensi asli ke SQLite.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_ENDPOINTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    selectedPreset === p.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <select
                value={expMethod}
                onChange={(e) => setExpMethod(e.target.value as 'GET' | 'POST')}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
              <input
                type="text"
                value={expPath}
                onChange={(e) => setExpPath(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Opsional: Header X-API-Key (jika kosong memakai sesi aktif)
              </label>
              <input
                type="text"
                value={expApiKey}
                onChange={(e) => setExpApiKey(e.target.value)}
                placeholder="bt_live_..."
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            {expMethod === 'POST' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Payload JSON
                </label>
                <textarea
                  rows={8}
                  value={expBody}
                  onChange={(e) => setExpBody(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-emerald-300 outline-none focus:border-emerald-500 dark:border-slate-700"
                />
              </div>
            )}

            <button
              type="button"
              disabled={expRunning}
              onClick={() => void handleRunExplorer()}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-950"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{expRunning ? 'Mengirim…' : 'Kirim Permintaan'}</span>
            </button>

            {expError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                {expError}
              </div>
            )}

            {expResult && (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2 font-mono text-xs text-slate-300 tabular-nums">
                  <span>HTTP {expResult.status}</span>
                  <span>{expResult.latencyMs} ms</span>
                </div>
                <pre className="max-h-64 overflow-auto p-3.5 font-mono text-xs text-emerald-300">
                  {expResult.data}
                </pre>
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Cuplikan Kode Integrasi
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Salin dan jalankan di Termux, browser, atau skrip backend Anda.
                </p>
              </div>

              <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
                {(['curl', 'js', 'python'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSnippetLang(lang)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium uppercase ${
                      snippetLang === lang
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2 text-xs text-slate-400">
                <span className="font-mono">{snippetLang}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(generatedSnippet);
                    setCopiedSnippet(true);
                    window.setTimeout(() => setCopiedSnippet(false), 1500);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white"
                >
                  {copiedSnippet ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedSnippet ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-emerald-300">
                {generatedSnippet}
              </pre>
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Ringkasan Endpoint Tersedia:</p>
              <ul className="space-y-1.5 font-mono text-[11px]">
                <li>GET /api/v1/materi — Daftar materi dengan filter &amp; paginasi</li>
                <li>POST /api/v1/materi — Tambah materi &amp; siarkan notifikasi real-time</li>
                <li>PUT /api/v1/materi/:id — Perbarui materi berdasarkan ID</li>
                <li>DELETE /api/v1/materi/:id — Hapus materi</li>
                <li>POST /api/v1/materi/import — Upsert massal array JSON (maks 50 item)</li>
                <li>POST /api/v1/notifications — Push notifikasi real-time ke seluruh klien</li>
                <li>GET /api/v1/analytics/summary — Agregasi analitik SQLite</li>
              </ul>
            </div>
          </section>
        </div>
      )}

      {/* EDITOR MODAL */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {editingId ? 'Edit Materi' : 'Tambah Materi Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSaveMateri(e)} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Judul Materi</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MateriCategory)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="Termux">Termux</option>
                    <option value="Networking">Networking</option>
                    <option value="System">System</option>
                    <option value="Automation">Automation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Level</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as MateriLevel)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="Beginner">Beginner (Dasar)</option>
                    <option value="Intermediate">Intermediate (Menengah)</option>
                    <option value="Advanced">Advanced (Ahli)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Waktu Baca (mnt)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={formReadingTime}
                    onChange={(e) => setFormReadingTime(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Tag (pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Ringkasan</label>
                <textarea
                  rows={2}
                  required
                  minLength={10}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Sub-judul Bagian Pertama
                  </label>
                  <input
                    type="text"
                    value={formSectionHeading}
                    onChange={(e) => setFormSectionHeading(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Isi Artikel
                  </label>
                  <textarea
                    rows={4}
                    value={formSectionParagraph}
                    onChange={(e) => setFormSectionParagraph(e.target.value)}
                    placeholder="Tulis penjelasan lengkap materi di sini…"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Contoh Perintah / Kode Bash (opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={formSectionCode}
                    onChange={(e) => setFormSectionCode(e.target.value)}
                    placeholder="pkg update && pkg upgrade -y"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-emerald-300 outline-none dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingMateri}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-950"
                >
                  {savingMateri ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Terbitkan Materi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Impor Massal Materi (JSON)
              </h2>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Tempel array JSON materi (maks 50 item) untuk langsung disimpan atau diperbarui secara massal via <code className="font-mono">POST /api/v1/materi/import</code>.
            </p>
            <form onSubmit={(e) => void handleImportSubmit(e)} className="mt-4 space-y-3">
              <textarea
                rows={10}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-emerald-300 outline-none dark:border-slate-700"
              />
              {importStatus && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400">{importStatus}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setImportOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950"
                >
                  Jalankan Impor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
