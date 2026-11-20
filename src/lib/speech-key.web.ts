let speechKey: string | null = null;

export const speechKeyScope = 'до перезагрузки страницы';

export async function getAzureKey(): Promise<string | null> {
  return speechKey;
}

export async function saveAzureKey(key: string): Promise<void> {
  speechKey = key.trim() || null;
}
