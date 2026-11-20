import * as SecureStore from 'expo-secure-store';

const keyName = 'azure_speech_key';

export const speechKeyScope = 'на устройстве';

export async function getAzureKey(): Promise<string | null> {
  return SecureStore.getItemAsync(keyName);
}

export async function saveAzureKey(key: string): Promise<void> {
  const value = key.trim();
  if (value) await SecureStore.setItemAsync(keyName, value);
  else await SecureStore.deleteItemAsync(keyName);
}
