import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { Button, Card, Screen, T } from '../components/ui';
import { syncContent, type SyncReport } from '../lib/content';
import { useStorage } from '../lib/storage';
import { loadSettings, type Settings } from '../lib/settings';
import { SECTIONS } from '../lib/types';

export default function Home() {
  const db = useStorage();
  const { width } = useWindowDimensions();
  const wide = Platform.OS === 'web' && width >= 640;
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<Settings | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<SyncReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [cnt, s, ls] = await Promise.all([db.countBySection(), loadSettings(db), db.getKv('last_sync')]);
    setCounts(cnt);
    setSettings(s);
    setLastSync(ls);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh().catch((e: Error) => setError(e.message));
    }, [refresh]),
  );

  async function onSync() {
    if (!settings) return;
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      setReport(await syncContent(db, settings.contentUrl));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const needsSetup = settings && (!settings.contentUrl || !settings.hasAzureKey);

  return (
    <Screen>
      {needsSetup && (
        <Card href="/settings">
          <T v="heading">Нужна настройка</T>
          <T v="muted">
            {!settings.contentUrl ? 'Укажите адрес репозитория с заданиями. ' : ''}
            {!settings.hasAzureKey ? 'Ключ Azure понадобится для Speaking.' : ''}
          </T>
        </Card>
      )}

      <View style={{ gap: 12, flexDirection: wide ? 'row' : 'column', flexWrap: wide ? 'wrap' : 'nowrap' }}>
        {SECTIONS.map((s) => (
          <Card
            key={s.id}
            href={{ pathname: '/section/[section]', params: { section: s.id } }}
            style={wide ? { flexBasis: '45%', flexGrow: 1 } : undefined}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <T v="heading">{s.title}</T>
              <T v="small">{counts[s.id] ?? 0} заданий</T>
            </View>
            <T v="muted">{s.subtitle}</T>
          </Card>
        ))}
      </View>

      <View style={{ gap: 8, marginTop: 8 }}>
        <Button title="Обновить задания" onPress={onSync} busy={busy} disabled={!settings?.contentUrl} />
        <T v="small">
          {lastSync
            ? `Последнее обновление: ${new Date(lastSync).toLocaleString('ru-RU')} · всего ${total}`
            : 'Задания ещё не загружались'}
        </T>
        {error && <T v="danger">{error}</T>}
        {report && (
          <View style={{ gap: 2 }}>
            <T v="ok">
              Новых: {report.added}, обновлено: {report.updated}, удалено: {report.removed}, без изменений:{' '}
              {report.unchanged}
            </T>
            {report.failed.map((f) => (
              <T key={f.id} v="danger">
                {f.id}: {f.reason}
              </T>
            ))}
          </View>
        )}
        <Button title="Настройки" secondary onPress={() => router.push('/settings')} />
      </View>
    </Screen>
  );
}
