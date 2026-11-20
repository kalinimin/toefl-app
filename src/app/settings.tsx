import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, Screen, T, useColors } from '../components/ui';
import {
  loadSettings,
  normalizeContentUrl,
  saveAzureRegion,
  saveContentUrl,
} from '../lib/settings';
import { saveAzureKey, speechKeyScope } from '../lib/speech-key';
import { useStorage } from '../lib/storage';

export default function SettingsScreen() {
  const db = useStorage();
  const c = useColors();
  const [contentUrl, setContentUrl] = useState('');
  const [region, setRegion] = useState('');
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings(db).then((s) => {
      setContentUrl(s.contentUrl);
      setRegion(s.azureRegion);
      setHasKey(s.hasAzureKey);
      setLoaded(true);
    }).catch((e: Error) => setError(e.message));
  }, [db]);

  async function onSave() {
    setBusy(true);
    setError(null);
    try {
      await saveContentUrl(db, contentUrl);
      await saveAzureRegion(db, region);
      if (key.trim()) await saveAzureKey(key);
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onRemoveKey() {
    await saveAzureKey('');
    setHasKey(false);
    setKey('');
  }

  const input = [styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.card }];
  const preview = contentUrl ? normalizeContentUrl(contentUrl) : '';

  return (
    <Screen>
      <Card>
        <T v="heading">Репозиторий заданий</T>
        <T v="small">Ссылка на публичный репозиторий GitHub или raw-адрес папки с index.json.</T>
        <TextInput
          accessibilityLabel="Адрес репозитория заданий"
          style={input}
          value={contentUrl}
          onChangeText={setContentUrl}
          placeholder="https://github.com/имя/toefl-content"
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {preview && preview !== contentUrl.trim() && <T v="small">Будет использовано: {preview}</T>}
      </Card>

      <Card>
        <T v="heading">Azure Speech</T>
        <T v="small">Регион ресурса, например westeurope или eastus.</T>
        <TextInput
          accessibilityLabel="Регион Azure Speech"
          style={input}
          value={region}
          onChangeText={setRegion}
          placeholder="westeurope"
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <T v="small">
          {hasKey ? 'Введите новый ключ, чтобы заменить текущий.' : 'Ключ ещё не сохранён.'}
          {' Ключ хранится '}{speechKeyScope}.
        </T>
        <TextInput
          accessibilityLabel="Ключ Azure Speech"
          style={input}
          value={key}
          onChangeText={setKey}
          placeholder="Ключ (Key 1)"
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        {hasKey && (
          <View style={{ marginTop: 4 }}>
            <Button title="Удалить ключ" secondary onPress={onRemoveKey} />
          </View>
        )}
      </Card>

      {error && <T v="danger">{error}</T>}
      <Button title="Сохранить" onPress={onSave} busy={busy} disabled={!loaded} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginTop: 4 },
});
