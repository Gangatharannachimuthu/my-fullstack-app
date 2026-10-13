import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import Screen, { ScreenTitle } from '../components/Screen';
import { Badge, Btn, Card, Empty, ErrorBanner, Field, Loading, Note, TextField } from '../components/ui';
import useLoad from '../hooks/useLoad';
import { joiningService } from '../api/services';
import { errorMessage } from '../api/client';
import { font, rupees, spacing } from '../theme';

/**
 * Joining contributions: what a member who joined late owes for an equal share of
 * what the group had already built.
 *
 * The "needs one" list matters as much as the calculator - it is what stops a late
 * joiner quietly ending up owing nothing.
 */
export default function JoiningScreen() {
  const [amounts, setAmounts] = useState({});
  const [busy, setBusy] = useState(null);

  const { data, loading, refreshing, error, setError, reload, refresh } = useLoad(async () => {
    const [dues, candidates] = await Promise.all([joiningService.getDues(), joiningService.getCandidates()]);
    return { dues: dues.data || [], candidates: candidates.data || [] };
  }, []);

  const dues = data?.dues || [];
  const candidates = data?.candidates || [];

  const create = async (c) => {
    const typed = amounts[c.member_id];
    const amount = typed === undefined || typed === '' ? c.suggested_amount : Number(typed);
    if (!amount || amount <= 0) {
      setError('Enter an amount greater than zero');
      return;
    }
    setBusy(c.member_id);
    setError('');
    try {
      await joiningService.createDue({
        member_id: c.member_id,
        total_amount: amount,
        basis_meeting_id: c.basis_meeting_id,
        note: c.working,
      });
      setAmounts({ ...amounts, [c.member_id]: '' });
      await reload();
    } catch (err) {
      setError(errorMessage(err, 'Could not create the joining contribution'));
    } finally {
      setBusy(null);
    }
  };

  const remove = (due) =>
    Alert.alert('Remove', `Remove the joining contribution for ${due.member_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await joiningService.removeDue(due.id);
            await reload();
          } catch (err) {
            // The API refuses while installments exist; offer the explicit force
            // path rather than silently discarding payment history.
            if (err?.response?.status === 409) {
              Alert.alert('Payments recorded', `${err.response.data.error}\n\nDrop the due anyway?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Drop it',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await joiningService.removeDue(due.id, true);
                      await reload();
                    } catch (e2) {
                      setError(errorMessage(e2, 'Could not remove'));
                    }
                  },
                },
              ]);
            } else {
              setError(errorMessage(err, 'Could not remove'));
            }
          }
        },
      },
    ]);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ScreenTitle
        title="Joining Contributions"
        subtitle="The fund's value the month before they joined, divided by the members at that time. Until it is fully paid they cannot take a loan."
      />
      <ErrorBanner message={error} onRetry={reload} />

      {loading ? (
        <Loading />
      ) : (
        <>
          <Text style={[font.h2, { marginBottom: spacing.sm }]}>Needs a joining contribution</Text>
          {candidates.length === 0 ? (
            <Empty text="Every member who joined late already has one recorded." />
          ) : (
            candidates.map((c) => (
              <Card key={c.member_id}>
                <Text style={[font.h2, { marginBottom: spacing.xs }]}>{c.member_name}</Text>
                <Field label="Joined" value={c.joined_date} />
                <Field label="Fund value before" value={rupees(c.net_worth)} />
                <Note>
                  as of {c.basis_label} · cash {rupees(c.cash)} + loans out {rupees(c.loans_out)} +
                  investments {rupees(c.investments_held)}
                </Note>
                <TextField
                  label={`Suggested — ${c.working}`}
                  value={amounts[c.member_id] ?? ''}
                  onChangeText={(v) => setAmounts({ ...amounts, [c.member_id]: v })}
                  placeholder={String(c.suggested_amount)}
                  keyboardType="numeric"
                  hint="Edit it if the group agreed a different figure."
                />
                <Btn
                  title={busy === c.member_id ? 'Setting...' : 'Set contribution'}
                  onPress={() => create(c)}
                  disabled={busy === c.member_id}
                />
              </Card>
            ))
          )}

          <Text style={[font.h2, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Recorded</Text>
          {dues.length === 0 ? (
            <Empty text="None recorded yet." />
          ) : (
            dues.map((d) => (
              <Card key={d.id}>
                <Text style={[font.h2, { marginBottom: spacing.xs }]}>{d.member_name}</Text>
                <Field label="Total" value={rupees(d.total_amount)} />
                <Field label="Paid" value={rupees(d.paid)} />
                <Field label="Remaining" value={rupees(d.remaining)} />
                <Field label="Basis" value={d.basis_label || '-'} />
                <Badge
                  text={d.is_cleared ? 'fully paid' : 'outstanding'}
                  tone={d.is_cleared ? 'success' : 'warning'}
                />
                <Btn title="Remove" tone="danger" onPress={() => remove(d)} style={{ marginTop: spacing.md }} />
              </Card>
            ))
          )}
        </>
      )}
    </Screen>
  );
}
