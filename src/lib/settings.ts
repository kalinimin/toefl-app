import { getAzureKey } from './speech-key';
import type { Storage } from './storage';

export interface Settings {
  contentUrl: string;
  azureRegion: string;
  hasAzureKey: boolean;
}

export async function loadSettings(db: Storage): Promise<Settings> {
  const [contentUrl, azureRegion, key] = await Promise.all([
    db.getKv('content_url'),
    db.getKv('azure_region'),
    getAzureKey(),
  ]);
  return {
    contentUrl: contentUrl ?? '',
    azureRegion: azureRegion ?? '',
    hasAzureKey: !!key,
  };
}

export async function saveContentUrl(db: Storage, url: string): Promise<void> {
  await db.setKv('content_url', normalizeContentUrl(url));
}

export async function saveAzureRegion(db: Storage, region: string): Promise<void> {
  await db.setKv('azure_region', region.trim().toLowerCase());
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
