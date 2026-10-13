import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import Screen, { ScreenTitle } from '../components/Screen';
import { Btn, Card, Empty, ErrorBanner, Field, Loading, Note, Select, TextField } from '../components/ui';
import useLoad from '../hooks/useLoad';
import { chitService, investmentService } from '../api/services';
import { errorMessage } from '../api/client';
import { useApp } from '../context/AppContext';
import { font, rupees, spacing } from '../theme';

/**
 * The month-by-month cash on chits, gold and deposits. Winning a chit is recorded
 * separately on the Chit Management screen - the two must not record the same
 * rupee twice.
 */
export default function InvestmentsScreen() {
  const { selectedMeetingId, canEdit, meetingEditable } = useApp();
  const [form, setForm] = useState({ category_id: '', amount: '', auction: '', commission: '', chit_id: '', note: '' });
  const [busy, setBusy] = useState(false);

  const { data, loading, refreshing, error, setError, reload, refresh } = useLoad(async () => {
    if (!selectedMeetingId) return null;
    const [cats, entries, chits] = await Promise.all([
      investmentService.getCategories(),
      investmentService.getForMeeting(selectedMeetingId),
      chitService.getAll(),
    ]);
    return { categories: cats.data || [], entries: entries.data || [], chits: chits.data || [] };
  }, [selectedMeetingId]);

  const entries = data?.entries || [];
  const categories = data?.categories || [];
  const chits = data?.chits || [];

  // Only a chit has an auction, so only a chit carries commission and a chit link.
  const isChit = (id) => {
    const c = categories.find((x) => String(x.id) === String(id));
    return !!c && /chit/i.test(c.name);
  };
  const chitName = (id) => chits.find((c) => c.id === id)?.host_name || null;

  const total = entries.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalCommission = entries.reduce((s, e) => s + Number(e.commission_amount || 0), 0);
  const totalAuction = entries.reduce((s, e) => s + Number(e.auction_amount || 0), 0);

  const add = async () => {
    if (!form.category_id || !form.amount) return;
    setBusy(true);
    setError('');
    try {
      const chit = isChit(form.category_id);
      await investmentService.create(selectedMeetingId, {
        category_id: Number(form.category_id),
        amount: Number(form.amount),
        commission_amount: chit ? Number(form.commission || 0) : 0,
        auction_amount: chit && form.auction !== '' ? Number(form.auction) : null,
        chit_id: chit && form.chit_id ? Number(form.chit_id) : null,
        note: form.note || null,
      });
      setForm({ category_id: '', amount: '', auction: '', commission: '', chit_id: '', note: '' });
      await reload();
    } catch (err) {
      setError(errorMessage(err, 'Could not add the entry'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (entry) =>
    Alert.alert('Remove entry', `Remove this ${rupees(entry.amount)} entry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await investmentService.remove(entry.id);
            await reload();
          } catch (err) {
            setError(errorMessage(err, 'Could not remove the entry'));
          }
        },
      },
    ]);

  if (!selectedMeetingId) {
    return (
      <Screen meetingScoped>
        <Empty text="Pick a meeting first." />
      </Screen>
    );
  }

  return (
    <Screen meetingScoped refreshing={refreshing} onRefresh={refresh}>
      <ScreenTitle title="Chit &amp; Savings" subtitle="What was paid in this month, and any commission that came back." />
      <ErrorBanner message={error} onRetry={reload} />

      {canEdit && meetingEditable ? (
        <Card>
          <Select
            label="Add an entry"
            value={form.category_id}
            onChange={(v) => setForm({ ...form, category_id: v })}
            placeholder="Select category"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <TextField
            value={form.amount}
            onChangeText={(v) => setForm({ ...form, amount: v })}
            placeholder="Amount paid"
            keyboardType="numeric"
          />
          {isChit(form.category_id) ? (
            <>
              <TextField
                value={form.auction}
                onChangeText={(v) => setForm({ ...form, auction: v })}
                placeholder="Auction amount (tracking only)"
                keyboardType="numeric"
              />
              <TextField
                value={form.commission}
                onChangeText={(v) => setForm({ ...form, commission: v })}
                placeholder="Commission to us"
                keyboardType="numeric"
              />
              <Select
                label="Link to chit (optional)"
                value={form.chit_id}
                onChange={(v) => setForm({ ...form, chit_id: v })}
                placeholder="Not linked"
                options={[{ value: '', label: 'Not linked' }, ...chits.map((c) => ({ value: c.id, label: c.host_name }))]}
              />
              <Note>Linking lets the Chit Management screen total this chit&apos;s commission over time.</Note>
            </>
          ) : null}
          <TextField
            value={form.note}
            onChangeText={(v) => setForm({ ...form, note: v })}
            placeholder="Note (optional)"
          />
          <Btn title={busy ? 'Adding...' : 'Add'} onPress={add} disabled={busy || !form.category_id || !form.amount} />
        </Card>
      ) : null}

      {loading ? (
        <Loading />
      ) : entries.length === 0 ? (
        <Empty text="Nothing recorded for this meeting." />
      ) : (
        <>
          {entries.map((e) => (
            <Card key={e.id}>
              <Text style={[font.h2, { marginBottom: spacing.xs }]}>{e.category_name}</Text>
              <Field label="Amount paid" value={rupees(e.amount)} />
              {e.auction_amount != null ? <Field label="Auction amount" value={rupees(e.auction_amount)} /> : null}
              <Field label="Commission" value={Number(e.commission_amount) > 0 ? rupees(e.commission_amount) : '-'} />
              <Field label="Chit" value={chitName(e.chit_id) || '-'} />
              <Field label="Note" value={e.note || '-'} />
              {canEdit && meetingEditable ? (
                <Btn title="Remove" tone="danger" onPress={() => confirmDelete(e)} style={{ marginTop: spacing.md }} />
              ) : null}
            </Card>
          ))}
          <Card style={{ backgroundColor: '#eef2ff' }}>
            <Field label={`Total paid (${entries.length})`} value={rupees(total)} valueStyle={{ fontWeight: '700' }} />
            {totalAuction > 0 ? <Field label="Auction total" value={rupees(totalAuction)} /> : null}
            <Field label="Commission total" value={rupees(totalCommission)} valueStyle={{ fontWeight: '700' }} />
          </Card>
        </>
      )}
    </Screen>
  );
}
