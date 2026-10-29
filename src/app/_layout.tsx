import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useColors } from '../components/ui';
import { DB_NAME, migrateDb } from '../lib/db';

export default function RootLayout() {
  const c = useColors();
  return (
    <SQLiteProvider databaseName={DB_NAME} onInit={migrateDb}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'TOEFL-тренажёр' }} />
        <Stack.Screen name="settings" options={{ title: 'Настройки' }} />
        <Stack.Screen name="section/[section]" options={{ title: '' }} />
        <Stack.Screen name="task/[id]" options={{ title: '' }} />
      </Stack>
    </SQLiteProvider>
  );
}
