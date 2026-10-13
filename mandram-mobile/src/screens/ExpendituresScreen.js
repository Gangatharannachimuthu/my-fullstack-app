import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import Screen, { ScreenTitle } from '../components/Screen';
import { Btn, Card, Empty, ErrorBanner, Field, Loading, Select, TextField } from '../components/ui';
import useLoad from '../hooks/useLoad';
import { expenditureService } from '../api/services';
import { errorMessage } from '../api/client';
import { useApp } from '../context/AppContext';
import { font, rupees, spacing } from '../theme';

export default function ExpendituresScreen() {
  const { selectedMeetingId, canEdit, meetingEditable } = useApp();
  const [form, setForm] = useState({ category_id: '', amount: '', note: '' });
  const [newCategory, setNewCategory] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, loading, refreshing, error, setError, reload, refresh } = useLoad(async () => {
    if (!selectedMeetingId) return null;
    const [cats, entries] = await Promise.all([
      expenditureService.getCategories(),
      expenditureService.getForMeeting(selectedMeetingId),
    ]);
    return { categories: cats.data || [], entries: entries.data || [] };
  }, [selectedMeetingId]);

  const entries = data?.entries || [];
  const total = entries.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const add = async () => {
    if (!form.category_id || !form.amount) return;
    setBusy(true);
    setError('');
    try {
      await expenditureService.create(selectedMeetingId, {
        category_id: Number(form.category_id),
        amount: Number(form.amount),
        note: form.note || null,
      });
      setForm({ category_id: '', amount: '', note: '' });
      await reload();
    } catch (err) {
      setError(errorMessage(err, 'Could not add the entry'));
    } finally {
      setBusy(false);
    }
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      setError('');
      await expenditureService.createCategory({ name: newCategory.trim() });
      setNewCategory('');
      await reload();
    } catch (err) {
      setError(errorMessage(err, 'Could not add the category'));
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
            await expenditureService.remove(entry.id);
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
      <ScreenTitle title="Expenditures (செலவு)" />
      <ErrorBanner message={error} onRetry={reload} />

      {canEdit && meetingEditable ? (
        <Card>
          <Select
            label="Add an entry"
            value={form.category_id}
            onChange={(v) => setForm({ ...form, category_id: v })}
            placeholder="Select category"
            options={(data?.categories || []).map((c) => ({ value: c.id, label: c.name }))}
          />
          <TextField
            value={form.amount}
            onChangeText={(v) => setForm({ ...form, amount: v })}
            placeholder="Amount"
            keyboardType="numeric"
          />
          <TextField
            value={form.note}
            onChangeText={(v) => setForm({ ...form, note: v })}
            placeholder="Note (optional)"
          />
          <Btn title={busy ? 'Adding...' : 'Add'} onPress={add} disabled={busy || !form.category_id || !form.amount} />
        </Card>
      ) : null}

      {canEdit ? (
        <Card>
          <TextField
            label="Add a category"
            value={newCategory}
            onChangeText={setNewCategory}
            placeholder="e.g. Hall Rent"
          />
          <Btn title="Add category" tone="ghost" onPress={addCategory} disabled={!newCategory.trim()} />
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
              <Field label="Amount" value={rupees(e.amount)} />
              <Field label="Note" value={e.note || '-'} />
              {canEdit && meetingEditable ? (
                <Btn title="Remove" tone="danger" onPress={() => confirmDelete(e)} style={{ marginTop: spacing.md }} />
              ) : null}
            </Card>
          ))}
          <Card style={{ backgroundColor: '#eef2ff' }}>
            <Field label={`Total (${entries.length})`} value={rupees(total)} valueStyle={{ fontWeight: '700' }} />
          </Card>
        </>
      )}
    </Screen>
  );
}
