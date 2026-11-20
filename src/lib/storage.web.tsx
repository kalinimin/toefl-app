import type { ReactNode } from 'react';
import type { Storage } from './storage';
import type { TaskFile } from './types';

const settingsPrefix = 'toefl:settings:';
const taskPrefix = 'toefl:task:';

function readTask(key: string): TaskFile | null {
  const value = localStorage.getItem(key);
  return value === null ? null : JSON.parse(value) as TaskFile;
}

function readTasks(): TaskFile[] {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith(taskPrefix))
    .map(readTask)
    .filter((task) => task !== null);
}

const storage: Storage = {
  async getKv(key) {
    return localStorage.getItem(settingsPrefix + key);
  },
  async setKv(key, value) {
    localStorage.setItem(settingsPrefix + key, value);
  },
  async countBySection() {
    const counts: Record<string, number> = {};
    for (const { section } of readTasks()) {
      counts[section] = (counts[section] ?? 0) + 1;
    }
    return counts;
  },
  async listTasks(section) {
    return readTasks()
      .filter((task) => task.section === section)
      .sort((a, b) => a.type.localeCompare(b.type) || a.cefr.localeCompare(b.cefr) || a.id.localeCompare(b.id))
      .map(({ id, type, cefr, version }) => ({ id, type, section, cefr, version, attempts: 0, best: null }));
  },
  async getTask(id) {
    return readTask(taskPrefix + id);
  },
  async listTaskVersions() {
    return readTasks().map(({ id, version }) => ({ id, version }));
  },
  async putTask(task) {
    localStorage.setItem(taskPrefix + task.id, JSON.stringify(task));
  },
  async removeTask(id) {
    localStorage.removeItem(taskPrefix + id);
  },
};

export function StorageProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useStorage(): Storage {
  return storage;
}
