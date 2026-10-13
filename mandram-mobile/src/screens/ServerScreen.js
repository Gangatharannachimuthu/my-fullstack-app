import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { testConnection } from '../api/client';
import { Badge, Btn, Card, Note, TextField } from '../components/ui';
import { colors, font, spacing } from '../theme';

/**
 * First screen on a fresh install, and reachable later from the drawer.
 *
 * The address is asked for rather than hardcoded because `localhost` means the
 * phone itself, not the PC running Flask - the single most common reason a
 * self-hosted app "does not work" on mobile. Test before saving so a wrong
 * address is caught here instead of surfacing as a confusing login failure.
 */
export default function ServerScreen({ embedded = false, onDone }) {
  const { serverUrl, saveServer } = useApp();
  const [value, setValue] = useState(serverUrl || '');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    setBusy(true);
    setResult(null);
    const res = await testConnection(value);
    setResult(res);
    setBusy(false);
    return res;
  };

  const saveIfReachable = async () => {
    const res = await check();
    if (res.ok) {
      await saveServer(value);
      setResult({ ok: true, message: `Saved. Using ${res.message.replace('Connected to ', '')}` });
      // Returning to where we came from is only meaningful when this screen was
      // opened deliberately; on first run the app moves on by itself once the
      // address is stored.
      if (onDone) onDone();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {!embedded ? (
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={font.h1}>Masiriyamman Mandram</Text>
            <Text style={[font.small, { marginTop: 4 }]}>Loan &amp; Savings Ledger</Text>
          </View>
        ) : null}

        <Card>
          <Text style={font.h2}>Server address</Text>
          <Note>
            The address of the PC running the Mandram backend, including the port. Do not use
            &quot;localhost&quot; — on a phone that means the phone itself. Find the PC&apos;s address with
            <Text style={{ fontWeight: '700' }}> ipconfig</Text> and use its IPv4 value.
          </Note>

          <TextField
            label="Address"
            value={value}
            onChangeText={setValue}
            placeholder="192.168.1.5:5001"
            keyboardType="url"
            autoCorrect={false}
            hint="Port 5001 unless you changed it. http:// is added for you."
          />

          {result ? (
            <View style={{ marginBottom: spacing.md }}>
              <Badge text={result.ok ? 'Reachable' : 'Not reachable'} tone={result.ok ? 'success' : 'danger'} />
              <Text style={[font.small, { marginTop: 6, lineHeight: 18 }]}>{result.message}</Text>
            </View>
          ) : null}

          <Btn
            title={busy ? 'Checking...' : 'Test and save'}
            onPress={saveIfReachable}
            disabled={busy || !value.trim()}
          />
          <Btn
            title="Test only"
            tone="ghost"
            onPress={check}
            disabled={busy || !value.trim()}
            style={{ marginTop: spacing.sm }}
          />
          {onDone ? (
            <Btn title="Back" tone="ghost" onPress={onDone} style={{ marginTop: spacing.sm }} />
          ) : null}
        </Card>

        <Card>
          <Text style={font.h2}>If it will not connect</Text>
          <Note>
            • Phone and PC must be on the same WiFi.{'\n'}
            • The backend must be running: <Text style={{ fontWeight: '700' }}>venv\Scripts\python.exe app.py</Text>.{'\n'}
            • Flask must listen on all addresses, not just localhost — it already does
            (<Text style={{ fontWeight: '700' }}>host=&quot;0.0.0.0&quot;</Text>).{'\n'}
            • Windows Firewall may block port 5001 the first time; allow it when prompted.
          </Note>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  body: { padding: spacing.lg, paddingTop: spacing.xl },
});
