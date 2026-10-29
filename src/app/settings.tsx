import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, Screen, T, useColors } from '../components/ui';
import {
  loadSettings,
  normalizeContentUrl,
  saveAzureKey,
  saveAzureRegion,
  saveContentUrl,
} from '../lib/settings';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const c = useColors();
  const [contentUrl, setContentUrl] = useState('');
  const [region, setRegion] = useState('');
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadSettings(db).then((s) => {
      setContentUrl(s.contentUrl);
      setRegion(s.azureRegion);
      setHasKey(s.hasAzureKey);
    });
  }, [db]);

  async function onSave() {
    setBusy(true);
    try {
      await saveContentUrl(db, contentUrl);
      await saveAzureRegion(db, region);
      if (key.trim()) await saveAzureKey(key);
      router.back();
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
          style={input}
          value={region}
          onChangeText={setRegion}
          placeholder="westeurope"
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <T v="small">
          {hasKey ? 'Ключ сохранён на телефоне. Введите новый, чтобы заменить.' : 'Ключ ещё не сохранён.'}
        </T>
        <TextInput
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

      <Button title="Сохранить" onPress={onSave} busy={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginTop: 4 },
});
