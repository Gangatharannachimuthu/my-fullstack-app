import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, font, monthLabel, spacing } from '../theme';
import { Badge, Select } from './ui';

/**
 * Standard page frame: scrollable body, pull-to-refresh, and - for the tabs that
 * are scoped to a meeting - the shared meeting picker pinned above the content,
 * mirroring the web app's meeting dropdown.
 */
export default function Screen({ children, refreshing, onRefresh, meetingScoped = false }) {
  const { meetings, selectedMeetingId, setSelectedMeetingId, selectedMeeting } = useApp();

  return (
    <View style={s.root}>
      {meetingScoped ? (
        <View style={s.bar}>
          <View style={{ flex: 1 }}>
            <Select
              label="Meeting"
              value={selectedMeetingId}
              onChange={setSelectedMeetingId}
              placeholder={meetings.length ? 'Pick a meeting' : 'No meetings yet'}
              options={meetings.map((m) => ({
                value: m.id,
                label: `${monthLabel(m.month, m.year)} — ${m.status}`,
              }))}
            />
          </View>
          {selectedMeeting ? (
            <Badge
              text={selectedMeeting.status}
              tone={selectedMeeting.status === 'finalized' ? 'success' : 'warning'}
            />
          ) : null}
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={s.body}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          ) : undefined
        }
      >
        {children}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

/** Heading + optional explanatory line, used at the top of most screens. */
export function ScreenTitle({ title, subtitle }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={font.h1}>{title}</Text>
      {subtitle ? <Text style={[font.small, { marginTop: 4, lineHeight: 18 }]}>{subtitle}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  body: { padding: spacing.lg },
});
