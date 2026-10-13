import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import Screen, { ScreenTitle } from '../components/Screen';
import { Badge, Btn, Card, Empty, ErrorBanner, Field, Loading, TextField } from '../components/ui';
import useLoad from '../hooks/useLoad';
import { memberService } from '../api/services';
import { errorMessage } from '../api/client';
import { useApp } from '../context/AppContext';
import { spacing } from '../theme';

const EMPTY = { name: '', phone: '', joined_date: '' };

export default function MembersScreen() {
  const { canEdit } = useApp();
  const { data, loading, refreshing, error, setError, reload, refresh } = useLoad(
    async () => (await memberService.getAll()).data || [],
    [],
    { initial: [] }
  );
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const members = data || [];

  const submit = async () => {
    if (!form.name.trim()) return;
    if (form.joined_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.joined_date.trim())) {
      setError('Joined date must be YYYY-MM-DD');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        joined_date: form.joined_date.trim() || null,
      };
      if (editingId) await memberService.update(editingId, payload);
      else await memberService.create(payload);
      setForm(EMPTY);
      setEditingId(null);
      await reload();
    } catch (err) {
      setError(errorMessage(err, 'Could not save the member'));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setForm({ name: m.name, phone: m.phone || '', joined_date: m.joined_date || '' });
  };

  const confirmDelete = (m) => {
    Alert.alert('Remove member', `Remove ${m.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await memberService.remove(m.id);
            await reload();
          } catch (err) {
            setError(errorMessage(err, 'Could not remove the member'));
          }
        },
      },
    ]);
  };

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ScreenTitle
        title="Members"
        subtitle="A member only appears in the ledger from the month they joined onward, so the joining date matters."
      />
      <ErrorBanner message={error} />

      {canEdit ? (
        <Card>
          <TextField
            label={editingId ? 'Edit member' : 'Add member'}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder="Name"
            autoCapitalize="words"
          />
          <TextField
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
            placeholder="Mobile number"
            keyboardType="phone-pad"
          />
          <TextField
            value={form.joined_date}
            onChangeText={(v) => setForm({ ...form, joined_date: v })}
            placeholder="Joined date (YYYY-MM-DD)"
            hint="Used to work out their joining contribution, if any."
          />
          <Btn title={busy ? 'Saving...' : editingId ? 'Save changes' : 'Add member'} onPress={submit} disabled={busy} />
          {editingId ? (
            <Btn
              title="Cancel"
              tone="ghost"
              onPress={() => {
                setEditingId(null);
                setForm(EMPTY);
              }}
              style={{ marginTop: spacing.sm }}
            />
          ) : null}
        </Card>
      ) : null}

      {loading ? (
        <Loading />
      ) : members.length === 0 ? (
        <Empty text="No members yet." />
      ) : (
        members.map((m) => (
          <Card key={m.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Field label="Name" value={m.name} />
            </View>
            <Field label="Phone" value={m.phone || '-'} />
            <Field label="Joined" value={m.joined_date || '-'} />
            {!m.is_active ? <Badge text="inactive" tone="neutral" /> : null}
            {canEdit ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                <Btn title="Edit" tone="ghost" onPress={() => startEdit(m)} style={{ flex: 1 }} />
                <Btn title="Remove" tone="danger" onPress={() => confirmDelete(m)} style={{ flex: 1 }} />
              </View>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
