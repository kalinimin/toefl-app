import type { SQLiteDatabase } from 'expo-sqlite';
import type { Section, TaskFile } from './types';

export const DB_NAME = 'toefl.db';
const DB_VERSION = 1;

// Вызывается SQLiteProvider при запуске: создаёт и обновляет таблицы.
export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= DB_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        section TEXT NOT NULL,
        cefr TEXT NOT NULL,
        version INTEGER NOT NULL,
        json TEXT NOT NULL,
        synced_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_section ON tasks(section);

      CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        task_version INTEGER NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        score REAL NOT NULL,
        max_score REAL NOT NULL,
        duration_sec INTEGER,
        details TEXT,
        errors TEXT,
        claude_score REAL
      );
      CREATE INDEX IF NOT EXISTS idx_results_task ON results(task_id);

      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    version = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}

// --- Настройки, которые не секретны (адрес контента, регион, время синхронизации)

export async function getKv(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setKv(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

// --- Задания

export interface TaskRow {
  id: string;
  type: string;
  section: Section;
  cefr: string;
  version: number;
  attempts: number;
  best: number | null; // лучшая доля от максимума, 0..1
}

export async function countBySection(db: SQLiteDatabase): Promise<Record<string, number>> {
  const rows = await db.getAllAsync<{ section: string; n: number }>(
    'SELECT section, COUNT(*) AS n FROM tasks GROUP BY section',
  );
  return Object.fromEntries(rows.map((r) => [r.section, r.n]));
}

export async function listTasks(db: SQLiteDatabase, section: Section): Promise<TaskRow[]> {
  return db.getAllAsync<TaskRow>(
    `SELECT t.id, t.type, t.section, t.cefr, t.version,
            COUNT(r.id) AS attempts,
            MAX(r.score / r.max_score) AS best
       FROM tasks t
       LEFT JOIN results r ON r.task_id = t.id
      WHERE t.section = ?
      GROUP BY t.id
      ORDER BY t.type, t.cefr, t.id`,
    section,
  );
}

export async function getTask(db: SQLiteDatabase, id: string): Promise<TaskFile | null> {
  const row = await db.getFirstAsync<{ json: string }>('SELECT json FROM tasks WHERE id = ?', id);
  return row ? (JSON.parse(row.json) as TaskFile) : null;
}

// --- Результаты (понадобятся модулям с недели 2)

export interface NewResult {
  task_id: string;
  task_version: number;
  type: string;
  score: number;
  max_score: number;
  duration_sec?: number;
  details?: unknown;
  errors?: unknown[];
}

export async function saveResult(db: SQLiteDatabase, r: NewResult): Promise<void> {
  await db.runAsync(
    `INSERT INTO results (task_id, task_version, type, date, score, max_score, duration_sec, details, errors)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    r.task_id,
    r.task_version,
    r.type,
    new Date().toISOString(),
    r.score,
    r.max_score,
    r.duration_sec ?? null,
    r.details === undefined ? null : JSON.stringify(r.details),
    r.errors === undefined ? null : JSON.stringify(r.errors),
  );
}
