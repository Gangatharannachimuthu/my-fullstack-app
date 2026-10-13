import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import Screen, { ScreenTitle } from '../components/Screen';
import { Badge, Btn, Card, Empty, ErrorBanner, Field, Loading, Note, Select, TextField } from '../components/ui';
import useLoad from '../hooks/useLoad';
import { memberService, userService } from '../api/services';
import { errorMessage } from '../api/client';
import { font, spacing } from '../theme';

const EMPTY = { username: '', password: '', role: 'viewer', member_id: '' };

/** Admin-only login management: who can sign in, and which member they are. */
export default function UsersScreen() {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const { data, loading, refreshing, error, setError, reload, refresh } = useLoad(async () => {
    const [users, members] = await Promise.all([userService.getAll(), memberService.getAll()]);
    return { users: users.data || [], members: members.data || [] };
  }, []);

  const users = data?.users || [];
  const members = data?.members || [];

  const create = async () => {
    if (!form.username.trim() || form.password.length < 6) {
      setError('Username is required and the password must be at least 6 characters');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await userService.create({
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        member_id: form.member_id ? Number(form.member_id) : null,
      });
      setForm(EMPTY);
      await reload();
    } catch (err) {
      setError(errorMessage(err, 'Could not create the login'));
    } finally {
      setBusy(false);
    }
  };

  const remove = (user) =>
    Alert.alert('Remove login', `Remove "${user.username}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await userService.remove(user.id);
            await reload();
          } catch (err) {
            setError(errorMessage(err, 'Could not remove the login'));
          }
        },
      },
    ]);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ScreenTitle title="Users" subtitle="Logins are separate from members. Link one to a member so that viewer sees only their own loans." />
      <ErrorBanner message={error} onRetry={reload} />

      <Card>
        <TextField
          label="Add a login"
          value={form.username}
          onChangeText={(v) => setForm({ ...form, username: v })}
          placeholder="Username"
          autoCorrect={false}
        />
        <TextField
          value={form.password}
          onChangeText={(v) => setForm({ ...form, password: v })}
          placeholder="Password (min 6 characters)"
          secureTextEntry
        />
        <Select
          label="Role"
          value={form.role}
          onChange={(v) => setForm({ ...form, role: v })}
          options={[
            { value: 'viewer', label: 'Viewer' },
            { value: 'admin', label: 'Admin' },
          ]}
        />
        <Select
          label="Linked member"
          value={form.member_id}
          onChange={(v) => setForm({ ...form, member_id: v })}
          placeholder="Not linked"
          options={[{ value: '', label: 'Not linked' }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
        />
        <Btn title={busy ? 'Creating...' : 'Create login'} onPress={create} disabled={busy} />
      </Card>

      {loading ? (
        <Loading />
      ) : users.length === 0 ? (
        <Empty text="No logins yet." />
      ) : (
        users.map((u) => (
          <Card key={u.id}>
            <Text style={[font.h2, { marginBottom: spacing.xs }]}>{u.username}</Text>
            <Field label="Role" value={u.role} />
            <Field label="Member" value={u.member_name || '-'} />
            <Badge text={u.role} tone={u.role === 'admin' ? 'success' : 'neutral'} />
            <Btn title="Remove" tone="danger" onPress={() => remove(u)} style={{ marginTop: spacing.md }} />
          </Card>
        ))
      )}

      <Note>
        The backend identifies the caller from a username header, which is not real authentication —
        anything talking to the API directly could claim to be an admin. Keep the server on a
        trusted network.
      </Note>
    </Screen>
  );
}
