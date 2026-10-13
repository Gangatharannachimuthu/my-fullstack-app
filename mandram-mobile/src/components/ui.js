import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, font, radius, spacing } from '../theme';

/** A white card - the mobile stand-in for a table row on the web. */
export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

/** One label/value line inside a card. */
export function Field({ label, value, valueStyle }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={[s.fieldValue, valueStyle]}>{value}</Text>
    </View>
  );
}

export function Badge({ text, tone = 'neutral' }) {
  const tones = {
    success: { bg: colors.successBg, fg: colors.success },
    warning: { bg: colors.warningBg, fg: colors.warning },
    danger: { bg: colors.dangerBg, fg: colors.danger },
    neutral: { bg: colors.border, fg: colors.textMuted },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <View style={[s.badge, { backgroundColor: t.bg }]}>
      <Text style={[s.badgeText, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

export function Btn({ title, onPress, tone = 'primary', disabled, style }) {
  const tones = {
    primary: { bg: colors.primary, fg: '#fff' },
    ghost: { bg: 'transparent', fg: colors.primary, border: colors.primary },
    danger: { bg: colors.danger, fg: '#fff' },
  };
  const t = tones[tone] || tones.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: t.bg, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
        t.border ? { borderWidth: 1, borderColor: t.border } : null,
        style,
      ]}
    >
      <Text style={[s.btnText, { color: t.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function TextField({ label, hint, style, ...props }) {
  return (
    <View style={[s.textFieldWrap, style]}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <TextInput
        style={s.input}
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
        {...props}
      />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

/**
 * Select control. React Native has no cross-platform <select>, and a wheel picker
 * reads badly for long lists like 66 meetings, so this is a searchless modal list -
 * tappable targets, current choice ticked.
 */
export function Select({ label, value, options, onChange, placeholder = 'Select...' }) {
  const [open, setOpen] = React.useState(false);
  const current = options.find((o) => String(o.value) === String(value));
  return (
    <View style={s.textFieldWrap}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <Pressable style={s.input} onPress={() => setOpen(true)}>
        <Text style={{ color: current ? colors.text : colors.textFaint }}>
          {current ? current.label : placeholder}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={s.sheetTitle}>{label || 'Select'}</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {options.length === 0 ? (
                <Text style={s.emptyText}>Nothing to choose from.</Text>
              ) : (
                options.map((o) => {
                  const active = String(o.value) === String(value);
                  return (
                    <Pressable
                      key={String(o.value)}
                      style={[s.option, active && { backgroundColor: '#eef2ff' }]}
                      onPress={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                    >
                      <Text style={{ color: active ? colors.primary : colors.text, flex: 1 }}>
                        {o.label}
                      </Text>
                      {active ? <Text style={{ color: colors.primary }}>✓</Text> : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
            <Btn title="Close" tone="ghost" onPress={() => setOpen(false)} style={{ marginTop: spacing.sm }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function Loading({ text = 'Loading...' }) {
  return (
    <View style={s.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <View style={s.error}>
      <Text style={s.errorText}>{message}</Text>
      {onRetry ? <Btn title="Retry" tone="ghost" onPress={onRetry} style={{ marginTop: spacing.sm }} /> : null}
    </View>
  );
}

export function Empty({ text }) {
  return <Text style={s.emptyText}>{text}</Text>;
}

export function SectionTitle({ children, right }) {
  return (
    <View style={s.sectionRow}>
      <Text style={font.h2}>{children}</Text>
      {right}
    </View>
  );
}

export function Note({ children }) {
  return <Text style={s.note}>{children}</Text>;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 3,
    gap: spacing.md,
  },
  fieldLabel: { ...font.label, flexShrink: 0 },
  fieldValue: { ...font.value, flexShrink: 1, textAlign: 'right' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  btn: {
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  btnText: { fontWeight: '700', fontSize: 14 },
  textFieldWrap: { marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: colors.text,
    fontSize: 15,
    marginTop: 4,
  },
  hint: { ...font.small, marginTop: 4 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.lg },
  sheetTitle: { ...font.h2, marginBottom: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  center: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...font.small, textAlign: 'center', paddingVertical: spacing.md },
  error: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 13 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  note: { ...font.small, marginBottom: spacing.md, lineHeight: 18 },
});

export { s as uiStyles };
