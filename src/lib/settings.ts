import * as SecureStore from 'expo-secure-store';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getKv, setKv } from './db';

// Ключ Azure хранится в защищённом хранилище телефона (Android Keystore),
// остальные настройки — в обычной базе.
const AZURE_KEY = 'azure_speech_key';

export interface Settings {
  contentUrl: string;
  azureRegion: string;
  hasAzureKey: boolean;
}

export async function loadSettings(db: SQLiteDatabase): Promise<Settings> {
  const [contentUrl, azureRegion, key] = await Promise.all([
    getKv(db, 'content_url'),
    getKv(db, 'azure_region'),
    SecureStore.getItemAsync(AZURE_KEY),
  ]);
  return {
    contentUrl: contentUrl ?? '',
    azureRegion: azureRegion ?? '',
    hasAzureKey: !!key,
  };
}

export async function saveContentUrl(db: SQLiteDatabase, url: string): Promise<void> {
  await setKv(db, 'content_url', normalizeContentUrl(url));
}

export async function saveAzureRegion(db: SQLiteDatabase, region: string): Promise<void> {
  await setKv(db, 'azure_region', region.trim().toLowerCase());
}

export async function saveAzureKey(key: string): Promise<void> {
  const k = key.trim();
  if (k) await SecureStore.setItemAsync(AZURE_KEY, k);
  else await SecureStore.deleteItemAsync(AZURE_KEY);
}

export async function getAzureKey(): Promise<string | null> {
  return SecureStore.getItemAsync(AZURE_KEY);
}

// Принимает и обычную ссылку на репозиторий GitHub, и raw-ссылку:
// https://github.com/user/toefl-content -> https://raw.githubusercontent.com/user/toefl-content/main
export function normalizeContentUrl(input: string): string {
  let url = input.trim().replace(/\/+$/, '');
  const gh = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?$/);
  if (gh) {
    const [, user, repo, branch] = gh;
    url = `https://raw.githubusercontent.com/${user}/${repo.replace(/\.git$/, '')}/${branch ?? 'main'}`;
  }
  return url;
}
