import React, { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import Screen, { ScreenTitle } from '../components/Screen';
import { Btn, Card, Empty, ErrorBanner, Field, Loading, Note, Select, TextField } from '../components/ui';
import useLoad from '../hooks/useLoad';
import { chitService } from '../api/services';
import { errorMessage } from '../api/client';
import { useApp } from '../context/AppContext';
import { font, monthLabel, rupees, spacing } from '../theme';

const EMPTY = { initiate_date: '', host_name: '', agent_amount: '', auction_count: '', amount_taken: '', note: '' };

/**
 * The register of chits the mandram has *won*. Written once, at the point of
 * taking the chit - not month by month, which belongs on Chit & Savings.
 *
 * Not scoped to the selected meeting: a register is only useful read as a whole,
 * so it lists every chit with a year filter.
 */
export default function ChitsScreen() {
  const { meetings, selectedMeetingId, canEdit } = useApp();
  const [form, setForm] = useState(EMPTY);
  const [takenIn, setTakenIn] = useState(selectedMeetingId || '');
  const [year, setYear] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, loading, refreshing, error, setError, reload, refresh } = useLoad(
    async () => (await chitService.getAll(year ? { year } : undefined)).data || [],
    [year],
    { initial: [] }
  );

  const chits = data || [];
  const years = useMemo(() => [...new Set(meetings.map((m) => m.year))].sort((a, b) => b - a), [meetings]);

  const totals = chits.reduce(
    (acc, c) => ({
      committed: acc.committed + Number(c.total_committed || 0),
      commission: acc.commission + Number(c.total_commission || 0),
      taken: acc.taken + Number(c.amount_taken || 0),
    }),
    { committed: 0, commission: 0, taken: 0 }
  );

  const add = async () => {
    if (!takenIn || !form.host_name.trim()) {
      setError('Pick the meeting it was taken in and enter the host name');
      return;
    }
    if (form.initiate_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.initiate_date.trim())) {
      setError('Initiate date must be YYYY-MM-DD');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await chitService.create({
        meeting_id: Number(takenIn),
        initiate_date: form.initiate_date.trim() || null,
        host_name: form.host_name.trim(),
        agent_amount: Number(form.agent_amount || 0),
        auction_count: Number(form.auction_count || 0),
        amount_taken: Number(form.amount_taken || 0),
        note: form.note || null,
      });
      setForm(EMPTY);
      await reload();
    } catch (err) {
      setError(errorMessage(err, 'Could not add the chit'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (chit) =>
    Alert.alert('Remove chit', `Remove ${chit.host_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await chitService.remove(chit.id);
            await reload();
          } catch (err) {
            setError(errorMessage(err, 'Could not remove the chit'));
          }
        },
      },
    ]);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ScreenTitle
        title="Chit Management"
        subtitle="One row per chit the mandram has taken (won the auction for). The amount taken is added to that month's balance."
      />
      <ErrorBanner message={error} onRetry={reload} />

      {canEdit ? (
        <Card>
          <Select
            label="Taken in meeting"
            value={takenIn}
            onChange={setTakenIn}
            placeholder="Select meeting"
            options={meetings.map((m) => ({ value: m.id, label: monthLabel(m.month, m.year) }))}
          />
          <TextField
            value={form.initiate_date}
            onChangeText={(v) => setForm({ ...form, initiate_date: v })}
            placeholder="Initiate date (YYYY-MM-DD, optional)"
          />
          <TextField
            value={form.host_name}
            onChangeText={(v) => setForm({ ...form, host_name: v })}
            placeholder="Chit host name"
            autoCapitalize="words"
          />
          <TextField
            value={form.agent_amount}
            onChangeText={(v) => setForm({ ...form, agent_amount: v })}
            placeholder="Agent amount (monthly)"
            keyboardType="numeric"
          />
          <TextField
            value={form.auction_count}
            onChangeText={(v) => setForm({ ...form, auction_count: v })}
            placeholder="Auction count"
            keyboardType="numeric"
          />
          <TextField
            value={form.amount_taken}
            onChangeText={(v) => setForm({ ...form, amount_taken: v })}
            placeholder="Chit amount taken"
            keyboardType="numeric"
          />
          <TextField
            value={form.note}
            onChangeText={(v) => setForm({ ...form, note: v })}
            placeholder="Note (optional)"
          />
          <Btn title={busy ? 'Adding...' : 'Add chit'} onPress={add} disabled={busy} />
        </Card>
      ) : null}

      <Select
        label="Year"
        value={year}
        onChange={setYear}
        placeholder="All years"
        options={[{ value: '', label: 'All years' }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
      />

      {loading ? (
        <Loading />
      ) : chits.length === 0 ? (
        <Empty text="No chits recorded yet." />
      ) : (
        <>
          {chits.map((c) => (
            <Card key={c.id}>
              <Text style={[font.h2, { marginBottom: spacing.xs }]}>{c.host_name}</Text>
              <Field label="Initiate date" value={c.initiate_date || '-'} />
              <Field label="Taken in" value={monthLabel(c.meeting_month, c.meeting_year)} />
              <Field label="Agent amount" value={rupees(c.agent_amount)} />
              <Field label="Auction count" value={String(c.auction_count)} />
              <Field label="Total committed" value={rupees(c.total_committed)} />
              <Field label="Total commission" value={rupees(c.total_commission || 0)} />
              <Field label="Amount taken" value={rupees(c.amount_taken)} />
              {canEdit ? (
                <Btn title="Remove" tone="danger" onPress={() => confirmDelete(c)} style={{ marginTop: spacing.md }} />
              ) : null}
            </Card>
          ))}
          <Card style={{ backgroundColor: '#eef2ff' }}>
            <Field label={`Total (${chits.length} chits)`} value="" />
            <Field label="Committed" value={rupees(totals.committed)} valueStyle={{ fontWeight: '700' }} />
            <Field label="Commission" value={rupees(totals.commission)} valueStyle={{ fontWeight: '700' }} />
            <Field label="Taken" value={rupees(totals.taken)} valueStyle={{ fontWeight: '700' }} />
          </Card>
          <Note>
            Total Commission is the running sum of the Chit &amp; Savings entries linked to that
            chit, shown for reference only.
          </Note>
        </>
      )}
    </Screen>
  );
}
