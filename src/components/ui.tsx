import type { ReactNode } from 'react';
import { Link, type Href } from 'expo-router';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const light = {
  bg: '#F6F5F1',
  card: '#FFFFFF',
  text: '#1C1B19',
  muted: '#6E6B63',
  border: '#E4E1D8',
  accent: '#2F5D50',
  accentText: '#FFFFFF',
  danger: '#B3261E',
  ok: '#2E7D32',
};

const dark: typeof light = {
  bg: '#141413',
  card: '#1F1E1C',
  text: '#F1EFE9',
  muted: '#A19D93',
  border: '#33312D',
  accent: '#7FB8A4',
  accentText: '#10201B',
  danger: '#F2B8B5',
  ok: '#8BC48E',
};

export type Palette = typeof light;

export function useColors(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const c = useColors();
  const inner = <View style={styles.inner}>{children}</View>;
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: c.bg }}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}

export function Card({
  children,
  onPress,
  href,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  href?: Href;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const base = [styles.card, { backgroundColor: c.card, borderColor: c.border }, style];
  if (!onPress && !href) return <View style={base}>{children}</View>;
  const pressable = (
    <Pressable accessibilityRole={href ? 'link' : 'button'} onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.7 }]}>
      {children}
    </Pressable>
  );
  return href ? <Link href={href} asChild>{pressable}</Link> : pressable;
}

type Variant = 'title' | 'heading' | 'body' | 'muted' | 'small' | 'danger' | 'ok';

export function T({
  children,
  v = 'body',
  style,
  selectable,
}: {
  children: ReactNode;
  v?: Variant;
  style?: StyleProp<TextStyle>;
  selectable?: boolean;
}) {
  const c = useColors();
  const map: Record<Variant, TextStyle> = {
    title: { fontSize: 26, fontWeight: '700', color: c.text },
    heading: { fontSize: 18, fontWeight: '600', color: c.text },
    body: { fontSize: 16, lineHeight: 23, color: c.text },
    muted: { fontSize: 15, lineHeight: 21, color: c.muted },
    small: { fontSize: 13, lineHeight: 18, color: c.muted },
    danger: { fontSize: 15, lineHeight: 21, color: c.danger },
    ok: { fontSize: 15, lineHeight: 21, color: c.ok },
  };
  return (
    <Text selectable={selectable} style={[map[v], style]}>
      {children}
    </Text>
  );
}

export function Button({
  title,
  onPress,
  busy,
  secondary,
  disabled,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const c = useColors();
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.button,
        secondary
          ? { backgroundColor: 'transparent', borderColor: c.accent, borderWidth: 1.5 }
          : { backgroundColor: c.accent },
        (pressed || off) && { opacity: 0.6 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? c.accent : c.accentText} />
      ) : (
        <Text style={[styles.buttonText, { color: secondary ? c.accent : c.accentText }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Badge({ label }: { label: string }) {
  const c = useColors();
  return (
    <View style={[styles.badge, { borderColor: c.border }]}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: c.muted }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  inner: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
    ...(Platform.OS === 'web' && { width: '100%', maxWidth: 960, alignSelf: 'center' }),
  },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 6 },
  button: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
});
