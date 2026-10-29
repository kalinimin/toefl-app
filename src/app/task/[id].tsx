import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Button, Card, Screen, T } from '../../components/ui';
import { getTask } from '../../lib/db';
import { TASK_TYPES, type TaskFile } from '../../lib/types';

// Здесь по типу задания будет подключаться нужный «плеер».
// Пока модули не готовы, экран показывает содержимое задания для проверки загрузки.
export default function TaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [task, setTask] = useState<TaskFile | null | undefined>(undefined);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    getTask(db, id).then(setTask);
  }, [db, id]);

  if (task === undefined) return <Screen>{null}</Screen>;
  if (task === null) {
    return (
      <Screen>
        <T v="danger">Задание {id} не найдено.</T>
      </Screen>
    );
  }

  const meta = TASK_TYPES[task.type];

  return (
    <Screen>
      <Stack.Screen options={{ title: meta.title }} />
      <Card>
        <T v="heading">{task.id}</T>
        <T v="muted">
          {[
            meta.title,
            task.cefr,
            task.topic,
            task.time_limit_sec ? `${Math.round(task.time_limit_sec / 60)} мин` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </T>
      </Card>

      <Card>
        <T>Модуль «{meta.title}» появится на неделе {meta.plannedWeek}.</T>
        <T v="small">Задание загружено и сохранено на телефоне — синхронизация работает.</T>
      </Card>

      <Button
        title={showJson ? 'Скрыть содержимое' : 'Показать содержимое (JSON)'}
        secondary
        onPress={() => setShowJson((v) => !v)}
      />
      {showJson && (
        <Card>
          <T v="small" selectable style={{ fontFamily: 'monospace' }}>
            {JSON.stringify(task.content, null, 2)}
          </T>
        </Card>
      )}
    </Screen>
  );
}
