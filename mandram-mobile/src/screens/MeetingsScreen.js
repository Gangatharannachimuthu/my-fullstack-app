import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import Screen, { ScreenTitle } from '../components/Screen';
import { Badge, Btn, Card, Empty, ErrorBanner, Field, Select, TextField } from '../components/ui';
import { useApp } from '../context/AppContext';
import { meetingService } from '../api/services';
import { errorMessage } from '../api/client';
import { monthLabel, rupees, spacing } from '../theme';

export default function MeetingsScreen() {
  const { meetings, refreshMeetings, canEdit, meetingsError } = useApp();
  const [year, setYear] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Years come from the data, so a new year appears as soon as its first meeting
  // exists - no hardcoded list to maintain.
  const years = useMemo(
    () => [...new Set(meetings.map((m) => m.year))].sort((a, b) => b - a),
    [meetings]
  );

  const visible = year ? meetings.filter((m) => String(m.year) === String(year)) : meetings;

  const create = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      setError('Enter the date as YYYY-MM-DD');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await meetingService.create({ meeting_date: date.trim() });
      setDate('');
      await refreshMeetings();
    } catch (err) {
      setError(errorMessage(err, 'Could not open the meeting'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (meeting) => {
    Alert.alert(
      'Delete meeting',
      `Remove ${monthLabel(meeting.month, meeting.year)}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await meetingService.remove(meeting.id);
              await refreshMeetings();
            } catch (err) {
              setError(errorMessage(err, 'Could not delete the meeting'));
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshMeetings();
    setRefreshing(false);
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenTitle title="Meetings" subtitle="One meeting per month. Opening balance is worked out automatically." />
      <ErrorBanner message={error || meetingsError} />

      {canEdit ? (
        <Card>
          <TextField
            label="Open a new meeting"
            value={date}
            onChangeText={setDate}
            placeholder="2026-10-04"
            hint="Month and year are taken from the date."
          />
          <Btn title={busy ? 'Opening...' : 'Open meeting'} onPress={create} disabled={busy || !date.trim()} />
        </Card>
      ) : null}

      <Select
        label="Filter by year"
        value={year}
        onChange={setYear}
        placeholder="All years"
        options={[{ value: '', label: 'All years' }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
      />

      {visible.length === 0 ? (
        <Empty text="No meetings yet." />
      ) : (
        visible.map((m) => (
          <Card key={m.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Badge text={m.status} tone={m.status === 'finalized' ? 'success' : 'warning'} />
            </View>
            <Field label="Meeting" value={monthLabel(m.month, m.year)} />
            <Field label="Date" value={m.meeting_date} />
            <Field label="Opening balance" value={rupees(m.opening_balance)} />
            {m.closing_balance != null ? (
              <Field label="Closing balance" value={rupees(m.closing_balance)} />
            ) : null}
            {m.trust_total_value != null ? (
              <Field label="Mandram total value" value={rupees(m.trust_total_value)} />
            ) : null}
            {canEdit && m.status !== 'finalized' ? (
              <Btn
                title="Delete"
                tone="danger"
                onPress={() => confirmDelete(m)}
                style={{ marginTop: spacing.md }}
              />
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
