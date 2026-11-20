import type { Storage } from './storage';
import { TASK_TYPES, isTaskType, type ContentIndex, type TaskFile } from './types';

export interface SyncReport {
  added: number;
  updated: number;
  removed: number;
  unchanged: number;
  failed: { id: string; reason: string }[];
}

// GitHub отдаёт raw-файлы с кэшем на несколько минут; параметр t обходит его.
async function fetchJson<T>(url: string): Promise<T> {
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(`${url}${sep}t=${Date.now()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} для ${url}`);
  return (await res.json()) as T;
}

function validateTask(raw: unknown, expectedId: string): TaskFile {
  const t = raw as Partial<TaskFile>;
  if (!t || typeof t !== 'object') throw new Error('файл не является объектом');
  if (t.id !== expectedId) throw new Error(`id в файле (${t.id}) не совпадает с индексом`);
  if (!isTaskType(t.type)) throw new Error(`неизвестный type: ${String(t.type)}`);
  if (t.section !== TASK_TYPES[t.type].section) throw new Error(`section не подходит к type ${t.type}`);
  if (typeof t.version !== 'number') throw new Error('нет version');
  if (!t.cefr) throw new Error('нет cefr');
  if (!t.content || typeof t.content !== 'object') throw new Error('нет content');
  if (t.status && t.status !== 'approved') throw new Error(`status = ${t.status}`);
  return t as TaskFile;
}

// Скачивает index.json, затем только новые и изменённые задания.
// Задания, которых больше нет в индексе, удаляются (результаты по ним остаются).
export async function syncContent(db: Storage, baseUrl: string): Promise<SyncReport> {
  if (!baseUrl) throw new Error('Укажите адрес репозитория контента в настройках');
  const base = baseUrl.replace(/\/+$/, '');
  const index = await fetchJson<ContentIndex>(`${base}/index.json`);
  if (!index || !Array.isArray(index.tasks)) throw new Error('index.json: нет списка tasks');

  const local = await db.listTaskVersions();
  const localVersions = new Map(local.map((r) => [r.id, r.version]));
  const report: SyncReport = { added: 0, updated: 0, removed: 0, unchanged: 0, failed: [] };
  const now = new Date().toISOString();

  for (const entry of index.tasks) {
    const known = localVersions.get(entry.id);
    if (known !== undefined && known >= entry.version) {
      report.unchanged++;
      continue;
    }
    try {
      const task = validateTask(await fetchJson<unknown>(`${base}/${entry.path}`), entry.id);
      await db.putTask(task, now);
      if (known === undefined) report.added++;
      else report.updated++;
    } catch (e) {
      report.failed.push({ id: entry.id, reason: e instanceof Error ? e.message : String(e) });
    }
  }

  const inIndex = new Set(index.tasks.map((t) => t.id));
  for (const { id } of local) {
    if (!inIndex.has(id)) {
      await db.removeTask(id);
      report.removed++;
    }
  }

  await db.setKv('last_sync', now);
  return report;
}
