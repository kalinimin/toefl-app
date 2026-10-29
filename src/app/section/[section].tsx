import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Badge, Card, Screen, T } from '../../components/ui';
import { listTasks, type TaskRow } from '../../lib/db';
import { isTaskType, SECTIONS, TASK_TYPES, type Section } from '../../lib/types';

export default function SectionScreen() {
  const { section } = useLocalSearchParams<{ section: Section }>();
  const db = useSQLiteContext();
  const [rows, setRows] = useState<TaskRow[] | null>(null);
  const meta = SECTIONS.find((s) => s.id === section);

  useFocusEffect(
    useCallback(() => {
      listTasks(db, section).then(setRows);
    }, [db, section]),
  );

  // Группировка по типу задания, в порядке из TASK_TYPES
  const groups = Object.entries(TASK_TYPES)
    .filter(([, t]) => t.section === section)
    .map(([type, t]) => ({ type, title: t.title, items: (rows ?? []).filter((r) => r.type === type) }));

  return (
    <Screen>
      <Stack.Screen options={{ title: meta?.title ?? '' }} />
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
            <Card key={r.id} onPress={() => router.push({ pathname: '/task/[id]', params: { id: r.id } })}>
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
