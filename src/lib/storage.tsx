import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useMemo, type ReactNode } from 'react';
import * as db from './db';
import type { Section, TaskFile } from './types';

export interface Storage {
  getKv(key: string): Promise<string | null>;
  setKv(key: string, value: string): Promise<void>;
  countBySection(): Promise<Record<string, number>>;
  listTasks(section: Section): Promise<db.TaskRow[]>;
  getTask(id: string): Promise<TaskFile | null>;
  listTaskVersions(): Promise<{ id: string; version: number }[]>;
  putTask(task: TaskFile, syncedAt: string): Promise<void>;
  removeTask(id: string): Promise<void>;
}

export function StorageProvider({ children }: { children: ReactNode }) {
  return <SQLiteProvider databaseName={db.DB_NAME} onInit={db.migrateDb}>{children}</SQLiteProvider>;
}

export function useStorage(): Storage {
  const database = useSQLiteContext();
  return useMemo(() => ({
    getKv: (key) => db.getKv(database, key),
    setKv: (key, value) => db.setKv(database, key, value),
    countBySection: () => db.countBySection(database),
    listTasks: (section) => db.listTasks(database, section),
    getTask: (id) => db.getTask(database, id),
    listTaskVersions: () => database.getAllAsync<{ id: string; version: number }>('SELECT id, version FROM tasks'),
    async putTask(task, syncedAt) {
      await database.runAsync(
        `INSERT INTO tasks (id, type, section, cefr, version, json, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET type = excluded.type, section = excluded.section,
           cefr = excluded.cefr, version = excluded.version, json = excluded.json, synced_at = excluded.synced_at`,
        task.id, task.type, task.section, task.cefr, task.version, JSON.stringify(task), syncedAt,
      );
    },
    async removeTask(id) {
      await database.runAsync('DELETE FROM tasks WHERE id = ?', id);
    },
  }), [database]);
}
