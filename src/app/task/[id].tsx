import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Card, Screen, T } from '../../components/ui';
import { useStorage } from '../../lib/storage';
import { TASK_TYPES, type TaskFile } from '../../lib/types';

// Здесь по типу задания будет подключаться нужный «плеер».
// Пока модули не готовы, экран показывает содержимое задания для проверки загрузки.
export default function TaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TaskDetails key={id} id={id} />;
}

function TaskDetails({ id }: { id: string }) {
  const db = useStorage();
  const [task, setTask] = useState<TaskFile | null | undefined>(undefined);
  const [showJson, setShowJson] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    db.getTask(id).then((item) => {
      if (active) setTask(item);
    }).catch((e: Error) => {
      if (active) setError(e.message);
    });
    return () => { active = false; };
  }, [db, id]);

  if (error) return <Screen><T v="danger">{error}</T></Screen>;
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
        <T v="small">Задание загружено и доступно в каталоге.</T>
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
