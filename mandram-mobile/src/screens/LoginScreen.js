import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { authService } from '../api/services';
import { errorMessage } from '../api/client';
import { Btn, Card, ErrorBanner, TextField } from '../components/ui';
import { colors, font, spacing } from '../theme';

export default function LoginScreen({ onNeedServer }) {
  const { signIn, serverUrl } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password) return;
    setBusy(true);
    setError('');
    try {
      const res = await authService.login(username.trim(), password);
      await signIn(res.data);
    } catch (err) {
      // 401 is a real credential failure; anything without a response is the
      // server being unreachable, which is a different fix entirely.
      setError(
        err?.response?.status === 401
          ? 'Wrong username or password.'
          : errorMessage(err, 'Could not sign in')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={font.h1}>Masiriyamman Mandram</Text>
          <Text style={[font.small, { marginTop: 4 }]}>Loan &amp; Savings Ledger</Text>
        </View>

        <Card>
          <ErrorBanner message={error} />
          <TextField
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="admin"
            autoCorrect={false}
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            onSubmitEditing={submit}
            returnKeyType="go"
          />
          <Btn
            title={busy ? 'Signing in...' : 'Sign in'}
            onPress={submit}
            disabled={busy || !username.trim() || !password}
          />
        </Card>

        <Text style={[font.small, { textAlign: 'center' }]}>
          Server: {serverUrl || 'not set'}
        </Text>
        <Btn
          title="Change server address"
          tone="ghost"
          onPress={onNeedServer}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  body: { padding: spacing.lg, paddingTop: spacing.xl * 2 },
});
