import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Badge, Card, Screen, T } from '../../components/ui';
import type { TaskRow } from '../../lib/db';
import { useStorage } from '../../lib/storage';
import { isTaskType, SECTIONS, TASK_TYPES, type Section } from '../../lib/types';

export default function SectionScreen() {
  const { section } = useLocalSearchParams<{ section: Section }>();
  const db = useStorage();
  const [rows, setRows] = useState<TaskRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const meta = SECTIONS.find((s) => s.id === section);

  useFocusEffect(
    useCallback(() => {
      if (!meta) return;
      let active = true;
      setError(null);
      db.listTasks(meta.id).then((items) => {
        if (active) setRows(items);
      }).catch((e: Error) => {
        if (active) setError(e.message);
      });
      return () => { active = false; };
    }, [db, meta]),
  );

  // Группировка по типу задания, в порядке из TASK_TYPES
  const groups = Object.entries(TASK_TYPES)
    .filter(([, t]) => t.section === section)
    .map(([type, t]) => ({ type, title: t.title, items: (rows ?? []).filter((r) => r.type === type) }));

  return (
    <Screen>
      <Stack.Screen options={{ title: meta?.title ?? '' }} />
      {!meta && <T v="danger">Раздел не найден.</T>}
      {error && <T v="danger">{error}</T>}
      {rows && rows.length === 0 && (
        <T v="muted">Заданий пока нет. Вернитесь на главный экран и нажмите «Обновить задания».</T>
      )}
      {groups.map((g) => (
        <View key={g.type} style={{ gap: 8 }}>
          <T v="heading" style={{ marginTop: 8 }}>
            {g.title}
          </T>
          {g.items.length === 0 && <T v="small">нет заданий</T>}
          {g.items.map((r) => (
            <Card key={r.id} href={{ pathname: '/task/[id]', params: { id: r.id } }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T style={{ flex: 1 }}>{r.id}</T>
                <Badge label={r.cefr} />
              </View>
              <T v="small">
                {r.attempts === 0
                  ? isTaskType(r.type) && !TASK_TYPES[r.type].ready
                    ? 'модуль в разработке'
                    : 'не решалось'
                  : `попыток: ${r.attempts} · лучший результат ${Math.round((r.best ?? 0) * 100)}%`}
              </T>
            </Card>
          ))}
        </View>
      ))}
    </Screen>
  );
}
